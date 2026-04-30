import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminStats, useListProposals, getGetAdminStatsQueryKey, getListProposalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, Briefcase, CheckCircle2, FileText, Send } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: proposals, isLoading: loadingProposals } = useListProposals(undefined, { query: { queryKey: getListProposalsQueryKey() } });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Command Center</h1>
          <p className="text-muted-foreground font-mono text-sm">STRATEGIC PIPELINE OVERVIEW</p>
        </div>
        <Link href="/admin/proposals/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          + Initialize Proposal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">TOTAL ASSETS</CardTitle>
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

      <h2 className="text-xl font-bold mb-4 font-mono tracking-tight flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" /> RECENT STRATEGIES
      </h2>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border/50 font-mono text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Business</th>
                <th className="px-6 py-4 font-medium">Value</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingProposals ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading pipeline data...</td></tr>
              ) : proposals?.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No proposals initialized yet.</td></tr>
              ) : proposals?.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-accent/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground">{proposal.clientName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{proposal.businessName}</td>
                  <td className="px-6 py-4 font-mono text-foreground">{formatCurrency(proposal.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={proposal.status === "accepted" ? "default" : proposal.status === "sent" ? "secondary" : "outline"} className="font-mono uppercase text-[10px] tracking-wider">
                      {proposal.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{proposal.viewCount}</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{format(new Date(proposal.createdAt), "MMM dd, yyyy")}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/proposals/${proposal.id}/edit`} className="text-primary hover:text-primary/80 font-medium text-xs font-mono mr-4">EDIT</Link>
                    <Link href={`/proposal/${proposal.id}`} target="_blank" className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono">PREVIEW</Link>
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