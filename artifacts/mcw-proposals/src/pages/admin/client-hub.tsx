import { AdminLayout } from "@/components/layout/admin-layout";
import { useListClients, useListCancellations, useCreateCancellation, useDeleteCancellation } from "@workspace/api-client-react";
import type { ClientRecord, Cancellation } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Search, BookUser, FileText, FileSignature, CheckSquare, ArrowRight,
  Mail, User, CreditCard, Copy, Check, ExternalLink, Link2,
  XCircle, Plus, Trash2, Building2, CalendarX, CheckCircle2, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

// ─── Shared constants ─────────────────────────────────────────────────────────

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams", "Ashlea Mortenson"];

type Stage = ClientRecord["stage"];

const STAGE_CONFIG: Record<Stage, { label: string; dot: string; badge: string; pipelineIndex: number }> = {
  proposal_draft:    { label: "Proposal Draft",    dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-600 border-gray-200",     pipelineIndex: 0 },
  proposal_sent:     { label: "Proposal Sent",     dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200",       pipelineIndex: 1 },
  proposal_accepted: { label: "Proposal Accepted", dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200",    pipelineIndex: 2 },
  contract_draft:    { label: "Contract Draft",    dot: "bg-violet-400", badge: "bg-violet-50 text-violet-700 border-violet-200", pipelineIndex: 3 },
  contract_sent:     { label: "Contract Sent",     dot: "bg-violet-500", badge: "bg-violet-100 text-violet-800 border-violet-300",pipelineIndex: 4 },
  contract_signed:   { label: "Contract Signed",   dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200",    pipelineIndex: 5 },
  onboarding:        { label: "Onboarding",        dot: "bg-teal-500",   badge: "bg-teal-50 text-teal-700 border-teal-200",       pipelineIndex: 6 },
};

const PIPELINE_STEPS = [
  { key: "proposal_draft",    short: "Draft" },
  { key: "proposal_sent",     short: "Sent" },
  { key: "proposal_accepted", short: "Accepted" },
  { key: "contract_draft",    short: "Contract" },
  { key: "contract_sent",     short: "Sent" },
  { key: "contract_signed",   short: "Signed" },
  { key: "onboarding",        short: "Onboarding" },
] as const;

// ─── Clients tab ──────────────────────────────────────────────────────────────

const CLIENT_STAGES: Stage[] = ["contract_signed", "onboarding"];

const CLIENT_FILTER_STAGES = [
  { value: "all",             label: "All Clients" },
  { value: "contract_signed", label: "Contract Signed" },
  { value: "onboarding",      label: "Onboarding" },
];

function PipelineBar({ stage }: { stage: Stage }) {
  const current = STAGE_CONFIG[stage].pipelineIndex;
  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.key} title={step.short}
          className={cn("h-1.5 rounded-full transition-all",
            i === 0 || i === 6 ? "w-5" : "w-3",
            i <= current ? STAGE_CONFIG[stage].dot : "bg-border"
          )} />
      ))}
    </div>
  );
}

function ClientCard({ client }: { client: ClientRecord }) {
  const cfg = STAGE_CONFIG[client.stage];
  const initials = client.clientName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-mono font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-foreground truncate">{client.clientName}</p>
              <p className="text-sm text-muted-foreground truncate">{client.businessName}</p>
            </div>
            <Badge variant="outline" className={cn("text-xs font-medium border shrink-0", cfg.badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", cfg.dot)} />
              {cfg.label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />{client.clientEmail}
            </span>
            {client.clientStrategist && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />{client.clientStrategist}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(client.proposalAmount)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="mt-3"><PipelineBar stage={client.stage} /></div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60">
            <Link href={`/admin/proposals/${client.proposalId}/edit`}>
              <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <FileText className="w-3 h-3" />Proposal<ArrowRight className="w-3 h-3" />
              </span>
            </Link>
            {client.contractId && (
              <Link href={`/admin/contracts/${client.contractId}/edit`}>
                <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <FileSignature className="w-3 h-3" />Contract<ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            )}
            {client.onboardingStatus && (
              <Link href="/admin/onboarding">
                <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <CheckSquare className="w-3 h-3" />Onboarding<ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsTab() {
  const { data: clients, isLoading } = useListClients();
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStrategist, setFilterStrategist] = useState("all");

  const contractClients = useMemo(() => (clients ?? []).filter((c) => CLIENT_STAGES.includes(c.stage)), [clients]);

  const filtered = useMemo(() => {
    let result = contractClients;
    if (filterStage !== "all") result = result.filter((c) => c.stage === filterStage);
    if (filterStrategist !== "all") result = result.filter((c) => c.clientStrategist === filterStrategist);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.businessName.toLowerCase().includes(q) ||
        c.clientEmail.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contractClients, filterStage, filterStrategist, search]);

  const stageCounts = useMemo(() => {
    const base = filterStrategist !== "all" ? contractClients.filter((c) => c.clientStrategist === filterStrategist) : contractClients;
    const counts: Record<string, number> = { all: base.length };
    for (const s of CLIENT_STAGES) counts[s] = base.filter((c) => c.stage === s).length;
    return counts;
  }, [contractClients, filterStrategist]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {CLIENT_FILTER_STAGES.map(({ value, label }) => {
          const count = stageCounts[value] ?? 0;
          const isActive = filterStage === value;
          const cfg = value !== "all" ? STAGE_CONFIG[value as Stage] : null;
          return (
            <button key={value} onClick={() => setFilterStage(value)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                isActive ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}>
              {cfg && !isActive && <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />}
              {label}
              <span className={cn("ml-0.5 font-mono text-[10px] rounded px-1",
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by name, business, or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterStrategist} onValueChange={setFilterStrategist}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Strategists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategists</SelectItem>
            {STRATEGISTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading clients…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookUser className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No clients found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {search || filterStage !== "all" || filterStrategist !== "all"
              ? "Try adjusting your filters" : "Clients appear here once contracts are signed"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {filtered.map((client) => <ClientCard key={client.id} client={client} />)}
        </div>
      )}
    </div>
  );
}

// ─── Payment Info tab ─────────────────────────────────────────────────────────

const PAYMENT_PUBLIC_PATH = "/update-payment";

function PaymentInfoTab() {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}${PAYMENT_PUBLIC_PATH}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#061e57] px-6 py-4 text-white flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <span className="font-semibold text-sm uppercase tracking-wide">Client-Facing Link</span>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Share this link with any client to let them securely submit updated ACH or credit card details. No login required.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#eef4f9] border border-[#b3cee1] rounded-lg px-4 py-3 font-mono text-sm text-[#061e57] select-all truncate">
                {publicUrl}
              </div>
              <Button onClick={handleCopy}
                className={`shrink-0 transition-colors ${copied ? "bg-green-600 hover:bg-green-600" : "bg-[#061e57] hover:bg-[#0a2a6e]"} text-white`}>
                {copied ? <><Check className="w-4 h-4 mr-1.5" />Copied!</> : <><Copy className="w-4 h-4 mr-1.5" />Copy Link</>}
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What clients will see</p>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                <>A secure form to submit either <strong>ACH bank transfer</strong> or <strong>credit card</strong> details</>,
                <>Full security &amp; compliance disclosures (SSL/TLS, data never stored, NACHA rules)</>,
                <>Required authorization checkbox before submitting</>,
                <>Submitted details are emailed to <strong>info@mcwilliamsmedia.com</strong> and never stored in the database</>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061e57] mt-2 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-100 pt-5 flex items-center justify-between">
            <p className="text-xs text-gray-400">Preview the form before sending it to a client</p>
            <a href={PAYMENT_PUBLIC_PATH} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#061e57] hover:underline font-medium">
              <ExternalLink className="w-3.5 h-3.5" />Preview Form
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cancellations tab ────────────────────────────────────────────────────────

const STRATEGIST_EMAILS: Record<string, string> = {
  "Matt McWilliams": "matt@mcwilliamsmedia.com",
  "Tiffany King": "tiffany@mcwilliamsmedia.com",
  "Elise Johnson": "elise@mcwilliamsmedia.com",
  "Rachelle Hoover": "rachelle@mcwilliamsmedia.com",
  "Ashlea Mortenson": "ashlea@mcwilliamsmedia.com",
};

const REASONS = [
  "Budget constraints","Going with a competitor","No response / unresponsive",
  "Project on hold","Not satisfied with proposal","Business closing",
  "Internal hire","Timing not right","Other",
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
  clientName: string; businessName: string; clientEmail: string;
  clientStrategist: string; reason: string; notes: string; cancelledAt: string;
}

const EMPTY_FORM: LogForm = {
  clientName: "", businessName: "", clientEmail: "",
  clientStrategist: "", reason: "", notes: "", cancelledAt: "",
};

function SlidePanel({ open, onClose, title, children, onSave, saving, saveLabel }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
  onSave: () => void; saving?: boolean; saveLabel?: string;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-5">{children}</div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0">
          <Button onClick={onSave} disabled={saving} className="flex-1 bg-[#0a1f5c] hover:bg-[#0d3494]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {saveLabel ?? "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}

function CancellationsTab() {
  const { data: cancellations, isLoading } = useListCancellations();
  const createCancellation = useCreateCancellation();
  const deleteCancellation = useDeleteCancellation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LogForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailStrategist, setEmailStrategist] = useState("");
  const [emailSubjectState, setEmailSubjectState] = useState("");
  const [emailBodyState, setEmailBodyState] = useState("");

  const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  const formUrl = `${window.location.origin}${base}/offboarding`;

  const defaultEmailSubject = "Action Required: Cancellation Acknowledgement — McWilliams Media";
  function buildDefaultBody(to: string) {
    const name = to.trim() || "[Client Name]";
    return `${name},\n\nWe've received your request to cancel your services with McWilliams Media. To officially process your cancellation and ensure a smooth wrap-up, please complete our Cancellation Acknowledgement Form at the link below.\n\nThis form confirms your understanding of our cancellation notice period and billing schedule — it only takes a few minutes to complete.\n\nComplete your Cancellation Acknowledgement Form here:\n${formUrl}\n\nPlease note: Your cancellation will not be finalized until this form is submitted. If you have any questions about the billing terms or your final invoice, don't hesitate to reach out — we're happy to walk you through everything.\n\nThank you for your time with McWilliams Media. We wish you all the best.\n\nWarm regards,\nThe McWilliams Media Team`;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl).then(() => {
      setCopiedLink(true);
      toast({ title: "Link copied!", description: "Cancellation form link copied to clipboard." });
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleOpenEmail = () => {
    setEmailTo(""); setEmailStrategist("");
    setEmailSubjectState(defaultEmailSubject);
    setEmailBodyState(buildDefaultBody(""));
    setEmailOpen(true);
  };

  const handleSendEmail = () => {
    window.open(`mailto:${emailTo}?subject=${encodeURIComponent(emailSubjectState)}&body=${encodeURIComponent(emailBodyState)}`, "_blank");
    setEmailOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim()) { toast({ title: "Client name required", variant: "destructive" }); return; }
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
      setForm(EMPTY_FORM); setShowForm(false);
    } catch {
      toast({ title: "Failed to log cancellation", variant: "destructive" });
    } finally { setSaving(false); }
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
    } finally { setDeletingId(null); }
  };

  return (
    <div>
      {/* Send Form Card */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground mb-0.5">Send Cancellation Form to Client</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with clients who are cancelling. Their submissions are recorded automatically below.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border mb-4">
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a href={formUrl} target="_blank" rel="noreferrer"
                className="flex-1 text-sm text-blue-600 hover:underline truncate font-mono">{formUrl}</a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </Button>
              <Button size="sm" onClick={handleOpenEmail} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Mail className="w-3.5 h-3.5" />Email Client
              </Button>
              <a href={formUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />Open Form
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Log header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Recent Cancellations</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />Log Cancellation
        </Button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5 mb-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarX className="w-4 h-4 text-red-500" />Log a Cancellation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Client Name *", key: "clientName", placeholder: "Jane Smith", type: "text" },
              { label: "Business Name", key: "businessName", placeholder: "Acme LLC", type: "text" },
              { label: "Client Email", key: "clientEmail", placeholder: "jane@example.com", type: "email" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">{label}</label>
                <Input type={type} placeholder={placeholder} className="bg-white"
                  value={form[key as keyof LogForm]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Strategist</label>
              <Select value={form.clientStrategist || "none"} onValueChange={(v) => setForm((f) => ({ ...f, clientStrategist: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select strategist" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {STRATEGISTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Reason</label>
              <Select value={form.reason || "none"} onValueChange={(v) => setForm((f) => ({ ...f, reason: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select reason —</SelectItem>
                  {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Date Cancelled</label>
              <Input type="date" className="bg-white" value={form.cancelledAt}
                onChange={(e) => setForm((f) => ({ ...f, cancelledAt: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Notes</label>
            <Textarea placeholder="Any additional context…" className="bg-white h-24 resize-none text-sm"
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5" size="sm">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Save Record"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading cancellations…
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
                        {c.businessName && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{c.businessName}</p>}
                        {c.clientEmail && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{c.clientEmail}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    {c.clientStrategist
                      ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><User className="w-3 h-3" />{c.clientStrategist}</span>
                      : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {c.reason
                      ? <Badge variant="outline" className={cn("text-xs font-medium border", REASON_COLORS[c.reason] ?? "bg-gray-100 text-gray-600 border-gray-200")}>{c.reason}</Badge>
                      : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell max-w-xs">
                    {c.notes ? <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p> : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.cancelledAt ? (
                        <><p className="font-medium text-foreground">{format(new Date(c.cancelledAt), "MMM d, yyyy")}</p>
                          <p>{formatDistanceToNow(new Date(c.cancelledAt), { addSuffix: true })}</p></>
                      ) : (
                        <><p className="font-medium text-foreground">{format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                          <p className="text-muted-foreground/50">logged {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p></>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <button onClick={() => handleDelete(c.id, c.clientName)} disabled={deletingId === c.id}
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove record">
                      {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email panel */}
      <SlidePanel open={emailOpen} onClose={() => setEmailOpen(false)} title="Email Client" onSave={handleSendEmail} saveLabel="Send Email">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From</p>
            <Select value={emailStrategist || "default"} onValueChange={(v) => setEmailStrategist(v === "default" ? "" : v)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">McWilliams Media &lt;info@mcwilliamsmedia.com&gt;</SelectItem>
                {Object.entries(STRATEGIST_EMAILS).map(([name, email]) => (
                  <SelectItem key={name} value={name}>{name} &lt;{email}&gt;</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To <span className="text-red-500">*</span></p>
            <Input placeholder="client@example.com" value={emailTo}
              onChange={(e) => { setEmailTo(e.target.value); setEmailBodyState(buildDefaultBody(e.target.value)); }} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject</p>
            <Input value={emailSubjectState} onChange={(e) => setEmailSubjectState(e.target.value)} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Body</p>
            <Textarea className="h-64 text-sm resize-none" value={emailBodyState} onChange={(e) => setEmailBodyState(e.target.value)} />
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "clients" | "payment" | "cancellations";

export default function ClientHub() {
  const [activeTab, setActiveTab] = useState<Tab>("clients");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "clients",       label: "Clients",       icon: BookUser  },
    { key: "payment",       label: "Payment Info",   icon: CreditCard },
    { key: "cancellations", label: "Cancellations",  icon: XCircle   },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookUser className="w-6 h-6 text-primary" />
            Client Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active clients, payment info links, and cancellation tracking
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-7">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "clients"       && <ClientsTab />}
      {activeTab === "payment"       && <PaymentInfoTab />}
      {activeTab === "cancellations" && <CancellationsTab />}
    </AdminLayout>
  );
}
