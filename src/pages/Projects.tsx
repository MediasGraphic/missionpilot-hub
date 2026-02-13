import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Lock, Archive, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

const statusLabels: Record<string, string> = {
  brouillon: "Démarrage",
  actif: "En cours",
  en_pause: "En pause",
  terminé: "Finalisation",
  archivé: "Archivé",
};

const domainColors: Record<string, string> = {
  Mobilité: "bg-info/15 text-info",
  Urbanisme: "bg-primary/15 text-primary",
  Communication: "bg-success/15 text-success",
  Énergie: "bg-warning/15 text-warning",
};

export default function Projects() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; client: string; description: string; domain: string; start_date: string; end_date: string }) => {
      const { data, error } = await supabase.from("projects").insert({
        name: input.name,
        client: input.client || null,
        description: input.description || null,
        domain: input.domain || null,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        status: "brouillon",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setAddOpen(false);
      toast.success(`Projet "${data.name}" créé !`);
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("projects").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setRenameTarget(null);
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteTarget(null);
      toast.success("Projet déplacé dans la corbeille");
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase.from("projects").update({ status: archive ? "archivé" : "actif" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(vars.archive ? "Projet archivé" : "Projet désarchivé");
    },
  });

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Projets</h1>
            <p className="text-muted-foreground text-sm mt-1">Gérez vos missions et projets</p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un projet..." className="pl-9 bg-secondary/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <h3 className="font-heading text-lg font-semibold text-muted-foreground">Aucun projet</h3>
            <p className="text-sm text-muted-foreground mt-1">Créez votre premier projet pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((project) => {
              const isArchived = project.status === "archivé";
              return (
                <div
                  key={project.id}
                  className={`glass-card p-5 transition-all cursor-pointer group animate-slide-up ${
                    isArchived ? "border-muted/50 opacity-75" : "hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isArchived && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                        <h3 className="font-heading font-semibold group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm mt-0.5">{project.client || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isArchived ? (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 gap-1">
                          <Archive className="h-3 w-3" /> Archivé
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className={`${domainColors[project.domain || ""] || "bg-secondary text-secondary-foreground"} border-0`}>
                          {project.domain || statusLabels[project.status] || project.status}
                        </Badge>
                      )}
                      <EntityActions
                        entityName={project.name}
                        readOnly={isArchived}
                        isArchived={isArchived}
                        onRename={isArchived ? undefined : () => setRenameTarget(project)}
                        onArchive={() => archiveMutation.mutate({ id: project.id, archive: !isArchived })}
                        onDelete={isArchived ? undefined : () => setDeleteTarget(project)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <p className="font-medium mt-0.5">{statusLabels[project.status] || project.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Période</p>
                      <p className="font-medium mt-0.5">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"}
                        {" → "}
                        {project.end_date ? new Date(project.end_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>

                  {project.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  )}

                  {isArchived && (
                    <div className="mt-3 p-2 rounded bg-muted/50 text-[11px] text-muted-foreground text-center">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Projet en lecture seule
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddProjectDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onConfirm={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ""}
        entityType="le projet"
        onConfirm={(newName) => renameTarget && renameMutation.mutate({ id: renameTarget.id, name: newName })}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le projet"
          onConfirm={() => deleteTarget && softDeleteMutation.mutate(deleteTarget.id)}
        />
      )}
    </Layout>
  );
}
