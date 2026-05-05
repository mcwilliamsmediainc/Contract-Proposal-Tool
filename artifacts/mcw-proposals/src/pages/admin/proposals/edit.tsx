import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetProposal, useUpdateProposal, useDeleteProposal, useGenerateProposalContent, getGetProposalQueryKey, getListProposalsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, Send, ArrowLeft, X, Users, FileText,
  DollarSign, Layout, ExternalLink, Plus, Trash2, StickyNote
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { FullProposalTemplate } from "@/components/proposal/proposal-template";
import { cn } from "@/lib/utils";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

const formSchema = z.object({
  clientName: z.string().min(1),
  businessName: z.string().min(1),
  clientEmail: z.string().email(),
  projectType: z.enum(["web", "marketing", "print"]),
  clientStrategist: z.string().optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  numberOfPages: z.coerce.number().int().min(1).optional(),
  pageNames: z.string().optional(),
  specialContext: z.string().optional(),
  content: z.string().optional(),
  loomVideoUrl: z.string().optional(),
  calendlyUrl: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

type Panel = "client" | "pages" | "content" | "pricing" | "settings" | "notes" | null;

function SlidePanel({ open, onClose, title, children, onSave, saving }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; onSave: () => void; saving?: boolean;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0">
          <Button onClick={onSave} disabled={saving} className="flex-1 bg-[#0a1f5c] hover:bg-[#0d3494]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}

function PageChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pages = value ? value.split("|").map(p => p.trim()).filter(Boolean) : [];
  const [newPage, setNewPage] = useState("");

  const addPage = () => {
    const trimmed = newPage.trim();
    if (!trimmed) return;
    const updated = [...pages, trimmed];
    onChange(updated.join(" | "));
    setNewPage("");
  };

  const removePage = (i: number) => {
    const updated = pages.filter((_, idx) => idx !== i);
    onChange(updated.join(" | "));
  };

  const renamePage = (i: number, newName: string) => {
    const updated = pages.map((p, idx) => idx === i ? newName : p);
    onChange(updated.join(" | "));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {pages.map((page, i) => (
          <div key={i} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 group">
            <input
              className="bg-transparent text-sm text-blue-800 font-medium w-auto min-w-[60px] outline-none"
              value={page}
              style={{ width: `${Math.max(page.length, 5)}ch` }}
              onChange={e => renamePage(i, e.target.value)}
            />
            <button onClick={() => removePage(i)} className="text-blue-400 hover:text-red-500 transition-colors ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add a page name..."
          value={newPage}
          onChange={e => setNewPage(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPage(); } }}
          className="text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={addPage} disabled={!newPage.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-400">Click a page name to rename it. Press Enter or + to add.</p>
    </div>
  );
}

export default function EditProposal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);

  const { data: proposal, isLoading } = useGetProposal(id, {
    query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "", businessName: "", clientEmail: "",
      projectType: "web", clientStrategist: "",
      totalAmount: undefined, numberOfPages: undefined, pageNames: "",
      specialContext: "", content: "", loomVideoUrl: "", calendlyUrl: "",
    },
  });

  const initializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (proposal && initializedRef.current !== id) {
      initializedRef.current = id;
      form.reset({
        clientName: proposal.clientName,
        businessName: proposal.businessName,
        clientEmail: proposal.clientEmail,
        projectType: proposal.projectType as "web" | "marketing" | "print",
        clientStrategist: proposal.clientStrategist || "",
        totalAmount: Number(proposal.totalAmount) || undefined,
        numberOfPages: proposal.numberOfPages ?? undefined,
        pageNames: proposal.pageNames || "",
        specialContext: proposal.specialContext || "",
        content: proposal.content || "",
        loomVideoUrl: proposal.loomVideoUrl || "",
        calendlyUrl: proposal.calendlyUrl || "",
        notes: "",
      });
      // Notes are internal-only and not included in the public proposal endpoint.
      // Fetch them separately from the admin-only /notes endpoint.
      fetch(`/api/proposals/${id}/notes`)
        .then(r => r.ok ? r.json() : { notes: null })
        .then(({ notes }: { notes: string | null }) => {
          form.setValue("notes", notes || "");
        })
        .catch(() => {/* non-critical — form starts empty */});
    }
  }, [proposal, id, form]);

  const updateProposal = useUpdateProposal();
  const deleteProposal = useDeleteProposal();
  const generateContent = useGenerateProposalContent();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteProposal.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
      toast({ title: "Deleted", description: "Proposal removed." });
      window.location.href = "/admin";
    } catch {
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  };

  const savePanel = async () => {
    setSaving(true);
    try {
      const values = form.getValues();
      const data = await updateProposal.mutateAsync({
        id,
        data: { ...values, totalAmount: values.totalAmount ?? 0 }
      });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      toast({ title: "Saved", description: "Changes saved to draft." });
      setActivePanel(null);
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    try {
      const data = await updateProposal.mutateAsync({ id, data: { status: "sent" } });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      toast({ title: "Sent!", description: "Proposal is now visible to the client." });
    } catch {
      toast({ title: "Error", description: "Failed to send.", variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    const values = form.getValues();
    try {
      const res = await generateContent.mutateAsync({
        data: {
          clientName: values.clientName,
          businessName: values.businessName,
          projectType: values.projectType,
          specialContext: values.specialContext,
        }
      });
      form.setValue("content", res.content);
      toast({ title: "Generated", description: "AI intro content ready." });
    } catch {
      toast({ title: "Failed", description: "Could not generate content.", variant: "destructive" });
    }
  };

  const watched = form.watch();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
  if (!proposal) return <div className="p-8">Proposal not found.</div>;

  const isSent = proposal.status === "sent" || proposal.status === "accepted";
  const toolbarButtons: { panel: Panel; label: string; icon: React.ElementType }[] = [
    { panel: "client", label: "Client Info", icon: Users },
    { panel: "pages", label: "Edit Pages", icon: Layout },
    { panel: "content", label: "Intro Text", icon: FileText },
    { panel: "pricing", label: "Investment", icon: DollarSign },
    { panel: "settings", label: "Settings", icon: ExternalLink },
    { panel: "notes", label: "Notes", icon: StickyNote },
  ];

  return (
    <div className="relative">
      {/* Sticky amber draft toolbar */}
      <div className="sticky top-0 z-30 bg-amber-500 shadow-md">
        <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
          <Link href="/admin" className="flex items-center gap-1.5 text-amber-900 hover:text-amber-950 font-semibold text-sm transition-colors mr-2 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Exit
          </Link>

          <div className="hidden md:flex items-center gap-1.5 text-amber-900 mr-3 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-amber-900/60 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isSent ? "SENT · VISIBLE TO CLIENT" : "DRAFT · NOT VISIBLE TO CLIENT"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {toolbarButtons.map(({ panel, label, icon: Icon }) => (
              <button
                key={panel}
                onClick={() => setActivePanel(activePanel === panel ? null : panel)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                  activePanel === panel
                    ? "bg-amber-900 text-amber-100"
                    : "bg-amber-400 hover:bg-amber-600 text-amber-900 hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={`/proposal/${id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-amber-400 hover:bg-amber-600 text-amber-900 hover:text-white transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Client View
            </a>
            <button
              onClick={handleSend}
              disabled={isSent}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                isSent
                  ? "bg-green-600 text-white cursor-default"
                  : "bg-white text-amber-900 hover:bg-amber-50 shadow-sm"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              {isSent ? (proposal.status === "accepted" ? "Accepted" : "Sent") : "Go Live"}
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-amber-950 font-bold">Delete?</span>
                <button onClick={handleDelete} className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-700">YES</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded text-xs font-bold bg-amber-800 text-amber-100 hover:bg-amber-900">NO</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-amber-900/60 hover:text-red-700 hover:bg-amber-400 transition-all"
                title="Delete proposal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accepted proposal — convert to contract nudge */}
      {proposal.status === "accepted" && (
        <div className="flex items-center justify-between px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-green-800">This proposal was accepted — ready to create a contract?</span>
          </div>
          <Link
            href={`/admin/contracts/new?proposalId=${id}&clientName=${encodeURIComponent(proposal.clientName)}&businessName=${encodeURIComponent(proposal.businessName)}&clientEmail=${encodeURIComponent(proposal.clientEmail)}&totalCost=${encodeURIComponent(Number(proposal.totalAmount))}`}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-colors whitespace-nowrap"
          >
            Create Contract →
          </Link>
        </div>
      )}

      {/* Full proposal preview */}
      <FullProposalTemplate
        data={{
          clientName: watched.clientName || proposal.clientName,
          businessName: watched.businessName || proposal.businessName,
          projectType: watched.projectType || proposal.projectType,
          numberOfPages: watched.numberOfPages,
          pageNames: watched.pageNames,
          totalAmount: watched.totalAmount,
          content: watched.content,
          loomVideoUrl: watched.loomVideoUrl,
          createdAt: proposal.createdAt,
        }}
      />

      {/* ── CLIENT INFO PANEL ── */}
      <SlidePanel open={activePanel === "client"} onClose={() => setActivePanel(null)} title="Client Information" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
            <FormField control={form.control} name="clientStrategist" render={({ field }) => (
              <FormItem>
                <FormLabel>Client Strategist</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Assign a strategist..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">— Unassigned —</SelectItem>
                    {STRATEGISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
        </Form>
      </SlidePanel>

      {/* ── PAGES PANEL ── */}
      <SlidePanel open={activePanel === "pages"} onClose={() => setActivePanel(null)} title="Web Pages" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-6">
            <FormField control={form.control} name="numberOfPages" render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Pages</FormLabel>
                <FormControl>
                  <Input
                    type="number" min={1} placeholder="e.g. 5"
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <p className="text-xs text-gray-500">This drives the page count and pricing in the proposal.</p>
              </FormItem>
            )} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Page Names</label>
              <Controller control={form.control} name="pageNames" render={({ field }) => (
                <PageChips value={field.value || ""} onChange={field.onChange} />
              )} />
            </div>
          </div>
        </Form>
      </SlidePanel>

      {/* ── INTRO CONTENT PANEL ── */}
      <SlidePanel open={activePanel === "content"} onClose={() => setActivePanel(null)} title="Intro / Thank You Text" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">This text appears on page 2 of the proposal, after the cover. Leave blank to use the default McWilliams Media introduction.</p>
            <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={generateContent.isPending} className="w-full">
              {generateContent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              AI Generate Custom Intro
            </Button>
            <Controller control={form.control} name="content" render={({ field }) => (
              <Textarea
                className="min-h-[280px] resize-y text-sm leading-relaxed"
                placeholder="Write a personalized introduction for this client..."
                {...field}
              />
            )} />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Notes (not shown to client)</label>
              <Controller control={form.control} name="specialContext" render={({ field }) => (
                <Textarea className="min-h-[80px] text-sm" placeholder="Notes for the team..." {...field} />
              )} />
            </div>
          </div>
        </Form>
      </SlidePanel>

      {/* ── PRICING PANEL ── */}
      <SlidePanel open={activePanel === "pricing"} onClose={() => setActivePanel(null)} title="Investment / Pricing" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-5">
            <p className="text-sm text-gray-600">Set the total investment amount. The pricing table calculates line items automatically based on page count, but the total shown to the client will be this value.</p>
            <FormField control={form.control} name="totalAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Total Investment ($)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <Input
                      type="number" min={0} step={0.01} placeholder="e.g. 5089"
                      className="pl-7 text-lg font-semibold"
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )} />
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Pricing Breakdown Preview</p>
              {[
                ["Website Setup & Required Pages", "$1,100"],
                ["Revisions & Launch", "$350"],
                ["Google Analytics Setup", "$110"],
                [`Web Pages (${watched.numberOfPages || 5})`, `$${((watched.numberOfPages || 5) * 450).toLocaleString()}`],
                ["Website Theme", "$75"],
                ["Timeline Deposit", "$500"],
              ].map(([label, price]) => (
                <div key={label} className="flex justify-between text-sm py-1 border-b border-blue-100 last:border-0">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-semibold text-gray-900">{price}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 font-bold">
                <span>Calculated Subtotal</span>
                <span className="text-blue-700">${(2135 + (watched.numberOfPages || 5) * 450).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Form>
      </SlidePanel>

      {/* ── SETTINGS PANEL ── */}
      <SlidePanel open={activePanel === "settings"} onClose={() => setActivePanel(null)} title="Settings & Links" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-4">
            <FormField control={form.control} name="loomVideoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Loom / YouTube Video URL</FormLabel>
                <FormControl><Input placeholder="https://loom.com/share/..." {...field} /></FormControl>
                <p className="text-xs text-gray-500">Adds a "Strategy Briefing" video section to the proposal.</p>
              </FormItem>
            )} />
            <FormField control={form.control} name="calendlyUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Calendly URL</FormLabel>
                <FormControl><Input placeholder="https://calendly.com/..." {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Proposal Links</p>
              <div className="space-y-2">
                <a href={`/proposal/${id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink className="w-4 h-4" /> Client-facing proposal URL
                </a>
              </div>
            </div>
          </div>
        </Form>
      </SlidePanel>

      {/* ── NOTES PANEL ── */}
      <SlidePanel
        open={activePanel === "notes"}
        onClose={() => setActivePanel(null)}
        title="Internal Notes"
        onSave={savePanel}
        saving={saving}
      >
        <Form {...form}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Internal strategist notes — never shown to the client. Auto-saves when you click away from the text area.
            </p>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Notes</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={14}
                      placeholder="Add notes about this client, their goals, objections, follow-up actions…"
                      className="w-full rounded-md border border-gray-200 bg-amber-50/40 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none transition-all"
                      onBlur={async () => {
                        if (!id) return;
                        try {
                          await updateProposal.mutateAsync({
                            id,
                            data: { notes: field.value },
                          });
                          queryClient.invalidateQueries({ queryKey: getGetProposalQueryKey(id) });
                          toast({ title: "Notes saved", duration: 1500 });
                        } catch {
                          toast({ title: "Error saving notes", variant: "destructive" });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </SlidePanel>
    </div>
  );
}
