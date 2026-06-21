"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskCard } from "./task-card";
import { TaskDetailSheet } from "./task-detail-sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { SerializedTask } from "@/lib/serialize";
import { STATUSES, type StatusKey, KANBAN_ORDER, statusByKey } from "@/lib/constants";
import { toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Inbox } from "lucide-react";

interface Props {
  filters: { department: string | null; priority: string | null; overdueOnly: boolean };
  onNewTask: () => void;
}

export function KanbanView({ filters, onNewTask }: Props) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<SerializedTask | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "kanban"],
    queryFn: async () => {
      const r = await fetch("/api/tasks");
      return (await r.json()) as { tasks: SerializedTask[] };
    },
  });

  const tasks = (data?.tasks ?? []).filter((t) => {
    if (filters.department && t.department !== filters.department) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.overdueOnly && !(t.status !== "DONE" && new Date(t.deadline).getTime() < Date.now()))
      return false;
    return true;
  });

  const columns = KANBAN_ORDER.map((status) => ({
    status,
    label: statusByKey(status)?.label ?? status,
    tasks: tasks.filter((t) => t.status === status),
  }));

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = String(over.id) as StatusKey;
    if (!STATUSES.some((s) => s.key === newStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    queryClient.setQueryData<{ tasks: SerializedTask[] }>(["tasks", "kanban"], (old) => {
      if (!old) return old;
      return {
        tasks: old.tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
      };
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`تسک به ستون «${statusByKey(newStatus)?.label}» منتقل شد.`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    } catch {
      toast.error("انتقال تسک ناموفق بود.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function openTask(task: SerializedTask) {
    setSelected(task);
    setSheetOpen(true);
  }

  return (
    <div className="h-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={({ active, droppableContainers }) => {
          // Find the droppable column under the pointer
          const rect = active.rect.current.translated;
          if (!rect) return { droppableContainers: [] };
          const intersections = droppableContainers
            .filter((c) => c.id !== active.id)
            .map((c) => {
              const r = c.rect.current;
              if (!r) return { id: c.id, area: 0 };
              const left = Math.max(rect.left, r.left);
              const right = Math.min(rect.right, r.right);
              const top = Math.max(rect.top, r.top);
              const bottom = Math.min(rect.bottom, r.bottom);
              const area = Math.max(0, right - left) * Math.max(0, bottom - top);
              return { id: c.id, area };
            })
            .sort((a, b) => b.area - a.area);
          return {
            droppableContainers: intersections
              .filter((i) => i.area > 0)
              .map((i) => ({ id: i.id })),
          };
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <ScrollArea className="flex-1 scroll-area-pmo">
          <div className="flex gap-4 min-w-max pb-4 px-1">
            {columns.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                tasks={col.tasks}
                onOpen={openTask}
                onNewTask={col.status === "PENDING" ? onNewTask : undefined}
                isLoading={isLoading}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 rotate-2 opacity-90">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet
        task={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["members"] });
        }}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
  onOpen,
  onNewTask,
  isLoading,
}: {
  status: StatusKey;
  label: string;
  tasks: SerializedTask[];
  onOpen: (t: SerializedTask) => void;
  onNewTask?: () => void;
  isLoading?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "PENDING" && "bg-slate-400",
              status === "STARTED" && "bg-sky-500",
              status === "BLOCKED" && "bg-rose-500",
              status === "DONE" && "bg-emerald-500"
            )}
          />
          <h3 className="font-semibold text-sm">{label}</h3>
          <span className="text-xs text-muted-foreground nums-fa bg-muted px-1.5 py-0.5 rounded">
            {toPersianDigits(tasks.length)}
          </span>
        </div>
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="افزودن تسک"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[200px] rounded-xl border border-dashed p-2 space-y-2 transition-colors",
          isOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30"
        )}
      >
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/60">
            <Inbox className="h-6 w-4 mb-1" />
            <span className="text-xs">خالی</span>
          </div>
        )}
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} onOpen={() => onOpen(task)} />
        ))}
      </div>
    </div>
  );
}

function DraggableTask({
  task,
  onOpen,
}: {
  task: SerializedTask;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div ref={setNodeRef} {...attributes} className={isDragging ? "kanban-dragging" : ""}>
      <div {...listeners} className={isDragging ? "cursor-grabbing" : "cursor-grab"}>
        <TaskCard
          task={task}
          onClick={onOpen}
          compact
          isDragging={isDragging}
        />
      </div>
    </div>
  );
}
