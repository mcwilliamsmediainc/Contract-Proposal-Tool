import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAdminProposal, useUpdateProposal, useDeleteProposal, getGetAdminProposalQueryKey, getListProposalsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, ArrowLeft, X, Users, FileText,
  DollarSign, Layout, ExternalLink, Plus, Trash2, Link2, ClipboardCheck, GripVertical, Download
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { FullProposalTemplate, PricingLineItem } from "@/components/proposal/proposal-template";
import { TieredMarketingTemplate } from "@/components/proposal/tiered-marketing-template";
import { AlaCarteMarketingTemplate } from "@/components/proposal/ala-carte-marketing-template";
import { AiReviewDrawer } from "@/components/ai-review-drawer";
import { cn } from "@/lib/utils";
import { clientUrl } from "@/lib/client-url";

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

const formSchema = z.object({
  clientName: z.string().min(1),
  businessName: z.string().min(1),
  clientEmail: z.string().email(),
  projectType: z.enum(["web", "tiered", "ala-carte", "marketing", "print", "project"]),
  clientStrategist: z.string().optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  numberOfPages: z.coerce.number().int().min(1).optional(),
  pageNames: z.string().optional(),
  pricingItems: z.string().optional(),
  specialContext: z.string().optional(),
  content: z.string().optional(),
  loomVideoUrl: z.string().optional(),
  calendlyUrl: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

type Panel = "client" | "content" | "pricing" | "settings" | null;

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

  const { data: proposal, isLoading } = useGetAdminProposal(id, {
    query: { enabled: !!id, queryKey: getGetAdminProposalQueryKey(id) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "", businessName: "", clientEmail: "",
      projectType: "web", clientStrategist: "",
      totalAmount: undefined, numberOfPages: undefined, pageNames: "",
      pricingItems: undefined,
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
        projectType: proposal.projectType as "web" | "marketing" | "print" | "tiered" | "ala-carte",
        clientStrategist: proposal.clientStrategist || "",
        totalAmount: Number(proposal.totalAmount) || undefined,
        numberOfPages: proposal.numberOfPages ?? undefined,
        pageNames: proposal.pageNames || "",
        pricingItems: proposal.pricingItems || undefined,
        specialContext: proposal.specialContext || "",
        content: proposal.content || "",
        loomVideoUrl: proposal.loomVideoUrl || "",
        calendlyUrl: proposal.calendlyUrl || "",
        notes: proposal.notes || "",
      });
    }
  }, [proposal, id, form]);

  const updateProposal = useUpdateProposal();
  const deleteProposal = useDeleteProposal();

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

  const doSave = async () => {
    setSaving(true);
    try {
      const values = form.getValues();
      // If totalAmount override is blank, compute from pricingItems line items
      let effectiveTotal = values.totalAmount ?? 0;
      if (!effectiveTotal && values.pricingItems) {
        try {
          const items = JSON.parse(values.pricingItems) as { price: number }[];
          effectiveTotal = items.reduce((s, r) => s + Number(r.price), 0);
        } catch { /* keep 0 */ }
      }
      const data = await updateProposal.mutateAsync({
        id,
        data: { ...values, totalAmount: effectiveTotal }
      });
      queryClient.setQueryData(getGetAdminProposalQueryKey(id), data);
      toast({ title: "Saved", description: "Changes saved to draft." });
      return true;
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const savePanel = async () => {
    const ok = await doSave();
    if (ok) setActivePanel(null);
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = clientUrl(`/proposal/${id}`);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({ title: "Link copied!", description: "Paste it into your email to share with the client." });
      setTimeout(() => setLinkCopied(false), 2500);
      if (!isSent) {
        const data = await updateProposal.mutateAsync({ id, data: { status: "sent" } });
        queryClient.setQueryData(getGetAdminProposalQueryKey(id), data);
      }
    } catch {
      toast({ title: "Error", description: "Could not copy link.", variant: "destructive" });
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
  const isTiered = watched.projectType === "tiered";
  const isAlaCarte = watched.projectType === "ala-carte";
  const isProject = watched.projectType === "project";
  const toolbarButtons: { panel: Panel; label: string; icon: React.ElementType }[] = [
    { panel: "client", label: "Client Info", icon: Users },
    { panel: "content", label: "Intro Text", icon: FileText },
    { panel: "pricing", label: "Pricing", icon: DollarSign },
    { panel: "settings", label: "Settings", icon: ExternalLink },
  ];

  return (
    <div className="relative">
      {/* Sticky amber draft toolbar */}
      <div className="no-print sticky top-0 z-30 bg-amber-500 shadow-md">
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
            <button
              onClick={doSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-green-700 hover:bg-green-800 text-white transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
              Save
            </button>
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
              onClick={handleCopyLink}
              disabled={proposal.status === "accepted"}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                linkCopied
                  ? "bg-green-600 text-white"
                  : proposal.status === "accepted"
                  ? "bg-green-600 text-white cursor-default"
                  : "bg-white text-amber-900 hover:bg-amber-50 shadow-sm"
              )}
            >
              {linkCopied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {proposal.status === "accepted" ? "Accepted" : linkCopied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-amber-400 hover:bg-amber-600 text-amber-900 hover:text-white transition-all"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-violet-600 hover:bg-violet-700 text-white transition-all"
              title="AI Review"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Review
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

      {/* Accepted proposal — contract nudge or existing contract warning */}
      {proposal.status === "accepted" && (
        proposal.contractId ? (
          <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-amber-800">A contract already exists for this client.</span>
            </div>
            <Link
              href={`/admin/contracts/${proposal.contractId}`}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-colors whitespace-nowrap"
            >
              View Contract →
            </Link>
          </div>
        ) : (
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
        )
      )}

      {/* Full proposal preview */}
      {isTiered ? (
        <TieredMarketingTemplate
          data={{
            clientName: watched.clientName || proposal.clientName,
            businessName: watched.businessName || proposal.businessName,
            projectType: "tiered",
            content: watched.content,
            loomVideoUrl: watched.loomVideoUrl,
            createdAt: proposal.createdAt,
          }}
        />
      ) : isAlaCarte ? (
        <AlaCarteMarketingTemplate
          data={{
            clientName: watched.clientName || proposal.clientName,
            businessName: watched.businessName || proposal.businessName,
            projectType: "ala-carte",
            content: watched.content,
            loomVideoUrl: watched.loomVideoUrl,
            createdAt: proposal.createdAt,
          }}
          readOnly
        />
      ) : (
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
      )}

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
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="tiered">Tiered Marketing</SelectItem>
                    <SelectItem value="ala-carte">A La Carte Marketing</SelectItem>
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
            {isProject && (
              <FormField control={form.control} name="pageNames" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Details</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px] resize-y text-sm"
                      placeholder="Describe the scope of this project — what will be built, key deliverables, or any special requirements..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>
        </Form>
      </SlidePanel>


      {/* ── INTRO CONTENT PANEL ── */}
      <SlidePanel open={activePanel === "content"} onClose={() => setActivePanel(null)} title="Intro / Thank You Text" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">This text appears on page 2 of the proposal, after the cover. Leave blank to use the default McWilliams Media introduction.</p>
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
      <SlidePanel open={activePanel === "pricing"} onClose={() => setActivePanel(null)} title="Pricing" onSave={savePanel} saving={saving}>
        <Form {...form}>
          <div className="space-y-5">
            {isTiered ? (
              <>
                <p className="text-sm text-gray-600">Tiered marketing proposals use fixed monthly pricing. The client selects their preferred plan when accepting.</p>
                <div className="space-y-3">
                  {[
                    { name: "Pro Plan", price: "$1,500 / month" },
                    { name: "Plus Plan", price: "$2,500 / month" },
                    { name: "Platinum Plan", price: "$4,000 / month" },
                  ].map(({ name, price }) => (
                    <div key={name} className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <span className="font-semibold text-gray-800">{name}</span>
                      <span className="text-blue-700 font-bold">{price}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mb-4">+ $500 one-time setup fee applies to all plans</p>
                <FormField control={form.control} name="specialContext" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Notes / Amendments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any custom amendments, special terms, discounts, or notes about this pricing arrangement..."
                        className="h-28 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            ) : (
              <Controller
                control={form.control}
                name="pricingItems"
                render={({ field }) => {
                  const pages = watched.numberOfPages || 5;
                  const defaultRows: PricingLineItem[] = [
                    { desc: "Website Setup & Required Pages", rate: 110, qty: "10 Hours", price: 1100 },
                    { desc: "Revisions & Launch", rate: 350, qty: "1 Unit", price: 350 },
                    { desc: "Google Analytics & Search Console Setup", rate: 110, qty: "1 Unit", price: 110 },
                    { desc: `Web Pages (${pages})`, rate: 450, qty: `${pages} Pages`, price: 450 * pages },
                    { desc: "Website Theme", rate: 75, qty: "1 Unit", price: 75 },
                    { desc: "Timeline Deposit (eligible for refund)", rate: 500, qty: "1 Unit", price: 500 },
                  ];

                  let rows: PricingLineItem[];
                  try {
                    const parsed = field.value ? JSON.parse(field.value) as PricingLineItem[] : null;
                    rows = parsed && parsed.length > 0 ? parsed : defaultRows;
                  } catch {
                    rows = defaultRows;
                  }

                  const setRows = (updated: PricingLineItem[]) => {
                    field.onChange(JSON.stringify(updated));
                  };

                  const updateRow = (i: number, key: keyof PricingLineItem, val: string | number) => {
                    const updated = rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
                    setRows(updated);
                  };

                  const addRow = () => {
                    setRows([...rows, { desc: "New Line Item", rate: 0, qty: "1 Unit", price: 0 }]);
                  };

                  const removeRow = (i: number) => {
                    setRows(rows.filter((_, idx) => idx !== i));
                  };

                  const resetToDefaults = () => {
                    field.onChange(undefined);
                  };

                  const lineTotal = rows.reduce((s, r) => s + Number(r.price), 0);

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Line Items</p>
                        <button
                          type="button"
                          onClick={resetToDefaults}
                          className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2"
                        >
                          Reset to defaults
                        </button>
                      </div>

                      <div className="space-y-2">
                        {rows.map((row, i) => (
                          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              <input
                                className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-medium text-gray-800 outline-none focus:ring-1 focus:ring-blue-400"
                                value={row.desc}
                                onChange={e => updateRow(i, "desc", e.target.value)}
                                placeholder="Description"
                              />
                              <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex gap-2 pl-6">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate ($)</label>
                                <input
                                  type="number"
                                  className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-400"
                                  value={row.rate}
                                  onChange={e => updateRow(i, "rate", Number(e.target.value))}
                                  min={0}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</label>
                                <input
                                  className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-400"
                                  value={row.qty}
                                  onChange={e => updateRow(i, "qty", e.target.value)}
                                  placeholder="e.g. 1 Unit"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price ($)</label>
                                <input
                                  type="number"
                                  className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-blue-400"
                                  value={row.price}
                                  onChange={e => updateRow(i, "price", Number(e.target.value))}
                                  min={0}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addRow}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Line Item
                      </button>

                      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">Line Item Total</span>
                        <span className="text-base font-bold text-blue-700">${lineTotal.toLocaleString()}</span>
                      </div>

                      <div className="pt-1">
                        <FormField control={form.control} name="totalAmount" render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Override Total ($) <span className="text-gray-400 font-normal text-xs">— leave blank to use line item total</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                <Input
                                  type="number" min={0} step={0.01} placeholder={String(lineTotal)}
                                  className="pl-7 text-lg font-semibold"
                                  value={f.value ?? ""}
                                  onChange={e => f.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  );
                }}
              />
            )}
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
                <a href={clientUrl(`/proposal/${id}`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink className="w-4 h-4" /> {clientUrl(`/proposal/${id}`)}
                </a>
              </div>
            </div>
          </div>
        </Form>
      </SlidePanel>

      <AiReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        reviewType="proposal"
        storageKey={`proposal:${id}`}
        data={{
          clientName: watched.clientName || proposal.clientName,
          businessName: watched.businessName || proposal.businessName,
          projectType: watched.projectType || proposal.projectType,
          totalAmount: watched.totalAmount ?? proposal.totalAmount,
          pricingItems: watched.pricingItems ?? proposal.pricingItems,
          content: watched.content || proposal.content,
          specialContext: watched.specialContext || proposal.specialContext,
          numberOfPages: watched.numberOfPages || proposal.numberOfPages,
          pageNames: watched.pageNames || proposal.pageNames,
          status: proposal.status,
          selectedTier: proposal.selectedTier,
          clientStrategist: watched.clientStrategist || proposal.clientStrategist,
        }}
      />
    </div>
  );
}
