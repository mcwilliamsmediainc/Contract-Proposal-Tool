import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetProposal, useUpdateProposal, useGenerateProposalContent, getGetProposalQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Send, Eye, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  projectType: z.enum(["web", "marketing", "print"]),
  totalAmount: z.coerce.number().min(0).optional(),
  numberOfPages: z.coerce.number().int().min(1).optional(),
  pageNames: z.string().optional(),
  specialContext: z.string().optional(),
  content: z.string().optional(),
  loomVideoUrl: z.string().optional(),
  calendlyUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function LiveProposalPreview({ values }: { values: FormValues }) {
  const label = values.projectType === "marketing" ? "Marketing" : values.projectType === "print" ? "Print" : "Website";
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const pages = values.numberOfPages || "XX";
  const pageList = values.pageNames || "Home | About | Services | Contact";
  const total = values.totalAmount || 0;
  const pagePrice = (values.numberOfPages || 5) * 450;

  const items = [
    { desc: "Website Setup & Required Pages", qty: "10 Hours", price: 1100 },
    { desc: "Revisions & Launch", qty: "1 Unit", price: 350 },
    { desc: "Google Analytics Setup", qty: "1 Unit", price: 110 },
    { desc: `Web Pages (${pages})`, qty: `${pages} Pages`, price: pagePrice },
    { desc: "Website Theme", qty: "1 Unit", price: 75 },
    { desc: "Timeline Deposit", qty: "1 Unit", price: 500 },
  ];
  const calcTotal = items.reduce((s, i) => s + i.price, 0);
  const displayTotal = total > 0 ? total : calcTotal;

  return (
    <div className="text-sm font-sans overflow-auto h-full">
      {/* Cover */}
      <div className="py-10 px-6 text-center flex flex-col items-center"
        style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 50%, #1a5bb8 100%)" }}>
        <img src="/mcwilliams-logo.png" alt="" className="h-8 mx-auto mb-4 brightness-0 invert" />
        <h2 className="text-2xl font-bold italic text-white mb-3" style={{ fontFamily: "Georgia, serif" }}>{label} Proposal</h2>
        <p className="text-sm font-bold text-white/90 mb-1">Prepared for {values.clientName || "[Client Name]"}</p>
        <p className="text-xs font-semibold text-white/70 mb-2">{values.businessName || "[Business Name]"}</p>
        <p className="text-xs italic text-white/50">{dateStr}, {today.getFullYear()} · Valid 30 days</p>
      </div>

      {/* Intro */}
      <div className="bg-white px-6 py-6 border-b border-gray-100">
        <p className="text-gray-700 text-xs leading-relaxed">
          {values.content || "Thank you for considering McWilliams Media as your partner in achieving your new website goals! We're excited for the opportunity to work with you and bring your vision to life with a professional, unique and conversion-focused design."}
        </p>
        <p className="text-xs text-gray-500 italic mt-4">— Matt McWilliams, Founder & CEO</p>
      </div>

      {/* Testimonial */}
      <div className="bg-[#0a1f5c] px-6 py-6 border-b border-blue-900">
        <p className="text-xs font-bold text-blue-300 tracking-widest uppercase mb-2">Client Success</p>
        <p className="text-white text-xs leading-relaxed italic">"I am very pleased with the finished product of my website! Every member of the team was easily accessible and incredibly responsive."</p>
        <p className="text-blue-200 text-xs mt-2">— Greg Sutmiller, Evolution Mental Health</p>
      </div>

      {/* Strategy */}
      <div className="bg-white px-6 py-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>A proven strategy customized for your business goals.</h3>
        <p className="text-gray-600 text-xs leading-relaxed">With over 75% of consumers going online to research a business before purchasing, the modern business owner needs a branded online presence focused on setting you apart from the competition.</p>
      </div>

      {/* Your Custom Website */}
      <div className="bg-white px-6 py-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>Your Custom Website</h3>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-3">
          <p className="text-xs font-bold text-gray-800 mb-1">Web Pages — {pages}</p>
          <p className="text-xs text-blue-700 font-medium">{pageList}</p>
        </div>
        <ul className="space-y-1.5">
          {["WordPress theme build", "Mobile responsive", "Modern design", "Content editing", "Google Analytics"].map(f => (
            <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-2 h-2 text-white" />
              </div>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing */}
      <div className="bg-white px-6 py-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3 text-center" style={{ fontFamily: "Georgia, serif" }}>Project Quote</h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-[#0a1f5c] px-4 py-2 flex justify-between">
            <span className="text-white text-xs font-bold">Website Design</span>
            <span className="text-white text-xs font-bold">${displayTotal.toLocaleString()}</span>
          </div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.desc} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700">{item.desc}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{item.qty}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">${item.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={2} className="px-3 py-2 text-right font-bold text-gray-900 text-xs">Total</td>
                <td className="px-3 py-2 text-right font-bold text-blue-700 text-sm">${displayTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Accept CTA */}
      <div className="px-6 py-6 text-center" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #1a5bb8 100%)" }}>
        <p className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "Georgia, serif" }}>Ready to work together?</p>
        <p className="text-blue-200 text-xs">Client will sign here to accept the proposal.</p>
      </div>
    </div>
  );
}

export default function EditProposal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proposal, isLoading } = useGetProposal(id, { query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) } });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "", businessName: "", clientEmail: "",
      projectType: "web", totalAmount: undefined,
      numberOfPages: undefined, pageNames: "",
      specialContext: "", content: "", loomVideoUrl: "", calendlyUrl: "",
    },
  });

  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (proposal && initializedForId.current !== id) {
      initializedForId.current = id;
      form.reset({
        clientName: proposal.clientName,
        businessName: proposal.businessName,
        clientEmail: proposal.clientEmail,
        projectType: proposal.projectType as "web" | "marketing" | "print",
        totalAmount: Number(proposal.totalAmount) || undefined,
        numberOfPages: proposal.numberOfPages ?? undefined,
        pageNames: proposal.pageNames || "",
        specialContext: proposal.specialContext || "",
        content: proposal.content || "",
        loomVideoUrl: proposal.loomVideoUrl || "",
        calendlyUrl: proposal.calendlyUrl || "",
      });
    }
  }, [proposal, id, form]);

  const updateProposal = useUpdateProposal();
  const generateContent = useGenerateProposalContent();

  const handleGenerate = async () => {
    const data = form.getValues();
    if (!data.clientName || !data.businessName || !data.projectType) {
      toast({ title: "Missing details", description: "Fill out client details first.", variant: "destructive" });
      return;
    }
    try {
      const res = await generateContent.mutateAsync({
        data: { clientName: data.clientName, businessName: data.businessName, projectType: data.projectType, specialContext: data.specialContext }
      });
      form.setValue("content", res.content);
      toast({ title: "Content Generated", description: "Introduction text has been generated." });
    } catch {
      toast({ title: "Failed", description: "Could not generate content.", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProposal.mutateAsync({ id, data: { ...values, totalAmount: values.totalAmount ?? 0 } }, {
        onSuccess: (data) => { queryClient.setQueryData(getGetProposalQueryKey(id), data); }
      });
      toast({ title: "Saved", description: "Proposal draft updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    try {
      const data = await updateProposal.mutateAsync({ id, data: { status: "sent" } });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      toast({ title: "Sent", description: "Proposal sent to client." });
    } catch {
      toast({ title: "Error", description: "Failed to send.", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  if (!proposal) return <AdminLayout><div>Proposal not found</div></AdminLayout>;

  const watched = form.watch();

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Edit Proposal Draft</h1>
          <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
            {proposal.clientName} · {proposal.businessName}
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">{proposal.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/proposal/${id}`, "_blank")}>
            <Eye className="w-4 h-4 mr-2" />
            Full Preview
          </Button>
          <Button
            onClick={handleSend}
            disabled={proposal.status === "accepted" || proposal.status === "sent"}
            className={proposal.status === "draft" ? "bg-primary" : "bg-muted text-muted-foreground hover:bg-muted"}
          >
            <Send className="w-4 h-4 mr-2" />
            {proposal.status === "draft" ? "Send to Client" : proposal.status === "sent" ? "Already Sent" : "Accepted"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="projectType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="web">Website</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="print">Print</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="totalAmount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} placeholder="e.g. 5089" {...field}
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="numberOfPages" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Pages</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="e.g. 5" {...field}
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="pageNames" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Names</FormLabel>
                        <FormControl><Input placeholder="Home | About | Services" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <FormField control={form.control} name="loomVideoUrl" render={({ field }) => (
                      <FormItem><FormLabel>Loom/YouTube URL</FormLabel><FormControl><Input placeholder="https://loom.com/..." {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="calendlyUrl" render={({ field }) => (
                      <FormItem><FormLabel>Calendly URL</FormLabel><FormControl><Input placeholder="https://calendly.com/..." {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Intro / Thank You Text</CardTitle>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generateContent.isPending}>
                {generateContent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                AI Generate
              </Button>
            </CardHeader>
            <CardContent>
              <Controller control={form.control} name="content" render={({ field }) => (
                <Textarea
                  className="min-h-[160px] resize-y text-sm leading-relaxed"
                  placeholder="Write a custom introduction for this client, or use AI Generate..."
                  {...field}
                />
              )} />
              <p className="text-xs text-muted-foreground mt-2">This text appears on page 2 of the proposal, after the cover.</p>
            </CardContent>
          </Card>

          <Controller control={form.control} name="specialContext" render={({ field }) => (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader><CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Internal Notes (not shown to client)</CardTitle></CardHeader>
              <CardContent>
                <Textarea className="min-h-[80px] resize-y text-sm" placeholder="Notes for the team..." {...field} />
              </CardContent>
            </Card>
          )} />

          <Button type="submit" form="edit-form" className="w-full h-12 text-base font-semibold" disabled={updateProposal.isPending}>
            {updateProposal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Draft
          </Button>
        </div>

        {/* Right: Live Preview */}
        <div className="hidden lg:flex flex-col h-[calc(100vh-10rem)] sticky top-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Live Draft Preview</p>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(`/proposal/${id}`, "_blank")}>
              Open Full <Eye className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="flex-1 rounded-xl border border-border/50 overflow-hidden shadow-2xl ring-1 ring-white/5 bg-white">
            <div className="bg-black/20 px-3 py-2 flex gap-2 border-b border-border/30">
              <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/60" />
              <span className="text-[10px] text-muted-foreground ml-2 font-mono">draft preview</span>
            </div>
            <div className="overflow-auto h-full">
              <LiveProposalPreview values={watched} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
