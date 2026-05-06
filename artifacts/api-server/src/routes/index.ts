import { Router, type IRouter } from "express";
import healthRouter from "./health";
import proposalsRouter from "./proposals";
import contractsRouter from "./contracts";
import adminRouter from "./admin";
import geminiRouter from "./gemini";
import onboardingFormRouter from "./onboarding-form";
import paymentUpdateRouter from "./payment-update";

const router: IRouter = Router();

router.use(healthRouter);
router.use(proposalsRouter);
router.use(contractsRouter);
router.use(adminRouter);
router.use(geminiRouter);
router.use(onboardingFormRouter);
router.use(paymentUpdateRouter);

export default router;
