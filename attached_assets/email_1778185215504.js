// =============================================================
// McWilliams Media Audit Tool — Email Handler
//
// IMPORTANT: This file plugs into YOUR EXISTING email setup.
// Find the comment marked "── PLUG IN HERE ──" and replace
// the sendMail() call with however your platform currently
// sends email (nodemailer, sendgrid, etc.)
//
// Sends FROM: info@mcwilliamsmedia.com  (your sales inbox)
// Sends TO:   the lead's email
// Attaches:   branded PDF audit report
// Includes:   "Request a Proposal" CTA button
// CC's:       info@mcwilliamsmedia.com so your team sees every send
// =============================================================

const { generateAuditPDF } = require('./pdfReport');

const FROM_EMAIL = 'info@mcwilliamsmedia.com';
const TEAM_EMAIL = 'info@mcwilliamsmedia.com';
const TEAM_PHONE = '(918) 286-4995';

// ─── MAIN: SEND REPORT EMAIL WITH PDF ────────────────────────

/**
 * Send the full audit report to the lead.
 * PDF is generated server-side and attached.
 * Also CC's the team so they see every lead in their inbox.
 *
 * @param {Object} lead - Full lead object from Replit DB
 */
async function sendReportEmail(lead) {
  if (!lead.email) return;

  const scores = lead.scores || {};
  const obs    = lead.scanData?.observations || {};

  // Generate the branded PDF
  const pdfBuffer = await generateAuditPDF(lead);

  const subject  = `Your Digital Health Check — ${(lead.url || '').replace(/^https?:\/\//, '')}`;
  const htmlBody = buildReportHTML(lead, scores, obs);
  const textBody = buildPlainText(lead, scores);

  // ── PLUG IN HERE ──────────────────────────────────────────
  // Replace this block with your existing email sending method.
  //
  // The variables you have available:
  //   FROM_EMAIL  — 'info@mcwilliamsmedia.com'
  //   lead.email  — recipient
  //   TEAM_EMAIL  — CC (so your team sees every send)
  //   subject     — email subject line
  //   htmlBody    — full branded HTML email body
  //   textBody    — plain text fallback
  //   pdfBuffer   — Buffer — the PDF attachment
  //
  // ── NODEMAILER EXAMPLE (most common on Replit) ────────────
  //
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: 587,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
  //
  // await transporter.sendMail({
  //   from:    `McWilliams Media <${FROM_EMAIL}>`,
  //   to:      lead.email,
  //   cc:      TEAM_EMAIL,
  //   subject,
  //   html:    htmlBody,
  //   text:    textBody,
  //   attachments: [{
  //     filename: `McWilliams-Media-Audit-${Date.now()}.pdf`,
  //     content:  pdfBuffer,
  //     contentType: 'application/pdf',
  //   }],
  // });
  //
  // ── SENDGRID EXAMPLE ──────────────────────────────────────
  //
  // await sgMail.send({
  //   from:    FROM_EMAIL,
  //   to:      lead.email,
  //   cc:      TEAM_EMAIL,
  //   subject,
  //   html:    htmlBody,
  //   text:    textBody,
  //   attachments: [{
  //     filename:    `McWilliams-Media-Audit-${Date.now()}.pdf`,
  //     content:     pdfBuffer.toString('base64'),
  //     type:        'application/pdf',
  //     disposition: 'attachment',
  //   }],
  // });
  //
  // ── WHICHEVER METHOD YOUR PLATFORM USES, PASTE IT HERE ───
  // Then delete the examples above.
  // ─────────────────────────────────────────────────────────

  console.log(`[Email] Audit report sent to ${lead.email} with PDF attached`);
}

// ─── TEAM NOTIFICATION EMAIL ──────────────────────────────────

/**
 * Notify the team when a new qualified lead comes in.
 * Fires after Stage 4 (qualification) — includes all data
 * and a direct link to the pre-built proposal in the dashboard.
 *
 * @param {Object} lead
 * @param {Object|null} proposal
 */
async function notifyTeam(lead, proposal = null) {
  const scores  = lead.scores || {};
  const subject = proposal
    ? `🟢 Proposal Ready: ${lead.email} — ${lead.city}`
    : `🔔 New Audit Lead: ${lead.email || 'No email yet'} — ${(lead.url || '').replace(/^https?:\/\//, '')}`;

  const html = buildTeamNotificationHTML(lead, proposal, scores);

  // ── PLUG IN HERE ──────────────────────────────────────────
  // Same method as above — send to TEAM_EMAIL only.
  //
  // await transporter.sendMail({
  //   from:    `McWilliams Audit Tool <${FROM_EMAIL}>`,
  //   to:      TEAM_EMAIL,
  //   subject,
  //   html,
  // });
  // ─────────────────────────────────────────────────────────

  console.log(`[Email] Team notified: ${subject}`);
}

// ─── PROPOSAL REQUEST HANDLER ─────────────────────────────────

/**
 * Called when a lead clicks "Request a Proposal" in their email
 * or on the thank-you page.
 *
 * Sends a confirmation to the lead and a high-priority alert
 * to the team with all context.
 *
 * @param {Object} lead
 */
async function sendProposalRequest(lead) {
  if (!lead.email) return;

  // Confirmation to lead
  const leadSubject = 'We received your proposal request — McWilliams Media';
  const leadHTML = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <tr><td style="background:#061E57;border-radius:12px 12px 0 0;padding:28px 32px;">
    <p style="margin:0;color:#C9A959;font-size:11px;letter-spacing:2px;text-transform:uppercase;">McWilliams Media</p>
    <h1 style="margin:8px 0 4px;color:#ffffff;font-size:24px;">Got It — We'll Be In Touch!</h1>
    <p style="margin:0;color:#b3cee1;font-size:13px;">Your proposal request has been received</p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:28px 32px;">
    <p style="font-size:15px;color:#061E57;line-height:1.7;margin:0 0 16px;">
      We've received your request and one of our team members will reach out 
      within one business day to talk through your goals and put together 
      a custom proposal.
    </p>
    <p style="font-size:14px;color:#3a4856;line-height:1.6;margin:0 0 20px;">
      In the meantime, feel free to reply to this email with any questions — 
      or give us a call at <strong style="color:#061E57;">${TEAM_PHONE}</strong>.
    </p>
    <div style="background:#f5f0e8;border-radius:8px;padding:16px 20px;border-left:3px solid #C9A959;">
      <p style="margin:0;font-size:13px;color:#3a4856;line-height:1.6;">
        <strong style="color:#061E57;">Website scanned:</strong> ${lead.url}<br>
        <strong style="color:#061E57;">City:</strong> ${lead.city}
      </p>
    </div>
  </td></tr>

  <tr><td style="background:#061E57;padding:20px 32px;text-align:center;border-radius:0 0 12px 12px;">
    <p style="margin:0;color:#b3cee1;font-size:12px;">
      McWilliams Media  ·  ${TEAM_PHONE}  ·  ${FROM_EMAIL}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  // High-priority alert to team
  const teamSubject = `🚨 PROPOSAL REQUESTED: ${lead.email} — ${lead.city}`;
  const teamHTML = buildTeamNotificationHTML(lead, null, lead.scores || {}, true);

  // ── PLUG IN HERE ──────────────────────────────────────────
  // Send both emails using your existing email method.
  //
  // // Confirmation to lead:
  // await transporter.sendMail({
  //   from:    `McWilliams Media <${FROM_EMAIL}>`,
  //   to:      lead.email,
  //   subject: leadSubject,
  //   html:    leadHTML,
  // });
  //
  // // High-priority team alert:
  // await transporter.sendMail({
  //   from:    `McWilliams Audit Tool <${FROM_EMAIL}>`,
  //   to:      TEAM_EMAIL,
  //   subject: teamSubject,
  //   html:    teamHTML,
  // });
  // ─────────────────────────────────────────────────────────

  console.log(`[Email] Proposal request handled for ${lead.email}`);
}

// ─── HTML BUILDERS ────────────────────────────────────────────

function buildReportHTML(lead, scores, obs) {
  const scoreColor = s => s >= 70 ? '#2d7a4f' : s >= 50 ? '#7c370c' : '#c0392b';
  const scoreLabel = s => s >= 70 ? 'Good' : s >= 50 ? 'Needs Work' : 'Critical';

  const pillars = [
    { key: 'ux',           label: 'Website UX'    },
    { key: 'seo',          label: 'SEO Presence'  },
    { key: 'social',       label: 'Social Media'  },
    { key: 'aiVisibility', label: 'AI Visibility' },
  ];

  // Proposal request URL — points to your API endpoint
  const proposalURL = `https://mcwclients.com/api/audit/request-proposal?leadId=${lead.id}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#061E57;border-radius:12px 12px 0 0;padding:28px 32px;">
    <p style="margin:0;color:#C9A959;font-size:11px;letter-spacing:2px;text-transform:uppercase;">McWilliams Media</p>
    <h1 style="margin:8px 0 4px;color:#ffffff;font-size:26px;letter-spacing:0.5px;">Your Digital Health Check</h1>
    <p style="margin:0;color:#b3cee1;font-size:13px;">
      ${(lead.url || '').replace(/^https?:\/\//, '')} &nbsp;·&nbsp; ${lead.city}
    </p>
  </td></tr>

  <!-- Intro -->
  <tr><td style="background:#ffffff;padding:24px 32px 16px;">
    <p style="margin:0 0 12px;font-size:15px;color:#061E57;line-height:1.7;">
      Hey there — your full audit is attached as a PDF you can save and share. 
      Here's the summary right in your inbox.
    </p>
    <p style="margin:0;font-size:13px;color:#3a4856;line-height:1.6;">
      I want to make sure your business in <strong>${lead.city}</strong> has every 
      advantage online — so here's the honest picture, along with what I'd tackle first.
    </p>
  </td></tr>

  <!-- PDF notice -->
  <tr><td style="background:#ffffff;padding:0 32px 20px;">
    <div style="background:#f5f0e8;border-radius:8px;padding:12px 16px;border-left:3px solid #C9A959;display:flex;align-items:center;">
      <p style="margin:0;font-size:12px;color:#3a4856;">
        📄 <strong style="color:#061E57;">Full report attached</strong> — 
        Your complete audit with all findings and recommendations is attached as a PDF.
      </p>
    </div>
  </td></tr>

  <!-- Score cards -->
  <tr><td style="background:#ffffff;padding:0 32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${pillars.map(p => {
          const score = scores[p.key] || 0;
          return `
          <td width="25%" style="padding:6px;text-align:center;">
            <div style="background:#f5f0e8;border-radius:10px;padding:16px 8px;">
              <div style="font-size:30px;font-weight:700;color:${scoreColor(score)};">${score}</div>
              <div style="font-size:9px;color:#3a4856;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:2px 0;">${p.label}</div>
              <div style="font-size:10px;color:${scoreColor(score)};font-weight:600;">${scoreLabel(score)}</div>
            </div>
          </td>`;
        }).join('')}
      </tr>
    </table>
  </td></tr>

  <!-- Observations -->
  ${pillars.map(p => {
    const o = obs[p.key];
    if (!o) return '';
    const score = scores[p.key] || 0;
    const labels = { ux: '🖥 Website UX', seo: '🔍 SEO Presence', social: '📱 Social Media', aiVisibility: '🤖 AI Visibility' };
    return `
  <tr><td style="background:#ffffff;padding:0 32px 20px;">
    <div style="border-left:3px solid ${scoreColor(score)};padding-left:16px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#061E57;">${labels[p.key]}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#3a4856;line-height:1.6;">${o.summary || ''}</p>
      ${o.friendlyTranslation ? `<p style="margin:0 0 6px;font-size:12px;color:#7c370c;font-style:italic;line-height:1.5;">${o.friendlyTranslation}</p>` : ''}
      ${p.key === 'aiVisibility' && o.aiQuote ? `
      <div style="background:#061E57;border-radius:6px;padding:10px 14px;margin-top:6px;">
        <p style="margin:0;font-size:12px;color:#b3cee1;font-style:italic;line-height:1.5;">"${o.aiQuote}"</p>
      </div>` : ''}
    </div>
  </td></tr>`;
  }).join('')}

  <!-- Divider -->
  <tr><td style="background:#ffffff;padding:0 32px 24px;">
    <div style="border-top:1px solid #d0cfc8;"></div>
  </td></tr>

  <!-- PROPOSAL REQUEST CTA — Primary action -->
  <tr><td style="background:#061E57;padding:32px;">
    <p style="margin:0 0 6px;font-size:11px;color:#C9A959;letter-spacing:2px;text-transform:uppercase;text-align:center;">Ready to Move Forward?</p>
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;text-align:center;line-height:1.3;">
      Request a Free Custom Proposal
    </h2>
    <p style="margin:0 0 24px;font-size:13px;color:#b3cee1;text-align:center;line-height:1.6;">
      Tell us you're interested and we'll put together a custom plan built around 
      your goals, your city, and your budget. No obligation — just a real conversation.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${proposalURL}" 
             style="display:inline-block;background:#C9A959;color:#061E57;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.5px;">
            Yes, I Want a Proposal →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#b3cee1;">
      Or call us directly: 
      <a href="tel:9182864995" style="color:#C9A959;">${TEAM_PHONE}</a>
      &nbsp;·&nbsp;
      <a href="mailto:${FROM_EMAIL}" style="color:#C9A959;">${FROM_EMAIL}</a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f5f0e8;padding:16px 32px;text-align:center;border-radius:0 0 12px 12px;">
    <p style="margin:0;font-size:11px;color:#3a4856;">
      McWilliams Media  ·  2430 W. New Orleans St., Broken Arrow, OK 74011
    </p>
    <p style="margin:6px 0 0;font-size:10px;color:#888;">
      You received this because you requested a free Digital Health Check at mcwilliamsmedia.com
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildPlainText(lead, scores) {
  return `
McWilliams Media — Digital Health Check
========================================
Website: ${lead.url}
City: ${lead.city}

YOUR SCORES
-----------
Website UX:    ${scores.ux || 0}/100
SEO Presence:  ${scores.seo || 0}/100
Social Media:  ${scores.social || 0}/100
AI Visibility: ${scores.aiVisibility || 0}/100

Your full report is attached as a PDF.

REQUEST A PROPOSAL
------------------
Ready to move forward? Reply to this email or call us at ${TEAM_PHONE}.

McWilliams Media
${TEAM_PHONE} · ${FROM_EMAIL}
2430 W. New Orleans St., Broken Arrow, OK 74011
`.trim();
}

function buildTeamNotificationHTML(lead, proposal, scores, isProposalRequest = false) {
  const urgencyColor = isProposalRequest ? '#c0392b' : '#2d7a4f';
  const urgencyLabel = isProposalRequest ? '🚨 PROPOSAL REQUESTED' : (proposal ? '🟢 PROPOSAL READY' : '🔔 NEW LEAD');

  return `
<div style="font-family:Arial,sans-serif;max-width:520px;padding:16px;">
  <div style="background:#061E57;border-radius:8px 8px 0 0;padding:16px 20px;">
    <span style="background:${urgencyColor};color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:1px;">${urgencyLabel}</span>
    <p style="margin:8px 0 0;color:#ffffff;font-size:16px;font-weight:700;">${lead.email || 'No email yet'}</p>
    <p style="margin:2px 0 0;color:#b3cee1;font-size:12px;">${new Date().toLocaleString()}</p>
  </div>

  <div style="border:1px solid #d0cfc8;border-top:none;border-radius:0 0 8px 8px;padding:16px 20px;background:#fff;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:5px 0;color:#3a4856;width:130px;">Website</td><td><a href="${lead.url}" style="color:#061E57;">${lead.url}</a></td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">City</td><td>${lead.city}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Challenge</td><td>${lead.challenge || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Budget</td><td>${lead.budget || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Goal</td><td>${lead.goal || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Scores</td>
        <td>UX ${scores.ux || '—'} &nbsp;|&nbsp; SEO ${scores.seo || '—'} &nbsp;|&nbsp; Social ${scores.social || '—'} &nbsp;|&nbsp; AI ${scores.aiVisibility || '—'}</td>
      </tr>
      ${proposal ? `<tr><td style="padding:5px 0;color:#3a4856;">Proposal ID</td><td style="font-family:monospace;font-size:11px;">${proposal.id}</td></tr>` : ''}
    </table>

    ${proposal ? `
    <div style="margin-top:14px;padding:12px;background:#f5f0e8;border-radius:6px;">
      <strong style="font-size:12px;color:#061E57;">RECOMMENDED SERVICES</strong>
      <ul style="margin:8px 0 0;padding-left:16px;font-size:12px;color:#3a4856;line-height:1.8;">
        ${(proposal.recommendedServices || []).map(s =>
          `<li><strong>${s.name}</strong> — ${s.reason}</li>`
        ).join('')}
      </ul>
    </div>` : ''}

    <div style="margin-top:16px;">
      <a href="https://mcwclients.com/dashboard" 
         style="background:#061E57;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">
        View in Dashboard →
      </a>
      ${isProposalRequest ? `
      <a href="mailto:${lead.email}" 
         style="margin-left:10px;background:#C9A959;color:#061E57;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">
        Reply to Lead →
      </a>` : ''}
    </div>
  </div>
</div>`;
}

module.exports = { sendReportEmail, notifyTeam, sendProposalRequest };
