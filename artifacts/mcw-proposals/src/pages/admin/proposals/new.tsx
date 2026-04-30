import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProposal, useGenerateProposalContent } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  projectType: z.enum(["web", "marketing", "print"]),
  totalAmount: z.coerce.number().min(1, "Amount must be greater than 0"),
  specialContext: z.string().optional(),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewProposal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      businessName: "",
      clientEmail: "",
      projectType: "web",
      totalAmount: 0,
      specialContext: "",
      content: "",
    },
  });

  const createProposal = useCreateProposal();
  const generateContent = useGenerateProposalContent();

  const handleGenerate = async () => {
    const data = form.getValues();
    if (!data.clientName || !data.businessName || !data.projectType || !data.totalAmount) {
      toast({ title: "Missing details", description: "Fill out client details first to generate strategy.", variant: "destructive" });
      return;
    }
    
    try {
      const res = await generateContent.mutateAsync({
        data: {
          clientName: data.clientName,
          businessName: data.businessName,
          projectType: data.projectType,
          totalAmount: data.totalAmount,
          specialContext: data.specialContext,
        }
      });
      form.setValue("content", res.content);
      toast({ title: "Strategic Generation Complete", description: "AI strategy has been generated successfully." });
    } catch (err) {
      toast({ title: "Generation failed", description: "Could not generate strategy.", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const proposal = await createProposal.mutateAsync({ data: values });
      toast({ title: "Proposal Initialized", description: "Successfully created strategic proposal." });
      setLocation(`/admin/proposals/${proposal.id}/edit`);
    } catch (err) {
      toast({ title: "Error", description: "Failed to initialize proposal.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Initialize Strategy</h1>
          <p className="text-muted-foreground font-mono text-sm">NEW PROPOSAL CREATION</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Client Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
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
                      <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="web">Web Ecosystem</SelectItem>
                            <SelectItem value="marketing">Growth Marketing</SelectItem>
                            <SelectItem value="print">Print & Brand</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Investment ($)</FormLabel>
                        <FormControl><Input type="number" placeholder="15000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategic Context</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Key pain points, specific deliverables requested, or competitive analysis..." 
                          className="min-h-[100px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4 border-t border-border/50">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 border-primary/50 text-primary hover:bg-primary/10" 
                    onClick={handleGenerate}
                    disabled={generateContent.isPending}
                  >
                    {generateContent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Execute Strategic Generation
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createProposal.isPending}>
                    {createProposal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Proposal
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div>
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full flex flex-col">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                <span>Live Strategy Preview</span>
                {generateContent.isPending && <span className="text-primary animate-pulse text-xs">Generating...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="p-6 prose prose-invert max-w-none">
                {form.watch("content") ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.watch("content") || ""}
                  </ReactMarkdown>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono opacity-50 pt-20">
                    AWAITING AI GENERATION
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}