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
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  projectType: z.enum(["web", "tiered", "ala-carte"]),
  clientStrategist: z.string().optional(),
  specialContext: z.string().optional(),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const projectTypeLabel = (type: string) => {
  if (type === "web") return "Website";
  if (type === "tiered") return "Tiered Marketing";
  if (type === "ala-carte") return "A La Carte Marketing";
  if (type === "marketing") return "A La Carte Marketing";
  return "Website";
};

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
      clientStrategist: "",
      specialContext: "",
      content: "",
    },
  });

  const createProposal = useCreateProposal();
  const generateContent = useGenerateProposalContent();

  const watched = form.watch();

  const handleGenerate = async () => {
    const values = form.getValues();
    try {
      const res = await generateContent.mutateAsync({
        data: {
          clientName: values.clientName,
          businessName: values.businessName,
          projectType: values.projectType,
          specialContext: values.specialContext,
        },
      });
      form.setValue("content", res.content);
      toast({ title: "Generated", description: "AI intro content ready." });
    } catch {
      toast({ title: "Failed", description: "Could not generate content.", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const proposal = await createProposal.mutateAsync({
        data: {
          ...values,
          clientStrategist: values.clientStrategist || null,
          specialContext: values.specialContext || null,
          content: values.content || null,
        },
      });
      toast({ title: "Draft Saved", description: "Proposal draft created successfully." });
      setLocation(`/admin/proposals/${proposal.id}/edit`);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save draft.", variant: "destructive" });
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">New Proposal</h1>
          <p className="text-muted-foreground font-mono text-sm">CREATE PROPOSAL DRAFT</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Form */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="web">Website</SelectItem>
                          <SelectItem value="tiered">Tiered Marketing</SelectItem>
                          <SelectItem value="ala-carte">A La Carte Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientStrategist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Strategist</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Assign a strategist..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">— Unassigned —</SelectItem>
                          {STRATEGISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={form.control}
                  name="specialContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Context</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Key details, deliverables, or notes about this project..."
                          className="min-h-[80px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2 border-t border-border/50">
                  <Button type="submit" className="w-full" disabled={createProposal.isPending}>
                    {createProposal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Draft
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Right: Preview + Content Editor */}
        <div className="space-y-4">
          {/* Cover preview */}
          <div
            className="rounded-xl overflow-hidden shadow-xl"
            style={{ background: "linear-gradient(135deg, #0b2c6e 0%, #1a4fa3 50%, #0f3580 100%)" }}
          >
            <div className="px-8 py-10 text-center text-white">
              <img
                src="/mcwilliams-logo.png"
                alt="McWilliams Media"
                className="h-12 mx-auto mb-6 brightness-0 invert opacity-90"
              />
              <h2 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight">
                {projectTypeLabel(watched.projectType || "web")} Proposal
              </h2>
              <p className="text-lg font-semibold mb-1 opacity-95">
                Prepared for {watched.clientName || "[Client Name]"}
              </p>
              <p className="text-base mb-1 opacity-80">
                {watched.businessName || "[Business Name]"}
              </p>
              <p className="text-sm italic opacity-60 mb-1">{dateStr}, {today.getFullYear()}</p>

              <p className="text-sm italic opacity-50">This quote is valid for 30 days</p>
            </div>
          </div>

          {/* Content editor */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Custom Intro Text</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">This text appears on page 2 of the proposal. Leave blank to use the default McWilliams Media introduction.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generateContent.isPending}
                    className="w-full"
                  >
                    {generateContent.isPending
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Sparkles className="w-4 h-4 mr-2" />}
                    AI Generate Custom Intro
                  </Button>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Write a personalized introduction for this client, or click AI Generate above..."
                            className="min-h-[200px] resize-y text-sm leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
