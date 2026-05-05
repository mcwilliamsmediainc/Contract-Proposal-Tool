import { AdminLayout } from "@/components/layout/admin-layout";
import { useListClients } from "@workspace/api-client-react";
import type { ClientRecord } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  Loader2,
  Search,
  BookUser,
  FileText,
  FileSignature,
  CheckSquare,
  ArrowRight,
  Mail,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

type Stage = ClientRecord["stage"];

interface StageConfig {
  label: string;
  dot: string;
  badge: string;
  pipelineIndex: number;
}

const STAGE_CONFIG: Record<Stage, StageConfig> = {
  proposal_draft:    { label: "Proposal Draft",    dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-600 border-gray-200",       pipelineIndex: 0 },
  proposal_sent:     { label: "Proposal Sent",     dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200",         pipelineIndex: 1 },
  proposal_accepted: { label: "Proposal Accepted", dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200",      pipelineIndex: 2 },
  contract_draft:    { label: "Contract Draft",    dot: "bg-violet-400", badge: "bg-violet-50 text-violet-700 border-violet-200",   pipelineIndex: 3 },
  contract_sent:     { label: "Contract Sent",     dot: "bg-violet-500", badge: "bg-violet-100 text-violet-800 border-violet-300",  pipelineIndex: 4 },
  contract_signed:   { label: "Contract Signed",   dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200",      pipelineIndex: 5 },
  onboarding:        { label: "Onboarding",        dot: "bg-teal-500",   badge: "bg-teal-50 text-teal-700 border-teal-200",         pipelineIndex: 6 },
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
  { value: "all", label: "All Stages" },
  { value: "proposal_draft",    label: "Proposal Draft" },
  { value: "proposal_sent",     label: "Proposal Sent" },
  { value: "proposal_accepted", label: "Proposal Accepted" },
  { value: "contract_draft",    label: "Contract Draft" },
  { value: "contract_sent",     label: "Contract Sent" },
  { value: "contract_signed",   label: "Contract Signed" },
  { value: "onboarding",        label: "Onboarding" },
];

function PipelineBar({ stage }: { stage: Stage }) {
  const current = STAGE_CONFIG[stage].pipelineIndex;
  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_STEPS.map((step, i) => (
        <div
          key={step.key}
          title={step.short}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === 0 || i === 6 ? "w-5" : "w-3",
            i <= current
              ? STAGE_CONFIG[stage].dot
              : "bg-border"
          )}
        />
      ))}
    </div>
  );
}

function ClientCard({ client }: { client: ClientRecord }) {
  const cfg = STAGE_CONFIG[client.stage];
  const initials = client.clientName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-mono font-bold text-sm flex-shrink-0">
          {initials}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-foreground truncate">{client.clientName}</p>
              <p className="text-sm text-muted-foreground truncate">{client.businessName}</p>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs font-medium border shrink-0", cfg.badge)}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", cfg.dot)} />
              {cfg.label}
            </Badge>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />
              {client.clientEmail}
            </span>
            {client.clientStrategist && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {client.clientStrategist}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(client.proposalAmount)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Pipeline bar */}
          <div className="mt-3">
            <PipelineBar stage={client.stage} />
          </div>

          {/* Action links */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60">
            <Link href={`/admin/proposals/${client.proposalId}/edit`}>
              <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <FileText className="w-3 h-3" />
                Proposal
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
            {client.contractId && (
              <Link href={`/admin/contracts/${client.contractId}/edit`}>
                <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <FileSignature className="w-3 h-3" />
                  Contract
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            )}
            {client.onboardingStatus && (
              <Link href="/admin/onboarding">
                <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <CheckSquare className="w-3 h-3" />
                  Onboarding
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStrategist, setFilterStrategist] = useState("all");

  const filtered = useMemo(() => {
    let result = clients ?? [];
    if (filterStage !== "all") result = result.filter((c) => c.stage === filterStage);
    if (filterStrategist !== "all") result = result.filter((c) => c.clientStrategist === filterStrategist);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.businessName.toLowerCase().includes(q) ||
          c.clientEmail.toLowerCase().includes(q)
      );
    }
    return result;
  }, [clients, filterStage, filterStrategist, search]);

  const stageCounts = useMemo(() => {
    const base = (filterStrategist !== "all" ? (clients ?? []).filter((c) => c.clientStrategist === filterStrategist) : clients ?? []);
    const counts: Record<string, number> = { all: base.length };
    for (const s of Object.keys(STAGE_CONFIG)) {
      counts[s] = base.filter((c) => c.stage === s).length;
    }
    return counts;
  }, [clients, filterStrategist]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookUser className="w-6 h-6 text-primary" />
            Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master list of all clients and their pipeline status
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {isLoading ? "—" : `${clients?.length ?? 0} total`}
        </div>
      </div>

      {/* Stage chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_STAGES.map(({ value, label }) => {
          const count = stageCounts[value] ?? 0;
          const isActive = filterStage === value;
          const cfg = value !== "all" ? STAGE_CONFIG[value as Stage] : null;
          return (
            <button
              key={value}
              onClick={() => setFilterStage(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {cfg && !isActive && (
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
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

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, business, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={filterStrategist} onValueChange={setFilterStrategist}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Strategists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategists</SelectItem>
            {STRATEGISTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading clients…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookUser className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No clients found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {(search || filterStage !== "all" || filterStrategist !== "all")
              ? "Try adjusting your filters"
              : "Clients appear here once proposals are created"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
