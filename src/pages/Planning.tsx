import { useState, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bot,
  Plus,
  CalendarRange,
  Settings2,
  GitBranch,
  Save,
  RefreshCcw,
  Flag,
  Lock,
  Link2,
  Users,
  Calendar,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit3,
  Copy,
  Send,
  ChevronDown,
  GripVertical,
  Target,
  Undo2,
  Download,
  FolderKanban,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePlanningData, type PlanningPhase, type PlanningTask, type SavedVersion } from "@/hooks/usePlanningData";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

/* ── Templates ── */
const TEMPLATES: Record<string, { label: string; phases: { name: string; tasks: { name: string; duration: number; deliverable?: string; isMilestone?: boolean }[] }[] }> = {
  "etude-enquete": {
    label: "Étude + enquête terrain",
    phases: [
      { name: "Cadrage", tasks: [
        { name: "Réunion de lancement", duration: 5, isMilestone: true },
        { name: "Note de cadrage", duration: 10, deliverable: "Note de cadrage" },
      ]},
      { name: "Diagnostic", tasks: [
        { name: "Revue documentaire", duration: 20 },
        { name: "Entretiens parties prenantes", duration: 15 },
        { name: "Rapport diagnostic", duration: 10, deliverable: "Rapport diagnostic" },
      ]},
      { name: "Enquête terrain", tasks: [
        { name: "Conception questionnaire", duration: 10 },
        { name: "Administration terrain", duration: 25 },
        { name: "Saisie & nettoyage", duration: 10 },
      ]},
      { name: "Analyse", tasks: [
        { name: "Analyse statistique", duration: 20 },
        { name: "Rapport d'analyse", duration: 15, deliverable: "Rapport d'analyse" },
      ]},
      { name: "Restitution", tasks: [
        { name: "Présentation résultats", duration: 5, isMilestone: true },
        { name: "Rapport final", duration: 15, deliverable: "Rapport final" },
      ]},
    ],
  },
  "concertation-multi": {
    label: "Concertation publique",
    phases: [
      { name: "Préparation", tasks: [
        { name: "Cadrage dispositif", duration: 15 },
        { name: "Plan de concertation", duration: 10, deliverable: "Plan de concertation" },
      ]},
      { name: "Information", tasks: [
        { name: "Supports d'information", duration: 15 },
        { name: "Réunion publique d'info", duration: 3, isMilestone: true },
      ]},
      { name: "Concertation", tasks: [
        { name: "Atelier participatif #1", duration: 5 },
        { name: "Atelier participatif #2", duration: 5 },
        { name: "Atelier participatif #3", duration: 5 },
        { name: "Permanence publique", duration: 30 },
      ]},
      { name: "Synthèse", tasks: [
        { name: "Analyse contributions", duration: 20 },
        { name: "Rapport de synthèse", duration: 15, deliverable: "Rapport de synthèse" },
      ]},
      { name: "Bilan", tasks: [
        { name: "Bilan de concertation", duration: 10, deliverable: "Bilan" },
      ]},
    ],
  },
  mixte: {
    label: "Mixte (étude + concertation + comm)",
    phases: [
      { name: "Cadrage", tasks: [
        { name: "Lancement projet", duration: 5, isMilestone: true },
        { name: "Note de cadrage", duration: 10, deliverable: "Note de cadrage" },
      ]},
      { name: "Diagnostic / Étude", tasks: [
        { name: "Diagnostic territorial", duration: 30 },
        { name: "Enquête terrain", duration: 25 },
        { name: "Rapport diagnostic", duration: 10, deliverable: "Rapport diagnostic" },
      ]},
      { name: "Concertation", tasks: [
        { name: "Ateliers concertation (x3)", duration: 30 },
        { name: "Réunion publique", duration: 5, isMilestone: true },
      ]},
      { name: "Communication", tasks: [
        { name: "Stratégie com", duration: 15 },
        { name: "Déploiement com", duration: 20 },
      ]},
      { name: "Synthèse", tasks: [
        { name: "Synthèse contributions", duration: 15 },
        { name: "Rapport final", duration: 15, deliverable: "Rapport final" },
      ]},
    ],
  },
};

const PHASE_COLORS = [
  "bg-info", "bg-primary", "bg-warning", "bg-accent-foreground", "bg-success",
  "bg-destructive", "bg-info/70", "bg-primary/70",
];

const statusColors: Record<string, string> = {
  done: "bg-success/70",
  active: "bg-primary",
  upcoming: "bg-muted-foreground/30",
};

/* ── Helpers ── */
function addDaysToDate(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ── Task Edit Dialog ── */
function TaskEditDialog({
  open,
  onOpenChange,
  task,
  phases,
  allTasks,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: PlanningTask | null;
  phases: PlanningPhase[];
  allTasks: PlanningTask[];
  onSave: (t: PlanningTask) => void;
}) {
  const [form, setForm] = useState<PlanningTask | null>(null);

  const handleOpen = useCallback(() => {
    if (task) setForm({ ...task });
  }, [task]);

  // Sync form when task changes
  if (open && task && (!form || form.id !== task.id)) {
    setForm({ ...task });
  }

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{task?.dbId || task?.name ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phase</label>
              <Select value={form.phaseId} onValueChange={(v) => setForm({ ...form, phaseId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Statut</label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Jour de début</label>
              <Input type="number" min={0} value={form.startDay} onChange={(e) => setForm({ ...form, startDay: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Durée (jours)</label>
              <Input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Livrable associé</label>
            <Input value={form.deliverable || ""} onChange={(e) => setForm({ ...form, deliverable: e.target.value || undefined })} placeholder="Optionnel" />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.isMilestone} onCheckedChange={(v) => setForm({ ...form, isMilestone: v })} />
              Jalon
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.isDeliverable} onCheckedChange={(v) => setForm({ ...form, isDeliverable: v })} />
              Livrable clé
            </label>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Dépendances</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allTasks.filter((t) => t.id !== form.id).map((t) => {
                const isSelected = form.dependsOn?.includes(t.id);
                return (
                  <Badge
                    key={t.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-[10px] transition-colors"
                    onClick={() => {
                      const deps = form.dependsOn || [];
                      setForm({
                        ...form,
                        dependsOn: isSelected
                          ? deps.filter((d) => d !== t.id)
                          : [...deps, t.id],
                      });
                    }}
                  >
                    {t.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => { onSave(form); onOpenChange(false); }}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Component ── */
export default function Planning() {
  const navigate = useNavigate();
  const planning = usePlanningData();
  const [activeTab, setActiveTab] = useState("timeline");
  const [planningMode, setPlanningMode] = useState<"forward" | "retro">("forward");
  const [retroEndDate, setRetroEndDate] = useState("");
  const [editingTask, setEditingTask] = useState<PlanningTask | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState("");

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiMode, setAiMode] = useState<"generate" | "advise">("generate");
  const [aiPlan, setAiPlan] = useState<{ summary: string; phases: { name: string; tasks: { name: string; duration: number; deliverable?: string }[] }[] } | null>(null);

  const totalDays = useMemo(() => {
    if (planning.tasks.length === 0) return 150;
    return Math.max(...planning.tasks.map((t) => t.startDay + t.duration)) + 10;
  }, [planning.tasks]);

  const monthHeaders = useMemo(() => {
    const headers: { label: string; startPct: number; widthPct: number }[] = [];
    let current = new Date(planning.startDate);
    let totalProcessed = 0;
    while (totalProcessed < totalDays) {
      const monthStart = totalProcessed;
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const startOfMonth = current.getDate() - 1;
      const remainingInMonth = daysInMonth - startOfMonth;
      const days = Math.min(remainingInMonth, totalDays - totalProcessed);
      headers.push({
        label: current.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        startPct: (monthStart / totalDays) * 100,
        widthPct: (days / totalDays) * 100,
      });
      totalProcessed += days;
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return headers;
  }, [planning.startDate, totalDays]);

  const groupedTasks = useMemo(() => {
    return planning.phases.map((phase) => ({
      phase,
      tasks: planning.tasks.filter((t) => t.phaseId === phase.id),
    }));
  }, [planning.phases, planning.tasks]);

  // Apply template
  const applyTemplate = (key: string) => {
    const tpl = TEMPLATES[key];
    if (!tpl) return;

    const newPhases: PlanningPhase[] = [];
    const newTasks: PlanningTask[] = [];
    let currentDay = 0;
    let prevTaskId: string | undefined;

    tpl.phases.forEach((p, pi) => {
      const phaseId = crypto.randomUUID();
      newPhases.push({
        id: phaseId,
        name: p.name,
        color: PHASE_COLORS[pi % PHASE_COLORS.length],
        orderIndex: pi,
      });

      p.tasks.forEach((t) => {
        const taskId = crypto.randomUUID();
        newTasks.push({
          id: taskId,
          name: t.name,
          phaseId,
          startDay: currentDay,
          duration: t.duration,
          status: "upcoming",
          deliverable: t.deliverable,
          isMilestone: t.isMilestone,
          dependsOn: prevTaskId ? [prevTaskId] : undefined,
        });
        currentDay += t.duration;
        prevTaskId = taskId;
      });
    });

    planning.setPhases(newPhases);
    planning.setTasks(newTasks);
    toast.success(`Template "${tpl.label}" appliqué`);
  };

  // Handle retroplanning
  const handleRetroPlanning = () => {
    if (!retroEndDate) {
      toast.error("Définissez une date de fin");
      return;
    }
    planning.calculateRetroPlanning(new Date(retroEndDate));
  };

  // New task
  const handleNewTask = (phaseId?: string) => {
    const phase = phaseId || planning.phases[0]?.id;
    if (!phase) {
      toast.error("Créez d'abord une phase");
      return;
    }
    const maxDay = planning.tasks.length > 0
      ? Math.max(...planning.tasks.filter((t) => t.phaseId === phase).map((t) => t.startDay + t.duration), 0)
      : 0;

    setEditingTask({
      id: "",
      name: "Nouvelle tâche",
      phaseId: phase,
      startDay: maxDay,
      duration: 5,
      status: "upcoming",
    });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (task: PlanningTask) => {
    if (task.id && planning.tasks.find((t) => t.id === task.id)) {
      planning.updateTask(task.id, task);
    } else {
      const { id, ...rest } = task;
      planning.addTask(rest);
    }
  };

  // Add phase
  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    planning.addPhase(newPhaseName.trim());
    setNewPhaseName("");
    toast.success("Phase ajoutée");
  };

  // AI submit
  const handleAISubmit = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResponse("");
    setAiPlan(null);

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/adaptive-planning`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    };

    const maxRetries = 2;

    const fetchWithRetry = async (body: object, retries = 0): Promise<Response> => {
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (resp.status === 429 && retries < maxRetries) {
        const delay = (retries + 1) * 3000;
        toast.info(`Rate limit atteint, nouvelle tentative dans ${delay / 1000}s…`);
        await new Promise((r) => setTimeout(r, delay));
        return fetchWithRetry(body, retries + 1);
      }
      return resp;
    };

    try {
      if (aiMode === "generate") {
        const resp = await fetchWithRetry({ prompt: aiPrompt.trim(), mode: "generate" });

        if (resp.status === 429) { toast.error("Trop de requêtes, réessayez dans quelques instants."); return; }
        if (resp.status === 402) { toast.error("Crédits IA insuffisants."); return; }
        if (!resp.ok) throw new Error("Erreur IA");

        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        setAiPlan(data);
        toast.success("Planning généré par l'IA !");
      } else {
        const resp = await fetchWithRetry({ prompt: aiPrompt.trim() });

        if (resp.status === 429) { toast.error("Trop de requêtes."); return; }
        if (resp.status === 402) { toast.error("Crédits IA insuffisants."); return; }
        if (!resp.ok || !resp.body) throw new Error("Erreur IA");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setAiResponse(fullText);
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la communication avec l'IA");
    } finally {
      setAiLoading(false);
    }
  };

  // Import AI plan into the Gantt
  const handleImportAIPlan = () => {
    if (!aiPlan) return;
    planning.importAIPlan(aiPlan.phases);
    setAiPlan(null);
    setAiPrompt("");
    setActiveTab("timeline");
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <CalendarRange className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Retroplanning</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Construisez, ajustez et versionnez votre planning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Project selector */}
            <Select value={planning.projectId || "standalone"} onValueChange={(v) => planning.selectProject(v === "standalone" ? null : v)}>
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <FolderKanban className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Sans projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone">Autonome (sans projet)</SelectItem>
                {planning.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mode toggle */}
            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setPlanningMode("forward")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  planningMode === "forward" ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowRight className="h-3 w-3 inline mr-1" />
                Forward
              </button>
              <button
                onClick={() => setPlanningMode("retro")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  planningMode === "retro" ? "bg-warning text-warning-foreground" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Retro
              </button>
            </div>

            <Badge variant="outline" className="border-primary/30 text-primary gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              {planning.versionName}
            </Badge>
          </div>
        </div>

        {/* Retro mode banner */}
        {planningMode === "retro" && (
          <div className="glass-card p-4 glow-border border-warning/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <Undo2 className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">Mode Retroplanning</p>
                <p className="text-xs text-muted-foreground">Définissez la date de fin et le planning sera calculé à rebours</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Date de fin imposée</label>
                <input
                  type="date"
                  value={retroEndDate}
                  onChange={(e) => setRetroEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-warning"
                />
              </div>
              <Button onClick={handleRetroPlanning} className="gap-1.5 bg-warning text-warning-foreground hover:bg-warning/90 mt-4">
                <RefreshCcw className="h-3.5 w-3.5" />
                Calculer le retroplanning
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="timeline" className="text-xs gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Gantt
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              Tâches
            </TabsTrigger>
            <TabsTrigger value="template" className="text-xs gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="ia" className="text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              IA
            </TabsTrigger>
          </TabsList>

          {/* ── GANTT TAB ── */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="glass-card p-5 overflow-x-auto">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-sm">
                    Début : {formatDate(planning.startDate)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">
                    Fin : {formatDate(addDaysToDate(planning.startDate, totalDays))}
                  </span>
                  <span className="text-xs text-muted-foreground">({totalDays} jours)</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-success/70" /> Terminé</div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-primary" /> En cours</div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" /> À venir</div>
                  <div className="flex items-center gap-1.5"><Flag className="h-3 w-3 text-warning" /> Jalon</div>
                </div>
              </div>

              {planning.tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CalendarRange className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">Aucune tâche dans le planning</p>
                  <p className="text-xs mb-4">Commencez par un template ou ajoutez des tâches manuellement</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("template")} className="gap-1.5 text-xs">
                      <Copy className="h-3.5 w-3.5" /> Template
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab("tasks")} className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Ajouter manuellement
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="min-w-[800px]">
                  {/* Month headers */}
                  <div className="relative h-6 mb-2 border-b border-border/50">
                    {monthHeaders.map((mh, i) => (
                      <div
                        key={i}
                        className="absolute top-0 text-[10px] text-muted-foreground font-medium text-center border-l border-border/30 pl-1"
                        style={{ left: `${200 + (mh.startPct / 100) * (800 - 200)}px`, width: `${(mh.widthPct / 100) * (800 - 200)}px` }}
                      >
                        {mh.label}
                      </div>
                    ))}
                  </div>

                  {groupedTasks.map(({ phase, tasks: phaseTasks }) => (
                    <div key={phase.id} className="mb-1">
                      <div className="grid grid-cols-[200px_1fr] items-center py-1.5 bg-secondary/20 rounded-t px-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-sm ${phase.color}`} />
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{phase.name}</span>
                        </div>
                        <div className="relative h-5">
                          {phaseTasks.length > 0 && (
                            <div
                              className={`absolute top-0.5 h-4 rounded ${phase.color} opacity-20`}
                              style={{
                                left: `${(Math.min(...phaseTasks.map((t) => t.startDay)) / totalDays) * 100}%`,
                                width: `${((Math.max(...phaseTasks.map((t) => t.startDay + t.duration)) - Math.min(...phaseTasks.map((t) => t.startDay))) / totalDays) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {phaseTasks.map((task) => (
                        <div
                          key={task.id}
                          className="grid grid-cols-[200px_1fr] items-center py-1 group hover:bg-secondary/10 rounded transition-colors cursor-pointer"
                          onClick={() => { setEditingTask(task); setTaskDialogOpen(true); }}
                        >
                          <div className="pr-3 min-w-0 flex items-center gap-1.5 pl-5">
                            {task.isMilestone && <Flag className="h-3 w-3 text-warning shrink-0" />}
                            {task.isDeliverable && <Lock className="h-3 w-3 text-primary shrink-0" />}
                            <p className="text-xs truncate">{task.name}</p>
                          </div>
                          <div className="relative h-6">
                            {monthHeaders.map((mh, mi) => (
                              <div key={mi} className="absolute top-0 h-full border-l border-border/10" style={{ left: `${(mh.startPct / 100) * 100}%` }} />
                            ))}
                            {task.isMilestone ? (
                              <div
                                className="absolute top-1 h-4 w-4 rotate-45 bg-warning border-2 border-background"
                                style={{ left: `${(task.startDay / totalDays) * 100}%` }}
                              />
                            ) : (
                              <div
                                className={`absolute top-1 h-4 rounded-sm ${statusColors[task.status]} transition-all group-hover:opacity-80 flex items-center justify-end pr-1`}
                                style={{
                                  left: `${(task.startDay / totalDays) * 100}%`,
                                  width: `${Math.max((task.duration / totalDays) * 100, 0.5)}%`,
                                }}
                              >
                                {task.deliverable && (
                                  <span className="text-[8px] text-background font-medium truncate">
                                    {task.duration >= 10 ? task.deliverable : ""}
                                  </span>
                                )}
                              </div>
                            )}
                            <span
                              className="absolute top-0.5 text-[9px] text-muted-foreground"
                              style={{ left: `${((task.startDay + task.duration) / totalDays) * 100 + 0.5}%` }}
                            >
                              {task.duration}j
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save bar */}
            {planning.tasks.length > 0 && (
              <div className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={planning.versionName}
                    onChange={(e) => planning.setVersionName(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">{planning.tasks.length} tâches · {planning.phases.length} phases</span>
                </div>
                <div className="flex gap-2">
                  {planningMode === "forward" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={planning.calculateForwardPlanning}>
                      <RefreshCcw className="h-3.5 w-3.5" /> Recalculer
                    </Button>
                  )}
                  <Button onClick={planning.savePlanning} disabled={planning.isSaving || !planning.projectId} className="gap-2">
                    {planning.isSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde…</>
                    ) : (
                      <><Save className="h-4 w-4" /> Sauvegarder</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Saved versions list */}
            {planning.projectId && planning.savedVersions.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  Versions sauvegardées ({planning.savedVersions.length})
                </h3>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {planning.savedVersions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="text-[10px] py-0 shrink-0">{v.version_name}</Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {v.reason || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs gap-1 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            if (planning.projectId) {
                              planning.loadPlanning(planning.projectId);
                              planning.setVersionName(v.version_name);
                              toast.success(`Version "${v.version_name}" rechargée`);
                            }
                          }}
                        >
                          <RefreshCcw className="h-3 w-3" /> Charger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── TASKS TAB (Manual editing) ── */}
          <TabsContent value="tasks" className="space-y-4">
            {/* Phases management */}
            <div className="glass-card p-5">
              <h2 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Phases
              </h2>
              <div className="space-y-2 mb-3">
                {planning.phases.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 group">
                    <div className={`h-3 w-3 rounded-sm ${p.color} shrink-0`} />
                    {editingPhaseId === p.id ? (
                      <Input
                        value={editingPhaseName}
                        onChange={(e) => setEditingPhaseName(e.target.value)}
                        onBlur={() => { planning.updatePhase(p.id, { name: editingPhaseName }); setEditingPhaseId(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { planning.updatePhase(p.id, { name: editingPhaseName }); setEditingPhaseId(null); } }}
                        className="h-7 text-xs flex-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm flex-1">{p.name}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {planning.tasks.filter((t) => t.phaseId === p.id).length} tâches
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setEditingPhaseId(p.id); setEditingPhaseName(p.name); }}>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => planning.deletePhase(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="Nom de la nouvelle phase" className="h-8 text-xs" onKeyDown={(e) => { if (e.key === "Enter") handleAddPhase(); }} />
                <Button size="sm" onClick={handleAddPhase} disabled={!newPhaseName.trim()} className="gap-1.5 text-xs shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </Button>
              </div>
            </div>

            {/* Tasks list by phase */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-primary" />
                  Tâches ({planning.tasks.length})
                </h2>
                <Button size="sm" onClick={() => handleNewTask()} className="gap-1.5 text-xs" disabled={planning.phases.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Nouvelle tâche
                </Button>
              </div>

              {planning.phases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Créez d'abord des phases pour organiser vos tâches
                </p>
              ) : (
                <div className="space-y-4">
                  {groupedTasks.map(({ phase, tasks: phaseTasks }) => (
                    <div key={phase.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-2.5 w-2.5 rounded-sm ${phase.color}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{phase.name}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => handleNewTask(phase.id)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {phaseTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground/50 pl-5 py-1">Aucune tâche</p>
                      ) : (
                        <div className="space-y-1">
                          {phaseTasks.sort((a, b) => a.startDay - b.startDay).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group cursor-pointer"
                              onClick={() => { setEditingTask(task); setTaskDialogOpen(true); }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {task.isMilestone && <Flag className="h-3 w-3 text-warning shrink-0" />}
                                  <span className="text-sm font-medium truncate">{task.name}</span>
                                  {task.deliverable && (
                                    <Badge variant="outline" className="text-[9px] py-0">{task.deliverable}</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                <span>J{task.startDay}→J{task.startDay + task.duration}</span>
                                <span>{task.duration}j</span>
                                <Badge className={`text-[9px] py-0 ${statusColors[task.status]} ${task.status === "upcoming" ? "text-foreground" : "text-background"}`}>
                                  {task.status === "done" ? "Terminé" : task.status === "active" ? "En cours" : "À venir"}
                                </Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); planning.deleteTask(task.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date settings */}
            <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Date de début du projet</label>
                <input
                  type="date"
                  value={planning.startDate.toISOString().split("T")[0]}
                  onChange={(e) => planning.setStartDate(new Date(e.target.value))}
                  className="px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={planning.calculateForwardPlanning}>
                  <RefreshCcw className="h-3.5 w-3.5" /> Recalculer les dépendances
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── TEMPLATES TAB ── */}
          <TabsContent value="template" className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
                <Copy className="h-4 w-4 text-primary" />
                Générer à partir d'un template
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <div
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className="p-4 rounded-lg border cursor-pointer transition-all border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <h3 className="text-sm font-medium mb-1">{tpl.label}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tpl.phases.length} phases</span>
                      <span>·</span>
                      <span>{tpl.phases.reduce((s, p) => s + p.tasks.length, 0)} tâches</span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tpl.phases.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] py-0">{p.name}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── IA TAB ── */}
          <TabsContent value="ia" className="space-y-4">
            {/* AI mode selector */}
            <div className="glass-card p-5 glow-border">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-heading text-sm font-semibold">Assistant Planning IA</span>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAiMode("generate")}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    aiMode === "generate"
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/50 bg-secondary/20 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Générer un planning</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'IA crée un planning complet (phases + tâches) importable en 1 clic
                  </p>
                </button>
                <button
                  onClick={() => setAiMode("advise")}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    aiMode === "advise"
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/50 bg-secondary/20 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Conseil & ajustement</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'IA analyse votre planning et propose des optimisations
                  </p>
                </button>
              </div>

              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={
                  aiMode === "generate"
                    ? "Ex : Je dois livrer un rapport d'étude d'impact pour le 15 décembre 2026. Il y a une phase de diagnostic de 2 mois, une enquête terrain, et une concertation publique avec 3 ateliers."
                    : "Ex : Mon planning actuel a 5 phases sur 6 mois, mais le client veut avancer la livraison de 3 semaines. Comment réorganiser ?"
                }
                className="bg-secondary/30 border-border/50 min-h-[100px] text-sm"
              />
              <div className="flex justify-end mt-3">
                <Button onClick={handleAISubmit} disabled={aiLoading || !aiPrompt.trim()} className="gap-2" size="sm">
                  {aiLoading ? (
                    <><div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {aiMode === "generate" ? "Génération…" : "Analyse…"}</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> {aiMode === "generate" ? "Générer le planning" : "Analyser"}</>
                  )}
                </Button>
              </div>

              {/* Structured AI plan result */}
              {aiPlan && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-primary/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Planning généré</span>
                    </div>
                    <Button size="sm" onClick={handleImportAIPlan} className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Importer dans le Gantt
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{aiPlan.summary}</p>
                  <div className="space-y-3">
                    {aiPlan.phases.map((phase, pi) => (
                      <div key={pi} className="rounded-lg border border-border/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30">
                          <div className={`h-2.5 w-2.5 rounded-sm ${PHASE_COLORS[pi % PHASE_COLORS.length]}`} />
                          <span className="text-xs font-semibold uppercase tracking-wider">{phase.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {phase.tasks.reduce((s, t) => s + t.duration, 0)} jours
                          </span>
                        </div>
                        <div className="divide-y divide-border/30">
                          {phase.tasks.map((task, ti) => (
                            <div key={ti} className="flex items-center justify-between px-3 py-1.5 text-xs">
                              <span>{task.name}</span>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                {task.deliverable && (
                                  <Badge variant="outline" className="text-[9px] py-0">{task.deliverable}</Badge>
                                )}
                                <span>{task.duration}j</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {aiPlan.phases.length} phases · {aiPlan.phases.reduce((s, p) => s + p.tasks.length, 0)} tâches · {aiPlan.phases.reduce((s, p) => s + p.tasks.reduce((ss, t) => ss + t.duration, 0), 0)} jours total
                    </span>
                    <Button size="sm" variant="outline" onClick={handleImportAIPlan} className="gap-1.5 text-xs">
                      <Download className="h-3 w-3" /> Appliquer
                    </Button>
                  </div>
                </div>
              )}

              {/* Streaming text advice result */}
              {aiResponse && !aiPlan && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Recommandations IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                </div>
              )}
            </div>

            {/* Workflow visual */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  <Bot className="h-3.5 w-3.5" /> IA propose
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning font-medium">
                  <Target className="h-3.5 w-3.5" /> Vous ajustez
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">
                  <GitBranch className="h-3.5 w-3.5" /> App versionne
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Task edit dialog */}
        <TaskEditDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={editingTask}
          phases={planning.phases}
          allTasks={planning.tasks}
          onSave={handleSaveTask}
        />
      </div>
    </Layout>
  );
}
