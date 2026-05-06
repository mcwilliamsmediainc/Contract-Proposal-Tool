import { Router } from "express";
import { z } from "zod";
import { sendPaymentUpdateEmail } from "../lib/email";

const router = Router();

const PaymentUpdateBody = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.literal("ach"),
    clientName: z.string().min(1),
    accountHolderName: z.string().min(1),
    bankName: z.string().min(1),
    accountType: z.enum(["checking", "savings"]),
    routingNumber: z.string().regex(/^\d{9}$/),
    accountNumber: z.string().regex(/^\d{4,17}$/),
  }),
  z.object({
    paymentMethod: z.literal("credit-card"),
    clientName: z.string().min(1),
    cardholderName: z.string().min(1),
    cardNumber: z.string().min(13).max(19),
    expirationMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
    expirationYear: z.string().regex(/^\d{4}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
    billingZip: z.string().min(5).max(10),
  }),
]);

router.post("/api/payment-update", async (req, res) => {
  const parsed = PaymentUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payment info", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;

  await sendPaymentUpdateEmail(data);

  res.json({ ok: true });
});

export default router;
