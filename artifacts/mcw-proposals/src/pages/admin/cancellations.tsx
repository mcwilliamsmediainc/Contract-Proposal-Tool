import { AdminLayout } from "@/components/layout/admin-layout";
import { useListCancellations, useCreateCancellation, useDeleteCancellation } from "@workspace/api-client-react";
import type { Cancellation } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  XCircle,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Mail,
  User,
  Building2,
  CalendarX,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const JOTFORM_URL = "https://form.jotform.com/253135875702055";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams", "Ashlea Mortenson"];

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

const REASON_COLORS: Record<string, string> = {
  "Budget constraints": "bg-orange-50 text-orange-700 border-orange-200",
  "Going with a competitor": "bg-red-50 text-red-700 border-red-200",
  "No response / unresponsive": "bg-gray-100 text-gray-600 border-gray-200",
  "Project on hold": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Not satisfied with proposal": "bg-rose-50 text-rose-700 border-rose-200",
  "Business closing": "bg-slate-100 text-slate-600 border-slate-200",
  "Internal hire": "bg-purple-50 text-purple-700 border-purple-200",
  "Timing not right": "bg-blue-50 text-blue-700 border-blue-200",
  "Other": "bg-gray-100 text-gray-600 border-gray-200",
};

interface LogForm {
  clientName: string;
  businessName: string;
  clientEmail: string;
  clientStrategist: string;
  reason: string;
  notes: string;
  cancelledAt: string;
}

const EMPTY_FORM: LogForm = {
  clientName: "",
  businessName: "",
  clientEmail: "",
  clientStrategist: "",
  reason: "",
  notes: "",
  cancelledAt: "",
};

export default function Cancellations() {
  const { data: cancellations, isLoading } = useListCancellations();
  const createCancellation = useCreateCancellation();
  const deleteCancellation = useDeleteCancellation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LogForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JOTFORM_URL).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Cancellation form link copied to clipboard." });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleEmailClient = () => {
    const subject = encodeURIComponent("McWilliams Media — Cancellation Form");
    const body = encodeURIComponent(
      `Hi,\n\nWe're sorry to see you go. Please take a moment to fill out our short cancellation form so we can better serve our clients in the future:\n\n${JOTFORM_URL}\n\nThank you for your time with McWilliams Media.\n\nWarm regards,\nMcWilliams Media Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim()) {
      toast({ title: "Client name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createCancellation.mutateAsync({
        data: {
          clientName: form.clientName.trim(),
          businessName: form.businessName.trim() || null,
          clientEmail: form.clientEmail.trim() || null,
          clientStrategist: form.clientStrategist || null,
          reason: form.reason || null,
          notes: form.notes.trim() || null,
          cancelledAt: form.cancelledAt ? new Date(form.cancelledAt).toISOString() : null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/cancellations"] });
      toast({ title: "Cancellation logged", description: `${form.clientName} has been recorded.` });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast({ title: "Failed to log cancellation", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove cancellation record for ${name}?`)) return;
    setDeletingId(id);
    try {
      await deleteCancellation.mutateAsync({ uuid: id });
      await queryClient.invalidateQueries({ queryKey: ["/api/cancellations"] });
      toast({ title: "Record removed" });
    } catch {
      toast({ title: "Failed to remove record", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-500" />
            Client Cancellations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send the cancellation form to clients and track logged cancellations
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          {isLoading ? "—" : `${cancellations?.length ?? 0} total`}
        </div>
      </div>

      {/* Send Form Card */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground mb-0.5">Cancellation Form</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send this JotForm link to clients who are cancelling. Their responses are tracked in JotForm directly.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border mb-4">
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a
                href={JOTFORM_URL}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-sm text-blue-600 hover:underline truncate font-mono"
              >
                {JOTFORM_URL}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmailClient}
                className="gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Compose Email
              </Button>
              <a href={JOTFORM_URL} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Form
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Log Cancellation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Recent Cancellations</h2>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Cancellation
        </Button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5 mb-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarX className="w-4 h-4 text-red-500" />
            Log a Cancellation
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">
                Client Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Jane Smith"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Business Name</label>
              <Input
                placeholder="Acme LLC"
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Client Email</label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Strategist</label>
              <Select value={form.clientStrategist || "none"} onValueChange={v => setForm(f => ({ ...f, clientStrategist: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select strategist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {STRATEGISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Reason</label>
              <Select value={form.reason || "none"} onValueChange={v => setForm(f => ({ ...f, reason: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select reason —</SelectItem>
                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Date Cancelled</label>
              <Input
                type="date"
                value={form.cancelledAt}
                onChange={e => setForm(f => ({ ...f, cancelledAt: e.target.value }))}
                className="bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Notes</label>
            <Textarea
              placeholder="Any additional context about this cancellation…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="bg-white h-24 resize-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5" size="sm">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Save Record"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading cancellations…
        </div>
      ) : !cancellations || cancellations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <XCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No cancellations logged yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Use "Log Cancellation" to record one</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Strategist</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Notes</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {cancellations.map((c: Cancellation) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
                        {c.clientName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.clientName}</p>
                        {c.businessName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{c.businessName}
                          </p>
                        )}
                        {c.clientEmail && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />{c.clientEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    {c.clientStrategist ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />{c.clientStrategist}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {c.reason ? (
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border", REASON_COLORS[c.reason] ?? "bg-gray-100 text-gray-600 border-gray-200")}
                      >
                        {c.reason}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell max-w-xs">
                    {c.notes ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.cancelledAt ? (
                        <>
                          <p className="font-medium text-foreground">{format(new Date(c.cancelledAt), "MMM d, yyyy")}</p>
                          <p>{formatDistanceToNow(new Date(c.cancelledAt), { addSuffix: true })}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">{format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                          <p className="text-muted-foreground/50">logged {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      onClick={() => handleDelete(c.id, c.clientName)}
                      disabled={deletingId === c.id}
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove record"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
