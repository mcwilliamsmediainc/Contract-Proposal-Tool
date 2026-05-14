import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProposal, useGenerateProposalContent, lookupLead, type LeadLookupResult } from "@workspace/api-client-react";
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
import { useState } from "react";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams", "Ashlea Mortenson"];

const auditScoresSchema = z.object({
  ux: z.coerce.number().int().min(0).max(100),
  seo: z.coerce.number().int().min(0).max(100),
  social: z.coerce.number().int().min(0).max(100),
  aiVisibility: z.coerce.number().int().min(0).max(100),
});

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
  city: z.string().optional(),
  industry: z.string().optional(),
  budgetRange: z.enum(["lean", "mid", "high"]).optional(),
  statedGoal: z.enum(["traffic", "leads", "brand", "all"]).optional(),
  auditScores: auditScoresSchema.partial().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PaigeOutput = {
  personalNote: string;
  whatWeFound: string;
  recommendedTier: "pro" | "plus" | "platinum";
  recommendedPrice: number;
  tierRationale: string;
  testimonialName: string;
  testimonialBusiness: string;
  testimonialQuote: string;
  nextSteps: string;
  includeWebsite: boolean;
  websiteRationale: string | null;
};

export default function NewProposal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Pre-fill from audit lead (passed as URL query params from /admin/lead-capture)
  const params = new URLSearchParams(window.location.search);
  const prefillEmail = params.get("clientEmail") ?? "";
  const prefillName = params.get("clientName") ?? "";
  const prefillCity = params.get("city") ?? "";
  const prefillUrl = params.get("url") ?? "";
  const prefillContext = [
    prefillUrl && `Website: ${prefillUrl}`,
    prefillCity && `City: ${prefillCity}`,
  ].filter(Boolean).join("\n") || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: prefillName,
      businessName: prefillName,
      clientEmail: prefillEmail,
      projectType: "tiered",
      clientStrategist: "",
      numberOfPages: undefined,
      pageNames: "",
      specialContext: prefillContext,
      content: "",
      city: prefillCity,
      industry: "",
      budgetRange: undefined,
      statedGoal: undefined,
      auditScores: { ux: undefined, seo: undefined, social: undefined, aiVisibility: undefined },
      notes: "",
    },
  });

  const createProposal = useCreateProposal();
  const generateContent = useGenerateProposalContent();
  const [paige, setPaige] = useState<PaigeOutput | null>(null);

  // Lead Lookup state
  const [leadQuery, setLeadQuery] = useState("");
  const [loadedLead, setLoadedLead] = useState<{ id: string; businessName: string } | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);

  const handleLoadLead = async () => {
    const q = leadQuery.trim();
    if (!q) return;
    setLeadError(null);
    setLeadLoading(true);
    try {
      const lead: LeadLookupResult = await lookupLead({ q });

      form.setValue("clientName", lead.contactName ?? lead.businessName);
      form.setValue("businessName", lead.businessName);
      form.setValue("clientEmail", lead.email ?? "");
      form.setValue("city", lead.city ?? "");
      if (lead.budgetRange) form.setValue("budgetRange", lead.budgetRange);
      if (lead.goal && (["traffic", "leads", "brand", "all"] as const).includes(lead.goal as "traffic" | "leads" | "brand" | "all")) {
        form.setValue("statedGoal", lead.goal as "traffic" | "leads" | "brand" | "all");
      }
      if (lead.auditScores) {
        form.setValue("auditScores", {
          ux: lead.auditScores.ux ?? undefined,
          seo: lead.auditScores.seo ?? undefined,
          social: lead.auditScores.social ?? undefined,
          aiVisibility: lead.auditScores.aiVisibility ?? undefined,
        });
      }

      setLoadedLead({ id: lead.id, businessName: lead.businessName });
      toast({ title: "Lead loaded", description: lead.businessName });
    } catch {
      setLeadError("No lead found for that email or UUID.");
      setLoadedLead(null);
    } finally {
      setLeadLoading(false);
    }
  };

  const watched = form.watch();
  const isWebsite = watched.projectType === "web";
  const isProject = watched.projectType === "project";

  const handleGenerate = async () => {
    const values = form.getValues();
    const scores = values.auditScores;
    const hasAllScores =
      scores &&
      typeof scores.ux === "number" &&
      typeof scores.seo === "number" &&
      typeof scores.social === "number" &&
      typeof scores.aiVisibility === "number";

    try {
      const res = await generateContent.mutateAsync({
        data: {
          clientName: values.clientName,
          businessName: values.businessName,
          projectType: values.projectType,
          leadId: loadedLead?.id,
          specialContext: values.specialContext || undefined,
          city: values.city || undefined,
          industry: values.industry || undefined,
          budgetRange: values.budgetRange,
          statedGoal: values.statedGoal,
          auditScores: hasAllScores
            ? {
                ux: scores!.ux as number,
                seo: scores!.seo as number,
                social: scores!.social as number,
                aiVisibility: scores!.aiVisibility as number,
              }
            : undefined,
          notes: values.notes || undefined,
        },
      });
      form.setValue("content", res.content);
      if (res.paigeContent) {
        setPaige(res.paigeContent as PaigeOutput);
      }
      toast({ title: "Generated", description: "Paige drafted the proposal." });
    } catch {
      toast({ title: "Failed", description: "Could not generate content.", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const proposal = await createProposal.mutateAsync({
        data: {
          clientName: values.clientName,
          businessName: values.businessName,
          clientEmail: values.clientEmail,
          projectType: values.projectType,
          clientStrategist: values.clientStrategist || null,
          numberOfPages: values.numberOfPages ?? null,
          pageNames: values.pageNames || null,
          specialContext: values.specialContext || null,
          content: values.content || null,
          paigeContent: paige ?? null,
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

      <div className="max-w-2xl space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Lead Lookup — auto-populates the form from a leads table row */}
            <Card style={{ borderColor: "#d8bfa7" }} className="bg-card/50 backdrop-blur border">
              <CardHeader>
                <CardTitle
                  className="font-mono text-sm uppercase tracking-wider"
                  style={{ color: "#7c370c" }}
                >
                  Load Lead (optional)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste a lead's email or UUID to auto-populate the form from the leads table.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com or lead UUID"
                    value={leadQuery}
                    onChange={(e) => setLeadQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLoadLead(); } }}
                    disabled={leadLoading}
                  />
                  <Button
                    type="button"
                    onClick={handleLoadLead}
                    disabled={!leadQuery.trim() || leadLoading}
                    style={{ backgroundColor: "#061e57", color: "#f5f0eb" }}
                  >
                    {leadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load Lead"}
                  </Button>
                </div>
                {loadedLead && (
                  <div
                    className="text-xs px-3 py-2 rounded-md flex items-center gap-2"
                    style={{ backgroundColor: "#b3cee1", color: "#061e57" }}
                  >
                    <span>✓</span>
                    Lead loaded — <strong>{loadedLead.businessName}</strong>
                  </div>
                )}
                {leadError && (
                  <div className="text-xs px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200">
                    {leadError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
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
              </CardContent>
            </Card>

            {/* Paige Context — feed her the audit + budget + goal so the proposal is genuinely custom */}
            <Card style={{ borderColor: "#b3cee1" }} className="bg-card/50 backdrop-blur border">
              <CardHeader>
                <CardTitle
                  className="font-mono text-sm uppercase tracking-wider"
                  style={{ color: "#061e57" }}
                >
                  Paige Context
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  More context = a more custom proposal. Audit scores drive Paige's tier recommendation.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="Tulsa, Oklahoma" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl><Input placeholder="Carpet cleaning, dental, etc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="budgetRange" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Range</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select budget..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="lean">Lean</SelectItem>
                          <SelectItem value="mid">Mid</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="statedGoal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stated Goal</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select goal..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="traffic">More Traffic</SelectItem>
                          <SelectItem value="leads">More Leads</SelectItem>
                          <SelectItem value="brand">Better Brand</SelectItem>
                          <SelectItem value="all">All of the Above</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div>
                  <FormLabel className="text-sm">Audit Scores (0-100)</FormLabel>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {(["ux", "seo", "social", "aiVisibility"] as const).map((key) => (
                      <FormField key={key} control={form.control} name={`auditScores.${key}` as const} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                            {key === "aiVisibility" ? "AI Vis." : key.toUpperCase()}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="0-100"
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ))}
                  </div>
                </div>

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Anything else Paige should know — sales conversation context, differentiators, competitors..."
                        className="min-h-[80px] resize-y text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generateContent.isPending || !watched.clientName || !watched.businessName}
                  className="w-full"
                  style={{ backgroundColor: "#061e57", color: "#f5f0eb" }}
                >
                  {generateContent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate with Paige
                </Button>

                {paige && (
                  <div
                    className="p-4 rounded-md text-sm space-y-3"
                    style={{ backgroundColor: "#f5f0eb", border: "1px solid #d8bfa7" }}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wider font-mono" style={{ color: "#7c370c" }}>
                        Recommended Tier
                      </p>
                      <p className="font-bold text-base" style={{ color: "#061e57" }}>
                        {paige.recommendedTier.toUpperCase()} — ${paige.recommendedPrice}/mo
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{paige.tierRationale}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-mono" style={{ color: "#7c370c" }}>What We Found</p>
                      <p className="text-slate-700">{paige.whatWeFound}</p>
                    </div>
                    {paige.includeWebsite && (
                      <div>
                        <p className="text-xs uppercase tracking-wider font-mono" style={{ color: "#7c370c" }}>Website Recommendation</p>
                        <p className="text-slate-700">{paige.websiteRationale}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>


            <div className="pb-8">
              <Button
                type="submit"
                className="w-full"
                disabled={createProposal.isPending}
              >
                {createProposal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Draft
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
