import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  Loader2, Search, UserPlus, Radar, Globe, MapPin, Mail, DollarSign, Target,
  CheckCircle2, AlertCircle, Clock, TrendingUp, FilePlus, FileText, FileSignature,
  ArrowRight, User, ArrowUpDown, ArrowUp, ArrowDown, Archive, ArchiveRestore, Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useListClients, useDeleteProposal } from "@workspace/api-client-react";
import type { ClientRecord } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Audit Lead types ────────────────────────────────────────────────────────

interface AuditLeadRecord {
  id: string;
  url: string;
  city: string;
  challenge: string | null;
  email: string | null;
  status: string;
  scores: { ux: number; seo: number; social: number; aiVisibility: number } | null;
  businessType: string | null;
  budget: string | null;
  goal: string | null;
  proposalRequested: boolean;
  proposalRequestedAt: string | null;
  createdAt: string;
}

const AUDIT_STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new:                { label: "New",               dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-600 border-gray-200" },
  scanned:            { label: "Scanned",           dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  email_captured:     { label: "Email Captured",    dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  qualified:          { label: "Qualified",         dot: "bg-violet-400",  badge: "bg-violet-50 text-violet-700 border-violet-200" },
  proposal_requested: { label: "Proposal Requested",dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const AUDIT_FILTER_STATUSES = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "scanned", label: "Scanned" },
  { value: "email_captured", label: "Email Captured" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_requested", label: "Proposal Requested" },
];

function scoreColor(s: number) {
  if (s >= 70) return "text-emerald-600";
  if (s >= 50) return "text-amber-600";
  return "text-red-600";
}

function MiniScores({ scores }: { scores: AuditLeadRecord["scores"] }) {
  if (!scores) return <span className="text-xs text-muted-foreground italic">No scores yet</span>;
  const pillars = [
    { key: "ux" as const, label: "UX" },
    { key: "seo" as const, label: "SEO" },
    { key: "social" as const, label: "Social" },
    { key: "aiVisibility" as const, label: "AI" },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {pillars.map(({ key, label }) => (
        <span key={key} className="inline-flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn("font-bold font-mono", scoreColor(scores[key]))}>{scores[key]}</span>
        </span>
      ))}
    </div>
  );
}

function AverageScore({ scores }: { scores: AuditLeadRecord["scores"] }) {
  if (!scores) return null;
  const avg = Math.round((scores.ux + scores.seo + scores.social + scores.aiVisibility) / 4);
  return <span className={cn("text-lg font-bold font-mono", scoreColor(avg))}>{avg}</span>;
}

function AuditLeadRow({ lead, showArchived, onArchive, onUnarchive, onDelete }: {
  lead: AuditLeadRecord;
  showArchived: boolean;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = AUDIT_STATUS_CONFIG[lead.status] ?? AUDIT_STATUS_CONFIG["new"];
  const urlClean = lead.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <a href={lead.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block max-w-[180px]">
              {urlClean}
            </a>
            {lead.businessType && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{lead.businessType}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3 h-3 flex-shrink-0" />{lead.city}
        </div>
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{lead.email}</span>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
          <Badge variant="outline" className={cn("text-xs border", cfg.badge)}>{cfg.label}</Badge>
        </div>
        {lead.proposalRequested && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">Proposal Requested</span>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <AverageScore scores={lead.scores} />
          {lead.scores && <span className="text-xs text-muted-foreground font-mono">/100</span>}
        </div>
        <MiniScores scores={lead.scores} />
      </td>
      <td className="py-3 px-4">
        {lead.budget && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />{lead.budget}
          </div>
        )}
        {lead.goal && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Target className="w-3 h-3" />{lead.goal}
          </div>
        )}
        {lead.challenge && (
          <p className="text-xs text-muted-foreground italic mt-1 max-w-[160px] truncate" title={lead.challenge}>
            "{lead.challenge}"
          </p>
        )}
        {!lead.budget && !lead.goal && !lead.challenge && (
          <span className="text-xs text-muted-foreground italic">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
        </div>
        {!showArchived && (
          <a
            href={`/admin/proposals/new?clientEmail=${encodeURIComponent(lead.email ?? "")}&clientName=${encodeURIComponent(lead.businessType ?? "")}&city=${encodeURIComponent(lead.city)}&url=${encodeURIComponent(lead.url)}`}
            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <FilePlus className="w-3 h-3" />
            Create Proposal →
          </a>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showArchived ? (
            <button
              onClick={() => onUnarchive(lead.id)}
              title="Restore from archive"
              className="p-1.5 rounded-md text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onArchive(lead.id)}
              title="Archive lead"
              className="p-1.5 rounded-md text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(lead.id)}
            title="Delete permanently"
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Pipeline Lead types ──────────────────────────────────────────────────────

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams", "Ashlea Mortenson"];
type Stage = ClientRecord["stage"];
const LEAD_STAGES: Stage[] = ["proposal_draft", "proposal_sent", "proposal_accepted", "contract_draft", "contract_sent"];

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

const FILTER_STAGES: { value: string; label: string }[] = [
  { value: "all",               label: "All Leads" },
  { value: "proposal_draft",    label: "Proposal Draft" },
  { value: "proposal_sent",     label: "Proposal Sent" },
  { value: "proposal_accepted", label: "Proposal Accepted" },
  { value: "contract_draft",    label: "Contract Draft" },
  { value: "contract_sent",     label: "Contract Sent" },
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

function PipelineLeadCard({ client, onDelete }: { client: ClientRecord; onDelete: (id: string) => void }) {
  const cfg = STAGE_CONFIG[client.stage];
  const initials = client.clientName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
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
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn("text-xs font-medium border", cfg.badge)}>
                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", cfg.dot)} />
                {cfg.label}
              </Badge>
              <button
                onClick={() => onDelete(client.proposalId)}
                title="Delete lead"
                className="p-1 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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
          <div className="mt-3">
            <PipelineBar stage={client.stage} />
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab components ───────────────────────────────────────────────────────────

function AuditLeadsTab() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState<"createdAt" | "score">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function toggleSort(key: "createdAt" | "score") {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const queryKey = ["audit-leads", showArchived ? "archived" : "active"];

  const { data: leads, isLoading } = useQuery<AuditLeadRecord[]>({
    queryKey,
    queryFn: async () => {
      const url = showArchived
        ? `${BASE}/api/admin/audit-leads?archived=true`
        : `${BASE}/api/admin/audit-leads`;
      const r = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!r.ok) throw new Error("Failed to load audit leads");
      return r.json() as Promise<AuditLeadRecord[]>;
    },
    refetchInterval: 30000,
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${BASE}/api/admin/audit-leads/${id}/archive`, { method: "POST" });
      if (!r.ok) throw new Error("Failed to archive");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-leads"] });
      toast({ title: "Lead archived" });
    },
    onError: () => toast({ title: "Failed to archive lead", variant: "destructive" }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${BASE}/api/admin/audit-leads/${id}/unarchive`, { method: "POST" });
      if (!r.ok) throw new Error("Failed to unarchive");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-leads"] });
      toast({ title: "Lead restored" });
    },
    onError: () => toast({ title: "Failed to restore lead", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${BASE}/api/admin/audit-leads/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["audit-leads"] });
      toast({ title: "Lead deleted" });
    },
    onError: () => toast({ title: "Failed to delete lead", variant: "destructive" }),
  });

  const handleDelete = (id: string) => {
    if (!confirm("Permanently delete this lead? This cannot be undone.")) return;
    deleteMutation.mutate(id);
  };

  const avgScore = (l: AuditLeadRecord) =>
    l.scores ? (l.scores.ux + l.scores.seo + l.scores.social + l.scores.aiVisibility) / 4 : -1;

  const filtered = useMemo(() => {
    let result = leads ?? [];
    if (filterStatus !== "all") result = result.filter((l) => l.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.url.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) || (l.businessType ?? "").toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const cmp = sortKey === "createdAt"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : avgScore(a) - avgScore(b);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [leads, filterStatus, search, sortKey, sortDir]);

  const stats = useMemo(() => {
    const all = leads ?? [];
    const withScores = all.filter((l) => l.scores);
    return {
      total: all.length,
      emailCaptured: all.filter((l) => l.email).length,
      proposalRequested: all.filter((l) => l.proposalRequested).length,
      avgScore: withScores.length > 0
        ? Math.round(withScores.reduce((s, l) => s + avgScore(l), 0) / withScores.length)
        : null,
    };
  }, [leads]);

  const statusCounts = useMemo(() => {
    const all = leads ?? [];
    const counts: Record<string, number> = { all: all.length };
    for (const { value } of AUDIT_FILTER_STATUSES.slice(1)) counts[value] = all.filter((l) => l.status === value).length;
    return counts;
  }, [leads]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Audit Leads", value: stats.total, icon: Radar, color: "text-primary" },
          { label: "Emails Captured",   value: stats.emailCaptured, icon: Mail, color: "text-amber-600" },
          { label: "Proposals Requested", value: stats.proposalRequested, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Avg Score", value: stats.avgScore !== null ? `${stats.avgScore}/100` : "—", icon: TrendingUp, color: "text-violet-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("w-3.5 h-3.5", color)} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{isLoading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Status filters + archive toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div className="flex flex-wrap gap-2">
          {!showArchived && AUDIT_FILTER_STATUSES.map(({ value, label }) => {
            const count = statusCounts[value] ?? 0;
            const isActive = filterStatus === value;
            return (
              <button key={value} onClick={() => setFilterStatus(value)}
                className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  isActive ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}>
                {value !== "all" && !isActive && (
                  <span className={cn("w-1.5 h-1.5 rounded-full", AUDIT_STATUS_CONFIG[value]?.dot ?? "bg-gray-400")} />
                )}
                {label}
                <span className={cn("ml-0.5 font-mono text-[10px] rounded px-1",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setShowArchived((v) => !v); setFilterStatus("all"); }}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            showArchived
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-background text-muted-foreground border-border hover:border-amber-300 hover:text-amber-700"
          )}
        >
          <Archive className="w-3 h-3" />
          {showArchived ? "← Active Leads" : "View Archived"}
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by URL, city, or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading leads…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {search || filterStatus !== "all" ? (
            <><AlertCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No leads match your filters</p></>
          ) : (
            <><Radar className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No audit leads yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Share the{" "}
                <a href="/audit" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Digital Health Check tool
                </a>{" "}to start capturing leads
              </p></>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Website</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => toggleSort("score")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Scores
                    {sortKey === "score" ? (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualification</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => toggleSort("createdAt")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Added
                    {sortKey === "createdAt" ? (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </button>
                </th>
                <th className="w-16 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <AuditLeadRow
                  key={lead.id}
                  lead={lead}
                  showArchived={showArchived}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  onUnarchive={(id) => unarchiveMutation.mutate(id)}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PipelineLeadsTab() {
  const { data: allClients, isLoading } = useListClients();
  const deleteProposal = useDeleteProposal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStrategist, setFilterStrategist] = useState("all");

  const handleDelete = (proposalId: string) => {
    if (!confirm("Delete this lead and its proposal? This cannot be undone.")) return;
    deleteProposal.mutate(
      { id: proposalId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
          toast({ title: "Lead deleted" });
        },
        onError: () => toast({ title: "Failed to delete lead", variant: "destructive" }),
      }
    );
  };

  const leads = useMemo(() => (allClients ?? []).filter((c) => LEAD_STAGES.includes(c.stage)), [allClients]);

  const filtered = useMemo(() => {
    let result = leads;
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
  }, [leads, filterStage, filterStrategist, search]);

  const stageCounts = useMemo(() => {
    const base = filterStrategist !== "all" ? leads.filter((c) => c.clientStrategist === filterStrategist) : leads;
    const counts: Record<string, number> = { all: base.length };
    for (const s of LEAD_STAGES) counts[s] = base.filter((c) => c.stage === s).length;
    return counts;
  }, [leads, filterStrategist]);

  return (
    <div>
      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_STAGES.map(({ value, label }) => {
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

      {/* Filters row */}
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

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading leads…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserPlus className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No leads found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {search || filterStage !== "all" || filterStrategist !== "all"
              ? "Try adjusting your filters"
              : "Leads appear here once proposals are created"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {filtered.map((client) => <PipelineLeadCard key={client.id} client={client} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "pipeline" | "audit";

export default function LeadHub() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Lead Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pipeline leads and Digital Health Check audit leads in one place
          </p>
        </div>
        <a href="/audit" target="_blank" rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-3 py-2 flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          View Audit Tool
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-7">
        {([
          { key: "pipeline" as Tab, label: "Pipeline Leads", icon: UserPlus },
          { key: "audit"    as Tab, label: "Audit Leads",    icon: Radar },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "pipeline" ? <PipelineLeadsTab /> : <AuditLeadsTab />}
    </AdminLayout>
  );
}
