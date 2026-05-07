import Mailgun from "mailgun.js";
import FormData from "form-data";
import { logger } from "./logger";

const FROM_INTERNAL = "McWilliams Media <notifications@mcwilliamsmedia.com>";
const FROM_CLIENT = "McWilliams Media <noreply@mcwclients.com>";

const STRATEGIST_EMAILS: Record<string, string> = {
  "Matt McWilliams": "matt@mcwilliamsmedia.com",
  "Tiffany King": "tiffany@mcwilliamsmedia.com",
  "Elise Johnson": "elise@mcwilliamsmedia.com",
  "Rachelle Hoover": "rachelle@mcwilliamsmedia.com",
};

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
  from: string;
  to: string[];
  subject: string;
  html: string;
}) {
  const mg = getMailgunClient();
  if (!mg) return;

  try {
    await mg.client.messages.create(mg.domain, {
      from: opts.from,
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
  const recipients: string[] = [FALLBACK];
  if (strategist && STRATEGIST_EMAILS[strategist] && STRATEGIST_EMAILS[strategist] !== FALLBACK) {
    recipients.push(STRATEGIST_EMAILS[strategist]);
  }
  return recipients;
}

function baseUrl() {
  return `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost"}`;
}

function internalLayout(body: string) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #061e57; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">McWilliams Media</h2>
      </div>
      <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none;">
        ${body}
      </div>
    </div>
  `;
}

function clientLayout(body: string) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; background: #ffffff;">
      <div style="background: #061e57; padding: 28px 36px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">McWilliams Media</h2>
      </div>
      <div style="padding: 36px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        ${body}
      </div>
      <div style="text-align: center; padding: 24px; color: #999; font-size: 12px; line-height: 1.6;">
        McWilliams Media &nbsp;·&nbsp; Premium Digital Agency<br>
        This is an automated confirmation — please do not reply to this email.
      </div>
    </div>
  `;
}

// ── INTERNAL: Proposal First View ─────────────────────────────────────────────

export async function sendProposalViewedEmail(opts: {
  clientName: string;
  businessName: string;
  proposalUuid: string;
  clientStrategist?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `${baseUrl()}/admin/proposals/${opts.proposalUuid}/edit`;

  await send({
    from: FROM_INTERNAL,
    to,
    subject: `👀 ${opts.clientName} just viewed their proposal`,
    html: internalLayout(`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Proposal Viewed</h3>
      <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> just opened their proposal for the first time.</p>
      <p style="margin: 0 0 24px; color: #666; font-size: 14px;">This is a great time to follow up!</p>
      <a href="${adminUrl}" style="background: #061e57; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Proposal in Dashboard</a>
    `),
  });
}

// ── INTERNAL: Proposal Accepted ───────────────────────────────────────────────

export async function sendProposalAcceptedEmail(opts: {
  clientName: string;
  businessName: string;
  proposalUuid: string;
  clientStrategist?: string | null;
  selectedTier?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `${baseUrl()}/admin/proposals/${opts.proposalUuid}/edit`;
  const tierNote = opts.selectedTier
    ? `<p style="margin: 0 0 8px;"><strong>Selected Plan:</strong> ${opts.selectedTier}</p>`
    : "";

  await send({
    from: FROM_INTERNAL,
    to,
    subject: `🎉 ${opts.clientName} accepted their proposal!`,
    html: internalLayout(`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Proposal Signed ✓</h3>
      <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has accepted and signed their proposal.</p>
      ${tierNote}
      <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Onboarding tasks have been created automatically.</p>
      <a href="${adminUrl}" style="background: #061e57; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Open in Dashboard</a>
    `),
  });
}

// ── CLIENT: Proposal Accepted Confirmation ────────────────────────────────────

export async function sendProposalAcceptedClientEmail(opts: {
  clientName: string;
  businessName: string;
  clientEmail: string;
  selectedTier?: string | null;
}) {
  if (!opts.clientEmail) return;

  const tierNote = opts.selectedTier
    ? `<p style="margin: 0 0 8px; color: #444;"><strong>Selected Plan:</strong> ${opts.selectedTier}</p>`
    : "";

  await send({
    from: FROM_CLIENT,
    to: [opts.clientEmail],
    subject: `Your proposal has been signed — welcome to McWilliams Media`,
    html: clientLayout(`
      <h3 style="margin: 0 0 8px; font-size: 22px; color: #0a0a0a;">Thank you, ${opts.clientName}!</h3>
      <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
        We've received your signed proposal for <strong>${opts.businessName}</strong>. We're excited to get started and will be in touch shortly to kick things off.
      </p>
      ${tierNote}
      <div style="background: #eef4f9; border-left: 4px solid #b3cee1; padding: 16px 20px; margin: 0 0 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #3a4856; font-size: 14px; line-height: 1.6;">
          <strong>What happens next?</strong><br>
          Your dedicated strategist will reach out within 1–2 business days to schedule your kickoff call and walk you through the onboarding process.
        </p>
      </div>
      <p style="margin: 0; color: #888; font-size: 13px;">Questions? Reply to your strategist directly or reach us at <a href="mailto:info@mcwilliamsmedia.com" style="color: #061e57;">info@mcwilliamsmedia.com</a>.</p>
    `),
  });
}

// ── CLIENT: Contract Ready to Sign ────────────────────────────────────────────

export async function sendContractReadyClientEmail(opts: {
  clientName: string;
  businessName: string;
  clientEmail: string;
  contractUuid: string;
  contractType: string;
  totalCost: number;
  depositAmount: number;
}) {
  if (!opts.clientEmail) return;

  const signingUrl = `${baseUrl()}/contract/${opts.contractUuid}`;
  const typeLabel = opts.contractType.charAt(0).toUpperCase() + opts.contractType.slice(1);

  await send({
    from: FROM_CLIENT,
    to: [opts.clientEmail],
    subject: `Your McWilliams Media contract is ready to sign`,
    html: clientLayout(`
      <h3 style="margin: 0 0 8px; font-size: 22px; color: #0a0a0a;">Your contract is ready, ${opts.clientName}!</h3>
      <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
        Thank you for accepting your proposal. We've prepared your <strong>${typeLabel} Services Agreement</strong> for <strong>${opts.businessName}</strong>. Please review and sign it at your earliest convenience to lock in your project start date.
      </p>
      <div style="background: #f9f9fb; border: 1px solid #dde6f0; border-radius: 8px; padding: 20px 24px; margin: 0 0 28px;">
        <p style="margin: 0 0 6px; font-size: 14px; color: #444;"><strong>Contract Type:</strong> ${typeLabel} Services Agreement</p>
        <p style="margin: 0 0 6px; font-size: 14px; color: #444;"><strong>Total Investment:</strong> $${opts.totalCost.toLocaleString()}</p>
        <p style="margin: 0; font-size: 14px; color: #444;"><strong>Deposit Due at Signing:</strong> $${opts.depositAmount.toLocaleString()}</p>
      </div>
      <div style="text-align: center; margin: 0 0 28px;">
        <a href="${signingUrl}" style="background: #061e57; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; letter-spacing: 0.3px;">Review &amp; Sign Contract →</a>
      </div>
      <div style="background: #eef4f9; border-left: 4px solid #b3cee1; padding: 16px 20px; margin: 0 0 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #3a4856; font-size: 14px; line-height: 1.6;">
          <strong>What happens next?</strong><br>
          Once your contract is signed, your strategist will reach out to confirm your deposit and schedule your project kickoff call.
        </p>
      </div>
      <p style="margin: 0; color: #888; font-size: 13px;">Questions? Reply to your strategist directly or reach us at <a href="mailto:info@mcwilliamsmedia.com" style="color: #061e57;">info@mcwilliamsmedia.com</a>.</p>
    `),
  });
}

// ── INTERNAL: Contract Ready to Sign ──────────────────────────────────────────

export async function sendContractReadyInternalEmail(opts: {
  clientName: string;
  businessName: string;
  contractUuid: string;
  contractType: string;
  totalCost: number;
  clientStrategist?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `${baseUrl()}/admin/contracts/${opts.contractUuid}/edit`;
  const typeLabel = opts.contractType.charAt(0).toUpperCase() + opts.contractType.slice(1);

  await send({
    from: FROM_INTERNAL,
    to,
    subject: `📄 Contract sent to ${opts.clientName} — ${opts.businessName}`,
    html: internalLayout(`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Contract Ready to Sign</h3>
      <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> accepted their proposal. A <strong>${typeLabel} Services Agreement</strong> has been generated and emailed to the client for signature.</p>
      <p style="margin: 0 0 8px;"><strong>Total:</strong> $${opts.totalCost.toLocaleString()}</p>
      <p style="margin: 0 0 24px; color: #666; font-size: 14px;">You'll receive another notification once the client signs.</p>
      <a href="${adminUrl}" style="background: #061e57; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Review Contract in Dashboard</a>
    `),
  });
}

// ── INTERNAL: Contract Signed ─────────────────────────────────────────────────

export async function sendContractSignedEmail(opts: {
  clientName: string;
  businessName: string;
  contractUuid: string;
  contractType: string;
  totalCost: number;
  clientStrategist?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `${baseUrl()}/admin/contracts`;

  await send({
    from: FROM_INTERNAL,
    to,
    subject: `📝 ${opts.clientName} signed their contract`,
    html: internalLayout(`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Contract Signed ✓</h3>
      <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has signed their contract.</p>
      <p style="margin: 0 0 8px;"><strong>Contract Type:</strong> ${opts.contractType}</p>
      <p style="margin: 0 0 24px;"><strong>Total:</strong> $${opts.totalCost.toLocaleString()}</p>
      <a href="${adminUrl}" style="background: #061e57; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Contracts</a>
    `),
  });
}

// ── CLIENT: Contract Signed Confirmation ──────────────────────────────────────

export async function sendContractSignedClientEmail(opts: {
  clientName: string;
  businessName: string;
  clientEmail: string;
  contractType: string;
  totalCost: number;
  depositAmount: number;
}) {
  if (!opts.clientEmail) return;

  await send({
    from: FROM_CLIENT,
    to: [opts.clientEmail],
    subject: `Your contract is signed — let's build something great`,
    html: clientLayout(`
      <h3 style="margin: 0 0 8px; font-size: 22px; color: #0a0a0a;">Contract confirmed, ${opts.clientName}!</h3>
      <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
        Your signed contract with McWilliams Media for <strong>${opts.businessName}</strong> has been received. A copy is on file and your project is officially underway.
      </p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 20px 24px; margin: 0 0 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #444;"><strong>Contract Type:</strong> ${opts.contractType}</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #444;"><strong>Total Investment:</strong> $${opts.totalCost.toLocaleString()}</p>
        <p style="margin: 0; font-size: 14px; color: #444;"><strong>Deposit Due:</strong> $${opts.depositAmount.toLocaleString()}</p>
      </div>
      <div style="background: #eef4f9; border-left: 4px solid #b3cee1; padding: 16px 20px; margin: 0 0 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #3a4856; font-size: 14px; line-height: 1.6;">
          <strong>Next steps:</strong><br>
          Your strategist will be in touch to confirm your deposit and schedule your project kickoff. Keep an eye on your inbox!
        </p>
      </div>
      <p style="margin: 0; color: #888; font-size: 13px;">Questions? Reach us at <a href="mailto:info@mcwilliamsmedia.com" style="color: #061e57;">info@mcwilliamsmedia.com</a>.</p>
    `),
  });
}

// ── INTERNAL: ACH Payment Info Received ───────────────────────────────────────

export async function sendAchPaymentEmail(opts: {
  clientName: string;
  businessName: string;
  contractUuid: string;
  totalCost: number;
  depositAmount: number;
  accountHolderName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
}) {
  const adminUrl = `${baseUrl()}/admin/contracts/${opts.contractUuid}/edit`;

  await send({
    from: FROM_INTERNAL,
    to: [FALLBACK],
    subject: `🏦 ACH payment info received — ${opts.clientName} (${opts.businessName})`,
    html: internalLayout(`
      <h3 style="margin: 0 0 8px; font-size: 18px;">ACH Payment Information Received</h3>
      <p style="margin: 0 0 20px; color: #555;">
        <strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has submitted their ACH payment details for deposit collection.
      </p>
      <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚠ Sensitive Financial Information — Handle Securely</p>
        <p style="margin: 0; font-size: 12px; color: #92400e;">Do not forward this email. Delete after processing the ACH transaction.</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666; width: 45%;">Account Holder</td>
          <td style="padding: 10px 0; font-weight: 600;">${opts.accountHolderName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666;">Bank Name</td>
          <td style="padding: 10px 0; font-weight: 600;">${opts.bankName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666;">Account Type</td>
          <td style="padding: 10px 0; font-weight: 600;">${opts.accountType}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666;">Routing Number</td>
          <td style="padding: 10px 0; font-weight: 600; font-family: monospace;">${opts.routingNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666;">Account Number</td>
          <td style="padding: 10px 0; font-weight: 600; font-family: monospace;">${opts.accountNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666;">Deposit Due</td>
          <td style="padding: 10px 0; font-weight: 600;">$${opts.depositAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">Total Contract Value</td>
          <td style="padding: 10px 0; font-weight: 600;">$${opts.totalCost.toLocaleString()}</td>
        </tr>
      </table>
      <div style="margin-top: 24px;">
        <a href="${adminUrl}" style="background: #061e57; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Contract in Dashboard</a>
      </div>
    `),
  });
}

// ── CLIENT: Proposal Outreach (sent by strategist) ────────────────────────────

export async function sendProposalOutreachEmail(opts: {
  clientName: string;
  clientEmail: string;
  proposalUuid: string;
  clientStrategist: string | null | undefined;
  emailSubject: string;
  emailBody: string;
}) {
  const strategistName = opts.clientStrategist || "McWilliams Media";
  const strategistEmail =
    opts.clientStrategist && STRATEGIST_EMAILS[opts.clientStrategist]
      ? STRATEGIST_EMAILS[opts.clientStrategist]
      : FALLBACK;

  const from = `${strategistName} <${strategistEmail}>`;

  const htmlBody = opts.emailBody
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      return trimmed === ""
        ? `<div style="height:12px"></div>`
        : `<p style="margin:0;line-height:1.7;font-size:15px;color:#1a1a1a;">${trimmed}</p>`;
    })
    .join("\n");

  await send({
    from,
    to: [opts.clientEmail],
    subject: opts.emailSubject,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 0;">
        ${htmlBody}
        <div style="height:32px"></div>
        <p style="margin:0;font-size:13px;color:#999;border-top:1px solid #eee;padding-top:20px;">
          ${strategistName} &nbsp;·&nbsp; McWilliams Media<br>
          <a href="mailto:${strategistEmail}" style="color:#061e57;">${strategistEmail}</a>
        </p>
      </div>
    `,
  });
}

// ── INTERNAL: Payment Update Received ─────────────────────────────────────────

export async function sendPaymentUpdateEmail(opts: {
  clientName: string;
  paymentMethod: "ach" | "credit-card";
  // ACH fields
  accountHolderName?: string;
  bankName?: string;
  accountType?: string;
  routingNumber?: string;
  accountNumber?: string;
  // Credit card fields
  cardholderName?: string;
  cardNumber?: string;
  expirationMonth?: string;
  expirationYear?: string;
  cvv?: string;
  billingZip?: string;
}) {
  const isAch = opts.paymentMethod === "ach";

  const achRows = isAch ? `
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666; width: 45%;">Account Holder</td>
      <td style="padding: 10px 0; font-weight: 600;">${opts.accountHolderName ?? ""}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666;">Bank Name</td>
      <td style="padding: 10px 0; font-weight: 600;">${opts.bankName ?? ""}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666;">Account Type</td>
      <td style="padding: 10px 0; font-weight: 600;">${opts.accountType ?? ""}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666;">Routing Number</td>
      <td style="padding: 10px 0; font-weight: 600; font-family: monospace;">${opts.routingNumber ?? ""}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #666;">Account Number</td>
      <td style="padding: 10px 0; font-weight: 600; font-family: monospace;">${opts.accountNumber ?? ""}</td>
    </tr>
  ` : `
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666; width: 45%;">Cardholder Name</td>
      <td style="padding: 10px 0; font-weight: 600;">${opts.cardholderName ?? ""}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666;">Card Number</td>
      <td style="padding: 10px 0; font-weight: 600; font-family: monospace;">${opts.cardNumber ?? ""}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666;">Expiration</td>
      <td style="padding: 10px 0; font-weight: 600;">${opts.expirationMonth ?? ""}/${opts.expirationYear ?? ""}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 10px 0; color: #666;">CVV</td>
      <td style="padding: 10px 0; font-weight: 600; font-family: monospace;">${opts.cvv ?? ""}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #666;">Billing ZIP</td>
      <td style="padding: 10px 0; font-weight: 600;">${opts.billingZip ?? ""}</td>
    </tr>
  `;

  await send({
    from: FROM_INTERNAL,
    to: [FALLBACK],
    subject: `💳 Payment info update — ${opts.clientName} (${isAch ? "ACH" : "Credit Card"})`,
    html: internalLayout(`
      <h3 style="margin: 0 0 8px; font-size: 18px;">Payment Information Update</h3>
      <p style="margin: 0 0 20px; color: #555;">
        <strong>${opts.clientName}</strong> has submitted updated <strong>${isAch ? "ACH bank account" : "credit card"}</strong> payment details.
      </p>
      <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚠ Sensitive Financial Information — Handle Securely</p>
        <p style="margin: 0; font-size: 12px; color: #92400e;">Do not forward this email. Delete after updating the payment record.</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666; width: 45%;">Client Name</td>
          <td style="padding: 10px 0; font-weight: 600;">${opts.clientName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 10px 0; color: #666;">Payment Method</td>
          <td style="padding: 10px 0; font-weight: 600;">${isAch ? "ACH Bank Transfer" : "Credit Card"}</td>
        </tr>
        ${achRows}
      </table>
    `),
  });
}

// ── INTERNAL: Onboarding Form Submitted ───────────────────────────────────────

export async function sendOnboardingSubmittedEmail(opts: {
  clientName: string;
  businessName: string;
  onboardingId: string;
  clientStrategist?: string | null;
}) {
  const to = recipientsFor(opts.clientStrategist);
  const adminUrl = `${baseUrl()}/admin/onboarding`;

  await send({
    from: FROM_INTERNAL,
    to,
    subject: `✅ ${opts.clientName} completed their onboarding form`,
    html: internalLayout(`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Onboarding Form Submitted</h3>
      <p style="margin: 0 0 8px;"><strong>${opts.clientName}</strong> at <strong>${opts.businessName}</strong> has completed and submitted their onboarding questionnaire.</p>
      <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Review their responses and begin onboarding.</p>
      <a href="${adminUrl}" style="background: #061e57; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Onboarding Pipeline</a>
    `),
  });
}

// ── CLIENT: Onboarding Kickoff (post-signing) ─────────────────────────────────

export async function sendOnboardingKickoffEmail(opts: {
  clientName: string;
  businessName: string;
  clientEmail: string;
  onboardingUuid: string;
  services: string[];
  hasLsa?: boolean;
}) {
  if (!opts.clientEmail) return;

  const formUrl = `${baseUrl()}/intake/${opts.onboardingUuid}`;

  const hasGoogleAds  = opts.services.includes("marketing.google_ads");
  const hasSocialPost = opts.services.includes("marketing.social_media_posting");
  const hasMetaAds    = opts.services.includes("marketing.social_media_ads");
  const hasEmail      = opts.services.includes("marketing.newsletter");
  const hasSeo        = opts.services.includes("marketing.seo");
  const isWebsite     = opts.services.includes("website");
  const hasLsa        = opts.hasLsa ?? false;

  // Build "what you'll need" section labels
  const sections: { icon: string; title: string; items: string[] }[] = [];

  sections.push({
    icon: "📋",
    title: "General Info (Everyone)",
    items: [
      "Your company website URL",
      "Primary point of contact email for your team",
      "Standard & seasonal discounts or promotions",
      "Lead magnets or freebie offers",
      "Company logo files (Google Drive or Dropbox link)",
      "Brand image files (Google Drive or Dropbox link)",
      "Links to your Facebook, Instagram, LinkedIn, and other social pages",
    ],
  });

  if (hasSeo) {
    sections.push({
      icon: "🔍",
      title: "SEO",
      items: [
        "Business address, phone number & hours",
        "5 cities you want to target",
        "Your services listed in priority order",
        "Services people think you offer that you do not",
      ],
    });
  }

  if (hasGoogleAds) {
    const lsaItems = hasLsa ? [
      "Business Insurance document (upload link)",
      "License Number or Bar Association Number (if applicable)",
      "Google LSA setup preference (self-complete or at kickoff call)",
      "Your LSA monthly budget",
    ] : [];
    sections.push({
      icon: "📣",
      title: "Google Ads" + (hasLsa ? " & Local Service Ads" : ""),
      items: [
        "Articles of Incorporation (upload link)",
        "Driver's License — front & back (upload link)",
        "Your PPC monthly budget",
        ...lsaItems,
      ],
    });
  }

  if (hasSocialPost) {
    sections.push({
      icon: "📱",
      title: "Social Media Posting",
      items: [
        "Verify your Instagram Business Account is connected to your Facebook Business Page",
        "Your preferred graphic style (up to 3): Modern, Minimalistic, Rustic, Vibrant, Upscale, Youthful, Feminine, Masculine, Elegant, Sophisticated, Fun, Trendy…",
        "Your preferred post tone (up to 3): Humorous, Informative, Trendy, Engaging, Inspirational, Promotional, Educational, Casual…",
        "Links to 2 inspirational social accounts in your industry",
      ],
    });
  }

  if (hasMetaAds) {
    sections.push({
      icon: "💰",
      title: "Meta (Facebook & Instagram) Ads",
      items: [
        "Have you run Meta Ads before? (Yes/No)",
        "Meta Business Manager name & Facebook Ad Account name (if existing)",
        "Whether you have a landing page for ads",
        "Verify Instagram is connected to your Facebook Business Page",
        "Confirm your identity on your personal Facebook profile",
        "Add a payment method to your Meta Ad Account",
      ],
    });
  }

  if (hasEmail) {
    sections.push({
      icon: "✉️",
      title: "Email Marketing",
      items: [
        "Your existing email contact list (upload link)",
        "Are you currently doing email marketing? (Yes/No)",
        "Your current email platform (if applicable)",
        "MailChimp account access (if applicable)",
        "Current email list size",
      ],
    });
  }

  if (isWebsite && !hasGoogleAds && !hasSocialPost && !hasMetaAds && !hasEmail) {
    sections.push({
      icon: "🌐",
      title: "Website Project",
      items: [
        "Brand assets and existing content you'd like us to reference",
        "Examples of websites you love (for design direction)",
        "Key pages, features, or functionality you need",
      ],
    });
  }

  const sectionsHtml = sections.map(sec => `
    <div style="margin: 0 0 20px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
      <div style="background: #061e57; padding: 10px 16px;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px;">${sec.icon} &nbsp;${sec.title}</p>
      </div>
      <ul style="margin: 0; padding: 12px 16px 12px 32px; background: #fff;">
        ${sec.items.map(item => `<li style="margin: 0 0 6px; font-size: 13px; color: #444; line-height: 1.5;">${item}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  await send({
    from: FROM_CLIENT,
    to: [opts.clientEmail],
    subject: `Action needed: Complete your pre-kickoff form — ${opts.businessName}`,
    html: clientLayout(`
      <h3 style="margin: 0 0 8px; font-size: 22px; color: #0a0a0a;">You're all set, ${opts.clientName}!</h3>
      <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
        Your contract is signed and your project with <strong>McWilliams Media</strong> is officially underway. Before your kickoff call, please take a few minutes to complete your <strong>Pre-Kickoff Questionnaire</strong> — it helps our team hit the ground running.
      </p>
      <div style="text-align: center; margin: 0 0 28px;">
        <a href="${formUrl}" style="background: #061e57; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; letter-spacing: 0.3px;">Complete Your Onboarding Form →</a>
      </div>
      <div style="background: #eef4f9; border-left: 4px solid #b3cee1; padding: 14px 18px; margin: 0 0 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #3a4856; font-size: 13px; line-height: 1.6;">
          <strong>Before you start, gather the following items</strong> — you'll need them to complete the form. Most uploads can be shared via Google Drive or Dropbox.
        </p>
      </div>
      ${sectionsHtml}
      <p style="margin: 24px 0 0; color: #888; font-size: 13px;">Questions? Reach us at <a href="mailto:info@mcwilliamsmedia.com" style="color: #061e57;">info@mcwilliamsmedia.com</a>.</p>
    `),
  });
}

// ── CLIENT: Onboarding Form Submitted Confirmation ────────────────────────────

export async function sendOnboardingSubmittedClientEmail(opts: {
  clientName: string;
  businessName: string;
  clientEmail: string;
}) {
  if (!opts.clientEmail) return;

  await send({
    from: FROM_CLIENT,
    to: [opts.clientEmail],
    subject: `Onboarding form received — we're on it`,
    html: clientLayout(`
      <h3 style="margin: 0 0 8px; font-size: 22px; color: #0a0a0a;">Got it, ${opts.clientName}!</h3>
      <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
        We've received your completed onboarding questionnaire for <strong>${opts.businessName}</strong>. Our team is reviewing your responses and will use them to make sure your project starts strong.
      </p>
      <div style="background: #eef4f9; border-left: 4px solid #b3cee1; padding: 16px 20px; margin: 0 0 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #3a4856; font-size: 14px; line-height: 1.6;">
          <strong>What's next:</strong><br>
          Your strategist will review your answers and reach out if they need any clarification before your project kicks off. You're all set!
        </p>
      </div>
      <p style="margin: 0; color: #888; font-size: 13px;">Questions? Reach us at <a href="mailto:info@mcwilliamsmedia.com" style="color: #061e57;">info@mcwilliamsmedia.com</a>.</p>
    `),
  });
}
