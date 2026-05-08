// =============================================================
// McWilliams Media Audit Tool — Express API Routes
//
// Add to your existing server.js:
//   const auditRoutes = require('./server/auditRoutes');
//   app.use('/api/audit', auditRoutes);
//
// Endpoints:
//   POST /api/audit/create            → create lead record
//   POST /api/audit/scan              → run real website scan
//   POST /api/audit/capture           → save email, send report
//   POST /api/audit/qualify           → save budget/goal, create proposal
//   GET  /api/audit/request-proposal  → lead clicked proposal CTA in email
//   POST /api/audit/request-proposal  → lead clicked proposal CTA in app
//   GET  /api/audit/dashboard         → team stats (protected)
//   GET  /api/audit/lead/:id          → single lead + proposal (protected)
//   PATCH /api/audit/proposal/:id/status → update proposal status (protected)
// =============================================================

const express = require('express');
const router  = express.Router();
const db      = require('./db');
const { scanWebsite }                       = require('./scanner');
const { sendReportEmail, notifyTeam, sendProposalRequest } = require('./email');

// ─── RATE LIMITING ───────────────────────────────────────────

const scanCounts = {};
const SCAN_LIMIT = 5;
const WINDOW_MS  = 60 * 60 * 1000;

function rateLimit(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!scanCounts[ip]) scanCounts[ip] = { count: 0, windowStart: now };

  const record = scanCounts[ip];
  if (now - record.windowStart > WINDOW_MS) {
    record.count       = 0;
    record.windowStart = now;
  }

  if (record.count >= SCAN_LIMIT) {
    return res.status(429).json({ error: 'Too many scans. Please try again in an hour.' });
  }

  record.count++;
  next();
}

// ─── STAGE 1: CREATE LEAD ────────────────────────────────────

router.post('/create', async (req, res) => {
  try {
    const { url, city, challenge } = req.body;

    if (!url || !city) {
      return res.status(400).json({ error: 'URL and city are required.' });
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const lead = await db.createLead({
      url:       normalizedUrl,
      city:      city.trim(),
      challenge: challenge || null,
    });

    res.json({ leadId: lead.id });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: 'Failed to create lead.' });
  }
});

// ─── STAGE 2: RUN SCAN ───────────────────────────────────────

router.post('/scan', rateLimit, async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const lead = await db.getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const scanResult = await scanWebsite(lead.url, lead.city);

    await db.saveScores(leadId, {
      scores:       scanResult.scores,
      scanData:     { observations: scanResult.observations, rawData: scanResult.rawData },
      businessType: scanResult.businessType,
    });

    // Return unlocked pillars only (UX, SEO, GBP, Reviews, Trust, Content, Lead Capture)
    // Social and AI Visibility are gated behind email
    res.json({
      leadId,
      businessType: scanResult.businessType,
      scores: {
        ux:          scanResult.scores.ux,
        seo:         scanResult.scores.seo,
        gbp:         scanResult.scores.gbp,
        reviews:     scanResult.scores.reviews,
        trust:       scanResult.scores.trust,
        content:     scanResult.scores.content,
        leadCapture: scanResult.scores.leadCapture,
        social:      null,       // gated
        aiVisibility: null,      // gated
      },
      observations: {
        ux:          scanResult.observations.ux,
        seo:         scanResult.observations.seo,
        gbp:         scanResult.observations.gbp,
        reviews:     scanResult.observations.reviews,
        trust:       scanResult.observations.trust,
        content:     scanResult.observations.content,
        leadCapture: scanResult.observations.leadCapture,
      },
    });
  } catch (err) {
    console.error('Error scanning website:', err);
    res.status(500).json({ error: 'Scan failed. Please check the URL and try again.' });
  }
});

// ─── STAGE 3: CAPTURE EMAIL ──────────────────────────────────

router.post('/capture', async (req, res) => {
  try {
    const { leadId, email } = req.body;

    if (!leadId || !email) {
      return res.status(400).json({ error: 'leadId and email are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    await db.captureEmail(leadId, email);
    const lead = await db.getLead(leadId);

    // Fire emails in background — don't block the response
    sendReportEmail(lead).catch(err => console.error('Report email failed:', err));
    notifyTeam(lead).catch(err => console.error('Team notification failed:', err));

    // Return all 9 scores now that email is captured
    res.json({
      success:      true,
      scores:       lead.scores,
      observations: lead.scanData?.observations,
      businessType: lead.businessType,
    });
  } catch (err) {
    console.error('Error capturing email:', err);
    res.status(500).json({ error: 'Failed to save email.' });
  }
});

// ─── STAGE 4: SAVE QUALIFICATION ─────────────────────────────

router.post('/qualify', async (req, res) => {
  try {
    const { leadId, budget, goal } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const { lead, proposal } = await db.saveQualification(leadId, {
      budget: budget || null,
      goal:   goal   || null,
    });

    notifyTeam(lead, proposal).catch(console.error);

    res.json({
      success:              true,
      proposalId:           proposal.id,
      recommendedServices:  proposal.recommendedServices,
    });
  } catch (err) {
    console.error('Error saving qualification:', err);
    res.status(500).json({ error: 'Failed to save qualification.' });
  }
});

// ─── PROPOSAL REQUEST (from email link) ──────────────────────

router.get('/request-proposal', async (req, res) => {
  try {
    const { leadId } = req.query;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const lead        = await db.getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const updatedLead = await db.markProposalRequested(leadId);

    sendProposalRequest(updatedLead).catch(console.error);

    // Redirect to a thank-you page
    res.redirect('https://mcwclients.com/audit/proposal-requested');
  } catch (err) {
    console.error('Proposal request error:', err);
    res.status(500).json({ error: 'Failed to process proposal request.' });
  }
});

// ─── PROPOSAL REQUEST (from in-app button) ───────────────────

router.post('/request-proposal', async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const lead = await db.getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const updatedLead = await db.markProposalRequested(leadId);

    sendProposalRequest(updatedLead).catch(console.error);

    res.json({ success: true });
  } catch (err) {
    console.error('Proposal request error:', err);
    res.status(500).json({ error: 'Failed to process proposal request.' });
  }
});

// ─── TEAM DASHBOARD ──────────────────────────────────────────

router.get('/dashboard', requireTeamAuth, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

router.get('/lead/:id', requireTeamAuth, async (req, res) => {
  try {
    const lead = await db.getLead(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    let proposal = null;
    if (lead.proposalId) proposal = await db.getProposal(lead.proposalId);

    res.json({ lead, proposal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lead.' });
  }
});

router.patch('/proposal/:id/status', requireTeamAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending_review', 'sent', 'signed', 'closed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const proposal = await db.updateProposalStatus(req.params.id, status);
    res.json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update proposal.' });
  }
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────

function requireTeamAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (!key || key !== process.env.TEAM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

module.exports = router;
