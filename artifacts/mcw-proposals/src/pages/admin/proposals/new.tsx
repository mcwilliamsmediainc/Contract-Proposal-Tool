import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProposal } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  businessName: z.string().min(2, "Business name is required"),
  clientEmail: z.string().email("Invalid email address"),
  projectType: z.enum(["web", "tiered", "ala-carte"]),
  clientStrategist: z.string().optional(),
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
    },
  });

  const createProposal = useCreateProposal();

  const onSubmit = async (values: FormValues) => {
    try {
      const proposal = await createProposal.mutateAsync({
        data: {
          ...values,
          clientStrategist: values.clientStrategist || null,
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

      <div className="max-w-xl">
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
      </div>
    </AdminLayout>
  );
}
