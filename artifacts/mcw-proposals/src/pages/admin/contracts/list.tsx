import { AdminLayout } from "@/components/layout/admin-layout";
import { clientUrl } from "@/lib/client-url";
import { useListContracts, useDeleteContract, getListContractsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "draft" | "sent" | "signed";

interface ContractStage {
  key: FilterKey;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
}

const CONTRACT_STAGES: ContractStage[] = [
  { key: "all",    label: "All",    color: "bg-muted/60 text-muted-foreground hover:bg-muted",   activeColor: "bg-foreground text-background",  dotColor: "bg-foreground" },
  { key: "draft",  label: "Draft",  color: "bg-gray-100 text-gray-600 hover:bg-gray-200",         activeColor: "bg-gray-700 text-white",          dotColor: "bg-gray-400" },
  { key: "sent",   label: "Sent",   color: "bg-blue-50 text-blue-700 hover:bg-blue-100",           activeColor: "bg-blue-600 text-white",          dotColor: "bg-blue-500" },
  { key: "signed", label: "Signed", color: "bg-green-50 text-green-700 hover:bg-green-100",        activeColor: "bg-green-600 text-white",         dotColor: "bg-green-500" },
];

function statusVariant(status: string) {
  if (status === "signed") return "default";
  if (status === "sent") return "secondary";
  return "outline";
}

function contractTypeLabel(type: string) {
  if (type === "website") return "Website";
  if (type === "marketing") return "Marketing";
  if (type === "print") return "Print";
  return type;
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

export default function ContractsList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const { data: contracts, isLoading } = useListContracts(undefined, {
    query: { queryKey: getListContractsQueryKey() },
  });
  const deleteContract = useDeleteContract();

  const filterCounts = useMemo<Record<FilterKey, number>>(() => {
    const all = contracts ?? [];
    return {
      all:    all.length,
      draft:  all.filter(c => c.status === "draft").length,
      sent:   all.filter(c => c.status === "sent").length,
      signed: all.filter(c => c.status === "signed").length,
    };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    if (activeFilter === "all") return contracts;
    return contracts.filter(c => c.status === activeFilter);
  }, [contracts, activeFilter]);

  const handleDelete = async (id: string) => {
    try {
      await deleteContract.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
      toast({ title: "Deleted", description: "Contract removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete contract.", variant: "destructive" });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Contracts</h1>
          <p className="text-muted-foreground font-mono text-sm">CONTRACT MANAGEMENT</p>
        </div>
        <Link
          href="/admin/contracts/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">TOTAL CONTRACTS</CardTitle>
            <FileSignature className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contracts?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">AWAITING SIGNATURE</CardTitle>
            <FileSignature className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {contracts?.filter((c) => c.status === "sent").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">SIGNED</CardTitle>
            <FileSignature className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {contracts?.filter((c) => c.status === "signed").length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── QUICK-FILTER CHIPS ── */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max pb-1">
          {CONTRACT_STAGES.map((stage, idx) => {
            const isActive = activeFilter === stage.key;
            const count = filterCounts[stage.key];
            return (
              <div key={stage.key} className="flex items-center gap-1.5">
                {idx > 0 && <div className="w-5 h-px bg-border/60 flex-shrink-0" />}
                <button
                  onClick={() => setActiveFilter(stage.key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all select-none",
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
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30">
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                    Loading contracts...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <FileSignature className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    {activeFilter === "all" ? (
                      <>
                        <p>No contracts yet.</p>
                        <Link href="/admin/contracts/new" className="text-primary text-xs mt-1 inline-block hover:underline">
                          Create your first contract →
                        </Link>
                      </>
                    ) : (
                      <p>No <span className="font-semibold">{activeFilter}</span> contracts.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
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
                    <td className="px-5 py-3.5 text-muted-foreground">{contractTypeLabel(contract.contractType)}</td>
                    <td className="px-5 py-3.5 font-mono text-foreground">
                      ${Number(contract.totalCost).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={statusVariant(contract.status)}
                        className="font-mono uppercase text-[10px] tracking-wider"
                      >
                        {contract.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground text-xs">
                      {format(new Date(contract.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmId === contract.id ? (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(contract.id)}
                          onCancel={() => setConfirmId(null)}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-3">
                          <Link
                            href={`/admin/contracts/${contract.id}/edit`}
                            className="text-primary hover:text-primary/80 font-medium text-xs font-mono"
                          >
                            EDIT
                          </Link>
                          <a
                            href={clientUrl(`/contract/${contract.id}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground font-medium text-xs font-mono"
                          >
                            VIEW
                          </a>
                          <button
                            onClick={() => setConfirmId(contract.id)}
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
