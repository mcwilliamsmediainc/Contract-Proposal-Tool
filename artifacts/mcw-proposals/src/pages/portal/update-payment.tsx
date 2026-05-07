import { useState } from "react";
import { CreditCard, Building2, Lock, ShieldCheck, Trash2, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "ach" | "credit-card";

export default function UpdatePayment() {
  const { toast } = useToast();

  const [method, setMethod] = useState<PaymentMethod>("ach");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shared
  const [clientName, setClientName] = useState("");

  // ACH
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Credit card
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingZip, setBillingZip] = useState("");

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clientName.trim()) errs.clientName = "Your name is required";
    if (method === "ach") {
      if (!accountHolderName.trim()) errs.accountHolderName = "Account holder name is required";
      if (!bankName.trim()) errs.bankName = "Bank name is required";
      if (!/^\d{9}$/.test(routingNumber.trim())) errs.routingNumber = "Routing number must be 9 digits";
      if (!/^\d{4,17}$/.test(accountNumber.trim())) errs.accountNumber = "Account number must be 4–17 digits";
    } else {
      if (!cardholderName.trim()) errs.cardholderName = "Cardholder name is required";
      if (cardNumber.replace(/\s/g, "").length < 13) errs.cardNumber = "Enter a valid card number";
      if (!/^(0[1-9]|1[0-2])$/.test(expirationMonth)) errs.expirationMonth = "Enter a valid month (01–12)";
      if (!/^\d{4}$/.test(expirationYear)) errs.expirationYear = "Enter a 4-digit year";
      if (!/^\d{3,4}$/.test(cvv)) errs.cvv = "CVV must be 3 or 4 digits";
      if (billingZip.trim().length < 5) errs.billingZip = "Enter a valid ZIP code";
    }
    if (!authorized) errs.authorized = "You must authorize the submission to continue";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const body =
        method === "ach"
          ? { paymentMethod: "ach", clientName, accountHolderName, bankName, accountType, routingNumber, accountNumber }
          : { paymentMethod: "credit-card", clientName, cardholderName, cardNumber: cardNumber.replace(/\s/g, ""), expirationMonth, expirationYear, cvv, billingZip };

      const res = await fetch("/api/payment-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch {
      toast({ title: "Submission failed", description: "Please try again or contact billing@mcwilliamsmedia.com", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Information Received</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your updated payment details have been securely submitted to McWilliams Media. Our team will process them and reach out if anything is needed.
          </p>
          <p className="text-xs text-gray-400">
            Questions? Email us at{" "}
            <a href="mailto:billing@mcwilliamsmedia.com" className="text-[#061e57] underline">billing@mcwilliamsmedia.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Header */}
      <header className="bg-[#061e57] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-7 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
        <span className="text-xs text-blue-200 uppercase tracking-widest font-semibold hidden sm:block">Update Payment Info</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Update Your Payment Information</h1>
          <p className="text-gray-500 mt-2 text-sm">Submit your updated payment details below. All information is encrypted and handled securely.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Section: Your name */}
          <div className="px-8 py-6 border-b border-gray-100">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="First and last name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={errors.clientName ? "border-red-400" : ""}
            />
            {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
          </div>

          {/* Section: Payment method toggle */}
          <div className="px-8 py-6 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Payment Method <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setMethod("ach"); setErrors({}); setAuthorized(false); }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  method === "ach" ? "border-[#061e57] bg-[#061e57] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Building2 className="w-4 h-4" />
                ACH Bank Transfer
              </button>
              <button
                type="button"
                onClick={() => { setMethod("credit-card"); setErrors({}); setAuthorized(false); }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  method === "credit-card" ? "border-[#061e57] bg-[#061e57] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Credit Card
              </button>
            </div>
          </div>

          {/* Section: Security disclosures */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="border border-[#b3cee1] rounded-xl overflow-hidden">
              <div className="bg-[#eef4f9] px-5 py-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#061e57]" />
                <span className="text-sm font-semibold text-[#061e57] uppercase tracking-wide">Security &amp; Compliance</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-[#3a4856] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Encrypted Transmission (SSL/TLS)</p>
                    <p className="text-xs text-gray-500 mt-0.5">This page is served over HTTPS. All data you enter is encrypted in transit between your browser and our server — it cannot be intercepted in plain text.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trash2 className="w-4 h-4 text-[#3a4856] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Never Stored — Deleted After Processing</p>
                    <p className="text-xs text-gray-500 mt-0.5">Your payment details are <strong>not saved</strong> to our database. They are securely transmitted to our accounting team for processing and then permanently deleted per our data retention policy.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="w-4 h-4 text-[#3a4856] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{method === "ach" ? "NACHA Rules & Limited Access" : "PCI-DSS Responsible Handling"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {method === "ach"
                        ? "McWilliams Media handles ACH information in accordance with NACHA's Reasonable Security requirements. Access is strictly limited to authorized personnel responsible for payment processing."
                        : "Credit card details are handled in accordance with PCI-DSS guidelines. Access is strictly limited to authorized personnel and the data is deleted immediately after your payment method is updated."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: ACH fields */}
          {method === "ach" && (
            <div className="px-8 py-6 border-b border-gray-100 space-y-5">
              <p className="text-sm font-semibold text-gray-700">ACH Bank Account Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Account Holder Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Full name on account" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} className={errors.accountHolderName ? "border-red-400" : ""} />
                  {errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Bank Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Chase, Wells Fargo" value={bankName} onChange={(e) => setBankName(e.target.value)} className={errors.bankName ? "border-red-400" : ""} />
                  {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Account Type <span className="text-red-500">*</span></Label>
                <div className="flex gap-3">
                  {["checking", "savings"].map((t) => (
                    <button key={t} type="button" onClick={() => setAccountType(t)}
                      className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${accountType === t ? "border-[#061e57] bg-[#061e57] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Routing Number <span className="text-red-500">*</span></Label>
                <Input placeholder="9-digit routing number" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))} inputMode="numeric" className={`font-mono ${errors.routingNumber ? "border-red-400" : ""}`} />
                {errors.routingNumber && <p className="text-red-500 text-xs mt-1">{errors.routingNumber}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Account Number <span className="text-red-500">*</span></Label>
                <Input placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))} inputMode="numeric" className={`font-mono ${errors.accountNumber ? "border-red-400" : ""}`} />
                {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
              </div>
            </div>
          )}

          {/* Section: Credit card fields */}
          {method === "credit-card" && (
            <div className="px-8 py-6 border-b border-gray-100 space-y-5">
              <p className="text-sm font-semibold text-gray-700">Credit Card Details</p>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Cardholder Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Name as it appears on card" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} className={errors.cardholderName ? "border-red-400" : ""} />
                {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Card Number <span className="text-red-500">*</span></Label>
                <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} inputMode="numeric" className={`font-mono tracking-widest ${errors.cardNumber ? "border-red-400" : ""}`} />
                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Exp. Month <span className="text-red-500">*</span></Label>
                  <Input placeholder="MM" value={expirationMonth} onChange={(e) => setExpirationMonth(e.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" className={`font-mono ${errors.expirationMonth ? "border-red-400" : ""}`} />
                  {errors.expirationMonth && <p className="text-red-500 text-xs mt-1">{errors.expirationMonth}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Exp. Year <span className="text-red-500">*</span></Label>
                  <Input placeholder="YYYY" value={expirationYear} onChange={(e) => setExpirationYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" className={`font-mono ${errors.expirationYear ? "border-red-400" : ""}`} />
                  {errors.expirationYear && <p className="text-red-500 text-xs mt-1">{errors.expirationYear}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">CVV <span className="text-red-500">*</span></Label>
                  <Input placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" className={`font-mono ${errors.cvv ? "border-red-400" : ""}`} />
                  {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Billing ZIP Code <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. 73008" value={billingZip} onChange={(e) => setBillingZip(e.target.value.slice(0, 10))} inputMode="numeric" className={`w-40 font-mono ${errors.billingZip ? "border-red-400" : ""}`} />
                {errors.billingZip && <p className="text-red-500 text-xs mt-1">{errors.billingZip}</p>}
              </div>
            </div>
          )}

          {/* Section: Authorization checkbox */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className={`border-2 rounded-xl p-5 transition-colors ${errors.authorized ? "border-red-400 bg-red-50" : authorized ? "border-[#061e57] bg-[#eef4f9]" : "border-gray-200 bg-gray-50"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={(e) => {
                    setAuthorized(e.target.checked);
                    if (e.target.checked && errors.authorized) {
                      setErrors((prev) => { const n = { ...prev }; delete n.authorized; return n; });
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#061e57] shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Authorization &amp; Consent</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {method === "ach"
                      ? `By checking this box, I authorize McWilliams Media Inc. to use the ACH bank account information provided above to process payments on my account. I understand this information will be transmitted securely, used only for payment processing, and deleted immediately after use. I may revoke this authorization by contacting `
                      : `By checking this box, I confirm that I am the authorized holder of the credit card provided above and consent to McWilliams Media Inc. storing and using this card for billing on my account. I understand this information will be transmitted securely, handled per PCI-DSS standards, and deleted immediately after updating my payment method. Questions: `}
                    <a href="mailto:billing@mcwilliamsmedia.com" className="text-[#061e57] underline">billing@mcwilliamsmedia.com</a>.
                  </p>
                </div>
              </label>
              {errors.authorized && <p className="text-red-600 text-xs mt-2 ml-7">{errors.authorized}</p>}
            </div>
          </div>

          {/* Footer / submit */}
          <div className="px-8 py-5 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#061e57] hover:bg-[#0a2a6e] text-white px-8"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" /> Submit Payment Info</>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          McWilliams Media Inc. &nbsp;·&nbsp; Questions? <a href="mailto:billing@mcwilliamsmedia.com" className="underline text-[#3a4856]">billing@mcwilliamsmedia.com</a>
        </p>
      </div>
    </div>
  );
}
