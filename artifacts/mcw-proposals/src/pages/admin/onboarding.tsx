import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListOnboardingClients,
  useCreateOnboardingClient,
  useDeleteOnboardingClient,
  useListOnboardingTasks,
  useToggleOnboardingTask,
  useAddOnboardingTask,
  useDeleteOnboardingTask,
  getListOnboardingClientsQueryKey,
  getListOnboardingTasksQueryKey,
  type OnboardingTask,
  type OnboardingClient,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  CheckSquare,
  Globe,
  Printer,
  Megaphone,
  ChevronDown,
  ChevronRight,
  X,
  Link2,
  ClipboardCheck,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { AiReviewDrawer } from "@/components/ai-review-drawer";
import { format } from "date-fns";
import { useState, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: OnboardingTask;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2.5 group/task py-0.5"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-muted-foreground/30 hover:text-muted-foreground/70 cursor-grab active:cursor-grabbing transition-colors touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {task.completed
          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
          : <Circle className="w-4 h-4" />
        }
      </button>
      <span className={cn(
        "flex-1 text-sm transition-colors",
        task.completed ? "line-through text-muted-foreground/50" : "text-foreground"
      )}>
        {task.label}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover/task:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Service definitions ────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  website: "Website",
  print: "Print",
  marketing: "Marketing",
  "marketing.seo": "SEO",
  "marketing.google_ads": "Google Ads",
  "marketing.social_media_ads": "Social Media Ads",
  "marketing.social_media_posting": "Social Media Posting",
  "marketing.newsletter": "Newsletter",
};

const MARKETING_SUB: string[] = [
  "marketing.seo",
  "marketing.google_ads",
  "marketing.social_media_ads",
  "marketing.social_media_posting",
  "marketing.newsletter",
];

function serviceLabel(key: string) {
  return SERVICE_LABELS[key] ?? key;
}

function serviceColor(key: string) {
  if (key === "website") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (key === "print") return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  return "bg-violet-500/10 text-violet-600 border-violet-500/20";
}

// ── Service Picker ─────────────────────────────────────────────────────────────

function ServicePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  const [mktOpen, setMktOpen] = useState(false);

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const toggleMarketing = () => {
    const anySub = MARKETING_SUB.some((s) => selected.includes(s));
    const hasParent = selected.includes("marketing");
    if (anySub || hasParent) {
      onChange(selected.filter((s) => s !== "marketing" && !MARKETING_SUB.includes(s)));
    } else {
      setMktOpen(true);
    }
  };

  const isChecked = (key: string) => selected.includes(key);
  const marketingActive = selected.includes("marketing") || MARKETING_SUB.some((s) => selected.includes(s));

  return (
    <div className="space-y-2">
      {/* Website */}
      <button
        type="button"
        onClick={() => toggle("website")}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
          isChecked("website")
            ? "border-blue-500 bg-blue-500/8"
            : "border-border/50 bg-card/40 hover:border-blue-400/50"
        )}
      >
        <Globe className={cn("w-5 h-5", isChecked("website") ? "text-blue-500" : "text-muted-foreground")} />
        <span className="font-semibold text-sm">Website</span>
        <div className={cn(
          "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          isChecked("website") ? "bg-blue-500 border-blue-500" : "border-border"
        )}>
          {isChecked("website") && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </button>

      {/* Print */}
      <button
        type="button"
        onClick={() => toggle("print")}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
          isChecked("print")
            ? "border-amber-500 bg-amber-500/8"
            : "border-border/50 bg-card/40 hover:border-amber-400/50"
        )}
      >
        <Printer className={cn("w-5 h-5", isChecked("print") ? "text-amber-600" : "text-muted-foreground")} />
        <span className="font-semibold text-sm">Print</span>
        <div className={cn(
          "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          isChecked("print") ? "bg-amber-500 border-amber-500" : "border-border"
        )}>
          {isChecked("print") && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </button>

      {/* Marketing (expandable) */}
      <div className={cn(
        "rounded-xl border-2 transition-all overflow-hidden",
        marketingActive ? "border-violet-500 bg-violet-500/5" : "border-border/50 bg-card/40"
      )}>
        <button
          type="button"
          onClick={() => setMktOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          <Megaphone className={cn("w-5 h-5", marketingActive ? "text-violet-500" : "text-muted-foreground")} />
          <span className="font-semibold text-sm">Marketing</span>
          <span className="text-xs text-muted-foreground ml-1">
            {MARKETING_SUB.filter((s) => selected.includes(s)).length > 0
              ? `(${MARKETING_SUB.filter((s) => selected.includes(s)).length} selected)`
              : ""}
          </span>
          <div className="ml-auto">
            {mktOpen
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {mktOpen && (
          <div className="px-4 pb-3 space-y-1.5 border-t border-violet-500/20 pt-3">
            {MARKETING_SUB.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  if (isChecked(sub)) {
                    onChange(selected.filter((s) => s !== sub && s !== "marketing"));
                  } else {
                    onChange([...selected.filter((s) => s !== "marketing"), sub]);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all",
                  isChecked(sub)
                    ? "bg-violet-500/15 text-violet-700"
                    : "hover:bg-violet-500/8 text-foreground"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  isChecked(sub) ? "bg-violet-500 border-violet-500" : "border-border"
                )}>
                  {isChecked(sub) && <div className="w-1.5 h-1.5 rounded-sm bg-white" />}
                </div>
                {serviceLabel(sub)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Onboarding Dialog ──────────────────────────────────────────────────────

const STRATEGISTS = ["Elise Johnson", "Rachelle Hoover", "Tiffany King", "Matt McWilliams"];

function NewOnboardingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createClient = useCreateOnboardingClient();

  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientStrategist, setClientStrategist] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setClientName("");
    setBusinessName("");
    setClientEmail("");
    setClientStrategist("");
    setServices([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!clientName.trim() || !businessName.trim() || services.length === 0) {
      toast({ title: "Missing fields", description: "Name, business, and at least one service are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createClient.mutateAsync({
        data: {
          clientName: clientName.trim(),
          businessName: businessName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          clientStrategist: clientStrategist || undefined,
          services,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListOnboardingClientsQueryKey() });
      toast({ title: "Onboarding created", description: `${businessName} added to active onboardings.` });
      handleClose();
    } catch {
      toast({ title: "Error", description: "Could not create onboarding.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">New Onboarding Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Name *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jane Smith"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Name *</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Co."
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="jane@acme.com"
                type="email"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategist</Label>
              <select
                value={clientStrategist}
                onChange={(e) => setClientStrategist(e.target.value)}
                className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Unassigned</option>
                {STRATEGISTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Services *</Label>
            <ServicePicker selected={services} onChange={setServices} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} size="sm">Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={saving || !clientName.trim() || !businessName.trim() || services.length === 0}
            size="sm"
            className="bg-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Onboarding
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Onboarding Card ────────────────────────────────────────────────────────────

function ShareFormButton({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/intake/${clientId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Send this link to your client to complete their intake form." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/40">
      <button
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all",
          copied
            ? "border-green-500/40 bg-green-50 text-green-700"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
        )}
      >
        {copied ? (
          <><ClipboardCheck className="w-3 h-3" /> Copied!</>
        ) : (
          <><Link2 className="w-3 h-3" /> Share Intake Form</>
        )}
      </button>
    </div>
  );
}

function OnboardingCard({ client }: { client: OnboardingClient }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: tasks, isLoading: loadingTasks } = useListOnboardingTasks(client.id, {
    query: { queryKey: getListOnboardingTasksQueryKey(client.id) },
  });

  const toggleTask = useToggleOnboardingTask();
  const addTask = useAddOnboardingTask();
  const deleteTask = useDeleteOnboardingTask();
  const deleteClient = useDeleteOnboardingClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const orderedTasks: OnboardingTask[] = (() => {
    if (!tasks) return [];
    if (!localOrder) return tasks;
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    return localOrder.map(id => taskMap.get(id)).filter((t): t is OnboardingTask => t !== undefined);
  })();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = orderedTasks.map(t => t.id);
    const oldIndex = currentIds.indexOf(active.id as number);
    const newIndex = currentIds.indexOf(over.id as number);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);

    setLocalOrder(newOrder);

    try {
      await Promise.all(
        newOrder.map((id, idx) =>
          toggleTask.mutateAsync({ taskId: id, data: { sortOrder: idx } })
        )
      );
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(client.id) });
    } catch {
      setLocalOrder(null);
      toast({ title: "Error", description: "Could not save new task order.", variant: "destructive" });
    }
  };

  const handleToggle = async (taskId: number, completed: boolean) => {
    try {
      await toggleTask.mutateAsync({ taskId, data: { completed: !completed } });
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(client.id) });
    } catch {
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  };

  const handleAddTask = async () => {
    const label = newTaskLabel.trim();
    if (!label) return;
    setAdding(true);
    try {
      await addTask.mutateAsync({ id: client.id, data: { label } });
      setLocalOrder(null);
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(client.id) });
      setNewTaskLabel("");
    } catch {
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask.mutateAsync({ taskId });
      setLocalOrder(prev => prev ? prev.filter(id => id !== taskId) : null);
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(client.id) });
    } catch {
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm(`Remove ${client.businessName} from onboarding?`)) return;
    try {
      await deleteClient.mutateAsync({ id: client.id });
      queryClient.invalidateQueries({ queryKey: getListOnboardingClientsQueryKey() });
    } catch {
      toast({ title: "Error", description: "Could not remove client.", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTask(); }
  };

  const completed = orderedTasks.filter(t => t.completed).length;
  const total = orderedTasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const sourceLabel = client.proposalId
    ? "Via Proposal"
    : client.contractId
      ? "Via Contract"
      : "Manual";

  return (
    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl overflow-hidden group hover:border-primary/40 transition-colors">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted/60">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight truncate">{client.clientName}</h3>
            <p className="text-sm text-muted-foreground truncate">{client.businessName}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            <div className="text-right">
              <div className={cn(
                "text-xs font-bold",
                progress === 100 ? "text-green-600" : progress > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {completed}/{total}
              </div>
            </div>
            <button
              onClick={() => setReviewOpen(true)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground/40 hover:text-violet-600 transition-all"
              title="AI Review"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteClient}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground/40 hover:text-red-500 transition-all"
              title="Remove onboarding"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
          {client.services.map((svc) => (
            <span
              key={svc}
              className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide", serviceColor(svc))}
            >
              {serviceLabel(svc)}
            </span>
          ))}
          {client.services.length === 0 && (
            <span className="text-[10px] text-muted-foreground/50 italic">No services</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn(
            "font-mono text-[10px] uppercase",
            progress === 100
              ? "border-green-500/30 bg-green-500/5 text-green-600"
              : "border-primary/30 bg-primary/5 text-primary"
          )}>
            {progress === 100 ? "Complete" : "In Progress"}
          </Badge>
          <span className="text-[10px] text-muted-foreground/50 font-mono">{sourceLabel}</span>
          {client.clientStrategist && (
            <span className="text-xs text-blue-600 font-medium">{client.clientStrategist}</span>
          )}
          {client.createdAt && (
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              {format(new Date(client.createdAt), "MM.dd.yy")}
            </span>
          )}
        </div>

        {/* Intake form link */}
        <ShareFormButton clientId={client.id} />
      </div>

      {/* Checklist */}
      <div className="px-5 py-3 min-h-[120px]">
        {loadingTasks ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-2 text-center">No tasks yet.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {orderedTasks.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add task input */}
      <div className="px-5 pb-4 border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a custom task..."
            className="flex-1 text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
          <button
            onClick={handleAddTask}
            disabled={adding || !newTaskLabel.trim()}
            className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AiReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        reviewType="onboarding"
        title={`${client.clientName} — Onboarding Review`}
        data={{
          clientName: client.clientName,
          businessName: client.businessName,
          services: client.services,
          clientStrategist: client.clientStrategist,
          status: client.status,
          createdAt: client.createdAt,
          tasks: (tasks ?? []).map(t => ({ label: t.label, completed: t.completed })),
        }}
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: clients, isLoading } = useListOnboardingClients({
    query: { queryKey: getListOnboardingClientsQueryKey() },
  });

  const active = clients?.filter((c) => c.status === "active") ?? [];
  const complete = clients?.filter((c) => c.status !== "active") ?? [];

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Onboarding</h1>
          <p className="text-muted-foreground font-mono text-sm">CLIENT ACTIVATION CHECKLISTS</p>
        </div>
        <div className="flex items-center gap-3">
          {clients && clients.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="font-mono">{active.length} active</span>
            </div>
          )}
          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Onboarding
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : clients?.length === 0 ? (
        <div className="text-center p-12 border border-border/50 border-dashed rounded-xl bg-card/30">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-mono text-sm">NO ACTIVE ONBOARDINGS</p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            Clients are added automatically when proposals are accepted or contracts are signed.
          </p>
          <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Manually
          </Button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {active.map((client) => (
                <OnboardingCard key={client.id} client={client} />
              ))}
            </div>
          )}
          {complete.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-60">
                {complete.map((client) => (
                  <OnboardingCard key={client.id} client={client} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <NewOnboardingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </AdminLayout>
  );
}
