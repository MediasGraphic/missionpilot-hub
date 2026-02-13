import { useState, useCallback, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarRange,
  Settings2,
  GitBranch,
  Save,
  RefreshCcw,
  Milestone,
  Link2,
  Users,
  Calendar,
  Loader2,
  Sparkles,
  ArrowRight,
  Flag,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ── Types ── */
interface PlanningTask {
  id: string;
  name: string;
  phaseId: string;
  startDay: number;
  duration: number;
  status: "done" | "active" | "upcoming";
  deliverable?: string;
  dependsOn?: string[];
  isDeliverable?: boolean;
  isMilestone?: boolean;
}

interface Phase {
  id: string;
  name: string;
  color: string;
}

interface Constraint {
  id: string;
  type: "end_date" | "milestone" | "dependency" | "resource";
  label: string;
  enabled: boolean;
  value: string;
}

/* ── Templates ── */
const TEMPLATES: Record<string, { label: string; phases: Phase[]; tasks: PlanningTask[] }> = {
  "etude-enquete": {
    label: "Étude + enquête terrain",
    phases: [
      { id: "p1", name: "Cadrage", color: "bg-info" },
      { id: "p2", name: "Diagnostic", color: "bg-primary" },
      { id: "p3", name: "Enquête terrain", color: "bg-warning" },
      { id: "p4", name: "Analyse", color: "bg-accent-foreground" },
      { id: "p5", name: "Restitution", color: "bg-success" },
    ],
    tasks: [
      { id: "t1", name: "Réunion de lancement", phaseId: "p1", startDay: 0, duration: 5, status: "upcoming", isMilestone: true },
      { id: "t2", name: "Note de cadrage", phaseId: "p1", startDay: 5, duration: 10, status: "upcoming", deliverable: "Note de cadrage" },
      { id: "t3", name: "Revue documentaire", phaseId: "p2", startDay: 15, duration: 20, status: "upcoming" },
      { id: "t4", name: "Entretiens parties prenantes", phaseId: "p2", startDay: 20, duration: 15, status: "upcoming" },
      { id: "t5", name: "Rapport diagnostic", phaseId: "p2", startDay: 35, duration: 10, status: "upcoming", deliverable: "Rapport diagnostic", dependsOn: ["t3", "t4"] },
      { id: "t6", name: "Conception questionnaire", phaseId: "p3", startDay: 45, duration: 10, status: "upcoming", dependsOn: ["t5"] },
      { id: "t7", name: "Administration terrain", phaseId: "p3", startDay: 55, duration: 25, status: "upcoming", dependsOn: ["t6"] },
      { id: "t8", name: "Saisie & nettoyage", phaseId: "p3", startDay: 80, duration: 10, status: "upcoming", dependsOn: ["t7"] },
      { id: "t9", name: "Analyse statistique", phaseId: "p4", startDay: 90, duration: 20, status: "upcoming", dependsOn: ["t8"] },
      { id: "t10", name: "Rapport d'analyse", phaseId: "p4", startDay: 110, duration: 15, status: "upcoming", deliverable: "Rapport d'analyse", dependsOn: ["t9"] },
      { id: "t11", name: "Présentation résultats", phaseId: "p5", startDay: 125, duration: 5, status: "upcoming", isMilestone: true, dependsOn: ["t10"] },
      { id: "t12", name: "Rapport final", phaseId: "p5", startDay: 130, duration: 15, status: "upcoming", deliverable: "Rapport final", isDeliverable: true, dependsOn: ["t11"] },
    ],
  },
  "concertation-multi": {
    label: "Concertation publique multi-événements",
    phases: [
      { id: "p1", name: "Préparation", color: "bg-info" },
      { id: "p2", name: "Information", color: "bg-primary" },
      { id: "p3", name: "Concertation", color: "bg-warning" },
      { id: "p4", name: "Synthèse", color: "bg-accent-foreground" },
      { id: "p5", name: "Bilan", color: "bg-success" },
    ],
    tasks: [
      { id: "t1", name: "Cadrage dispositif", phaseId: "p1", startDay: 0, duration: 15, status: "upcoming" },
      { id: "t2", name: "Plan de concertation", phaseId: "p1", startDay: 10, duration: 10, status: "upcoming", deliverable: "Plan de concertation" },
      { id: "t3", name: "Supports d'information", phaseId: "p2", startDay: 20, duration: 15, status: "upcoming", dependsOn: ["t2"] },
      { id: "t4", name: "Réunion publique d'info", phaseId: "p2", startDay: 35, duration: 3, status: "upcoming", isMilestone: true, dependsOn: ["t3"] },
      { id: "t5", name: "Atelier participatif #1", phaseId: "p3", startDay: 45, duration: 5, status: "upcoming", dependsOn: ["t4"] },
      { id: "t6", name: "Atelier participatif #2", phaseId: "p3", startDay: 60, duration: 5, status: "upcoming", dependsOn: ["t5"] },
      { id: "t7", name: "Atelier participatif #3", phaseId: "p3", startDay: 75, duration: 5, status: "upcoming", dependsOn: ["t6"] },
      { id: "t8", name: "Permanence publique", phaseId: "p3", startDay: 55, duration: 30, status: "upcoming" },
      { id: "t9", name: "Analyse contributions", phaseId: "p4", startDay: 85, duration: 20, status: "upcoming", dependsOn: ["t7"] },
      { id: "t10", name: "Rapport de synthèse", phaseId: "p4", startDay: 105, duration: 15, status: "upcoming", deliverable: "Rapport de synthèse", dependsOn: ["t9"] },
      { id: "t11", name: "Bilan de concertation", phaseId: "p5", startDay: 120, duration: 10, status: "upcoming", deliverable: "Bilan", isDeliverable: true, dependsOn: ["t10"] },
    ],
  },
  "communication-multicanal": {
    label: "Communication multicanal",
    phases: [
      { id: "p1", name: "Stratégie", color: "bg-info" },
      { id: "p2", name: "Création", color: "bg-primary" },
      { id: "p3", name: "Déploiement", color: "bg-warning" },
      { id: "p4", name: "Évaluation", color: "bg-success" },
    ],
    tasks: [
      { id: "t1", name: "Diagnostic communication", phaseId: "p1", startDay: 0, duration: 15, status: "upcoming" },
      { id: "t2", name: "Stratégie & plan média", phaseId: "p1", startDay: 10, duration: 15, status: "upcoming", deliverable: "Stratégie com" },
      { id: "t3", name: "Création graphique", phaseId: "p2", startDay: 25, duration: 20, status: "upcoming", dependsOn: ["t2"] },
      { id: "t4", name: "Rédaction contenus", phaseId: "p2", startDay: 25, duration: 20, status: "upcoming", dependsOn: ["t2"] },
      { id: "t5", name: "Développement web", phaseId: "p2", startDay: 35, duration: 15, status: "upcoming", dependsOn: ["t3"] },
      { id: "t6", name: "Campagne print", phaseId: "p3", startDay: 50, duration: 20, status: "upcoming", dependsOn: ["t3", "t4"] },
      { id: "t7", name: "Campagne digitale", phaseId: "p3", startDay: 50, duration: 30, status: "upcoming", dependsOn: ["t5"] },
      { id: "t8", name: "Événementiel", phaseId: "p3", startDay: 60, duration: 15, status: "upcoming" },
      { id: "t9", name: "Mesure & reporting", phaseId: "p4", startDay: 80, duration: 15, status: "upcoming", dependsOn: ["t6", "t7"] },
      { id: "t10", name: "Rapport final", phaseId: "p4", startDay: 95, duration: 10, status: "upcoming", deliverable: "Rapport évaluation", isDeliverable: true, dependsOn: ["t9"] },
    ],
  },
  mixte: {
    label: "Mixte (étude + concertation + comm)",
    phases: [
      { id: "p1", name: "Cadrage", color: "bg-info" },
      { id: "p2", name: "Diagnostic / Étude", color: "bg-primary" },
      { id: "p3", name: "Concertation", color: "bg-warning" },
      { id: "p4", name: "Communication", color: "bg-accent-foreground" },
      { id: "p5", name: "Synthèse", color: "bg-success" },
    ],
    tasks: [
      { id: "t1", name: "Lancement projet", phaseId: "p1", startDay: 0, duration: 5, status: "upcoming", isMilestone: true },
      { id: "t2", name: "Note de cadrage", phaseId: "p1", startDay: 5, duration: 10, status: "upcoming", deliverable: "Note de cadrage" },
      { id: "t3", name: "Diagnostic territorial", phaseId: "p2", startDay: 15, duration: 30, status: "upcoming", dependsOn: ["t2"] },
      { id: "t4", name: "Enquête terrain", phaseId: "p2", startDay: 30, duration: 25, status: "upcoming" },
      { id: "t5", name: "Rapport diagnostic", phaseId: "p2", startDay: 55, duration: 10, status: "upcoming", deliverable: "Rapport diagnostic", dependsOn: ["t3", "t4"] },
      { id: "t6", name: "Ateliers concertation (x3)", phaseId: "p3", startDay: 65, duration: 30, status: "upcoming", dependsOn: ["t5"] },
      { id: "t7", name: "Réunion publique", phaseId: "p3", startDay: 80, duration: 5, status: "upcoming", isMilestone: true },
      { id: "t8", name: "Stratégie com", phaseId: "p4", startDay: 70, duration: 15, status: "upcoming" },
      { id: "t9", name: "Déploiement com", phaseId: "p4", startDay: 85, duration: 20, status: "upcoming", dependsOn: ["t8"] },
      { id: "t10", name: "Synthèse contributions", phaseId: "p5", startDay: 100, duration: 15, status: "upcoming", dependsOn: ["t6"] },
      { id: "t11", name: "Rapport final", phaseId: "p5", startDay: 115, duration: 15, status: "upcoming", deliverable: "Rapport final", isDeliverable: true, dependsOn: ["t10", "t9"] },
    ],
  },
};

const statusColors: Record<string, string> = {
  done: "bg-success/70",
  active: "bg-primary",
  upcoming: "bg-muted-foreground/30",
};

/* ── Helpers ── */
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Planning() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState("mixte");
  const [tasks, setTasks] = useState<PlanningTask[]>(TEMPLATES.mixte.tasks);
  const [phases, setPhases] = useState<Phase[]>(TEMPLATES.mixte.phases);
  const [startDate, setStartDate] = useState(new Date("2026-03-02"));
  const [versionName, setVersionName] = useState("v1 — baseline");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");

  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: "c1", type: "end_date", label: "Date de fin imposée", enabled: false, value: "2026-12-15" },
    { id: "c2", type: "milestone", label: "Jalon : Réunion publique avant S+12", enabled: false, value: "84" },
    { id: "c3", type: "dependency", label: "Respecter les dépendances", enabled: true, value: "" },
    { id: "c4", type: "resource", label: "Capacité ressource (nb personnes)", enabled: false, value: "3" },
  ]);

  const totalDays = useMemo(() => {
    if (tasks.length === 0) return 150;
    return Math.max(...tasks.map((t) => t.startDay + t.duration)) + 10;
  }, [tasks]);

  const monthHeaders = useMemo(() => {
    const headers: { label: string; startPct: number; widthPct: number }[] = [];
    let current = new Date(startDate);
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
  }, [startDate, totalDays]);

  const applyTemplate = (key: string) => {
    const tpl = TEMPLATES[key];
    if (!tpl) return;
    setSelectedTemplate(key);
    setPhases(tpl.phases);
    setTasks(tpl.tasks);
    toast.success(`Template "${tpl.label}" appliqué`);
  };

  const recalculateDates = useCallback(() => {
    const endDateConstraint = constraints.find((c) => c.type === "end_date" && c.enabled);
    const depConstraint = constraints.find((c) => c.type === "dependency" && c.enabled);
    const resourceConstraint = constraints.find((c) => c.type === "resource" && c.enabled);

    let updated = [...tasks];

    // Apply dependencies
    if (depConstraint) {
      const taskMap = new Map(updated.map((t) => [t.id, t]));
      const resolved = new Set<string>();
      const resolve = (t: PlanningTask) => {
        if (resolved.has(t.id)) return;
        if (t.dependsOn) {
          for (const depId of t.dependsOn) {
            const dep = taskMap.get(depId);
            if (dep) {
              resolve(dep);
              const depEnd = dep.startDay + dep.duration;
              if (t.startDay < depEnd) {
                t.startDay = depEnd;
              }
            }
          }
        }
        resolved.add(t.id);
      };
      updated.forEach(resolve);
    }

    // Resource leveling (simple: max N tasks in parallel)
    if (resourceConstraint) {
      const maxParallel = parseInt(resourceConstraint.value) || 3;
      updated.sort((a, b) => a.startDay - b.startDay);
      for (let i = 0; i < updated.length; i++) {
        const concurrent = updated.filter(
          (t, j) => j < i && t.startDay + t.duration > updated[i].startDay
        );
        if (concurrent.length >= maxParallel) {
          const earliestEnd = Math.min(...concurrent.map((t) => t.startDay + t.duration));
          updated[i].startDay = earliestEnd;
        }
      }
    }

    // Compress to end date
    if (endDateConstraint) {
      const targetEnd = daysBetween(startDate, new Date(endDateConstraint.value));
      const currentEnd = Math.max(...updated.map((t) => t.startDay + t.duration));
      if (currentEnd > targetEnd && currentEnd > 0) {
        const ratio = targetEnd / currentEnd;
        updated = updated.map((t) => ({
          ...t,
          startDay: Math.round(t.startDay * ratio),
          duration: Math.max(1, Math.round(t.duration * ratio)),
        }));
      }
    }

    setTasks(updated);
    toast.success("Dates recalculées avec les contraintes actives");
  }, [tasks, constraints, startDate]);

  const toggleConstraint = (id: string) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateConstraintValue = (id: string, value: string) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value } : c))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success(`ScheduleVersion "${versionName}" enregistrée !`);
  };

  const constraintIcons: Record<string, React.ElementType> = {
    end_date: Calendar,
    milestone: Flag,
    dependency: Link2,
    resource: Users,
  };

  const groupedTasks = useMemo(() => {
    return phases.map((phase) => ({
      phase,
      tasks: tasks.filter((t) => t.phaseId === phase.id),
    }));
  }, [phases, tasks]);

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <CalendarRange className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Planning</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Construisez et ajustez votre planning de mission
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-primary/30 text-primary gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              {versionName}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => navigate("/planning-ia")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ajuster avec IA
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="timeline" className="text-xs gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="template" className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Template
            </TabsTrigger>
            <TabsTrigger value="constraints" className="text-xs gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Contraintes
            </TabsTrigger>
          </TabsList>

          {/* ── Timeline Tab ── */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="glass-card p-5 overflow-x-auto">
              {/* Legend */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-sm">
                    Début : {formatDate(startDate)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Fin : {formatDate(addDays(startDate, totalDays))}
                  </span>
                  <span className="text-xs text-muted-foreground">({totalDays} jours)</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-success/70" />
                    Terminé
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                    En cours
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />
                    À venir
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flag className="h-3 w-3 text-warning" />
                    Jalon
                  </div>
                </div>
              </div>

              <div className="min-w-[800px]">
                {/* Month headers */}
                <div className="relative h-6 mb-2 border-b border-border/50">
                  {monthHeaders.map((mh, i) => (
                    <div
                      key={i}
                      className="absolute top-0 text-[10px] text-muted-foreground font-medium text-center border-l border-border/30 pl-1"
                      style={{ left: `${200 + ((mh.startPct / 100) * (100 - 20))}%`.replace(/^/, ''), width: `${mh.widthPct * 0.8}%` }}
                    >
                      {mh.label}
                    </div>
                  ))}
                </div>

                {/* Task rows grouped by phase */}
                {groupedTasks.map(({ phase, tasks: phaseTasks }) => (
                  <div key={phase.id} className="mb-1">
                    {/* Phase header */}
                    <div className="grid grid-cols-[200px_1fr] items-center py-1.5 bg-secondary/20 rounded-t px-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-sm ${phase.color}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {phase.name}
                        </span>
                      </div>
                      <div className="relative h-5">
                        {/* Phase bar */}
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

                    {/* Tasks */}
                    {phaseTasks.map((task) => (
                      <div
                        key={task.id}
                        className="grid grid-cols-[200px_1fr] items-center py-1 group hover:bg-secondary/10 rounded transition-colors"
                      >
                        <div className="pr-3 min-w-0 flex items-center gap-1.5 pl-5">
                          {task.isMilestone && <Flag className="h-3 w-3 text-warning shrink-0" />}
                          {task.isDeliverable && <Lock className="h-3 w-3 text-primary shrink-0" />}
                          <p className="text-xs truncate">{task.name}</p>
                        </div>
                        <div className="relative h-6">
                          {/* Grid lines */}
                          {monthHeaders.map((mh, mi) => (
                            <div
                              key={mi}
                              className="absolute top-0 h-full border-l border-border/10"
                              style={{ left: `${(mh.startPct / 100) * 100}%` }}
                            />
                          ))}
                          {/* Task bar */}
                          {task.isMilestone ? (
                            <div
                              className="absolute top-1 h-4 w-4 rotate-45 bg-warning border-2 border-background"
                              style={{
                                left: `${(task.startDay / totalDays) * 100}%`,
                              }}
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
                          {/* Duration label */}
                          <span
                            className="absolute top-0.5 text-[9px] text-muted-foreground"
                            style={{
                              left: `${((task.startDay + task.duration) / totalDays) * 100 + 0.5}%`,
                            }}
                          >
                            {task.duration}j
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">{tasks.length} tâches · {phases.length} phases</span>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde…</>
                ) : (
                  <><Save className="h-4 w-4" /> Enregistrer ScheduleVersion</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ── Template Tab ── */}
          <TabsContent value="template" className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Générer à partir d'un template
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <div
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplate === key
                        ? "border-primary bg-primary/5 glow-border"
                        : "border-border/50 bg-secondary/20 hover:border-border"
                    }`}
                  >
                    <h3 className="text-sm font-medium mb-1">{tpl.label}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tpl.phases.length} phases</span>
                      <span>·</span>
                      <span>{tpl.tasks.length} tâches</span>
                      <span>·</span>
                      <span>{tpl.tasks.filter((t) => t.deliverable).length} livrables</span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tpl.phases.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[9px] py-0">
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Date de début :</label>
                <input
                  type="date"
                  value={startDate.toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Constraints Tab ── */}
          <TabsContent value="constraints" className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Contraintes de planning
              </h2>

              <div className="space-y-3">
                {constraints.map((c) => {
                  const Icon = constraintIcons[c.type] || Settings2;
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        c.enabled ? "border-primary/30 bg-primary/5" : "border-border/30 bg-secondary/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${c.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium">{c.label}</span>
                        </div>
                        <Switch checked={c.enabled} onCheckedChange={() => toggleConstraint(c.id)} />
                      </div>
                      {c.enabled && c.type !== "dependency" && (
                        <div className="mt-3 pl-7">
                          {c.type === "end_date" && (
                            <input
                              type="date"
                              value={c.value}
                              onChange={(e) => updateConstraintValue(c.id, e.target.value)}
                              className="px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}
                          {c.type === "milestone" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Jour max :</span>
                              <input
                                type="number"
                                value={c.value}
                                onChange={(e) => updateConstraintValue(c.id, e.target.value)}
                                className="w-20 px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          )}
                          {c.type === "resource" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Nb personnes :</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={c.value}
                                onChange={(e) => updateConstraintValue(c.id, e.target.value)}
                                className="w-20 px-3 py-1.5 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={recalculateDates} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Recalculer les dates
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
