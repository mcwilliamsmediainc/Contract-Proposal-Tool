import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useGetAdminStats, useListProposals, useListContracts,
  useDeleteProposal, useDeleteContract,
  getGetAdminStatsQueryKey, getListProposalsQueryKey, getListContractsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, Briefcase, FileSignature, FileText, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

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
  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: proposals, isLoading: loadingProposals } = useListProposals(undefined, { query: { queryKey: getListProposalsQueryKey() } });
  const { data: contracts, isLoading: loadingContracts } = useListContracts(undefined, { query: { queryKey: getListContractsQueryKey() } });

  const deleteProposal = useDeleteProposal();
  const deleteContract = useDeleteContract();

  const [confirmProposal, setConfirmProposal] = useState<string | null>(null);
  const [confirmContract, setConfirmContract] = useState<string | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

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

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Current Leads</h1>
          <p className="text-muted-foreground font-mono text-sm">STRATEGIC PIPELINE OVERVIEW</p>
        </div>
        <Link href="/admin/proposals/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          + Initialize Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">TOTAL PROPOSALS</CardTitle>
            <Briefcase className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProposals || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">ACTIVE PIPELINE</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats?.activePipeline || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">CONVERSION RATE</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.conversionRate || 0).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">TOTAL ENGAGEMENT</CardTitle>
            <Send className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalEngagement || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Table */}
      <h2 className="text-xl font-bold mb-4 font-mono tracking-tight flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" /> PROPOSALS
      </h2>
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
              ) : proposals?.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No proposals yet.</td></tr>
              ) : proposals?.map((proposal) => (
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

      {/* Contracts Table */}
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
                <tr key={contract.id} className="hover:bg-accent/50 transition-colors">
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
