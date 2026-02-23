import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DBPhase = Tables<"phases">;
export type DBTask = Tables<"tasks">;
export type DBProject = Tables<"projects">;

export interface PlanningPhase {
  id: string;
  name: string;
  color: string;
  orderIndex: number;
  startDate?: string | null;
  endDate?: string | null;
  dbId?: string; // DB id if persisted
}

export interface PlanningTask {
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
  dbId?: string;
}

const PHASE_COLORS = [
  "bg-info", "bg-primary", "bg-warning", "bg-accent-foreground", "bg-success",
  "bg-destructive", "bg-info/70", "bg-primary/70",
];

export interface SavedVersion {
  id: string;
  version_name: string;
  reason: string | null;
  created_at: string;
  project_id: string;
  project_name?: string;
}

export interface AllPlanningEntry {
  id: string;
  version_name: string;
  reason: string | null;
  created_at: string;
  project_id: string;
  project_name: string;
}

export function usePlanningData() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [phases, setPhases] = useState<PlanningPhase[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [versionName, setVersionName] = useState("v1 — baseline");
  const [startDate, setStartDate] = useState(new Date());
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const [allPlannings, setAllPlannings] = useState<AllPlanningEntry[]>([]);

  // Load projects and all plannings on mount
  const loadAllPlannings = useCallback(async () => {
    const { data } = await supabase
      .from("schedule_versions")
      .select("*, projects(name)")
      .order("created_at", { ascending: false });
    if (data) {
      setAllPlannings(data.map((v: any) => ({
        id: v.id,
        version_name: v.version_name,
        reason: v.reason,
        created_at: v.created_at,
        project_id: v.project_id,
        project_name: v.projects?.name || "Projet inconnu",
      })));
    }
  }, []);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data);
      });
    loadAllPlannings();
  }, [loadAllPlannings]);

  // Load saved versions for a project
  const loadVersions = useCallback(async (pid: string) => {
    const { data } = await supabase
      .from("schedule_versions")
      .select("*")
      .eq("project_id", pid)
      .order("created_at", { ascending: false });
    if (data) {
      setSavedVersions(data.map((v) => ({
        id: v.id,
        version_name: v.version_name,
        reason: v.reason,
        created_at: v.created_at,
        project_id: v.project_id,
      })));
    }
  }, []);

  // Load planning data for selected project
  const loadPlanning = useCallback(async (pid: string) => {
    setIsLoading(true);
    try {
      const [{ data: dbPhases }, { data: dbTasks }] = await Promise.all([
        supabase
          .from("phases")
          .select("*")
          .eq("project_id", pid)
          .is("deleted_at", null)
          .order("order_index"),
        supabase
          .from("tasks")
          .select("*")
          .eq("project_id", pid)
          .is("deleted_at", null)
          .order("created_at"),
      ]);

      if (dbPhases && dbPhases.length > 0) {
        setPhases(
          dbPhases.map((p, i) => ({
            id: p.id,
            name: p.name,
            color: PHASE_COLORS[i % PHASE_COLORS.length],
            orderIndex: p.order_index,
            startDate: p.start_date,
            endDate: p.end_date,
            dbId: p.id,
          }))
        );
      }

      if (dbTasks && dbTasks.length > 0) {
        // Find project start reference
        const earliestStart = dbTasks
          .filter((t) => t.start_date)
          .map((t) => new Date(t.start_date!).getTime())
          .sort((a, b) => a - b)[0];
        
        const refDate = earliestStart ? new Date(earliestStart) : new Date();
        setStartDate(refDate);

        setTasks(
          dbTasks.map((t) => {
            const tStart = t.start_date ? new Date(t.start_date) : refDate;
            const dayOffset = Math.round(
              (tStart.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const deps = Array.isArray(t.dependencies_json)
              ? (t.dependencies_json as string[])
              : [];
            return {
              id: t.id,
              name: t.name,
              phaseId: t.phase_id,
              startDay: Math.max(0, dayOffset),
              duration: t.duration_days || 5,
              status: t.status === "terminé" ? "done" : t.status === "en_cours" ? "active" : "upcoming",
              dependsOn: deps.length > 0 ? deps : undefined,
              dbId: t.id,
            };
          })
        );
      }
    } catch (err) {
      console.error("Error loading planning:", err);
      toast.error("Erreur lors du chargement du planning");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback(
    (pid: string | null) => {
      setProjectId(pid);
      if (pid) {
        loadPlanning(pid);
        loadVersions(pid);
      } else {
        // Reset to empty for standalone mode
        setPhases([]);
        setTasks([]);
        setSavedVersions([]);
      }
    },
    [loadPlanning, loadVersions]
  );

  // Add phase
  const addPhase = useCallback(
    (name: string) => {
      const newPhase: PlanningPhase = {
        id: crypto.randomUUID(),
        name,
        color: PHASE_COLORS[phases.length % PHASE_COLORS.length],
        orderIndex: phases.length,
      };
      setPhases((prev) => [...prev, newPhase]);
      return newPhase;
    },
    [phases.length]
  );

  // Update phase
  const updatePhase = useCallback((id: string, updates: Partial<PlanningPhase>) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  // Delete phase
  const deletePhase = useCallback(
    (id: string) => {
      setPhases((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.filter((t) => t.phaseId !== id));
    },
    []
  );

  // Add task
  const addTask = useCallback(
    (task: Omit<PlanningTask, "id">) => {
      const newTask: PlanningTask = { ...task, id: crypto.randomUUID() };
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    },
    []
  );

  // Update task
  const updateTask = useCallback((id: string, updates: Partial<PlanningTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  // Delete task
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Retroplanning: calculate backwards from end date
  const calculateRetroPlanning = useCallback(
    (endDate: Date) => {
      if (tasks.length === 0) return;

      const totalDuration = Math.max(...tasks.map((t) => t.startDay + t.duration));
      const endDay = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Build dependency graph
      const taskMap = new Map(tasks.map((t) => [t.id, { ...t }]));
      const updated: PlanningTask[] = [];

      // Sort tasks by end day descending (start from the last ones)
      const sorted = [...tasks].sort((a, b) => (b.startDay + b.duration) - (a.startDay + a.duration));

      // Calculate shift: move the last task to end at endDay
      const shift = endDay - totalDuration;

      sorted.forEach((t) => {
        const newT = { ...t, startDay: t.startDay + shift };
        updated.push(newT);
      });

      // Apply dependencies backwards
      const resolvedMap = new Map(updated.map((t) => [t.id, t]));
      
      // Forward pass to ensure dependencies are respected
      const resolve = (task: PlanningTask, visited: Set<string>) => {
        if (visited.has(task.id)) return;
        visited.add(task.id);
        
        if (task.dependsOn) {
          for (const depId of task.dependsOn) {
            const dep = resolvedMap.get(depId);
            if (dep) {
              resolve(dep, visited);
              const depEnd = dep.startDay + dep.duration;
              if (task.startDay < depEnd) {
                task.startDay = depEnd;
              }
            }
          }
        }
      };

      const visited = new Set<string>();
      updated.forEach((t) => {
        resolvedMap.set(t.id, t);
        resolve(t, visited);
      });

      setTasks(updated);
      
      // Update start date to earliest task
      const earliestDay = Math.min(...updated.map((t) => t.startDay));
      if (earliestDay < 0) {
        const newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() + earliestDay);
        setStartDate(newStart);
        setTasks(updated.map((t) => ({ ...t, startDay: t.startDay - earliestDay })));
      }

      toast.success("Retroplanning calculé à partir de la date de fin");
    },
    [tasks, startDate]
  );

  // Forward planning: calculate from start date with dependencies
  const calculateForwardPlanning = useCallback(() => {
    if (tasks.length === 0) return;

    const updated = tasks.map((t) => ({ ...t }));
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
    setTasks(updated);
    toast.success("Planning recalculé en mode forward");
  }, [tasks]);

  // Save everything to DB
  const savePlanning = useCallback(async (reason?: string) => {
    if (!projectId) {
      toast.error("Sélectionnez un projet pour sauvegarder");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upsert phases
      for (const phase of phases) {
        const phaseData: TablesInsert<"phases"> = {
          id: phase.dbId || phase.id,
          name: phase.name,
          project_id: projectId,
          order_index: phase.orderIndex,
          start_date: phase.startDate || null,
          end_date: phase.endDate || null,
        };

        const { error } = await supabase.from("phases").upsert(phaseData);
        if (error) throw error;
        
        // Mark as persisted
        if (!phase.dbId) phase.dbId = phase.id;
      }

      // 2. Upsert tasks
      for (const task of tasks) {
        const taskStart = new Date(startDate);
        taskStart.setDate(taskStart.getDate() + task.startDay);
        const taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + task.duration);

        const taskData: TablesInsert<"tasks"> = {
          id: task.dbId || task.id,
          name: task.name,
          phase_id: task.phaseId,
          project_id: projectId,
          duration_days: task.duration,
          start_date: taskStart.toISOString().split("T")[0],
          end_date: taskEnd.toISOString().split("T")[0],
          status: task.status === "done" ? "terminé" : task.status === "active" ? "en_cours" : "à_faire",
          dependencies_json: task.dependsOn || [],
        };

        const { error } = await supabase.from("tasks").upsert(taskData);
        if (error) throw error;

        if (!task.dbId) task.dbId = task.id;
      }

      // 3. Create schedule version
      const { error: vError } = await supabase.from("schedule_versions").insert({
        project_id: projectId,
        version_name: versionName,
        reason: reason || "Sauvegarde manuelle",
      });
      if (vError) throw vError;

      toast.success(`Planning "${versionName}" sauvegardé !`);
      // Refresh versions list
      if (projectId) loadVersions(projectId);
      loadAllPlannings();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, phases, tasks, startDate, versionName, loadVersions, loadAllPlannings]);

  // Import AI-generated planning
  const importAIPlan = useCallback(
    (aiPhases: { name: string; tasks: { name: string; duration: number; deliverable?: string }[] }[]) => {
      const newPhases: PlanningPhase[] = [];
      const newTasks: PlanningTask[] = [];
      let currentDay = 0;

      aiPhases.forEach((ap, pi) => {
        const phaseId = crypto.randomUUID();
        newPhases.push({
          id: phaseId,
          name: ap.name,
          color: PHASE_COLORS[pi % PHASE_COLORS.length],
          orderIndex: pi,
        });

        ap.tasks.forEach((at) => {
          const taskId = crypto.randomUUID();
          newTasks.push({
            id: taskId,
            name: at.name,
            phaseId,
            startDay: currentDay,
            duration: at.duration,
            status: "upcoming",
            deliverable: at.deliverable,
          });
          currentDay += at.duration;
        });
      });

      setPhases(newPhases);
      setTasks(newTasks);
      toast.success(`${newPhases.length} phases et ${newTasks.length} tâches importées de l'IA`);
    },
    []
  );

  return {
    projectId,
    projects,
    phases,
    tasks,
    isLoading,
    isSaving,
    versionName,
    startDate,
    savedVersions,
    allPlannings,
    setStartDate,
    setVersionName,
    selectProject,
    addPhase,
    updatePhase,
    deletePhase,
    addTask,
    updateTask,
    deleteTask,
    setTasks,
    setPhases,
    calculateRetroPlanning,
    calculateForwardPlanning,
    savePlanning,
    importAIPlan,
    loadPlanning,
    loadAllPlannings,
  };
}
