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
import { Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  projectType: z.enum(["web", "tiered", "ala-carte", "project"]),
  clientStrategist: z.string().optional(),
  numberOfPages: z.coerce.number().int().min(1).optional(),
  pageNames: z.string().optional(),
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
      clientStrategist: "",
      numberOfPages: undefined,
      pageNames: "",
      specialContext: "",
      content: "",
    },
  });

  const createProposal = useCreateProposal();
  const generateContent = useGenerateProposalContent();

  const watched = form.watch();
  const isWebsite = watched.projectType === "web";
  const isProject = watched.projectType === "project";

  const handleGenerate = async () => {
    const values = form.getValues();
    try {
      const res = await generateContent.mutateAsync({
        data: {
          clientName: values.clientName,
          businessName: values.businessName,
          projectType: values.projectType,
          specialContext: values.specialContext || undefined,
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
          numberOfPages: values.numberOfPages ?? null,
          pageNames: values.pageNames || null,
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

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">New Proposal</h1>
          <p className="text-muted-foreground font-mono text-sm">CREATE PROPOSAL DRAFT</p>
        </div>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Client Details */}
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
                          <SelectItem value="project">Project</SelectItem>
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

                {/* Website-only fields */}
                {isWebsite && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="numberOfPages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Pages</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="e.g. 5"
                                value={field.value ?? ""}
                                onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <p className="text-xs text-muted-foreground pb-2">Total number of web pages in the project.</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="pageNames"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Names</FormLabel>
                          <FormControl>
                            <Input placeholder="Home | About | Services | Contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Project-only fields */}
                {isProject && (
                  <FormField
                    control={form.control}
                    name="pageNames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the scope of this project — what will be built, key deliverables, or any special requirements..."
                            className="min-h-[100px] resize-y text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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

        {/* AI Custom Intro */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">The Problem / Their Situation</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">The highest-converting section most agencies skip. Describe what the client told you about their situation — the AI will mirror it back in 2–3 sentences that make them feel truly heard.</p>
                <FormField
                  control={form.control}
                  name="specialContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client's Situation / Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. They've been struggling with low website traffic. Their current site is outdated and doesn't reflect the quality of their work. They've tried running Google Ads before but didn't see results..."
                          className="min-h-[100px] resize-y text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Intro</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="AI-generated intro will appear here. You can also write or edit it manually."
                          className="min-h-[120px] resize-y text-sm leading-relaxed"
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
    </AdminLayout>
  );
}
