import { useState } from "react";
import Layout from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, EyeOff, Plus, Loader2 } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { RenameDialog } from "@/components/RenameDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Kpi = Tables<"kpis">;

export default function KPI() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Kpi | null>(null);
  const [renameTarget, setRenameTarget] = useState<Kpi | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [newFrequency, setNewFrequency] = useState("Mensuel");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").is("deleted_at", null).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: kpis = [], isLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kpis")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; target: number; project_id: string; frequency: string }) => {
      const { data, error } = await supabase.from("kpis").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      setAddOpen(false);
      setNewName(""); setNewTarget(""); setNewProjectId(""); setNewFrequency("Mensuel");
      toast.success(`KPI "${data.name}" créé !`);
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("kpis").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      setRenameTarget(null);
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kpis").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      setDeleteTarget(null);
      toast.success("KPI déplacé dans la corbeille");
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error("Le nom est obligatoire"); return; }
    if (!newProjectId) { toast.error("Sélectionnez un projet"); return; }
    createMutation.mutate({
      name: newName.trim(),
      target: parseFloat(newTarget) || 0,
      project_id: newProjectId,
      frequency: newFrequency,
    });
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Indicateurs (KPI)</h1>
            <p className="text-muted-foreground text-sm mt-1">Performance et suivi des objectifs</p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau KPI
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : kpis.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <h3 className="font-heading text-lg font-semibold text-muted-foreground">Aucun KPI</h3>
            <p className="text-sm text-muted-foreground mt-1">Créez votre premier indicateur.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => {
              const targetVal = Number(kpi.target) || 0;
              return (
                <div key={kpi.id} className="glass-card p-5 animate-slide-up">
                  <div className="flex items-start justify-between">
                    <p className="text-muted-foreground text-xs font-medium leading-tight truncate flex-1 min-w-0">
                      {kpi.name}
                    </p>
                    <EntityActions
                      entityName={kpi.name}
                      onRename={() => setRenameTarget(kpi)}
                      onDelete={() => setDeleteTarget(kpi)}
                    />
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-heading text-3xl font-bold">{targetVal}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>Objectif : {targetVal}</span>
                      <span>{kpi.frequency || "—"}</span>
                    </div>
                    <Progress value={50} className="h-1.5" />
                  </div>
                  {kpi.definition && (
                    <p className="mt-3 pt-2 border-t border-border/30 text-[11px] text-muted-foreground line-clamp-2">
                      {kpi.definition}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add KPI dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Nouveau KPI</DialogTitle>
            <DialogDescription>Créez un nouvel indicateur de performance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Taux de participation..." autoFocus className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Projet *</Label>
              <Select value={newProjectId} onValueChange={setNewProjectId}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Objectif</Label>
                <Input type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="100" className="bg-secondary/30" />
              </div>
              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={newFrequency} onValueChange={setNewFrequency}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quotidien">Quotidien</SelectItem>
                    <SelectItem value="Hebdomadaire">Hebdomadaire</SelectItem>
                    <SelectItem value="Mensuel">Mensuel</SelectItem>
                    <SelectItem value="Trimestriel">Trimestriel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ""}
        entityType="le KPI"
        onConfirm={(newNameVal) => renameTarget && renameMutation.mutate({ id: renameTarget.id, name: newNameVal })}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le KPI"
          onConfirm={() => deleteTarget && softDeleteMutation.mutate(deleteTarget.id)}
        />
      )}
    </Layout>
  );
}
