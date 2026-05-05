import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListProposals, getListProposalsQueryKey,
  useListOnboardingTasks, useToggleOnboardingTask, useAddOnboardingTask, useDeleteOnboardingTask,
  getListOnboardingTasksQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Circle, Plus, Trash2, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { useState, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function OnboardingCard({ proposal }: { proposal: { id: string; clientName: string; businessName: string; totalAmount: number; signedAt: string | null; clientStrategist: string | null } }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: tasks, isLoading: loadingTasks } = useListOnboardingTasks(proposal.id, {
    query: { queryKey: getListOnboardingTasksQueryKey(proposal.id) },
  });

  const toggleTask = useToggleOnboardingTask();
  const addTask = useAddOnboardingTask();
  const deleteTask = useDeleteOnboardingTask();

  const handleToggle = async (taskId: number, completed: boolean) => {
    try {
      await toggleTask.mutateAsync({ taskId, data: { completed: !completed } });
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(proposal.id) });
    } catch {
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  };

  const handleAddTask = async () => {
    const label = newTaskLabel.trim();
    if (!label) return;
    setAdding(true);
    try {
      await addTask.mutateAsync({ id: proposal.id, data: { label } });
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(proposal.id) });
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
      queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey(proposal.id) });
    } catch {
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTask(); }
  };

  const completed = tasks?.filter(t => t.completed).length ?? 0;
  const total = tasks?.length ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

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
          <div>
            <h3 className="font-bold text-foreground text-base leading-tight">{proposal.clientName}</h3>
            <p className="text-sm text-muted-foreground">{proposal.businessName}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-xs font-mono text-muted-foreground">
              {proposal.signedAt ? format(new Date(proposal.signedAt), "MM.dd.yy") : ""}
            </div>
            <div className={cn(
              "text-xs font-bold mt-0.5",
              progress === 100 ? "text-green-600" : progress > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {completed}/{total} done
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 bg-primary/5 uppercase">
            {progress === 100 ? "Complete" : "In Progress"}
          </Badge>
          {proposal.clientStrategist && (
            <span className="text-xs text-blue-600 font-medium">{proposal.clientStrategist}</span>
          )}
          <span className="text-xs font-mono text-muted-foreground ml-auto">
            ${Number(proposal.totalAmount).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-5 py-3 space-y-1 min-h-[120px]">
        {loadingTasks ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-2 text-center">No tasks yet.</p>
        ) : tasks?.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-2.5 group/task py-0.5"
          >
            <button
              onClick={() => handleToggle(task.id, task.completed)}
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
              onClick={() => handleDeleteTask(task.id)}
              className="opacity-0 group-hover/task:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add task input */}
      <div className="px-5 pb-4 border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskLabel}
            onChange={e => setNewTaskLabel(e.target.value)}
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
    </div>
  );
}

export default function Onboarding() {
  const { data: proposals, isLoading } = useListProposals(
    { status: "accepted" },
    { query: { queryKey: getListProposalsQueryKey({ status: "accepted" }) } }
  );

  const completedCount = 0;

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Onboarding</h1>
          <p className="text-muted-foreground font-mono text-sm">CLIENT ACTIVATION CHECKLISTS</p>
        </div>
        {proposals && proposals.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="font-mono">{proposals.length} active client{proposals.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : proposals?.length === 0 ? (
        <div className="text-center p-12 border border-border/50 border-dashed rounded-xl bg-card/30">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-mono text-sm">NO ACTIVE ONBOARDINGS</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Accepted proposals will appear here with their onboarding checklists.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {proposals?.map(proposal => (
            <OnboardingCard
              key={proposal.id}
              proposal={{
                id: proposal.id,
                clientName: proposal.clientName,
                businessName: proposal.businessName,
                totalAmount: Number(proposal.totalAmount),
                signedAt: proposal.signedAt ?? null,
                clientStrategist: proposal.clientStrategist ?? null,
              }}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
