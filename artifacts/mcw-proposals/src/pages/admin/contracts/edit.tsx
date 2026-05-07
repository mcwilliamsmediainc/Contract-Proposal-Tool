import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetContract,
  useUpdateContract,
  useSendContract,
  useGetProposal,
  getGetContractQueryKey,
  getGetProposalQueryKey,
  getListContractsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { clientUrl } from "@/lib/client-url";
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
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Eye, CheckCircle2, Rocket, Sparkles, FileText, Link2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { AiReviewDrawer } from "@/components/ai-review-drawer";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  contractType: z.enum(["website", "marketing", "print"]),
  totalCost: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0),
  remainingBalance: z.coerce.number().min(0),
  scheduleA: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PricingLineItem {
  desc?: string;
  rate?: number;
  qty?: string;
  price: number;
}

function computeProposalTotal(
  pricingItems: string | null | undefined,
  totalAmount: number | null | undefined,
  numberOfPages?: number | null,
): number {
  const pages = numberOfPages || 5;
  const defaultItems: PricingLineItem[] = [
    { desc: "Website Setup & Required Pages", rate: 110, qty: "10 Hours", price: 1100 },
    { desc: "Revisions & Launch", rate: 350, qty: "1 Unit", price: 350 },
    { desc: "Google Analytics & Search Console Setup", rate: 110, qty: "1 Unit", price: 110 },
    { desc: `Web Pages (${pages})`, rate: 450, qty: `${pages} Pages`, price: 450 * pages },
    { desc: "Website Theme", rate: 75, qty: "1 Unit", price: 75 },
    { desc: "Timeline Deposit (eligible for refund)", rate: 500, qty: "1 Unit", price: 500 },
  ];

  if (totalAmount && totalAmount > 0) return totalAmount;

  let items: PricingLineItem[] = [];
  if (pricingItems) {
    try { items = JSON.parse(pricingItems) as PricingLineItem[]; } catch { /* fallback */ }
  }
  if (items.length === 0) items = defaultItems;
  return items.reduce((s, i) => s + Number(i.price), 0);
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status: string) {
  if (status === "signed") return <Badge className="bg-green-100 text-green-800 border-green-200 font-mono uppercase text-[10px] tracking-wider">Signed</Badge>;
  if (status === "sent") return <Badge variant="secondary" className="font-mono uppercase text-[10px] tracking-wider">Sent</Badge>;
  return <Badge variant="outline" className="font-mono uppercase text-[10px] tracking-wider">Draft</Badge>;
}

function contractTypeLabel(type: string) {
  if (type === "website") return "Website Development";
  if (type === "marketing") return "Marketing Services";
  if (type === "print") return "Print & Brand";
  return type;
}

function FeesDisplay({
  total,
  deposit,
  remaining,
  proposalId,
  isLinked,
}: {
  total: number;
  deposit: number;
  remaining: number;
  proposalId?: string | null;
  isLinked: boolean;
}) {
  return (
    <div className="space-y-4">
      {isLinked ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono">
          <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
          Financials sourced from linked proposal — updated automatically when the proposal pricing changes
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          No linked proposal — enter financials manually below
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-1">Total Investment</p>
          <p className="text-xl font-bold text-gray-900">${fmt(total)}</p>
        </div>
        <div className="rounded-lg border border-[#061e57]/20 bg-[#061e57]/5 px-4 py-3">
          <p className="text-xs text-[#061e57]/70 font-mono uppercase tracking-wide mb-1">Deposit (50%)</p>
          <p className="text-xl font-bold text-[#061e57]">${fmt(deposit)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-1">Remaining (50%)</p>
          <p className="text-xl font-bold text-gray-900">${fmt(remaining)}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/60 font-mono">
        Hosting option is selected by the client during contract signing
      </p>
    </div>
  );
}

function ContractDraftPreview({
  form,
  contract,
}: {
  form: UseFormReturn<FormValues>;
  contract: { clientName: string; id: string; status: string; scheduleA?: string | null };
}) {
  const values = useWatch({ control: form.control });
  const today = new Date();
  const dateStr = `${today.getDate()}th day of ${today.toLocaleString("default", { month: "long" })}, ${today.getFullYear()}`;

  const totalCost = Number(values.totalCost ?? 0);
  const deposit = Number(values.depositAmount ?? 0);
  const remaining = Number(values.remainingBalance ?? 0);
  const contractType = values.contractType ?? "website";
  const scheduleA = values.scheduleA;
  const clientName = values.clientName || contract.clientName || "Client";

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground font-semibold">Contract Draft Preview</h2>
        <span className="text-[10px] text-muted-foreground/60 font-mono ml-1">(live — updates as you edit above)</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#061e57] px-8 py-5 text-white">
          <h2 className="text-lg font-bold uppercase tracking-wide">Development Agreement</h2>
          <p className="text-blue-200 text-sm mt-1">Draft — {contract.id.slice(0, 8)}…</p>
        </div>

        <div className="px-8 py-6 prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <p className="text-sm text-gray-500 mb-4 font-medium">
            This Agreement is entered into between <strong>MCWILLIAMS MEDIA INC.</strong> ("Developer") and{" "}
            <strong>{clientName}</strong> ("Client"), dated {dateStr}.
          </p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">1. Services</h3>
          <p className="mb-3">Developer will design, build, and deliver a website ("Site") as described in Schedule A. All work will be tested before delivery.</p>
          <p className="mb-3"><strong>1.1. Revisions.</strong> Two rounds of revisions are included per project phase. Additional rounds are billed at Developer's hourly rate. Major revisions (scope changes) require a revised quote and written approval before work begins. All revision requests must be submitted through Developer's project management tool.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">2. Fees &amp; Payment</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Fee</div>
                <div className="text-lg font-bold text-gray-900">${totalCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deposit (Non-Refundable)</div>
                <div className="text-lg font-bold text-[#061e57]">${deposit.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining Balance</div>
                <div className="text-lg font-bold text-gray-900">${remaining.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <p className="mb-3">The non-refundable Deposit is due before work begins. Preferred payment is ACH transfer; check or credit card accepted at Developer's discretion. Invoices are due within 15 days. Late payments are subject to a $75/month fee. Accounts 90+ days past due may have services, including hosting, suspended until current.</p>
          <p className="mb-3"><strong>Expenses.</strong> Client will be invoiced at cost for any required third-party software, plugins, or licenses. Developer will obtain written approval before any such purchase.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">3. Schedule</h3>
          <p className="mb-3">Developer will make reasonable efforts to meet agreed deadlines. Timelines may be extended by written notice. Delays caused by events outside Developer's control (natural disasters, power failures, acts of government, etc.) are not a breach of this Agreement.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">4. Client Approval</h3>
          <p className="mb-3">Developer will present the Site for Client review at each major milestone. Client has 7 business days to respond with approval or revision requests. No response within that window is considered approval. Final written approval authorizes launch and constitutes acceptance of the delivered work.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">5. Post-Launch Support</h3>
          <p className="mb-3">Developer provides 30 days of post-launch support for bugs or errors caused by Developer's work at no charge. This does not cover new requests, client-made changes, plugin updates, or content edits. Work outside this scope is billed at Developer's hourly rate.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">6. Copyright &amp; License</h3>
          <p className="mb-3">Client owns the copyright to all content it provides. Upon payment in full, Client receives a non-exclusive license to use Developer's tools solely to operate the Site. Developer retains all rights to its tools and development resources. Developer may display the Site in its portfolio and marketing materials and tag Client on social media at launch. No confidential business information will be disclosed without Client's consent. Client consents to Developer recording video meetings for design and training purposes.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">7. Domain Name</h3>
          <p className="mb-3">Client is responsible for obtaining and maintaining its own domain name at its own expense. Developer has no interest in Client's domain.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">8. Client Content</h3>
          <p className="mb-3">Client is responsible for all content provided for the Site. Client warrants that it owns or has rights to all such content and that it does not infringe any third-party rights or violate any laws. Developer is not liable for claims arising from Client-supplied content.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">9. Third-Party Assets</h3>
          <p className="mb-3">The Site may use licensed third-party assets (fonts, stock photos, plugins, etc.). Developer will disclose these to Client. Client is responsible for maintaining required licenses after delivery. Developer is not liable for claims arising from Client's failure to do so.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">10. Hosting</h3>
          <p className="mb-3">If Developer provides hosting, it will make reasonable efforts to maintain Site availability but does not guarantee uninterrupted service. Client is responsible for maintaining its own backups. Hosting accounts in Developer's name remain under Developer's control until all fees are paid and the account is transferred. Hosting may be suspended for accounts 90+ days past due.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">11. Disclaimers &amp; Warranties</h3>
          <p className="mb-3">ALL WORK IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. DEVELOPER DOES NOT WARRANT THAT THE SITE WILL OPERATE ERROR-FREE OR WITHOUT INTERRUPTION.</p>
          <p className="mb-3"><strong>AI Tools.</strong> Developer may use AI-assisted tools during the project. Developer does not warrant the originality, accuracy, or legal clearance of AI-assisted outputs. Developer reviews all AI-assisted work before delivery, but this is not a guarantee against defects or third-party claims. Client is responsible for any AI-generated content it provides.</p>
          <p className="mb-3"><strong>SEO.</strong> Developer makes no guarantee of search engine rankings, traffic, or business outcomes. Any SEO configuration is technical setup only.</p>
          <p className="mb-3"><strong>Browsers.</strong> The Site will be compatible with current stable versions of Chrome, Firefox, Safari, and Edge on standard mobile and desktop devices. Legacy browsers and non-standard devices are not covered.</p>
          <p className="mb-3"><strong>Privacy &amp; Compliance.</strong> Client is solely responsible for the Site's compliance with applicable laws, including GDPR, CCPA, and CAN-SPAM. Any privacy tools Developer configures are not legal compliance advice.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">12. Liability</h3>
          <p className="mb-3">Developer is not liable for lost profits or consequential damages. Client agrees to indemnify Developer against third-party claims arising from Client's use of the Site or Client-supplied content.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">13. Termination</h3>
          <p className="mb-3">Either party may terminate for material breach with 30 days' written notice if the breach is not cured. If Client cancels for any reason, Developer retains the Deposit and all payments made to date. If Client goes 30 days without responding to a written request, Developer may stop work and retain all payments, then either deliver unfinished files and close the project, or negotiate a new schedule.</p>
          <p className="mb-3"><strong>Abandonment.</strong> If the project is inactive for 90+ days due to Client, it is considered abandoned. A 25% restart fee applies to resume work.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">14. File Retention</h3>
          <p className="mb-3">After termination, Developer will retain Client's project files for 6 months. Client may request file delivery at any time during this period. After 6 months, files may be permanently deleted without notice. Developer is not liable for file loss after this period. Developer may retain copies for portfolio or legal purposes.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">15. Confidentiality</h3>
          <p className="mb-3">Both parties agree not to disclose the terms of this Agreement without the other's written consent, except as required by law.</p>

          <h3 className="font-bold text-gray-900 mt-4 mb-2">16. Governing Law</h3>
          <p className="mb-3">This Agreement is governed by Oklahoma law, with jurisdiction in Tulsa County. Disputes will first go to mediation under the American Arbitration &amp; Mediation Association. The prevailing party in any legal action is entitled to recover attorney's fees and costs.</p>

          {scheduleA && (
            <div className="mt-4">
              <h3 className="font-bold text-gray-900 mb-2">Schedule A — Scope of Work</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap text-sm">{scheduleA}</div>
            </div>
          )}

          <div className="border-t border-gray-200 mt-6 pt-6">
            <p className="font-semibold text-gray-900 mb-1">IN WITNESS WHEREOF, the Parties hereto have executed this Agreement:</p>
            <p className="text-sm text-gray-500 mb-4">By signing below, <strong>{clientName}</strong> agrees to all terms of this Development Agreement.</p>
            <div className="h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-400 font-mono">[ Client signature pad appears here ]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditContract() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: contract, isLoading } = useGetContract(id, {
    query: { enabled: !!id, queryKey: getGetContractQueryKey(id) },
  });

  const proposalId = contract?.proposalId ?? null;

  const { data: linkedProposal } = useGetProposal(proposalId ?? "", {
    query: {
      enabled: !!proposalId,
      queryKey: getGetProposalQueryKey(proposalId ?? ""),
    },
  });

  const proposalTotal = useMemo(() => {
    if (!linkedProposal) return null;
    return computeProposalTotal(
      linkedProposal.pricingItems,
      linkedProposal.totalAmount,
      linkedProposal.numberOfPages,
    );
  }, [linkedProposal]);

  const effectiveTotal = proposalTotal ?? (contract ? Number(contract.totalCost) : 0);
  const effectiveDeposit = Math.round(effectiveTotal * 0.5 * 100) / 100;
  const effectiveRemaining = Math.round((effectiveTotal - effectiveDeposit) * 100) / 100;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      businessName: "",
      clientEmail: "",
      contractType: "website",
      totalCost: 0,
      depositAmount: 0,
      remainingBalance: 0,
      scheduleA: "",
    },
  });

  const initializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (contract && initializedRef.current !== id) {
      initializedRef.current = id;
      form.reset({
        clientName: contract.clientName,
        businessName: contract.businessName,
        clientEmail: contract.clientEmail,
        contractType: contract.contractType as "website" | "marketing" | "print",
        totalCost: Number(contract.totalCost),
        depositAmount: Number(contract.depositAmount),
        remainingBalance: Number(contract.remainingBalance),
        scheduleA: contract.scheduleA || "",
      });
    }
  }, [contract, id, form]);

  useEffect(() => {
    if (proposalTotal !== null) {
      form.setValue("totalCost", proposalTotal, { shouldDirty: false });
      form.setValue("depositAmount", effectiveDeposit, { shouldDirty: false });
      form.setValue("remainingBalance", effectiveRemaining, { shouldDirty: false });
    }
  }, [proposalTotal, effectiveDeposit, effectiveRemaining, form]);

  const updateContract = useUpdateContract();
  const sendContract = useSendContract();

  const onSubmit = async (values: FormValues) => {
    const payload = {
      clientName: values.clientName,
      businessName: values.businessName,
      clientEmail: values.clientEmail,
      contractType: values.contractType,
      totalCost: values.totalCost,
      depositAmount: values.depositAmount,
      remainingBalance: values.remainingBalance,
      scheduleA: values.scheduleA,
    };
    try {
      const updated = await updateContract.mutateAsync({ id, data: payload });
      queryClient.setQueryData(getGetContractQueryKey(id), updated);
      await queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
      toast({ title: "Saved", description: "Contract updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    try {
      const updated = await sendContract.mutateAsync({ id });
      queryClient.setQueryData(getGetContractQueryKey(id), updated);
      await queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
      toast({ title: "Sent", description: "Contract marked as sent to client." });
    } catch {
      toast({ title: "Error", description: "Failed to send.", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  if (!contract) return <AdminLayout><div>Contract not found</div></AdminLayout>;

  const isSigned = contract.status === "signed";

  return (
    <AdminLayout>
      {isSigned && (
        <div className="flex items-center justify-between mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Contract signed — ready to begin onboarding</p>
              <p className="text-xs text-green-700 mt-0.5">This client is ready to move into the active onboarding phase.</p>
            </div>
          </div>
          <Link href="/admin/onboarding">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
              <Rocket className="w-4 h-4" />
              Begin Onboarding →
            </button>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Edit Contract</h1>
          <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
            ID: {contract.id.slice(0, 8)}... {statusBadge(contract.status)}
            {contract.signedAt && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Signed {format(new Date(contract.signedAt), "MMM d, yyyy")}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setReviewOpen(true)}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Review
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(clientUrl(`/contract/${id}`), "_blank")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Client View
          </Button>
          <Button
            onClick={handleSend}
            disabled={contract.status !== "draft" || sendContract.isPending}
            className={contract.status === "draft" ? "bg-primary" : "bg-muted text-muted-foreground hover:bg-muted"}
          >
            {sendContract.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {contract.status === "draft" ? "Send to Client" : contract.status === "sent" ? "Awaiting Signature" : "Signed"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl">
        <Form {...form}>
          <form id="edit-contract-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientName" render={({ field }) => (
                    <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="businessName" render={({ field }) => (
                    <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="clientEmail" render={({ field }) => (
                  <FormItem><FormLabel>Client Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contractType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="print">Print</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Fees & Hosting</CardTitle>
              </CardHeader>
              <CardContent>
                {proposalId ? (
                  <FeesDisplay
                    total={effectiveTotal}
                    deposit={effectiveDeposit}
                    remaining={effectiveRemaining}
                    proposalId={proposalId}
                    isLinked={true}
                  />
                ) : (
                  <div className="space-y-4">
                    <FeesDisplay
                      total={effectiveTotal}
                      deposit={effectiveDeposit}
                      remaining={effectiveRemaining}
                      proposalId={null}
                      isLinked={false}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={form.control} name="totalCost" render={({ field }) => (
                        <FormItem><FormLabel>Total Cost ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="depositAmount" render={({ field }) => (
                        <FormItem><FormLabel>Deposit ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="remainingBalance" render={({ field }) => (
                        <FormItem><FormLabel>Remaining ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Schedule A — Scope of Work</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="scheduleA" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Scope & Deliverables</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[140px] resize-y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Button type="submit" form="edit-contract-form" className="w-full h-12" disabled={updateContract.isPending}>
              {updateContract.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>

        <ContractDraftPreview form={form} contract={contract} />
      </div>
      <AiReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        reviewType="contract"
        storageKey={`contract:${id}`}
        data={{
          clientName: contract.clientName,
          businessName: contract.businessName,
          contractType: contract.contractType,
          totalCost: effectiveTotal,
          depositAmount: effectiveDeposit,
          remainingBalance: effectiveRemaining,
          hostingOption: contract.hostingOption,
          scheduleA: contract.scheduleA,
          status: contract.status,
        }}
      />
    </AdminLayout>
  );
}
