import { AdminLayout } from "@/components/layout/admin-layout";
import { useListProposals, getListProposalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Rocket, Target } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Onboarding() {
  const { data: proposals, isLoading } = useListProposals({ status: "accepted" }, { query: { queryKey: getListProposalsQueryKey({ status: "accepted" }) } });

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Active Pipeline</h1>
          <p className="text-muted-foreground font-mono text-sm">PHASE 1 ONBOARDING & ACTIVATION</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : proposals?.length === 0 ? (
        <div className="text-center p-12 border border-border/50 border-dashed rounded-xl bg-card/30">
          <p className="text-muted-foreground font-mono text-sm">NO ACTIVE ONBOARDINGS</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals?.map(proposal => (
            <Card key={proposal.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="h-2 w-full bg-primary/20">
                <div className="h-full bg-primary w-1/3" />
              </div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 bg-primary/5 uppercase">DISCOVERY PHASE</Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {proposal.signedAt ? format(new Date(proposal.signedAt), "MM.dd.yy") : ""}
                  </span>
                </div>
                <CardTitle className="text-xl">{proposal.clientName}</CardTitle>
                <p className="text-sm text-muted-foreground">{proposal.businessName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Target className="w-4 h-4 text-primary" />
                    <span>Strategy formulation complete</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Client kickoff scheduled</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground opacity-40">
                    <Rocket className="w-4 h-4" />
                    <span>Asset acquisition pending</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="font-mono text-sm text-foreground">${proposal.totalAmount.toLocaleString()}</span>
                  <Link href={`/proposal/${proposal.id}`} target="_blank" className="text-xs font-mono text-primary hover:underline">
                    VIEW PORTAL →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// Inline badge since it wasn't exported from ui in this file context earlier
function Badge({ className, variant, ...props }: any) {
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props} />
}