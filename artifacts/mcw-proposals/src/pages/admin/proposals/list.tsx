import { AdminLayout } from "@/components/layout/admin-layout";
import { clientUrl } from "@/lib/client-url";
import {
  useListProposals, useDeleteProposal,
  getListProposalsQueryKey, getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2, FileText, Send, Eye, CheckCircle2, Trash2, Users, User } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/react";

type FilterKey = "all" | "draft" | "sent" | "accepted" | "archived";

interface Stage {
  key: FilterKey;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
}

const STAGES: Stage[] = [
  { key: "all",      label: "All",      color: "bg-muted/60 text-muted-foreground hover:bg-muted",   activeColor: "bg-foreground text-background",  dotColor: "bg-foreground" },
  { key: "draft",    label: "Draft",    color: "bg-gray-100 text-gray-600 hover:bg-gray-200",         activeColor: "bg-gray-700 text-white",          dotColor: "bg-gray-400" },
  { key: "sent",     label: "Sent",     color: "bg-blue-50 text-blue-700 hover:bg-blue-100",           activeColor: "bg-blue-600 text-white",          dotColor: "bg-blue-500" },
  { key: "accepted", label: "Accepted", color: "bg-green-50 text-green-700 hover:bg-green-100",        activeColor: "bg-green-600 text-white",         dotColor: "bg-green-500" },
  { key: "archived", label: "Archived", color: "bg-muted/50 text-muted-foreground hover:bg-muted",     activeColor: "bg-muted-foreground text-white",  dotColor: "bg-muted-foreground" },
];

const PROJECT_TYPE_LABELS: Record<string, string> = {
  web:          "Website",
  marketing:    "Marketing",
  print:        "Print",
  tiered:       "Tiered",
  "ala-carte":  "Ala Carte",
  project:      "Project",
};

function statusBadge(status: string) {
  if (status === "accepted") return <Badge className="bg-green-100 text-green-800 border-green-200 font-mono uppercase text-[10px] tracking-wider">Accepted</Badge>;
  if (status === "archived") return <Badge variant="outline" className="font-mono uppercase text-[10px] tracking-wider text-muted-foreground">Archived</Badge>;
  if (status === "sent")     return <Badge variant="secondary" className="font-mono uppercase text-[10px] tracking-wider">Sent</Badge>;
  return <Badge variant="outline" className="font-mono uppercase text-[10px] tracking-wider">Draft</Badge>;
}

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-red-600 font-medium">Delete?</span>
      <button onClick={onConfirm} className="text-xs font-mono font-bold text-red-600 hover:text-red-800">YES</button>
      <button onClick={onCancel} className="text-xs font-mono text-muted-foreground hover:text-foreground">NO</button>
    </span>
  );
}

export default function ProposalsList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const myName = user?.fullName || "";

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [myOnly, setMyOnly] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: proposals, isLoading } = useListProposals(undefined, {
    query: { queryKey: getListProposalsQueryKey() },
  });
  const deleteProposal = useDeleteProposal();

  const base = useMemo(() => {
    let result = proposals ?? [];
    if (myOnly && myName) result = result.filter(p => (p.clientStrategist ?? "") === myName);
    return result;
  }, [proposals, myOnly, myName]);

  const filterCounts = useMemo<Record<FilterKey, number>>(() => ({
    all:      base.length,
    draft:    base.filter(p => p.status === "draft").length,
    sent:     base.filter(p => p.status === "sent").length,
    accepted: base.filter(p => p.status === "accepted").length,
    archived: base.filter(p => p.status === "archived").length,
  }), [base]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return base;
    return base.filter(p => p.status === activeFilter);
  }, [base, activeFilter]);

  const stats = useMemo(() => {
    const active   = base.filter(p => p.status !== "archived");
    const total    = active.length;
    const accepted = active.filter(p => p.status === "accepted").length;
    const pipeline = active.reduce((s, p) => s + Number(p.totalAmount ?? 0), 0);
    const rate     = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, pipeline, rate };
  }, [base]);

  const handleDelete = async (id: string) => {
    try {
      await deleteProposal.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast({ title: "Deleted", description: "Proposal removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete proposal.", variant: "destructive" });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Proposals</h1>
          <p className="text-muted-foreground font-mono text-sm">PROPOSAL MANAGEMENT</p>
        </div>
        <Link
          href="/admin/proposals/new"
          className="inline-flex h-10 items-center gap-2 justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <FilePlus2 className="w-4 h-4" />
          Create Proposal
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono uppercase">Total Active</CardTitle>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono uppercase">Sent</CardTitle>
            <Send className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filterCounts.sent}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono uppercase">Accepted</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono uppercase">Close Rate</CardTitle>
            <Eye className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        {/* Stage chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STAGES.map((stage, idx) => {
            const isActive = activeFilter === stage.key;
            const count = filterCounts[stage.key];
            return (
              <div key={stage.key} className="flex items-center gap-1.5">
                {idx > 0 && <div className="w-5 h-px bg-border/60 flex-shrink-0" />}
                <button
                  onClick={() => setActiveFilter(stage.key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all select-none whitespace-nowrap",
                    isActive ? stage.activeColor : stage.color
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

        {/* My / All toggle */}
        <div className="flex items-center gap-0.5 p-1 bg-muted rounded-lg border border-border/50 shrink-0">
          <button
            onClick={() => setMyOnly(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              myOnly ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-3 h-3" />
            My Proposals
          </button>
          <button
            onClick={() => setMyOnly(false)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              !myOnly ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="w-3 h-3" />
            All
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border/50 font-mono text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">Client</th>
                <th className="px-5 py-4 font-medium">Business</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Strategist</th>
                <th className="px-5 py-4 font-medium">Value</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                    Loading proposals...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    {activeFilter === "all" && !myOnly ? (
                      <>
                        <p>No proposals yet.</p>
                        <Link href="/admin/proposals/new" className="text-primary text-xs mt-1 inline-block hover:underline">
                          Create your first proposal →
                        </Link>
                      </>
                    ) : (
                      <p>No {activeFilter !== "all" ? <><span className="font-semibold">{activeFilter}</span> </> : ""}proposals{myOnly ? " assigned to you" : ""}.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <div>{proposal.clientName}</div>
                      {proposal.clientEmail && (
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{proposal.clientEmail}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {proposal.businessName || <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {PROJECT_TYPE_LABELS[proposal.projectType] ?? proposal.projectType}
                    </td>
                    <td className="px-5 py-3.5">
                      {proposal.clientStrategist ? (
                        <span className="text-xs font-medium text-blue-600">{proposal.clientStrategist}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-foreground">
                      {proposal.totalAmount ? `$${Number(proposal.totalAmount).toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(proposal.status)}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground text-xs">
                      <div>{format(new Date(proposal.createdAt), "MMM dd, yyyy")}</div>
                      <div className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmId === proposal.id ? (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(proposal.id)}
                          onCancel={() => setConfirmId(null)}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-3">
                          <Link
                            href={`/admin/proposals/${proposal.id}/edit`}
                            className="text-primary hover:text-primary/80 font-medium text-xs font-mono"
                          >
                            EDIT
                          </Link>
                          <a
                            href={clientUrl(`/proposal/${proposal.id}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono"
                          >
                            VIEW
                          </a>
                          <button
                            onClick={() => setConfirmId(proposal.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
