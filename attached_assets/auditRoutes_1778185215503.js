// =============================================================
// McWilliams Media Audit Tool — API Routes
// Drop this into your existing Express app in server.js / index.js
//
// Usage:
//   const auditRoutes = require('./server/auditRoutes');
//   app.use('/api/audit', auditRoutes);
// =============================================================

const express = require('express');
const router = express.Router();
const db = require('./db');
const { scanWebsite } = require('./scanner');
const { sendReportEmail, notifyTeam, sendProposalRequest } = require('./email');

// ─── RATE LIMITING ───────────────────────────────────────────
// Simple in-memory rate limiter (no extra dependencies)
// Prevents one IP from spamming scans
const scanCounts = {};
const SCAN_LIMIT = 5;       // max scans per IP per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!scanCounts[ip]) scanCounts[ip] = { count: 0, windowStart: now };

  const record = scanCounts[ip];
  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= SCAN_LIMIT) {
    return res.status(429).json({
      error: 'Too many scans. Please try again in an hour.',
    });
  }

  record.count++;
  next();
}

// ─── STAGE 1: CREATE LEAD ────────────────────────────────────
// Called when user submits URL + City (before scan starts)
// Returns a leadId that flows through all subsequent stages

router.post('/create', async (req, res) => {
  try {
    const { url, city, challenge } = req.body;

    if (!url || !city) {
      return res.status(400).json({ error: 'URL and city are required.' });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const lead = await db.createLead({
      url: normalizedUrl,
      city: city.trim(),
      challenge: challenge || null,
    });

    res.json({ leadId: lead.id, mode: lead.mode });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: 'Failed to create lead.' });
  }
});

// ─── STAGE 2: RUN SCAN ───────────────────────────────────────
// Fetches real data from the URL + runs AI interpretation
// Returns scores and friendly observations for all 4 pillars

router.post('/scan', rateLimit, async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const lead = await db.getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    // Run the actual scan (see scanner.js)
    const scanResult = await scanWebsite(lead.url, lead.city);

    // Save scores to DB
    const updatedLead = await db.saveScores(leadId, {
      scores: scanResult.scores,
      scanData: scanResult.rawData,
      businessType: scanResult.businessType,
    });

    // Return teaser data (2 unlocked, 2 locked)
    res.json({
      leadId,
      scores: {
        ux: scanResult.scores.ux,
        seo: scanResult.scores.seo,
        // social and aiVisibility are gated — return null
        social: null,
        aiVisibility: null,
      },
      observations: {
        ux: scanResult.observations.ux,
        seo: scanResult.observations.seo,
      },
      businessType: scanResult.businessType,
    });
  } catch (err) {
    console.error('Error scanning website:', err);
    res.status(500).json({ error: 'Scan failed. Please check the URL and try again.' });
  }
});

// ─── STAGE 3: CAPTURE EMAIL ──────────────────────────────────
// Gates full report behind email
// Triggers report email + unlocks all 4 scores

router.post('/capture', async (req, res) => {
  try {
    const { leadId, email } = req.body;

    if (!leadId || !email) {
      return res.status(400).json({ error: 'leadId and email are required.' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const updatedLead = await db.captureEmail(leadId, email);

    // Get the full lead to retrieve all scan data
    const lead = await db.getLead(leadId);

    // Fire email in background (don't await — keep response fast)
    sendReportEmail(lead).catch(err =>
      console.error('Email send failed:', err)
    );

    // Notify team in background
    notifyTeam(lead).catch(err =>
      console.error('Team notification failed:', err)
    );

    // Return the full unlocked scores
    res.json({
      success: true,
      scores: lead.scores,                  // all 4 now
      observations: lead.scanData?.observations,
      businessType: lead.businessType,
    });
  } catch (err) {
    console.error('Error capturing email:', err);
    res.status(500).json({ error: 'Failed to save email.' });
  }
});

// ─── STAGE 4: SAVE QUALIFICATION ─────────────────────────────
// Optional — saves budget/goal and creates proposal shell
// Automatically builds a pre-filled proposal in your system

router.post('/qualify', async (req, res) => {
  try {
    const { leadId, budget, goal } = req.body;

    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const { lead, proposal } = await db.saveQualification(leadId, {
      budget: budget || null,
      goal: goal || null,
    });

    // Notify team that a proposal shell is ready
    notifyTeam(lead, proposal).catch(console.error);

    res.json({
      success: true,
      proposalId: proposal.id,
      recommendedServices: proposal.recommendedServices,
    });
  } catch (err) {
    console.error('Error saving qualification:', err);
    res.status(500).json({ error: 'Failed to save qualification data.' });
  }
});

// ─── ADMIN: TEAM DASHBOARD DATA ──────────────────────────────
// Protected — only your team should access this
// Add your own auth middleware before deploying

router.get('/dashboard', requireTeamAuth, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

// Get single lead with its proposal
router.get('/lead/:id', requireTeamAuth, async (req, res) => {
  try {
    const lead = await db.getLead(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    let proposal = null;
    if (lead.proposalId) {
      proposal = await db.getProposal(lead.proposalId);
    }

    res.json({ lead, proposal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lead.' });
  }
});

// Update proposal status (pending_review → sent → signed)
router.patch('/proposal/:id/status', requireTeamAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending_review', 'sent', 'signed', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const proposal = await db.updateProposalStatus(req.params.id, status);
    res.json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update proposal status.' });
  }
});

// ─── PROPOSAL REQUEST ────────────────────────────────────────
// Called when lead clicks "Yes, I Want a Proposal" in their email
// or on the thank-you page. Marks lead as proposal_requested,
// sends confirmation to lead, high-priority alert to team.

router.get('/request-proposal', async (req, res) => {
  try {
    const { leadId } = req.query;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const lead = await db.getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    // Update lead status
    const updatedLead = {
      ...lead,
      proposalRequested: true,
      proposalRequestedAt: new Date().toISOString(),
      status: 'proposal_requested',
      updatedAt: new Date().toISOString(),
    };
    const Database = require('@replit/database');
    const dbClient = new Database();
    await dbClient.set(`lead:${leadId}`, JSON.stringify(updatedLead));

    // Fire emails in background
    sendProposalRequest(updatedLead).catch(err =>
      console.error('Proposal request email failed:', err)
    );

    // Redirect to a thank-you confirmation page
    res.redirect('https://mcwclients.com/audit/proposal-requested');
  } catch (err) {
    console.error('Proposal request error:', err);
    res.status(500).json({ error: 'Failed to process proposal request.' });
  }
});

// Also accept POST for in-app requests (from thank-you page button)
router.post('/request-proposal', async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required.' });

    const lead = await db.getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const updatedLead = {
      ...lead,
      proposalRequested: true,
      proposalRequestedAt: new Date().toISOString(),
      status: 'proposal_requested',
      updatedAt: new Date().toISOString(),
    };
    const Database = require('@replit/database');
    const dbClient = new Database();
    await dbClient.set(`lead:${leadId}`, JSON.stringify(updatedLead));

    sendProposalRequest(updatedLead).catch(console.error);

    res.json({ success: true });
  } catch (err) {
    console.error('Proposal request error:', err);
    res.status(500).json({ error: 'Failed to process proposal request.' });
  }
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────
// Protects team-only routes with a simple API key
// Set TEAM_API_KEY in your Replit Secrets

function requireTeamAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (!key || key !== process.env.TEAM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

module.exports = router;
