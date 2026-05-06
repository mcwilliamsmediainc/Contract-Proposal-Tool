import Mailgun from "mailgun.js";
import FormData from "form-data";
import { logger } from "./logger";

const FROM = "McWilliams Media <notifications@mcwilliamsmedia.com>";

const STRATEGIST_EMAILS: Record<string, string> = {
  "Matt McWilliams": "matt@mcwilliamsmedia.com",
  "Tiffany King": "tiffany@mcwilliamsmedia.com",
  "Elise Johnson": "elise@mcwilliamsmedia.com",
  "Rachelle Hoover": "rachelle@mcwilliamsmedia.com",
};

const ALL_STRATEGISTS = Object.values(STRATEGIST_EMAILS);
const FALLBACK = "info@mcwilliamsmedia.com";

function getMailgunClient() {
  const apiKey = process.env["MAILGUN_API_KEY"];
  const domain = process.env["MAILGUN_DOMAIN"];
  if (!apiKey || !domain) {
    logger.warn("MAILGUN_API_KEY or MAILGUN_DOMAIN not set — email notifications disabled");
    return null;
  }
  const mg = new Mailgun(FormData);
  return { client: mg.client({ username: "api", key: apiKey }), domain };
}

async function send(opts: {
  to: string[];
  subject: string;
  html: string;
}) {
  const mg = getMailgunClient();
  if (!mg) return;

  try {
    await mg.client.messages.create(mg.domain, {
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send email");
  }
}

function recipientsFor(strategist: string | null | undefined): string[] {
  if (strategist && STRATEGIST_EMAILS[strategist]) {
    return [STRATEGIST_EMAILS[strategist]];
  }
  return [FALLBACK];
}

// ── Proposal: First View ──────────────────────────────────────────────────────

export async function sendProposalViewedEmail(opts: {
  clientName: string;
  businessName: string;
  proposalUuid: string;
  clientStrategist?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost"}/admin/proposals/${opts.proposalUuid}/edit`;

  await send({
    to,
    subject: `👀 ${opts.clientName} just viewed their proposal`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0a0a0a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; letter-spacing: 1px;">McWilliams Media</h2>
        </div>
        <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none;">
          <h3 style="margin: 0 0 16px; font-size: 18px;">Proposal Viewed</h3>
          <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> just opened their proposal for the first time.</p>
          <p style="margin: 0 0 24px; color: #666; font-size: 14px;">This is a great time to follow up!</p>
          <a href="${adminUrl}" style="background: #d4af37; color: #0a0a0a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Proposal in Dashboard</a>
        </div>
      </div>
    `,
  });
}

// ── Proposal: Accepted / Signed ───────────────────────────────────────────────

export async function sendProposalAcceptedEmail(opts: {
  clientName: string;
  businessName: string;
  proposalUuid: string;
  clientStrategist?: string | null;
  selectedTier?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost"}/admin/proposals/${opts.proposalUuid}/edit`;
  const tierNote = opts.selectedTier ? `<p style="margin: 0 0 8px;"><strong>Selected Plan:</strong> ${opts.selectedTier}</p>` : "";

  await send({
    to,
    subject: `🎉 ${opts.clientName} accepted their proposal!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0a0a0a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; letter-spacing: 1px;">McWilliams Media</h2>
        </div>
        <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none;">
          <h3 style="margin: 0 0 16px; font-size: 18px;">Proposal Signed ✓</h3>
          <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has accepted and signed their proposal.</p>
          ${tierNote}
          <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Onboarding tasks have been created automatically.</p>
          <a href="${adminUrl}" style="background: #d4af37; color: #0a0a0a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Open in Dashboard</a>
        </div>
      </div>
    `,
  });
}

// ── Contract: Signed ──────────────────────────────────────────────────────────

export async function sendContractSignedEmail(opts: {
  clientName: string;
  businessName: string;
  contractUuid: string;
  contractType: string;
  totalCost: number;
}) {
  const adminUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost"}/admin/contracts`;

  await send({
    to: ALL_STRATEGISTS,
    subject: `📝 ${opts.clientName} signed their contract`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0a0a0a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; letter-spacing: 1px;">McWilliams Media</h2>
        </div>
        <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none;">
          <h3 style="margin: 0 0 16px; font-size: 18px;">Contract Signed ✓</h3>
          <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has signed their contract.</p>
          <p style="margin: 0 0 8px;"><strong>Contract Type:</strong> ${opts.contractType}</p>
          <p style="margin: 0 0 24px;"><strong>Total:</strong> $${opts.totalCost.toLocaleString()}</p>
          <a href="${adminUrl}" style="background: #d4af37; color: #0a0a0a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Contracts</a>
        </div>
      </div>
    `,
  });
}

// ── Onboarding Form: Submitted ────────────────────────────────────────────────

export async function sendOnboardingSubmittedEmail(opts: {
  clientName: string;
  businessName: string;
  onboardingId: string;
  clientStrategist?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost"}/admin/onboarding`;

  await send({
    to,
    subject: `✅ ${opts.clientName} completed their onboarding form`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0a0a0a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; letter-spacing: 1px;">McWilliams Media</h2>
        </div>
        <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none;">
          <h3 style="margin: 0 0 16px; font-size: 18px;">Onboarding Form Submitted</h3>
          <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has completed and submitted their onboarding questionnaire.</p>
          <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Review their responses and begin onboarding.</p>
          <a href="${adminUrl}" style="background: #d4af37; color: #0a0a0a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Onboarding Pipeline</a>
        </div>
      </div>
    `,
  });
}
