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
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Send, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  projectType: z.enum(["web", "marketing", "print"]),
  specialContext: z.string().optional(),
  content: z.string().optional(),
  loomVideoUrl: z.string().optional(),
  calendlyUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProposal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: proposal, isLoading } = useGetProposal(id, { query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) } });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      businessName: "",
      clientEmail: "",
      projectType: "web",
      specialContext: "",
      content: "",
      loomVideoUrl: "",
      calendlyUrl: "",
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
        projectType: proposal.projectType,
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
        data: {
          clientName: data.clientName,
          businessName: data.businessName,
          projectType: data.projectType,
          specialContext: data.specialContext,
        }
      });
      form.setValue("content", res.content);
      toast({ title: "Generation Complete", description: "Strategy generated." });
    } catch (err) {
      toast({ title: "Failed", description: "Could not generate strategy.", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProposal.mutateAsync({ id, data: values }, {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetProposalQueryKey(id), data);
        }
      });
      toast({ title: "Saved", description: "Proposal updated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    try {
      const data = await updateProposal.mutateAsync({ id, data: { status: "sent" } });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      toast({ title: "Sent", description: "Status changed to sent." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to send.", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  if (!proposal) return <AdminLayout><div>Proposal not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Edit Strategy</h1>
          <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
            ID: {proposal.id.slice(0, 8)}... <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">{proposal.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/proposal/${id}`, '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Portal
          </Button>
          <Button onClick={handleSend} disabled={proposal.status === "accepted" || proposal.status === "sent"} className={proposal.status === "draft" ? "bg-primary" : "bg-muted text-muted-foreground hover:bg-muted"}>
            <Send className="w-4 h-4 mr-2" />
            {proposal.status === "draft" ? "Send to Client" : proposal.status === "sent" ? "Already Sent" : "Accepted"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Client Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="clientName" render={({ field }) => (
                        <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                        <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                  </div>
                  
                  <FormField control={form.control} name="clientEmail" render={({ field }) => (
                      <FormItem><FormLabel>Client Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                    )} />
                  
                  <FormField control={form.control} name="projectType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Category</FormLabel>
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

                  <FormField control={form.control} name="specialContext" render={({ field }) => (
                      <FormItem><FormLabel>Strategic Context</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl></FormItem>
                    )} />

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
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
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Strategic Content</CardTitle>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generateContent.isPending}>
                {generateContent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Regenerate
              </Button>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="content"
                render={({ field }) => (
                  <Textarea className="min-h-[400px] font-mono text-xs leading-relaxed" {...field} />
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" form="edit-form" className="w-full h-12 text-md font-medium" disabled={updateProposal.isPending}>
            {updateProposal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
        
        <div className="hidden lg:block h-[calc(100vh-12rem)] sticky top-8">
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="border-b border-border/50 bg-black/20 p-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 bg-zinc-950">
              <div className="p-8 prose prose-invert prose-headings:font-sans prose-p:text-zinc-400 prose-h1:text-white max-w-none prose-sm">
                {form.watch("content") ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.watch("content") || ""}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center pt-20 text-zinc-600 font-mono text-sm">NO CONTENT GENERATED</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}