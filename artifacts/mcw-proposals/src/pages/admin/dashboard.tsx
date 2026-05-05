import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListProposals, useListContracts,
  useDeleteProposal, useDeleteContract,
  getGetAdminStatsQueryKey, getListProposalsQueryKey, getListContractsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, BarChart3, Briefcase, FileSignature, FileText, Send, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

type StageKey = "all" | "draft" | "sent" | "accepted" | "contract-out" | "contract-signed";

interface PipelineStage {
  key: StageKey;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
  isContract?: boolean;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { key: "all",             label: "All",             color: "bg-muted/60 text-muted-foreground hover:bg-muted",        activeColor: "bg-foreground text-background",        dotColor: "bg-foreground" },
  { key: "draft",           label: "Draft",           color: "bg-gray-100 text-gray-600 hover:bg-gray-200",             activeColor: "bg-gray-700 text-white",               dotColor: "bg-gray-400" },
  { key: "sent",            label: "Sent",            color: "bg-blue-50 text-blue-700 hover:bg-blue-100",              activeColor: "bg-blue-600 text-white",               dotColor: "bg-blue-500" },
  { key: "accepted",        label: "Accepted",        color: "bg-amber-50 text-amber-700 hover:bg-amber-100",           activeColor: "bg-amber-500 text-white",              dotColor: "bg-amber-400" },
  { key: "contract-out",    label: "Contract Out",    color: "bg-violet-50 text-violet-700 hover:bg-violet-100",        activeColor: "bg-violet-600 text-white",             dotColor: "bg-violet-400", isContract: true },
  { key: "contract-signed", label: "Contract Signed", color: "bg-green-50 text-green-700 hover:bg-green-100",           activeColor: "bg-green-600 text-white",              dotColor: "bg-green-500", isContract: true },
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

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: proposals, isLoading: loadingProposals } = useListProposals(undefined, { query: { queryKey: getListProposalsQueryKey() } });
  const { data: contracts, isLoading: loadingContracts } = useListContracts(undefined, { query: { queryKey: getListContractsQueryKey() } });

  const deleteProposal = useDeleteProposal();
  const deleteContract = useDeleteContract();

  const [confirmProposal, setConfirmProposal] = useState<string | null>(null);
  const [confirmContract, setConfirmContract] = useState<string | null>(null);

  // Filter state
  const [activeStage, setActiveStage] = useState<StageKey>("all");
  const [filterStrategist, setFilterStrategist] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  // Stage counts
  const stageCounts = useMemo(() => ({
    all:              proposals?.length ?? 0,
    draft:            proposals?.filter(p => p.status === "draft").length ?? 0,
    sent:             proposals?.filter(p => p.status === "sent").length ?? 0,
    accepted:         proposals?.filter(p => p.status === "accepted").length ?? 0,
    "contract-out":   contracts?.filter(c => c.status === "draft" || c.status === "sent").length ?? 0,
    "contract-signed": contracts?.filter(c => c.status === "signed").length ?? 0,
  }), [proposals, contracts]);

  // Filtered proposals — stage chip + strategist + status dropdowns all compose as AND
  const filteredProposals = useMemo(() => {
    let result = proposals ?? [];

    // Stage chip filter (only for proposal stages)
    if (activeStage === "draft")    result = result.filter(p => p.status === "draft");
    if (activeStage === "sent")     result = result.filter(p => p.status === "sent");
    if (activeStage === "accepted") result = result.filter(p => p.status === "accepted");
    // contract-out / contract-signed: show all proposals (those stages are contract-only)

    // Strategist dropdown
    if (filterStrategist !== "all") {
      result = result.filter(p => (p.clientStrategist || "") === filterStrategist);
    }

    // Status dropdown
    if (filterStatus !== "all") {
      result = result.filter(p => p.status === filterStatus);
    }

    return result;
  }, [proposals, activeStage, filterStrategist, filterStatus]);

  // Computed stats from filtered proposals
  const computedStats = useMemo(() => {
    const total = filteredProposals.length;
    const pipeline = filteredProposals.reduce((sum, p) => sum + Number(p.totalAmount ?? 0), 0);
    const accepted = filteredProposals.filter(p => p.status === "accepted").length;
    const conversionRate = total > 0 ? (accepted / total) * 100 : 0;
    const views = filteredProposals.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
    return { total, pipeline, conversionRate, views };
  }, [filteredProposals]);

  const isFiltered = activeStage !== "all" || filterStrategist !== "all" || filterStatus !== "all";

  const handleDeleteProposal = async (id: string) => {
    try {
      await deleteProposal.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast({ title: "Deleted", description: "Proposal removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete proposal.", variant: "destructive" });
    } finally {
      setConfirmProposal(null);
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      await deleteContract.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
      toast({ title: "Deleted", description: "Contract removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete contract.", variant: "destructive" });
    } finally {
      setConfirmContract(null);
    }
  };

  const handleStageClick = (key: StageKey) => {
    setActiveStage(key);
    // When clicking a contract stage, clear proposal-level status filter to avoid conflicting UI
    if (key === "contract-out" || key === "contract-signed") {
      setFilterStatus("all");
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Current Leads</h1>
          <p className="text-muted-foreground font-mono text-sm">STRATEGIC PIPELINE OVERVIEW</p>
        </div>
        <Link href="/admin/proposals/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          + Initialize Proposal
        </Link>
      </div>

      {/* ── PIPELINE STAGE HEADER ── */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max pb-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isActive = activeStage === stage.key;
            const count = stageCounts[stage.key];
            return (
              <div key={stage.key} className="flex items-center gap-1.5">
                {idx > 0 && idx < PIPELINE_STAGES.length && (
                  <div className="w-5 h-px bg-border/60 flex-shrink-0" />
                )}
                <button
                  onClick={() => handleStageClick(stage.key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all select-none",
                    isActive ? stage.activeColor : stage.color,
                    stage.isContract && !isActive && "border border-dashed border-current/30"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? "bg-current opacity-80" : stage.dotColor)} />
                  {stage.label}
                  <span className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                    isActive ? "bg-white/20 text-inherit" : "bg-current/10 text-current"
                  )}>
                    {count}
                  </span>
                  {stage.isContract && !isActive && (
                    <span className="text-[9px] opacity-50 uppercase tracking-wider font-mono">contract</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STATS CARDS ── */}
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
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">CONVERSION RATE</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{computedStats.conversionRate.toFixed(1)}%</div>
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

      {/* ── PROPOSALS TABLE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> PROPOSALS
          {isFiltered && (
            <span className="text-xs text-muted-foreground font-normal ml-1">
              ({filteredProposals.length} shown)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <Select value={filterStrategist} onValueChange={v => { setFilterStrategist(v); }}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue placeholder="All Strategists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategists</SelectItem>
              {STRATEGISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={v => {
              setFilterStatus(v);
              // Keep stage chip in sync when selecting a status
              if (v !== "all") setActiveStage(v as StageKey);
              else if (activeStage !== "contract-out" && activeStage !== "contract-signed") setActiveStage("all");
            }}
          >
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
              onClick={() => { setActiveStage("all"); setFilterStrategist("all"); setFilterStatus("all"); }}
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
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingProposals ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                    {isFiltered ? (
                      <span>No proposals match the current filters. <button onClick={() => { setActiveStage("all"); setFilterStrategist("all"); setFilterStatus("all"); }} className="text-primary hover:underline">Clear filters</button></span>
                    ) : "No proposals yet."}
                  </td>
                </tr>
              ) : filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">{proposal.clientName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{proposal.businessName}</td>
                  <td className="px-5 py-3.5">
                    {proposal.clientStrategist ? (
                      <span className="text-xs font-medium text-blue-600">{proposal.clientStrategist}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-foreground">{formatCurrency(proposal.totalAmount)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={proposal.status === "accepted" ? "default" : proposal.status === "sent" ? "secondary" : "outline"} className="font-mono uppercase text-[10px] tracking-wider">
                      {proposal.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-muted-foreground">{proposal.viewCount}</td>
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
                        <a href={`/proposal/${proposal.id}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono">PREVIEW</a>
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

      {/* ── CONTRACTS TABLE ── */}
      <h2 className="text-xl font-bold mb-4 font-mono tracking-tight flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-primary" /> CONTRACTS
      </h2>
      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30 backdrop-blur">
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
              ) : contracts?.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No contracts yet.</td></tr>
              ) : contracts?.map((contract) => (
                <tr key={contract.id} className={cn(
                  "hover:bg-accent/50 transition-colors",
                  (activeStage === "contract-out" && (contract.status === "draft" || contract.status === "sent")) && "bg-violet-50/50",
                  (activeStage === "contract-signed" && contract.status === "signed") && "bg-green-50/50",
                )}>
                  <td className="px-5 py-3.5 font-medium text-foreground">{contract.clientName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{contract.businessName}</td>
                  <td className="px-5 py-3.5">
                    {contract.teamMember ? (
                      <span className="text-xs font-medium text-blue-600">{contract.teamMember}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground capitalize">{contract.contractType}</td>
                  <td className="px-5 py-3.5 font-mono text-foreground">{formatCurrency(Number(contract.totalCost))}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={contract.status === "signed" ? "default" : contract.status === "sent" ? "secondary" : "outline"} className="font-mono uppercase text-[10px] tracking-wider">
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
                        <a href={`/contract/${contract.id}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono">VIEW</a>
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
    </AdminLayout>
  );
}
