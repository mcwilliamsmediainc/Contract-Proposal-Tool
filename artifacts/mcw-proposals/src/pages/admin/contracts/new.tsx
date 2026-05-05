import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateContract,
  useListProposals,
  getListContractsQueryKey,
  getListProposalsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const formSchema = z.object({
  proposalId: z.string().optional(),
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  contractType: z.enum(["website", "marketing", "print"]),
  totalCost: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0),
  remainingBalance: z.coerce.number().min(0),
  hostingOption: z.enum(["none", "basic", "platinum"]),
  scheduleA: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewContract() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proposals } = useListProposals(undefined, {
    query: { queryKey: getListProposalsQueryKey() },
  });

  // Read pre-fill params from URL (set when converting an accepted proposal)
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const prefillClientName = searchParams.get("clientName") || "";
  const prefillBusinessName = searchParams.get("businessName") || "";
  const prefillClientEmail = searchParams.get("clientEmail") || "";
  const rawTotal = Number(searchParams.get("totalCost") || 0);
  const prefillTotalCost = Number.isFinite(rawTotal) ? rawTotal : 0;
  const prefillProposalId = searchParams.get("proposalId") || "none";
  const hasPrefill = !!prefillClientName;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proposalId: prefillProposalId,
      clientName: prefillClientName,
      businessName: prefillBusinessName,
      clientEmail: prefillClientEmail,
      contractType: "website",
      totalCost: prefillTotalCost,
      depositAmount: 0,
      remainingBalance: prefillTotalCost,
      hostingOption: "none",
      scheduleA: "",
    },
  });

  const createContract = useCreateContract();

  const handleProposalSelect = (proposalId: string) => {
    if (!proposalId || proposalId === "none") return;
    const proposal = proposals?.find((p) => p.id === proposalId);
    if (proposal) {
      form.setValue("clientName", proposal.clientName);
      form.setValue("businessName", proposal.businessName);
      form.setValue("clientEmail", proposal.clientEmail);
      form.setValue(
        "contractType",
        (proposal.projectType === "web" ? "website" : proposal.projectType) as "website" | "marketing" | "print"
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const contract = await createContract.mutateAsync({
        data: {
          ...values,
          proposalId: (values.proposalId && values.proposalId !== "none") ? values.proposalId : undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
      toast({ title: "Contract Created", description: "Successfully created contract." });
      setLocation(`/admin/contracts/${contract.id}/edit`);
    } catch {
      toast({ title: "Error", description: "Failed to create contract.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-1">New Contract</h1>
          <p className="text-muted-foreground font-mono text-sm">CONTRACT CREATION</p>
        </div>
      </div>

      {hasPrefill && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">Pre-filled from accepted proposal</p>
            <p className="text-xs text-green-700 mt-0.5">Client details and total have been imported. Review and adjust as needed before creating.</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Link to Proposal (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="proposalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accepted Proposal</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          handleProposalSelect(v);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a proposal (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No linked proposal</SelectItem>
                          {proposals?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.clientName} — {p.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="print">Print</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Fees & Hosting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cost ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remainingBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remaining Balance ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="hostingOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hosting Option</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Hosting</SelectItem>
                          <SelectItem value="basic">Basic — $50/mo</SelectItem>
                          <SelectItem value="platinum">Platinum — $100/mo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Schedule A — Scope of Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="scheduleA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Scope & Deliverables</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the specific deliverables, timeline, and scope of work for this project..."
                          className="min-h-[140px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-12" disabled={createContract.isPending}>
              {createContract.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Contract
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
