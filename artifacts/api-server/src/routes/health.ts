import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// ── TEMPORARY: one-shot production invite sender ──────────────────────────────
// Remove this route after invitations have been confirmed sent.
const INVITE_TOKEN = "mcw-invite-prod-2026";
const TEAM = [
  { email: "matt@mcwilliamsmedia.com",     firstName: "Matt",        lastName: "McWilliams" },
  { email: "tiffany@mcwilliamsmedia.com",  firstName: "Tiffany",     lastName: "King" },
  { email: "elise@mcwilliamsmedia.com",    firstName: "Elise",       lastName: "Johnson" },
  { email: "rachelle@mcwilliamsmedia.com", firstName: "Rachelle",    lastName: "Hoover" },
  { email: "info@mcwilliamsmedia.com",     firstName: "McWilliams",  lastName: "Media" },
];

router.get("/send-team-invites", async (req, res) => {
  if (req.query.token !== INVITE_TOKEN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const redirectUrl = domain ? `https://${domain}/sign-up` : undefined;
  const clerkKey = process.env.CLERK_SECRET_KEY;

  if (!clerkKey) {
    res.status(500).json({ error: "CLERK_SECRET_KEY not set" });
    return;
  }

  const results: { email: string; status: string; id?: string; error?: string }[] = [];

  for (const user of TEAM) {
    try {
      const body: Record<string, unknown> = {
        email_address: user.email,
        public_metadata: { firstName: user.firstName, lastName: user.lastName },
      };
      if (redirectUrl) body.redirect_url = redirectUrl;

      const r = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json() as Record<string, unknown>;
      if (r.ok) {
        results.push({ email: user.email, status: "sent", id: data.id as string });
      } else {
        const errs = data.errors as Array<{ message: string }> | undefined;
        results.push({ email: user.email, status: "error", error: errs?.[0]?.message ?? JSON.stringify(data) });
      }
    } catch (e) {
      results.push({ email: user.email, status: "exception", error: String(e) });
    }
  }

  res.json({
    environment: clerkKey.startsWith("sk_live") ? "production" : "development",
    redirectUrl,
    results,
  });
});

export default router;
