import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createEntrepreneurTask,
  deleteEntrepreneurTask,
  getEntrepreneurTasks,
  updateEntrepreneurTask,
  type EntrepreneurTask,
  type EntrepreneurTaskColumn,
} from "@/services/api";
import { cn } from "@/lib/utils";

const columns: Array<{
  id: EntrepreneurTaskColumn;
  title: string;
  description: string;
}> = [
  { id: "backlog", title: "Backlog", description: "Ideias e pendências ainda não priorizadas." },
  { id: "todo", title: "A fazer", description: "Tarefas escolhidas para execução." },
  { id: "review", title: "Em revisão", description: "Itens aguardando validação ou ajuste." },
  { id: "done", title: "Concluído", description: "Tarefas finalizadas." },
];

const columnLabels = columns.reduce(
  (acc, column) => {
    acc[column.id] = column.title;
    return acc;
  },
  {} as Record<EntrepreneurTaskColumn, string>,
);

type TaskForm = {
  title: string;
  description: string;
  due_date: string;
  column: EntrepreneurTaskColumn;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  due_date: "",
  column: "backlog",
};

function isTaskColumn(value: string): value is EntrepreneurTaskColumn {
  return columns.some((column) => column.id === value);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return "Não foi possível concluir a operação.";
}

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

export default function ToolsKanbanPage() {
  const [tasks, setTasks] = useState<EntrepreneurTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EntrepreneurTask | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getEntrepreneurTasks();
      setTasks(response.data ?? []);
    } catch {
      setError("Não foi possível carregar as tarefas do Kanban.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const groupedTasks = useMemo(() => {
    const grouped = columns.reduce(
      (acc, column) => {
        acc[column.id] = [];
        return acc;
      },
      {} as Record<EntrepreneurTaskColumn, EntrepreneurTask[]>,
    );

    tasks.forEach((task) => {
      grouped[task.column]?.push(task);
    });

    return grouped;
  }, [tasks]);

  const openCreateDialog = (column: EntrepreneurTaskColumn) => {
    setEditingTask(null);
    setForm({ ...emptyForm, column });
    setDialogOpen(true);
  };

  const openEditDialog = (task: EntrepreneurTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      due_date: task.due_date ?? "",
      column: task.column,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      column: form.column,
    };

    try {
      if (editingTask) {
        await updateEntrepreneurTask(editingTask.id, payload);
        toast.success("Tarefa atualizada.");
      } else {
        await createEntrepreneurTask(payload);
        toast.success("Tarefa criada.");
      }

      setDialogOpen(false);
      await loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (task: EntrepreneurTask, column: EntrepreneurTaskColumn) => {
    if (task.column === column) return;

    setMovingTaskId(task.id);

    try {
      await updateEntrepreneurTask(task.id, { column });
      toast.success(`Tarefa movida para ${columnLabels[column]}.`);
      await loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleDelete = async (task: EntrepreneurTask) => {
    const confirmed = window.confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.");

    if (!confirmed) return;

    setDeletingTaskId(task.id);

    try {
      await deleteEntrepreneurTask(task.id);
      toast.success("Tarefa excluída.");
      await loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground">
            <Link to="/app/ferramentas">
              <ArrowLeft className="h-4 w-4" />
              Ferramentas
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Kanban</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Tarefas salvas no contrato real do empreendedor. Use os controles de coluna para
              movimentar itens sem depender de arrastar e soltar.
            </p>
          </div>
        </div>
        <Button onClick={() => openCreateDialog("backlog")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kanban indisponível</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <KanbanSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((column) => (
            <section key={column.id} className="min-w-0 space-y-3">
              <Card className="border-border/60 bg-card p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-foreground">{column.title}</h2>
                    <Badge variant="outline">{groupedTasks[column.id].length}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{column.description}</p>
                </div>
              </Card>

              <div className="space-y-3">
                {groupedTasks[column.id].length === 0 && (
                  <Card className="border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Nenhuma tarefa nesta coluna.
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0 text-primary"
                      onClick={() => openCreateDialog(column.id)}
                    >
                      Criar tarefa
                    </Button>
                  </Card>
                )}

                {groupedTasks[column.id].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    moving={movingTaskId === task.id}
                    deleting={deletingTaskId === task.id}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
            <DialogDescription>
              O Kanban usa as colunas aceitas pelo backend: backlog, a fazer, revisão e concluído.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={form.title}
                maxLength={255}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Revisar documentos da campanha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Contexto, decisão ou próximo passo."
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Prazo</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, due_date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Coluna</Label>
                <Select
                  value={form.column}
                  onValueChange={(value) => {
                    if (isTaskColumn(value)) {
                      setForm((current) => ({ ...current, column: value }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTask ? "Salvar tarefa" : "Criar tarefa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  moving,
  deleting,
  onEdit,
  onDelete,
  onMove,
}: {
  task: EntrepreneurTask;
  moving: boolean;
  deleting: boolean;
  onEdit: (task: EntrepreneurTask) => void;
  onDelete: (task: EntrepreneurTask) => void;
  onMove: (task: EntrepreneurTask, column: EntrepreneurTaskColumn) => void;
}) {
  const dueDate = formatDate(task.due_date);

  return (
    <Card className="border-border/60 p-4 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="break-words font-semibold leading-tight text-foreground">{task.title}</h3>
          {task.description && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>

        {dueDate && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {dueDate}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs text-muted-foreground">Mover para</Label>
          <Select
            value={task.column}
            disabled={moving || deleting}
            onValueChange={(value) => {
              if (isTaskColumn(value)) {
                onMove(task, value);
              }
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)} disabled={moving || deleting}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-destructive hover:text-destructive", deleting && "opacity-70")}
            onClick={() => onDelete(task)}
            disabled={moving || deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
        </div>
      </div>
    </Card>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((column) => (
        <div key={column.id} className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
