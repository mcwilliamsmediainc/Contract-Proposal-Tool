import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetContract,
  useUpdateContract,
  useSendContract,
  getGetContractQueryKey,
  getListContractsQueryKey,
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
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Eye, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
  hostingOption: z.enum(["none", "basic", "platinum"]),
  scheduleA: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function statusBadge(status: string) {
  if (status === "signed") return <Badge className="bg-green-100 text-green-800 border-green-200 font-mono uppercase text-[10px] tracking-wider">Signed</Badge>;
  if (status === "sent") return <Badge variant="secondary" className="font-mono uppercase text-[10px] tracking-wider">Sent</Badge>;
  return <Badge variant="outline" className="font-mono uppercase text-[10px] tracking-wider">Draft</Badge>;
}

export default function EditContract() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useGetContract(id, {
    query: { enabled: !!id, queryKey: getGetContractQueryKey(id) },
  });

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
      hostingOption: "none",
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
        totalCost: contract.totalCost,
        depositAmount: contract.depositAmount,
        remainingBalance: contract.remainingBalance,
        hostingOption: contract.hostingOption as "none" | "basic" | "platinum",
        scheduleA: contract.scheduleA || "",
      });
    }
  }, [contract, id, form]);

  const updateContract = useUpdateContract();
  const sendContract = useSendContract();

  const onSubmit = async (values: FormValues) => {
    try {
      const updated = await updateContract.mutateAsync({ id, data: values });
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

  return (
    <AdminLayout>
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
            onClick={() => window.open(`/contract/${id}`, "_blank")}
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
              <CardContent className="space-y-4">
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
                <FormField control={form.control} name="hostingOption" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hosting Option</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Hosting</SelectItem>
                        <SelectItem value="basic">Basic — $50/mo</SelectItem>
                        <SelectItem value="platinum">Platinum — $100/mo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
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
      </div>
    </AdminLayout>
  );
}
