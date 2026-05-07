import { useState } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
  "Social Media Ads",
  "Social Media Posting",
  "SEO",
  "Google Ads",
  "Website Hosting",
  "Google LSA's",
  "Blog",
  "Email/Newsletter",
  "Mailbox",
  "Other (Please List Below)",
];

const STANDARD_POLICY = `Standard Services (30-Day Notice): If cancellation occurs any time during the month, services will continue through that full month. You'll receive a final invoice on the 1st of the next month for the notice period. No work will be performed during that final invoiced month.`;

const SOCIAL_POLICY = `Social Media Management (60-Day Notice): Social media services continue through the current month and the following month. You'll receive a final invoice on the 1st of the third month, with no work performed during that month.`;

interface FormState {
  businessName: string;
  clientEmail: string;
  services: string[];
  otherService: string;
  acknowledgedStandard: boolean;
  agreedToTerms: "yes" | "no" | "";
  acknowledgedSocial: boolean;
  cancelledAt: string;
  finalAcceptance: boolean;
  feedbackReason: string;
  feedbackNotes: string;
}

const EMPTY: FormState = {
  businessName: "",
  clientEmail: "",
  services: [],
  otherService: "",
  acknowledgedStandard: false,
  agreedToTerms: "",
  acknowledgedSocial: false,
  cancelledAt: "",
  finalAcceptance: false,
  feedbackReason: "",
  feedbackNotes: "",
};

function Checkbox({ checked, onChange, label, description, error }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  error?: boolean;
}) {
  return (
    <label className={cn(
      "flex gap-3 cursor-pointer p-3 rounded-xl border transition-colors",
      checked
        ? "bg-white/15 border-white/40"
        : "bg-white/5 border-white/15 hover:bg-white/10",
      error && !checked && "border-red-400/60"
    )}>
      <div className={cn(
        "w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors",
        checked
          ? "bg-white border-white"
          : "bg-transparent border-white/40"
      )}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-[#061e57]" strokeWidth={3} />}
      </div>
      <div>
        {label && <p className="text-sm font-medium text-white leading-snug">{label}</p>}
        {description && <p className="text-sm text-[#b3cee1] leading-relaxed mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function Radio({ checked, onChange, label }: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className={cn(
      "flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors",
      checked
        ? "bg-white/15 border-white/40"
        : "bg-white/5 border-white/15 hover:bg-white/10"
    )} onClick={onChange}>
      <div className={cn(
        "w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-colors",
        checked ? "border-white bg-transparent" : "border-white/40"
      )}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
      </div>
      <span className="text-sm text-white">{label}</span>
    </label>
  );
}

function SectionLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <p className="text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
      {text}{required && <span className="text-red-400 ml-1">*</span>}
    </p>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{msg}</p>;
}

export default function CancellationForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "services_min", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hasOther = form.services.includes("Other (Please List Below)");

  function toggleService(s: string) {
    setForm(f => ({
      ...f,
      services: f.services.includes(s)
        ? f.services.filter(x => x !== s)
        : [...f.services, s],
    }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required.";
    if (!form.clientEmail.trim()) e.clientEmail = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) e.clientEmail = "Please enter a valid email.";
    if (form.services.length === 0) e.services_min = "Please select at least one service.";
    if (!form.acknowledgedStandard) e.acknowledgedStandard = "You must acknowledge the standard services cancellation policy.";
    if (!form.agreedToTerms) e.agreedToTerms = "Please indicate whether you understand the billing terms.";
    if (!form.cancelledAt) e.cancelledAt = "Please provide your requested cancellation date.";
    if (!form.finalAcceptance) e.finalAcceptance = "You must accept the final billing acknowledgement to proceed.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);

    const servicesList = form.services.join(", ") + (hasOther && form.otherService ? ` (Other: ${form.otherService})` : "");
    const notes = [
      `Services: ${servicesList}`,
      `Agreed to terms: ${form.agreedToTerms === "yes" ? "Yes" : "No — will be contacted"}`,
      `Acknowledged Standard 30-day policy: ${form.acknowledgedStandard ? "Yes" : "No"}`,
      `Acknowledged Social Media 60-day policy: ${form.acknowledgedSocial ? "Yes" : "No"}`,
      `Final billing acceptance: ${form.finalAcceptance ? "Accepted" : "Not accepted"}`,
      form.feedbackReason ? `Feedback reason: ${form.feedbackReason}` : null,
      form.feedbackNotes ? `Feedback notes: ${form.feedbackNotes}` : null,
    ].filter(Boolean).join("\n");

    try {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${basePath}/api/cancellation-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.businessName.trim(),
          businessName: form.businessName.trim(),
          clientEmail: form.clientEmail.trim(),
          reason: servicesList || null,
          notes,
          cancelledAt: form.cancelledAt ? new Date(form.cancelledAt).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setServerError("Something went wrong. Please try again or contact us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#061e57] text-white">
      <PublicHeader />

      <div className="max-w-2xl mx-auto px-6 py-14">
        {submitted ? (
          <div className="text-center py-20 space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Acknowledgement Received</h2>
            <p className="text-[#b3cee1] leading-relaxed max-w-md mx-auto">
              Thank you for completing the cancellation acknowledgement form. Our team will be in touch to confirm the details and finalize the wrap-up of your services.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Cancellation Acknowledgement Form</h1>
              </div>
              <p className="text-[#b3cee1] text-sm leading-relaxed">
                Please complete the form below to acknowledge your cancellation and our billing schedule. This helps us ensure a smooth and professional wrap-up of your services.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Business Name */}
              <div>
                <SectionLabel text="Business Name" required />
                <Input
                  value={form.businessName}
                  onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                  placeholder="Acme LLC"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
                {errors.businessName && <FieldError msg={errors.businessName} />}
              </div>

              {/* Email */}
              <div>
                <SectionLabel text="Email" required />
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="example@example.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
                {errors.clientEmail && <FieldError msg={errors.clientEmail} />}
              </div>

              {/* Services */}
              <div>
                <SectionLabel text="Services Being Cancelled?" required />
                <div className="space-y-2">
                  {SERVICES.map(s => (
                    <Checkbox
                      key={s}
                      checked={form.services.includes(s)}
                      onChange={() => toggleService(s)}
                      label={s}
                      error={!!errors.services_min}
                    />
                  ))}
                </div>
                {errors.services_min && <FieldError msg={errors.services_min} />}
              </div>

              {/* Other service text */}
              {hasOther && (
                <div>
                  <SectionLabel text="If Other, Please State Below" />
                  <Input
                    value={form.otherService}
                    onChange={e => setForm(f => ({ ...f, otherService: e.target.value }))}
                    placeholder="Describe the service being cancelled…"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                  />
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Standard Policy Acknowledgement */}
              <div>
                <p className="text-sm font-semibold text-white mb-1">
                  Cancellation Policy Acknowledgement: Please read the following and confirm your understanding.
                  <span className="text-red-400 ml-1">*</span>
                </p>
                <div className="mt-3">
                  <Checkbox
                    checked={form.acknowledgedStandard}
                    onChange={v => setForm(f => ({ ...f, acknowledgedStandard: v }))}
                    description={STANDARD_POLICY}
                    error={!!errors.acknowledgedStandard}
                  />
                </div>
                {errors.acknowledgedStandard && <FieldError msg={errors.acknowledgedStandard} />}
              </div>

              {/* Agree to terms */}
              <div>
                <p className="text-sm font-semibold text-white mb-3">
                  Do you understand and agree to the cancellation and billing terms above?
                  <span className="text-red-400 ml-1">*</span>
                </p>
                <div className="space-y-2">
                  <Radio
                    checked={form.agreedToTerms === "yes"}
                    onChange={() => setForm(f => ({ ...f, agreedToTerms: "yes" }))}
                    label="Yes, I understand and agree"
                  />
                  <Radio
                    checked={form.agreedToTerms === "no"}
                    onChange={() => setForm(f => ({ ...f, agreedToTerms: "no" }))}
                    label="No (If no, we will contact you to clarify)"
                  />
                </div>
                {errors.agreedToTerms && <FieldError msg={errors.agreedToTerms} />}
              </div>

              {/* Social Media Policy Acknowledgement */}
              <div>
                <p className="text-sm font-semibold text-white mb-1">
                  Cancellation Policy Acknowledgement: Please read the following and confirm your understanding.
                </p>
                <div className="mt-3">
                  <Checkbox
                    checked={form.acknowledgedSocial}
                    onChange={v => setForm(f => ({ ...f, acknowledgedSocial: v }))}
                    description={SOCIAL_POLICY}
                  />
                </div>
              </div>

              {/* Cancellation Date */}
              <div>
                <SectionLabel text="Requested Cancellation Date" required />
                <Input
                  type="date"
                  value={form.cancelledAt}
                  onChange={e => setForm(f => ({ ...f, cancelledAt: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
                {errors.cancelledAt && <FieldError msg={errors.cancelledAt} />}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Final Acceptance */}
              <div>
                <p className="text-sm font-semibold text-white mb-3">
                  By checking below confirm that: You understand your final invoice will follow the policy above. That no work will be performed after the final invoice. And you accept responsibility for payment of your final invoice.
                  <span className="text-red-400 ml-1">*</span>
                </p>
                <Radio
                  checked={form.finalAcceptance}
                  onChange={() => setForm(f => ({ ...f, finalAcceptance: !f.finalAcceptance }))}
                  label="I Accept"
                />
                {errors.finalAcceptance && <FieldError msg={errors.finalAcceptance} />}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Feedback section (optional) */}
              <div>
                <p className="text-sm font-semibold text-white mb-1">Feedback <span className="text-[#b3cee1] font-normal text-xs">(Optional)</span></p>
                <p className="text-xs text-[#b3cee1] mb-4">We'd love to understand more about your experience. This section is completely optional.</p>
                <div className="space-y-3">
                  <div>
                    <SectionLabel text="Primary Reason for Leaving" />
                    <Input
                      value={form.feedbackReason}
                      onChange={e => setForm(f => ({ ...f, feedbackReason: e.target.value }))}
                      placeholder="e.g. Budget constraints, going in a different direction…"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                    />
                  </div>
                  <div>
                    <SectionLabel text="Additional Comments" />
                    <Textarea
                      value={form.feedbackNotes}
                      onChange={e => setForm(f => ({ ...f, feedbackNotes: e.target.value }))}
                      placeholder="Any additional thoughts or suggestions for us…"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1] h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              {serverError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />{serverError}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-[#061e57] hover:bg-[#b3cee1] font-semibold py-3 h-auto"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {submitting ? "Submitting…" : "Submit Cancellation Acknowledgement"}
              </Button>

              <p className="text-xs text-[#b3cee1]/50 text-center pb-8">
                By submitting this form, you acknowledge all billing terms stated above.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
