import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Radar,
  Globe,
  MapPin,
  Mail,
  DollarSign,
  Target,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; badge: string }> = {
  new:                { label: "New",               color: "text-gray-400",   dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-600 border-gray-200" },
  scanned:            { label: "Scanned",           color: "text-blue-400",   dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  email_captured:     { label: "Email Captured",    color: "text-amber-400",  dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  qualified:          { label: "Qualified",         color: "text-violet-400", dot: "bg-violet-400",  badge: "bg-violet-50 text-violet-700 border-violet-200" },
  proposal_requested: { label: "Proposal Requested",color: "text-emerald-400",dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function scoreColor(s: number): string {
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
  return (
    <span className={cn("text-lg font-bold font-mono", scoreColor(avg))}>
      {avg}
    </span>
  );
}

function LeadRow({ lead }: { lead: AuditLeadRecord }) {
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG["new"];
  const urlClean = lead.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block max-w-[180px]"
            >
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
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {lead.city}
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
          <Badge variant="outline" className={cn("text-xs border", cfg.badge)}>
            {cfg.label}
          </Badge>
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
        {lead.budget ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />{lead.budget}
          </div>
        ) : null}
        {lead.goal ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Target className="w-3 h-3" />{lead.goal}
          </div>
        ) : null}
        {lead.challenge ? (
          <p className="text-xs text-muted-foreground italic mt-1 max-w-[160px] truncate" title={lead.challenge}>
            "{lead.challenge}"
          </p>
        ) : null}
        {!lead.budget && !lead.goal && !lead.challenge && (
          <span className="text-xs text-muted-foreground italic">—</span>
        )}
      </td>

      <td className="py-3 px-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
        </div>
      </td>
    </tr>
  );
}

const FILTER_STATUSES = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "scanned", label: "Scanned" },
  { value: "email_captured", label: "Email Captured" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_requested", label: "Proposal Requested" },
];

export default function LeadCapture() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: leads, isLoading } = useQuery<AuditLeadRecord[]>({
    queryKey: ["audit-leads"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/audit/leads`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error("Failed to load audit leads");
      return r.json() as Promise<AuditLeadRecord[]>;
    },
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    let result = leads ?? [];
    if (filterStatus !== "all") result = result.filter((l) => l.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.url.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.email ?? "").toLowerCase().includes(q) ||
          (l.businessType ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, filterStatus, search]);

  const stats = useMemo(() => {
    const all = leads ?? [];
    return {
      total: all.length,
      emailCaptured: all.filter((l) => l.email).length,
      proposalRequested: all.filter((l) => l.proposalRequested).length,
      avgScore: all.filter((l) => l.scores).length > 0
        ? Math.round(
            all
              .filter((l) => l.scores)
              .reduce(
                (sum, l) =>
                  sum +
                  (l.scores!.ux + l.scores!.seo + l.scores!.social + l.scores!.aiVisibility) / 4,
                0
              ) / all.filter((l) => l.scores).length
          )
        : null,
    };
  }, [leads]);

  const statusCounts = useMemo(() => {
    const all = leads ?? [];
    const counts: Record<string, number> = { all: all.length };
    for (const { value } of FILTER_STATUSES.slice(1)) {
      counts[value] = all.filter((l) => l.status === value).length;
    }
    return counts;
  }, [leads]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radar className="w-6 h-6 text-primary" />
            Lead Capture
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Website audit leads from the Digital Health Check tool
          </p>
        </div>
        <a
          href="/audit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-3 py-2 flex items-center gap-1.5"
        >
          <Globe className="w-3 h-3" />
          View Audit Tool
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Leads", value: stats.total, icon: Radar, color: "text-primary" },
          { label: "Emails Captured", value: stats.emailCaptured, icon: Mail, color: "text-amber-600" },
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

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_STATUSES.map(({ value, label }) => {
          const count = statusCounts[value] ?? 0;
          const isActive = filterStatus === value;
          return (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {value !== "all" && !isActive && (
                <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[value]?.dot ?? "bg-gray-400")} />
              )}
              {label}
              <span className={cn(
                "ml-0.5 font-mono text-[10px] rounded px-1",
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by URL, city, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading leads…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {(search || filterStatus !== "all") ? (
            <>
              <AlertCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No leads match your filters</p>
            </>
          ) : (
            <>
              <Radar className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No audit leads yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Share the{" "}
                <a href="/audit" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Digital Health Check tool
                </a>{" "}
                to start capturing leads
              </p>
            </>
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scores</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualification</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
