import { AdminLayout } from "@/components/layout/admin-layout";
import { clientUrl } from "@/lib/client-url";
import {
  useListProposals, useListContracts, useListOnboardingClients,
  useDeleteProposal, useDeleteContract,
  getGetAdminStatsQueryKey, getListProposalsQueryKey, getListContractsQueryKey,
  getListOnboardingClientsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Activity, BarChart3, Briefcase, FileSignature, FileText, Send, Trash2,
  Filter, FilePlus2, User, Users, Search, X, Rocket, CheckCircle2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/react";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams", "Ashlea Mortenson"];

type StageKey = "all" | "draft" | "sent" | "accepted" | "contract-out" | "contract-signed" | "onboarding";
const CONTRACT_STAGES: StageKey[] = ["contract-out", "contract-signed", "onboarding"];

interface PipelineStage {
  key: StageKey;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
  isContract?: boolean;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { key: "all",             label: "All",             color: "bg-muted/60 text-muted-foreground hover:bg-muted",       activeColor: "bg-foreground text-background",        dotColor: "bg-foreground" },
  { key: "draft",           label: "Draft",           color: "bg-gray-100 text-gray-600 hover:bg-gray-200",            activeColor: "bg-gray-700 text-white",               dotColor: "bg-gray-400" },
  { key: "sent",            label: "Sent",            color: "bg-blue-50 text-blue-700 hover:bg-blue-100",             activeColor: "bg-blue-600 text-white",               dotColor: "bg-blue-500" },
  { key: "accepted",        label: "Accepted",        color: "bg-amber-50 text-amber-700 hover:bg-amber-100",          activeColor: "bg-amber-500 text-white",              dotColor: "bg-amber-400" },
  { key: "contract-out",    label: "Contract Out",    color: "bg-violet-50 text-violet-700 hover:bg-violet-100",       activeColor: "bg-violet-600 text-white",             dotColor: "bg-violet-400", isContract: true },
  { key: "contract-signed", label: "Contract Signed", color: "bg-green-50 text-green-700 hover:bg-green-100",          activeColor: "bg-green-600 text-white",              dotColor: "bg-green-500",  isContract: true },
  { key: "onboarding",      label: "Onboarding",      color: "bg-teal-50 text-teal-700 hover:bg-teal-100",             activeColor: "bg-teal-600 text-white",               dotColor: "bg-teal-500",   isContract: true },
];

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-red-600 font-medium">Delete?</span>
      <button onClick={onConfirm} className="text-xs font-mono font-bold text-red-600 hover:text-red-800">YES</button>
      <button onClick={onCancel} className="text-xs font-mono text-muted-foreground hover:text-foreground">NO</button>
    </span>
  );
}

function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return fields.some(f => f?.toLowerCase().includes(q));
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const myName = user?.fullName || "";

  const { data: proposals, isLoading: loadingProposals } = useListProposals(undefined, { query: { queryKey: getListProposalsQueryKey() } });
  const { data: contracts, isLoading: loadingContracts } = useListContracts(undefined, { query: { queryKey: getListContractsQueryKey() } });
  const { data: onboardingClients, isLoading: loadingOnboarding } = useListOnboardingClients({ query: { queryKey: getListOnboardingClientsQueryKey() } });

  const deleteProposal = useDeleteProposal();
  const deleteContract = useDeleteContract();

  const [confirmProposal, setConfirmProposal] = useState<string | null>(null);
  const [confirmContract, setConfirmContract] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<StageKey>("all");
  const [myItemsOnly, setMyItemsOnly] = useState(false);
  const [filterStrategist, setFilterStrategist] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const effectiveStrategist = myItemsOnly && myName ? myName : filterStrategist;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const proposalsByDropdowns = useMemo(() => {
    let result = proposals ?? [];
    if (effectiveStrategist !== "all") result = result.filter(p => (p.clientStrategist || "") === effectiveStrategist);
    if (filterStatus !== "all") result = result.filter(p => p.status === filterStatus);
    return result;
  }, [proposals, effectiveStrategist, filterStatus]);

  const contractsByStrategist = useMemo(() => {
    let result = contracts ?? [];
    if (effectiveStrategist !== "all") result = result.filter(c => (c.teamMember || "") === effectiveStrategist);
    return result;
  }, [contracts, effectiveStrategist]);

  const filteredProposals = useMemo(() => {
    let result = CONTRACT_STAGES.includes(activeStage) ? [] : proposalsByDropdowns;
    if (activeStage === "draft")    result = result.filter(p => p.status === "draft");
    if (activeStage === "sent")     result = result.filter(p => p.status === "sent");
    if (activeStage === "accepted") result = result.filter(p => p.status === "accepted");
    if (search) result = result.filter(p => matchesSearch(search, p.clientName, p.businessName, p.clientStrategist));
    return result;
  }, [proposalsByDropdowns, activeStage, search]);

  const filteredContracts = useMemo(() => {
    let result = contractsByStrategist;
    if (activeStage === "contract-out")    result = result.filter(c => c.status === "draft" || c.status === "sent");
    if (activeStage === "contract-signed") result = result.filter(c => c.status === "signed");
    if (search) result = result.filter(c => matchesSearch(search, c.clientName, c.businessName, c.teamMember));
    return result;
  }, [contractsByStrategist, activeStage, search]);

  const filteredOnboarding = useMemo(() => {
    let result = onboardingClients ?? [];
    if (activeStage !== "all" && activeStage !== "onboarding" && !CONTRACT_STAGES.includes(activeStage)) return [];
    if (activeStage === "contract-out" || activeStage === "contract-signed") return [];
    if (search) result = result.filter(c => matchesSearch(search, c.clientName, c.businessName, c.clientStrategist));
    return result;
  }, [onboardingClients, activeStage, search]);

  const stageCounts = useMemo<Record<StageKey, number>>(() => ({
    all:               proposalsByDropdowns.length,
    draft:             proposalsByDropdowns.filter(p => p.status === "draft").length,
    sent:              proposalsByDropdowns.filter(p => p.status === "sent").length,
    accepted:          proposalsByDropdowns.filter(p => p.status === "accepted").length,
    "contract-out":    contractsByStrategist.filter(c => c.status === "draft" || c.status === "sent").length,
    "contract-signed": contractsByStrategist.filter(c => c.status === "signed").length,
    onboarding:        (onboardingClients ?? []).length,
  }), [proposalsByDropdowns, contractsByStrategist, onboardingClients]);

  const computedStats = useMemo(() => {
    const total    = filteredProposals.length;
    const pipeline = filteredProposals
      .filter(p => p.status !== "accepted")
      .reduce((s, p) => s + Number(p.totalAmount ?? 0), 0);
    const won      = filteredProposals
      .filter(p => p.status === "accepted")
      .reduce((s, p) => s + Number(p.totalAmount ?? 0), 0);
    const accepted = filteredProposals.filter(p => p.status === "accepted").length;
    const rate     = total > 0 ? (accepted / total) * 100 : 0;
    const views    = filteredProposals.reduce((s, p) => s + (p.viewCount ?? 0), 0);
    return { total, pipeline, won, rate, views };
  }, [filteredProposals]);

  const isFiltered = activeStage !== "all" || effectiveStrategist !== "all" || filterStatus !== "all" || myItemsOnly || !!search;
  const isContractStage = CONTRACT_STAGES.includes(activeStage);
  const isOnboardingStage = activeStage === "onboarding";

  const clearFilters = () => {
    setActiveStage("all");
    setFilterStrategist("all");
    setFilterStatus("all");
    setMyItemsOnly(false);
    setSearch("");
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      await deleteProposal.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast({ title: "Deleted", description: "Proposal removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete proposal.", variant: "destructive" });
    } finally { setConfirmProposal(null); }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      await deleteContract.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
      toast({ title: "Deleted", description: "Contract removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete contract.", variant: "destructive" });
    } finally { setConfirmContract(null); }
  };

  const showProposals   = !isOnboardingStage;
  const showContracts   = activeStage === "all" || isContractStage;
  const showOnboarding  = activeStage === "all" || isOnboardingStage;

  return (
    <AdminLayout>
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Current Leads</h1>
          <p className="text-muted-foreground font-mono text-sm">STRATEGIC PIPELINE OVERVIEW</p>
        </div>
        <Link href="/admin/proposals/new" className="inline-flex h-10 items-center gap-2 justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 whitespace-nowrap">
          <FilePlus2 className="w-4 h-4" />
          Create Proposal
        </Link>
      </div>

      {/* ── GLOBAL SEARCH ── */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client name, business, or strategist across all sections…"
          className="pl-9 pr-9 h-10 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── PIPELINE STAGE CHIPS ── */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max pb-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isActive = activeStage === stage.key;
            const count = stageCounts[stage.key];
            return (
              <div key={stage.key} className="flex items-center gap-1.5">
                {idx > 0 && <div className="w-5 h-px bg-border/60 flex-shrink-0" />}
                <button
                  onClick={() => setActiveStage(stage.key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all select-none",
                    isActive ? stage.activeColor : stage.color,
                    stage.isContract && !isActive && "border border-dashed border-current/30"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? "bg-current opacity-80" : stage.dotColor)} />
                  {stage.label}
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold",
                    isActive ? "bg-white/20 text-inherit" : "bg-current/10 text-current"
                  )}>
                    {count}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      {!isContractStage && !isOnboardingStage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">
                {isFiltered ? "MATCHING" : "TOTAL"} PROPOSALS
              </CardTitle>
              <Briefcase className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{computedStats.total}</div>
              {isFiltered && <p className="text-xs text-muted-foreground mt-1">of {proposals?.length ?? 0} total</p>}
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">
                {isFiltered ? "FILTERED" : "ACTIVE"} PIPELINE
              </CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(computedStats.pipeline)}</div>
              {computedStats.won > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(computedStats.won)} won</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">CONVERSION RATE</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{computedStats.rate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">
                {isFiltered ? "FILTERED" : "TOTAL"} ENGAGEMENT
              </CardTitle>
              <Send className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{computedStats.views}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Views</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PROPOSALS TABLE ── */}
      {showProposals && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> PROPOSALS
              {isFiltered && !isContractStage && (
                <span className="text-xs text-muted-foreground font-normal ml-1">({filteredProposals.length} shown)</span>
              )}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />

              <div className="flex items-center rounded-md border border-border overflow-hidden h-8 text-xs">
                <button
                  onClick={() => setMyItemsOnly(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 h-full transition-colors",
                    myItemsOnly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <User className="w-3 h-3" /> My Items
                </button>
                <button
                  onClick={() => setMyItemsOnly(false)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 h-full border-l border-border transition-colors",
                    !myItemsOnly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Users className="w-3 h-3" /> All
                </button>
              </div>

              <Select value={filterStrategist} onValueChange={v => { setFilterStrategist(v); setMyItemsOnly(false); }} disabled={myItemsOnly}>
                <SelectTrigger className={cn("h-8 text-xs w-44", myItemsOnly && "opacity-40 pointer-events-none")}>
                  <SelectValue placeholder="All Strategists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strategists</SelectItem>
                  {STRATEGISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>

              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="h-8 px-2.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Clear ×
                </button>
              )}
            </div>
          </div>

          <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30 backdrop-blur mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border/50 font-mono text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-medium">Client</th>
                    <th className="px-5 py-4 font-medium">Business</th>
                    <th className="px-5 py-4 font-medium">Strategist</th>
                    <th className="px-5 py-4 font-medium">Value</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Views</th>
                    <th className="px-5 py-4 font-medium">Last Viewed</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loadingProposals ? (
                    <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : isContractStage ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                        <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-25" />
                        <p className="text-sm font-medium">Clients at this stage have progressed to contracts.</p>
                        <p className="text-xs mt-1">
                          <button onClick={() => window.scrollTo({ top: 9999, behavior: "smooth" })} className="text-primary hover:underline">
                            View contracts below ↓
                          </button>
                          {" · "}
                          <button onClick={clearFilters} className="text-muted-foreground hover:text-foreground hover:underline">Show all proposals</button>
                        </p>
                      </td>
                    </tr>
                  ) : filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">
                        {isFiltered
                          ? <span>No proposals match. <button onClick={clearFilters} className="text-primary hover:underline">Clear filters</button></span>
                          : "No proposals yet."
                        }
                      </td>
                    </tr>
                  ) : filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{proposal.clientName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{proposal.businessName}</td>
                      <td className="px-5 py-3.5">
                        {proposal.clientStrategist
                          ? <span className="text-xs font-medium text-blue-600">{proposal.clientStrategist}</span>
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 font-mono text-foreground">{formatCurrency(proposal.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={proposal.status === "accepted" ? "default" : proposal.status === "sent" ? "secondary" : "outline"}
                          className="font-mono uppercase text-[10px] tracking-wider"
                        >
                          {proposal.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">{proposal.viewCount}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {proposal.lastViewedAt
                          ? formatDistanceToNow(new Date(proposal.lastViewedAt), { addSuffix: true })
                          : <span className="opacity-30">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted-foreground text-xs">{format(new Date(proposal.createdAt), "MMM dd, yyyy")}</td>
                      <td className="px-5 py-3.5 text-right">
                        {confirmProposal === proposal.id ? (
                          <ConfirmDelete
                            onConfirm={() => handleDeleteProposal(proposal.id)}
                            onCancel={() => setConfirmProposal(null)}
                          />
                        ) : (
                          <span className="inline-flex items-center gap-3">
                            <Link href={`/admin/proposals/${proposal.id}/edit`} className="text-primary hover:text-primary/80 font-medium text-xs font-mono">EDIT</Link>
                            <a href={clientUrl(`/proposal/${proposal.id}`)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono">PREVIEW</a>
                            {proposal.status === "accepted" && (
                              <Link
                                href={`/admin/contracts/new?proposalId=${proposal.id}&clientName=${encodeURIComponent(proposal.clientName)}&businessName=${encodeURIComponent(proposal.businessName)}&clientEmail=${encodeURIComponent(proposal.clientEmail)}&totalCost=${encodeURIComponent(proposal.totalAmount)}`}
                                className="text-green-600 hover:text-green-700 font-bold text-xs font-mono whitespace-nowrap"
                              >
                                CONTRACT →
                              </Link>
                            )}
                            <button onClick={() => setConfirmProposal(proposal.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── CONTRACTS TABLE ── */}
      {showContracts && (
        <>
          <h2 className="text-xl font-bold mb-4 font-mono tracking-tight flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" /> CONTRACTS
            {search && <span className="text-xs text-muted-foreground font-normal ml-1">({filteredContracts.length} shown)</span>}
            {isContractStage && (
              <span className="text-xs text-muted-foreground font-normal ml-1 capitalize">
                · filtered to {activeStage.replace("-", " ")}
              </span>
            )}
          </h2>
          <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30 backdrop-blur mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border/50 font-mono text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-medium">Client</th>
                    <th className="px-5 py-4 font-medium">Business</th>
                    <th className="px-5 py-4 font-medium">Strategist</th>
                    <th className="px-5 py-4 font-medium">Type</th>
                    <th className="px-5 py-4 font-medium">Total</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loadingContracts ? (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                        {isFiltered
                          ? <span>No contracts match. <button onClick={clearFilters} className="text-primary hover:underline">Clear filters</button></span>
                          : "No contracts yet."
                        }
                      </td>
                    </tr>
                  ) : filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className={cn(
                        "hover:bg-accent/50 transition-colors",
                        activeStage === "contract-out" && (contract.status === "draft" || contract.status === "sent") && "bg-violet-50/50",
                        activeStage === "contract-signed" && contract.status === "signed" && "bg-green-50/50",
                      )}
                    >
                      <td className="px-5 py-3.5 font-medium text-foreground">{contract.clientName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{contract.businessName}</td>
                      <td className="px-5 py-3.5">
                        {contract.teamMember
                          ? <span className="text-xs font-medium text-blue-600">{contract.teamMember}</span>
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground capitalize">{contract.contractType}</td>
                      <td className="px-5 py-3.5 font-mono text-foreground">{formatCurrency(Number(contract.totalCost))}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={contract.status === "signed" ? "default" : contract.status === "sent" ? "secondary" : "outline"}
                          className="font-mono uppercase text-[10px] tracking-wider"
                        >
                          {contract.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted-foreground text-xs">{format(new Date(contract.createdAt), "MMM dd, yyyy")}</td>
                      <td className="px-5 py-3.5 text-right">
                        {confirmContract === contract.id ? (
                          <ConfirmDelete
                            onConfirm={() => handleDeleteContract(contract.id)}
                            onCancel={() => setConfirmContract(null)}
                          />
                        ) : (
                          <span className="inline-flex items-center gap-3">
                            <Link href={`/admin/contracts/${contract.id}/edit`} className="text-primary hover:text-primary/80 font-medium text-xs font-mono">EDIT</Link>
                            <a href={clientUrl(`/contract/${contract.id}`)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono">VIEW</a>
                            <button onClick={() => setConfirmContract(contract.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── ONBOARDING TABLE ── */}
      {showOnboarding && (
        <>
          <h2 className="text-xl font-bold mb-4 font-mono tracking-tight flex items-center gap-2">
            <Rocket className="w-5 h-5 text-teal-600" /> ONBOARDING
            {search && <span className="text-xs text-muted-foreground font-normal ml-1">({filteredOnboarding.length} shown)</span>}
          </h2>
          <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30 backdrop-blur mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border/50 font-mono text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-medium">Client</th>
                    <th className="px-5 py-4 font-medium">Business</th>
                    <th className="px-5 py-4 font-medium">Strategist</th>
                    <th className="px-5 py-4 font-medium">Services</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Started</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loadingOnboarding ? (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filteredOnboarding.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                        {search
                          ? <span>No onboarding clients match. <button onClick={() => setSearch("")} className="text-primary hover:underline">Clear search</button></span>
                          : <span>No clients in onboarding yet. <Link href="/admin/onboarding" className="text-teal-600 hover:underline">Go to Onboarding →</Link></span>
                        }
                      </td>
                    </tr>
                  ) : filteredOnboarding.map((client) => (
                    <tr key={client.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{client.clientName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{client.businessName}</td>
                      <td className="px-5 py-3.5">
                        {client.clientStrategist
                          ? <span className="text-xs font-medium text-blue-600">{client.clientStrategist}</span>
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(client.services ?? []).slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded capitalize">
                              {s}
                            </span>
                          ))}
                          {(client.services ?? []).length > 3 && (
                            <span className="text-[10px] font-mono text-muted-foreground">+{client.services.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                          client.status === "complete"
                            ? "bg-green-100 text-green-700"
                            : "bg-teal-50 text-teal-700"
                        )}>
                          {client.status === "complete" ? <CheckCircle2 className="w-3 h-3" /> : <Rocket className="w-3 h-3" />}
                          {client.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href="/admin/onboarding" className="text-teal-600 hover:text-teal-700 font-medium text-xs font-mono">
                          VIEW
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
