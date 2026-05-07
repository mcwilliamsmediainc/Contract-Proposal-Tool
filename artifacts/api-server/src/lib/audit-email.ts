import FormData from "form-data";
import Mailgun from "mailgun.js";
import type { AuditLead } from "@workspace/db";
import { generateAuditPDF } from "./audit-pdf.js";

const FROM_EMAIL = "info@mcwilliamsmedia.com";
const TEAM_EMAIL = "info@mcwilliamsmedia.com";
const TEAM_PHONE = "(918) 286-4995";

function getMailgunClient() {
  const mg = new Mailgun(FormData);
  return mg.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY ?? "",
    url: "https://api.mailgun.net",
  });
}

function scoreColor(s: number): string {
  if (s >= 70) return "#2d7a4f";
  if (s >= 50) return "#7c370c";
  return "#c0392b";
}

function scoreLabel(s: number): string {
  if (s >= 70) return "Good";
  if (s >= 50) return "Needs Work";
  return "Critical";
}

function buildReportHTML(lead: AuditLead, scores: Record<string, number>, obs: Record<string, Record<string, string>>): string {
  const pillars = [
    { key: "ux", label: "Website UX" },
    { key: "seo", label: "SEO Presence" },
    { key: "social", label: "Social Media" },
    { key: "aiVisibility", label: "AI Visibility" },
  ];

  const urlClean = (lead.url ?? "").replace(/^https?:\/\//, "");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "mcwclients.com";
  const proposalURL = `https://${domain}/api/audit/request-proposal?leadId=${lead.uuid}`;

  const scoreCards = pillars
    .map((p) => {
      const score = scores[p.key] ?? 0;
      return `<td width="25%" style="padding:6px;text-align:center;">
      <div style="background:#f5f0e8;border-radius:10px;padding:16px 8px;">
        <div style="font-size:30px;font-weight:700;color:${scoreColor(score)};">${score}</div>
        <div style="font-size:9px;color:#3a4856;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:2px 0;">${p.label}</div>
        <div style="font-size:10px;color:${scoreColor(score)};font-weight:600;">${scoreLabel(score)}</div>
      </div>
    </td>`;
    })
    .join("");

  const obsBlocks = pillars
    .map((p) => {
      const o = obs[p.key] ?? {};
      const score = scores[p.key] ?? 0;
      const labels: Record<string, string> = {
        ux: "🖥 Website UX",
        seo: "🔍 SEO Presence",
        social: "📱 Social Media",
        aiVisibility: "🤖 AI Visibility",
      };
      if (!o["summary"]) return "";
      return `<tr><td style="background:#ffffff;padding:0 32px 20px;">
      <div style="border-left:3px solid ${scoreColor(score)};padding-left:16px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#061E57;">${labels[p.key]}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#3a4856;line-height:1.6;">${o["summary"] ?? ""}</p>
        ${o["friendlyTranslation"] ? `<p style="margin:0 0 6px;font-size:12px;color:#7c370c;font-style:italic;line-height:1.5;">${o["friendlyTranslation"]}</p>` : ""}
        ${p.key === "aiVisibility" && o["aiQuote"] ? `<div style="background:#061E57;border-radius:6px;padding:10px 14px;margin-top:6px;"><p style="margin:0;font-size:12px;color:#b3cee1;font-style:italic;line-height:1.5;">"${o["aiQuote"]}"</p></div>` : ""}
      </div>
    </td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#061E57;border-radius:12px 12px 0 0;padding:28px 32px;">
    <p style="margin:0;color:#C9A959;font-size:11px;letter-spacing:2px;text-transform:uppercase;">McWilliams Media</p>
    <h1 style="margin:8px 0 4px;color:#ffffff;font-size:26px;letter-spacing:0.5px;">Your Digital Health Check</h1>
    <p style="margin:0;color:#b3cee1;font-size:13px;">${urlClean} &nbsp;·&nbsp; ${lead.city}</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:24px 32px 16px;">
    <p style="margin:0 0 12px;font-size:15px;color:#061E57;line-height:1.7;">
      Your full audit is attached as a PDF you can save and share. Here's the summary right in your inbox.
    </p>
    <p style="margin:0;font-size:13px;color:#3a4856;line-height:1.6;">
      Here's the honest picture for your business in <strong>${lead.city}</strong>, along with what we'd tackle first.
    </p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:0 32px 20px;">
    <div style="background:#f5f0e8;border-radius:8px;padding:12px 16px;border-left:3px solid #C9A959;">
      <p style="margin:0;font-size:12px;color:#3a4856;">
        📄 <strong style="color:#061E57;">Full report attached</strong> — Your complete audit with all findings and recommendations is attached as a PDF.
      </p>
    </div>
  </td></tr>
  <tr><td style="background:#ffffff;padding:0 32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>${scoreCards}</tr></table>
  </td></tr>
  ${obsBlocks}
  <tr><td style="background:#ffffff;padding:0 32px 24px;"><div style="border-top:1px solid #d0cfc8;"></div></td></tr>
  <tr><td style="background:#061E57;padding:32px;">
    <p style="margin:0 0 6px;font-size:11px;color:#C9A959;letter-spacing:2px;text-transform:uppercase;text-align:center;">Ready to Move Forward?</p>
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;text-align:center;line-height:1.3;">Request a Free Custom Proposal</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#b3cee1;text-align:center;line-height:1.6;">
      Tell us you're interested and we'll put together a custom plan built around your goals, your city, and your budget. No obligation.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${proposalURL}" style="display:inline-block;background:#C9A959;color:#061E57;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.5px;">
          Yes, I Want a Proposal →
        </a>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#b3cee1;">
      Or call us: <a href="tel:9182864995" style="color:#C9A959;">${TEAM_PHONE}</a>
      &nbsp;·&nbsp;
      <a href="mailto:${FROM_EMAIL}" style="color:#C9A959;">${FROM_EMAIL}</a>
    </p>
  </td></tr>
  <tr><td style="background:#f5f0e8;padding:16px 32px;text-align:center;border-radius:0 0 12px 12px;">
    <p style="margin:0;font-size:11px;color:#3a4856;">McWilliams Media  ·  2430 W. New Orleans St., Broken Arrow, OK 74011</p>
    <p style="margin:6px 0 0;font-size:10px;color:#888;">You received this because you requested a free Digital Health Check.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildTeamHTML(lead: AuditLead, scores: Record<string, number>, isProposalRequest = false): string {
  const urgencyColor = isProposalRequest ? "#c0392b" : "#2d7a4f";
  const urgencyLabel = isProposalRequest ? "🚨 PROPOSAL REQUESTED" : "🔔 NEW AUDIT LEAD";

  return `<div style="font-family:Arial,sans-serif;max-width:520px;padding:16px;">
  <div style="background:#061E57;border-radius:8px 8px 0 0;padding:16px 20px;">
    <span style="background:${urgencyColor};color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:1px;">${urgencyLabel}</span>
    <p style="margin:8px 0 0;color:#ffffff;font-size:16px;font-weight:700;">${lead.email ?? "No email yet"}</p>
    <p style="margin:2px 0 0;color:#b3cee1;font-size:12px;">${new Date().toLocaleString()}</p>
  </div>
  <div style="border:1px solid #d0cfc8;border-top:none;border-radius:0 0 8px 8px;padding:16px 20px;background:#fff;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:5px 0;color:#3a4856;width:130px;">Website</td><td><a href="${lead.url}" style="color:#061E57;">${lead.url}</a></td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">City</td><td>${lead.city}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Challenge</td><td>${lead.challenge ?? "—"}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Budget</td><td>${lead.budget ?? "—"}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Goal</td><td>${lead.goal ?? "—"}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Business Type</td><td>${lead.businessType ?? "—"}</td></tr>
      <tr><td style="padding:5px 0;color:#3a4856;">Scores</td>
        <td>UX ${scores["ux"] ?? "—"} &nbsp;|&nbsp; SEO ${scores["seo"] ?? "—"} &nbsp;|&nbsp; Social ${scores["social"] ?? "—"} &nbsp;|&nbsp; AI ${scores["aiVisibility"] ?? "—"}</td>
      </tr>
    </table>
  </div>
</div>`;
}

export async function sendReportEmail(lead: AuditLead): Promise<void> {
  if (!lead.email) return;

  const scores: Record<string, number> = lead.scores ? JSON.parse(lead.scores) : {};
  const scanData: { observations?: Record<string, Record<string, string>> } = lead.scanData
    ? JSON.parse(lead.scanData)
    : {};
  const obs = scanData.observations ?? {};

  const pdfBuffer = await generateAuditPDF(lead);
  const subject = `Your Digital Health Check — ${(lead.url ?? "").replace(/^https?:\/\//, "")}`;
  const html = buildReportHTML(lead, scores, obs);
  const text = `McWilliams Media — Digital Health Check\n\nWebsite: ${lead.url}\nCity: ${lead.city}\n\nUX: ${scores["ux"] ?? 0}/100 | SEO: ${scores["seo"] ?? 0}/100 | Social: ${scores["social"] ?? 0}/100 | AI Visibility: ${scores["aiVisibility"] ?? 0}/100\n\nFull report attached.\n\nMcWilliams Media — ${TEAM_PHONE} — ${FROM_EMAIL}`;

  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN ?? "";

  const form = new FormData();
  form.append("from", `McWilliams Media <${FROM_EMAIL}>`);
  form.append("to", lead.email);
  form.append("cc", TEAM_EMAIL);
  form.append("subject", subject);
  form.append("html", html);
  form.append("text", text);
  form.append("attachment", pdfBuffer, {
    filename: `McWilliams-Media-Audit-${Date.now()}.pdf`,
    contentType: "application/pdf",
  });

  await mg.messages.create(domain, form as unknown as Parameters<typeof mg.messages.create>[1]);
}

export async function notifyTeamNewLead(lead: AuditLead): Promise<void> {
  const scores: Record<string, number> = lead.scores ? JSON.parse(lead.scores) : {};
  const subject = `🔔 New Audit Lead: ${lead.email ?? "No email"} — ${(lead.url ?? "").replace(/^https?:\/\//, "")}`;
  const html = buildTeamHTML(lead, scores, false);

  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN ?? "";

  await mg.messages.create(domain, {
    from: `McWilliams Audit Tool <${FROM_EMAIL}>`,
    to: TEAM_EMAIL,
    subject,
    html,
  });
}

export async function notifyTeamProposalRequest(lead: AuditLead): Promise<void> {
  const scores: Record<string, number> = lead.scores ? JSON.parse(lead.scores) : {};
  const subject = `🚨 PROPOSAL REQUESTED: ${lead.email ?? "Unknown"} — ${lead.city}`;
  const html = buildTeamHTML(lead, scores, true);

  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN ?? "";

  await mg.messages.create(domain, {
    from: `McWilliams Audit Tool <${FROM_EMAIL}>`,
    to: TEAM_EMAIL,
    subject,
    html,
  });

  if (lead.email) {
    const confirmHTML = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
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
      We've received your request and one of our team members will reach out within one business day.
    </p>
    <p style="font-size:14px;color:#3a4856;line-height:1.6;margin:0 0 20px;">
      Feel free to reply to this email or call <strong style="color:#061E57;">${TEAM_PHONE}</strong>.
    </p>
    <div style="background:#f5f0e8;border-radius:8px;padding:16px 20px;border-left:3px solid #C9A959;">
      <p style="margin:0;font-size:13px;color:#3a4856;line-height:1.6;">
        <strong style="color:#061E57;">Website scanned:</strong> ${lead.url}<br>
        <strong style="color:#061E57;">City:</strong> ${lead.city}
      </p>
    </div>
  </td></tr>
  <tr><td style="background:#061E57;padding:20px 32px;text-align:center;border-radius:0 0 12px 12px;">
    <p style="margin:0;color:#b3cee1;font-size:12px;">McWilliams Media  ·  ${TEAM_PHONE}  ·  ${FROM_EMAIL}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    await mg.messages.create(domain, {
      from: `McWilliams Media <${FROM_EMAIL}>`,
      to: lead.email,
      subject: "We received your proposal request — McWilliams Media",
      html: confirmHTML,
    });
  }
}
