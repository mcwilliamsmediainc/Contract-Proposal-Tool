import { useState } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const STRATEGISTS = [
  "Elise Johnson",
  "Rachelle Hoover",
  "Tiffany King",
  "Matt McWilliams",
  "Ashlea Mortenson",
];

const REASONS = [
  "Budget constraints",
  "Going with a competitor",
  "No response / unresponsive",
  "Project on hold",
  "Not satisfied with proposal",
  "Business closing",
  "Internal hire",
  "Timing not right",
  "Other",
];

interface FormState {
  clientName: string;
  businessName: string;
  clientEmail: string;
  clientStrategist: string;
  reason: string;
  notes: string;
  cancelledAt: string;
}

const EMPTY: FormState = {
  clientName: "",
  businessName: "",
  clientEmail: "",
  clientStrategist: "",
  reason: "",
  notes: "",
  cancelledAt: "",
};

export default function CancellationForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.clientName.trim()) e.clientName = "Your name is required.";
    if (!form.clientEmail.trim()) e.clientEmail = "Your email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail))
      e.clientEmail = "Please enter a valid email.";
    if (!form.reason) e.reason = "Please select a reason.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${basePath}/api/cancellation-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName.trim(),
          businessName: form.businessName.trim() || null,
          clientEmail: form.clientEmail.trim(),
          clientStrategist: form.clientStrategist || null,
          reason: form.reason || null,
          notes: form.notes.trim() || null,
          cancelledAt: form.cancelledAt
            ? new Date(form.cancelledAt).toISOString()
            : null,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setServerError(
        "Something went wrong. Please try again or reach out to us directly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#061e57] text-white">
      <PublicHeader />

      <div className="max-w-xl mx-auto px-6 py-16">
        {submitted ? (
          <div className="text-center py-16 space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Thank You for Your Feedback
            </h2>
            <p className="text-[#b3cee1] leading-relaxed">
              We're sorry to see you go. Your response has been received and our
              team will be in touch if needed. We appreciate the time you spent
              with McWilliams Media.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Cancellation Request
              </h1>
              <p className="text-[#b3cee1] text-sm leading-relaxed">
                We're sorry to hear you're considering leaving. Please take a
                moment to share your feedback — it helps us improve.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientName: e.target.value }))
                  }
                  placeholder="Jane Smith"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
                {errors.clientName && (
                  <p className="text-red-400 text-xs mt-1">{errors.clientName}</p>
                )}
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Business Name
                </label>
                <Input
                  value={form.businessName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, businessName: e.target.value }))
                  }
                  placeholder="Acme LLC"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientEmail: e.target.value }))
                  }
                  placeholder="jane@example.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
                {errors.clientEmail && (
                  <p className="text-red-400 text-xs mt-1">{errors.clientEmail}</p>
                )}
              </div>

              {/* Strategist */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Who Was Your Account Strategist?
                </label>
                <Select
                  value={form.clientStrategist || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      clientStrategist: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white data-[placeholder]:text-white/30 focus:border-[#b3cee1]">
                    <SelectValue placeholder="Select a strategist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not sure / N/A —</SelectItem>
                    {STRATEGISTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Primary Reason for Cancellation{" "}
                  <span className="text-red-400">*</span>
                </label>
                <Select
                  value={form.reason || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, reason: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white data-[placeholder]:text-white/30 focus:border-[#b3cee1]">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select a reason —</SelectItem>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p className="text-red-400 text-xs mt-1">{errors.reason}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Effective Cancellation Date
                </label>
                <Input
                  type="date"
                  value={form.cancelledAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cancelledAt: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#b3cee1] uppercase tracking-wider mb-1.5">
                  Additional Feedback
                </label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Please share any additional thoughts or suggestions…"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#b3cee1] h-28 resize-none"
                />
              </div>

              {serverError && (
                <p className="text-red-400 text-sm">{serverError}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-[#061e57] hover:bg-[#b3cee1] font-semibold py-3 h-auto mt-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {submitting ? "Submitting…" : "Submit Cancellation Request"}
              </Button>

              <p className="text-xs text-[#b3cee1]/50 text-center">
                Your response is confidential and used only to improve our
                services.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
