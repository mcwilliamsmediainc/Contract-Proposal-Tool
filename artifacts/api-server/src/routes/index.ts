import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import proposalsRouter from "./proposals";
import contractsRouter from "./contracts";
import adminRouter from "./admin";
import geminiRouter from "./gemini";
import onboardingFormRouter from "./onboarding-form";
import paymentUpdateRouter from "./payment-update";
import cancellationsRouter from "./cancellations";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Paths that don't require authentication (client-facing portals)
function isPublicPath(path: string, method: string): boolean {
  if (path === "/healthz") return true;
  if (path === "/send-team-invites") return true; // temp — remove after invites sent
  // Client portal: GET /proposals/:uuid  (exact — no sub-path)
  if (method === "GET" && /^\/proposals\/[^/]+$/.test(path)) return true;
  // Proposal tracking & acceptance (public)
  if (/^\/proposals\/[^/]+\/(view|accept)$/.test(path)) return true;
  // Client portal: GET /contracts/:uuid (exact)
  if (method === "GET" && /^\/contracts\/[^/]+$/.test(path)) return true;
  // Client contract signing (public)
  if (/^\/contracts\/[^/]+\/sign$/.test(path)) return true;
  // Public intake / payment-update forms
  if (path.startsWith("/onboarding-form")) return true;
  if (path.startsWith("/payment-update")) return true;
  return false;
}

function conditionalAuth(req: Request, res: Response, next: NextFunction) {
  if (isPublicPath(req.path, req.method)) return next();
  return requireAuth(req, res, next);
}

router.use(conditionalAuth);

router.use(healthRouter);
router.use(proposalsRouter);
router.use(contractsRouter);
router.use(adminRouter);
router.use(geminiRouter);
router.use(onboardingFormRouter);
router.use(paymentUpdateRouter);
router.use(cancellationsRouter);

export default router;
