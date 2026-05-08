// =============================================================
// McWilliams Media Audit Tool — Email Handler
//
// Sends FROM: info@mcwilliamsmedia.com
// Attaches:   branded PDF audit report
// CC's team:  info@mcwilliamsmedia.com on every lead email
//
// SETUP: Find the three "── PLUG IN HERE ──" blocks below and
// replace each with your existing email sending method.
//
// Most common on Replit is Nodemailer. Example at each block.
// =============================================================

const { generateAuditPDF } = require('./pdfReport');

const FROM_EMAIL = 'info@mcwilliamsmedia.com';
const TEAM_EMAIL = 'info@mcwilliamsmedia.com';
const TEAM_PHONE = '(918) 286-4995';

// ─── SEND REPORT TO LEAD ─────────────────────────────────────

async function sendReportEmail(lead) {
  if (!lead.email) return;

  const scores     = lead.scores || {};
  const obs        = lead.scanData?.observations || {};
  const pdfBuffer  = await generateAuditPDF(lead);
  const subject    = `Your Digital Health Check — ${(lead.url || '').replace(/^https?:\/\//, '')}`;
  const htmlBody   = buildReportHTML(lead, scores, obs);
  const textBody   = buildPlainText(lead, scores);
  const filename   = `McWilliams-Media-Audit-${Date.now()}.pdf`;

  // ── PLUG IN HERE ──────────────────────────────────────────
  // Replace this with your existing email method.
  //
  // NODEMAILER EXAMPLE:
  // await transporter.sendMail({
  //   from:    `McWilliams Media <${FROM_EMAIL}>`,
  //   to:      lead.email,
  //   cc:      TEAM_EMAIL,
  //   subject,
  //   html:    htmlBody,
  //   text:    textBody,
  //   attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
  // });
  //
  // SENDGRID EXAMPLE:
  // await sgMail.send({
  //   from:    FROM_EMAIL,
  //   to:      lead.email,
  //   cc:      TEAM_EMAIL,
  //   subject,
  //   html:    htmlBody,
  //   text:    textBody,
  //   attachments: [{ filename, content: pdfBuffer.toString('base64'), type: 'application/pdf', disposition: 'attachment' }],
  // });
  // ─────────────────────────────────────────────────────────

  console.log(`[Email] Report sent to ${lead.email}`);
}

// ─── TEAM NOTIFICATION ───────────────────────────────────────

async function notifyTeam(lead, proposal = null) {
  const scores  = lead.scores || {};
  const subject = proposal
    ? `🟢 Proposal Ready: ${lead.email} — ${lead.city}`
    : `🔔 New Audit Lead: ${lead.email || 'No email'} — ${(lead.url || '').replace(/^https?:\/\//, '')}`;

  const html = buildTeamHTML(lead, proposal, scores);

  // ── PLUG IN HERE ──────────────────────────────────────────
  // await transporter.sendMail({
  //   from:    `McWilliams Audit <${FROM_EMAIL}>`,
  //   to:      TEAM_EMAIL,
  //   subject,
  //   html,
  // });
  // ─────────────────────────────────────────────────────────

  console.log(`[Email] Team notified: ${subject}`);
}

// ─── PROPOSAL REQUEST CONFIRMATION ───────────────────────────

async function sendProposalRequest(lead) {
  if (!lead.email) return;

  const leadSubject = 'We received your proposal request — McWilliams Media';
  const teamSubject = `🚨 PROPOSAL REQUESTED: ${lead.email} — ${lead.city}`;

  const leadHTML = buildProposalConfirmHTML(lead);
  const teamHTML = buildTeamHTML(lead, null, lead.scores || {}, true);

  // ── PLUG IN HERE ──────────────────────────────────────────
  // // Confirmation to lead:
  // await transporter.sendMail({
  //   from:    `McWilliams Media <${FROM_EMAIL}>`,
  //   to:      lead.email,
  //   subject: leadSubject,
  //   html:    leadHTML,
  // });
  // // High-priority alert to team:
  // await transporter.sendMail({
  //   from:    `McWilliams Audit <${FROM_EMAIL}>`,
  //   to:      TEAM_EMAIL,
  //   subject: teamSubject,
  //   html:    teamHTML,
  // });
  // ─────────────────────────────────────────────────────────

  console.log(`[Email] Proposal request handled for ${lead.email}`);
}

// ─── HTML BUILDERS ───────────────────────────────────────────

function buildReportHTML(lead, scores, obs) {
  const scoreColor = s => s >= 70 ? '#2d7a4f' : s >= 50 ? '#854F0B' : '#A32D2D';
  const scoreLabel = s => s >= 70 ? 'Good' : s >= 50 ? 'Needs Work' : 'Critical';

  const pillars = [
    { key: 'ux',          label: '🖥 Website UX'            },
    { key: 'seo',         label: '🔍 SEO Presence'          },
    { key: 'gbp',         label: '📍 Google Business Profile' },
    { key: 'reviews',     label: '⭐ Review Signals'         },
    { key: 'trust',       label: '🔒 Trust Signals'          },
    { key: 'content',     label: '📝 Content Health'         },
    { key: 'leadCapture', label: '📣 Lead Capture'           },
    { key: 'social',      label: '📱 Social Media'           },
    { key: 'aiVisibility',label: '🤖 AI Visibility'          },
  ];

  const proposalURL = `https://mcwclients.com/api/audit/request-proposal?leadId=${lead.id}`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ddeef6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ddeef6;padding:28px 14px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<tr><td style="background:#061E57;border-radius:12px 12px 0 0;padding:24px 28px;">
  <p style="margin:0;color:#b3cee1;font-size:10px;letter-spacing:2px;text-transform:uppercase;">McWilliams Media</p>
  <h1 style="margin:6px 0 4px;color:#ffffff;font-size:24px;">Your 9-Pillar Digital Health Check</h1>
  <p style="margin:0;color:rgba(255,255,255,.5);font-size:12px;">${(lead.url||'').replace(/^https?:\/\//,'')} · ${lead.city}</p>
</td></tr>

<tr><td style="background:#ffffff;padding:20px 28px 14px;">
  <p style="margin:0 0 10px;font-size:14px;color:#061E57;line-height:1.7;">
    I've finished scanning your website and want to share what I found. Your full report is attached as a PDF — here's the summary right in your inbox.
  </p>
  <p style="margin:0;font-size:12px;color:#3a4856;line-height:1.6;">
    I want to make sure your business in <strong>${lead.city}</strong> has every advantage online — so here's the honest picture across all 9 areas we check.
  </p>
</td></tr>

<tr><td style="background:#ffffff;padding:0 28px 20px;">
  <div style="background:#ddeef6;border-radius:7px;padding:10px 14px;border-left:3px solid #b3cee1;">
    <p style="margin:0;font-size:11px;color:#3a4856;">📄 <strong style="color:#061E57;">Full PDF report attached</strong> — save it, share it with your team, refer back to it anytime.</p>
  </div>
</td></tr>

<tr><td style="background:#ffffff;padding:0 28px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      ${['ux','seo','gbp','reviews','trust','content','leadCapture','social','aiVisibility'].slice(0,4).map(k => {
        const s = scores[k]||0;
        return `<td width="25%" style="padding:4px;text-align:center;">
          <div style="background:#ddeef6;border-radius:8px;padding:12px 6px;">
            <div style="font-size:26px;font-weight:700;color:${scoreColor(s)};">${s}</div>
            <div style="font-size:9px;color:#3a4856;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">${{ux:'UX',seo:'SEO',gbp:'GBP',reviews:'Reviews',trust:'Trust',content:'Content',leadCapture:'Lead Cap.',social:'Social',aiVisibility:'AI Vis.'}[k]}</div>
            <div style="font-size:10px;color:${scoreColor(s)};font-weight:700;">${scoreLabel(s)}</div>
          </div>
        </td>`;
      }).join('')}
    </tr>
    <tr style="margin-top:6px">
      ${['ux','seo','gbp','reviews','trust','content','leadCapture','social','aiVisibility'].slice(4).map(k => {
        const s = scores[k]||0;
        return `<td width="20%" style="padding:4px;text-align:center;">
          <div style="background:#ddeef6;border-radius:8px;padding:12px 6px;">
            <div style="font-size:26px;font-weight:700;color:${scoreColor(s)};">${s}</div>
            <div style="font-size:9px;color:#3a4856;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">${{trust:'Trust',content:'Content',leadCapture:'Lead Cap.',social:'Social',aiVisibility:'AI Vis.'}[k]}</div>
            <div style="font-size:10px;color:${scoreColor(s)};font-weight:700;">${scoreLabel(s)}</div>
          </div>
        </td>`;
      }).join('')}
    </tr>
  </table>
</td></tr>

${pillars.filter(p => obs[p.key]).map(p => `
<tr><td style="background:#ffffff;padding:0 28px 16px;">
  <div style="border-left:3px solid ${scoreColor(scores[p.key]||0)};padding-left:14px;">
    <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#061E57;">${p.label} — ${scores[p.key]||0}/100</p>
    <p style="margin:0 0 6px;font-size:12px;color:#3a4856;line-height:1.6;">${obs[p.key]?.summary||''}</p>
    ${obs[p.key]?.friendlyTranslation ? `<p style="margin:0;font-size:11px;color:#854F0B;font-style:italic;line-height:1.5;">${obs[p.key].friendlyTranslation}</p>` : ''}
    ${p.key === 'aiVisibility' && obs[p.key]?.aiQuote ? `<div style="margin-top:8px;background:#061E57;border-radius:6px;padding:9px 12px;"><p style="margin:0;font-size:11px;color:#b3cee1;font-style:italic;">"${obs[p.key].aiQuote}"</p></div>` : ''}
  </div>
</td></tr>`).join('')}

<tr><td style="background:#061E57;padding:26px 28px;text-align:center;">
  <p style="margin:0 0 6px;font-size:10px;color:#b3cee1;letter-spacing:2px;text-transform:uppercase;">Ready to Move Forward?</p>
  <h2 style="margin:0 0 10px;color:#ffffff;font-size:20px;">Request a Free Custom Proposal</h2>
  <p style="margin:0 0 18px;font-size:12px;color:rgba(255,255,255,.55);line-height:1.6;">Tell us you're interested and we'll build a custom plan around your goals, your city, and your budget. No obligation — just a real conversation.</p>
  <a href="${proposalURL}" style="display:inline-block;background:#b3cee1;color:#061E57;padding:13px 32px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.5px;">Yes, I Want a Proposal →</a>
  <p style="margin:16px 0 0;color:rgba(255,255,255,.4);font-size:11px;">Or call: <a href="tel:9182864995" style="color:#b3cee1;">${TEAM_PHONE}</a> · <a href="mailto:${FROM_EMAIL}" style="color:#b3cee1;">${FROM_EMAIL}</a></p>
</td></tr>

<tr><td style="background:#ddeef6;padding:14px 28px;text-align:center;border-radius:0 0 12px 12px;">
  <p style="margin:0;font-size:10px;color:#3a4856;">McWilliams Media · 2430 W. New Orleans St., Broken Arrow, OK 74011</p>
  <p style="margin:4px 0 0;font-size:10px;color:#888;">You received this because you requested a free Digital Health Check.</p>
</td></tr>

</table></td></tr></table></body></html>`;
}

function buildPlainText(lead, scores) {
  return `McWilliams Media — 9-Pillar Digital Health Check
Website: ${lead.url} · ${lead.city}

YOUR SCORES
UX: ${scores.ux||0} | SEO: ${scores.seo||0} | GBP: ${scores.gbp||0} | Reviews: ${scores.reviews||0}
Trust: ${scores.trust||0} | Content: ${scores.content||0} | Lead Capture: ${scores.leadCapture||0}
Social: ${scores.social||0} | AI Visibility: ${scores.aiVisibility||0}

Your full PDF report is attached.

Ready to move forward? Reply to this email or call ${TEAM_PHONE}.

McWilliams Media · ${TEAM_PHONE} · ${FROM_EMAIL}
2430 W. New Orleans St., Broken Arrow, OK 74011`.trim();
}

function buildTeamHTML(lead, proposal, scores, isProposalRequest = false) {
  const urgencyLabel = isProposalRequest ? '🚨 PROPOSAL REQUESTED' : (proposal ? '🟢 PROPOSAL READY' : '🔔 NEW LEAD');

  return `<div style="font-family:Arial,sans-serif;max-width:520px;padding:16px;">
  <div style="background:#061E57;border-radius:8px 8px 0 0;padding:14px 18px;">
    <span style="background:${isProposalRequest?'#A32D2D':'#2d7a4f'};color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:4px;letter-spacing:1px;">${urgencyLabel}</span>
    <p style="margin:7px 0 0;color:#ffffff;font-size:15px;font-weight:700;">${lead.email||'No email'}</p>
    <p style="margin:2px 0 0;color:#b3cee1;font-size:11px;">${new Date().toLocaleString()}</p>
  </div>
  <div style="border:1px solid #ccd8e0;border-top:none;border-radius:0 0 8px 8px;padding:14px 18px;background:#fff;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr><td style="padding:4px 0;color:#3a4856;width:120px;">Website</td><td><a href="${lead.url}">${lead.url}</a></td></tr>
      <tr><td style="padding:4px 0;color:#3a4856;">City</td><td>${lead.city}</td></tr>
      <tr><td style="padding:4px 0;color:#3a4856;">Challenge</td><td>${lead.challenge||'—'}</td></tr>
      <tr><td style="padding:4px 0;color:#3a4856;">Budget</td><td>${lead.budget||'—'}</td></tr>
      <tr><td style="padding:4px 0;color:#3a4856;">Goal</td><td>${lead.goal||'—'}</td></tr>
      <tr><td style="padding:4px 0;color:#3a4856;">Scores</td><td>UX ${scores.ux||'—'} | SEO ${scores.seo||'—'} | AI ${scores.aiVisibility||'—'} | Lead Cap. ${scores.leadCapture||'—'}</td></tr>
      ${proposal ? `<tr><td style="padding:4px 0;color:#3a4856;">Proposal</td><td style="font-family:monospace;font-size:10px;">${proposal.id}</td></tr>` : ''}
    </table>
    ${proposal?.recommendedServices?.length ? `
    <div style="margin-top:12px;padding:10px;background:#ddeef6;border-radius:6px;">
      <strong style="font-size:11px;color:#061E57;">RECOMMENDED SERVICES</strong>
      <ul style="margin:6px 0 0;padding-left:14px;font-size:11px;color:#3a4856;line-height:1.7;">
        ${proposal.recommendedServices.map(s => `<li><strong>${s.name}</strong> — ${s.reason}</li>`).join('')}
      </ul>
    </div>` : ''}
    <div style="margin-top:14px;display:flex;gap:8px;">
      <a href="https://mcwclients.com/dashboard" style="background:#061E57;color:#fff;padding:8px 16px;border-radius:5px;text-decoration:none;font-size:12px;font-weight:700;">View in Dashboard →</a>
      ${isProposalRequest ? `<a href="mailto:${lead.email}" style="background:#b3cee1;color:#061E57;padding:8px 16px;border-radius:5px;text-decoration:none;font-size:12px;font-weight:700;">Reply to Lead →</a>` : ''}
    </div>
  </div>
</div>`;
}

function buildProposalConfirmHTML(lead) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ddeef6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ddeef6;padding:28px 14px;">
<tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#061E57;border-radius:12px 12px 0 0;padding:24px 28px;">
  <p style="margin:0;color:#b3cee1;font-size:10px;letter-spacing:2px;text-transform:uppercase;">McWilliams Media</p>
  <h1 style="margin:6px 0 4px;color:#ffffff;font-size:22px;">Got It — We'll Be In Touch!</h1>
  <p style="margin:0;color:rgba(255,255,255,.5);font-size:12px;">Your proposal request has been received</p>
</td></tr>
<tr><td style="background:#ffffff;padding:24px 28px;border-radius:0 0 12px 12px;">
  <p style="font-size:14px;color:#061E57;line-height:1.7;margin:0 0 14px;">We've received your request and one of our team members will reach out within one business day to talk through your goals and put together a custom proposal.</p>
  <p style="font-size:13px;color:#3a4856;line-height:1.6;margin:0 0 18px;">In the meantime, feel free to reply to this email with any questions — or give us a call at <strong style="color:#061E57;">${TEAM_PHONE}</strong>.</p>
  <div style="background:#ddeef6;border-radius:7px;padding:13px 16px;border-left:3px solid #b3cee1;">
    <p style="margin:0;font-size:12px;color:#3a4856;line-height:1.6;"><strong style="color:#061E57;">Website scanned:</strong> ${lead.url}<br><strong style="color:#061E57;">City:</strong> ${lead.city}</p>
  </div>
  <p style="margin:18px 0 0;text-align:center;font-size:11px;color:#3a4856;">McWilliams Media · ${TEAM_PHONE} · ${FROM_EMAIL}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = { sendReportEmail, notifyTeam, sendProposalRequest };
