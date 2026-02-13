import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Lock, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: string;
  type: string;
  phases: number;
  currentPhase: number;
  team: number;
  startDate: string;
  endDate: string;
  relatedCount: number;
  isArchived: boolean;
  impactDetails: { contributions: number; documents: number; phases: number; tâches: number; livrables: number; KPI: number };
}

const projectsData: ProjectData[] = [
  { id: "p1", name: "Étude mobilité Grand Ouest", client: "Métropole de Nantes", progress: 65, status: "En cours", type: "Étude", phases: 4, currentPhase: 2, team: 5, startDate: "Jan 2026", endDate: "Juin 2026", relatedCount: 12, isArchived: false, impactDetails: { contributions: 312, documents: 14, phases: 4, tâches: 18, livrables: 6, KPI: 4 } },
  { id: "p2", name: "Concertation PLUi Littoral", client: "CC Côte d'Opale", progress: 30, status: "En cours", type: "Concertation", phases: 5, currentPhase: 1, team: 3, startDate: "Mars 2026", endDate: "Sept 2026", relatedCount: 8, isArchived: false, impactDetails: { contributions: 47, documents: 5, phases: 5, tâches: 10, livrables: 3, KPI: 2 } },
  { id: "p3", name: "Enquête publique ZAC Centre", client: "Ville de Bordeaux", progress: 90, status: "Finalisation", type: "Communication", phases: 4, currentPhase: 4, team: 4, startDate: "Oct 2025", endDate: "Fév 2026", relatedCount: 15, isArchived: false, impactDetails: { contributions: 85, documents: 22, phases: 4, tâches: 14, livrables: 7, KPI: 3 } },
  { id: "p4", name: "Schéma directeur Énergie", client: "Région Bretagne", progress: 10, status: "Démarrage", type: "Étude", phases: 6, currentPhase: 0, team: 6, startDate: "Fév 2026", endDate: "Déc 2026", relatedCount: 4, isArchived: false, impactDetails: { contributions: 0, documents: 2, phases: 6, tâches: 4, livrables: 1, KPI: 1 } },
];

const typeColors: Record<string, string> = {
  Étude: "bg-info/15 text-info",
  Concertation: "bg-primary/15 text-primary",
  Communication: "bg-success/15 text-success",
};

export default function Projects() {
  const [projects, setProjects] = useState(projectsData);
  const [deleteTarget, setDeleteTarget] = useState<ProjectData | null>(null);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.name, type: "projet" });
    setDeleteTarget(null);
  };

  const handleArchive = (project: ProjectData) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, isArchived: !p.isArchived, status: !p.isArchived ? "Archivé" : "En cours" } : p
      )
    );
    toast.success(
      project.isArchived
        ? `"${project.name}" désarchivé`
        : `"${project.name}" archivé — lecture seule activée`
    );
  };

  const visibleProjects = projects.filter((p) => !isDeleted(p.id));

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Projets</h1>
            <p className="text-muted-foreground text-sm mt-1">Gérez vos missions et projets</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un projet..." className="pl-9 bg-secondary/50" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleProjects.map((project) => (
            <div
              key={project.id}
              className={`glass-card p-5 transition-all cursor-pointer group animate-slide-up ${
                project.isArchived
                  ? "border-muted/50 opacity-75"
                  : "hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {project.isArchived && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <h3 className="font-heading font-semibold group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">{project.client}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {project.isArchived ? (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 gap-1">
                      <Archive className="h-3 w-3" />
                      Archivé
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className={`${typeColors[project.type]} border-0`}>
                      {project.type}
                    </Badge>
                  )}
                  <EntityActions
                    entityName={project.name}
                    readOnly={project.isArchived}
                    isArchived={project.isArchived}
                    onEdit={project.isArchived ? undefined : () => toast.info("Modifier : " + project.name)}
                    onRename={project.isArchived ? undefined : () => toast.info("Renommer : " + project.name)}
                    onDuplicate={project.isArchived ? undefined : () => toast.info("Dupliquer : " + project.name)}
                    onArchive={() => handleArchive(project)}
                    onDelete={project.isArchived ? undefined : () => setDeleteTarget(project)}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Progress value={project.progress} className="flex-1 h-1.5" />
                <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                  {project.progress}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Phase</p>
                  <p className="font-medium mt-0.5">{project.currentPhase}/{project.phases}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Équipe</p>
                  <p className="font-medium mt-0.5">{project.team} pers.</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Période</p>
                  <p className="font-medium mt-0.5">{project.startDate} → {project.endDate}</p>
                </div>
              </div>

              {project.isArchived && (
                <div className="mt-3 p-2 rounded bg-muted/50 text-[11px] text-muted-foreground text-center">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Projet en lecture seule — Seul un Admin peut désarchiver
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le projet"
          relatedCount={deleteTarget.relatedCount}
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
