import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

const livrablesData = [
  { id: "l1", name: "Note méthodologique", project: "Mobilité Grand Ouest", phase: "Phase 1", status: "validé", progress: 100, dueDate: "15 fév 2026" },
  { id: "l2", name: "Rapport diagnostic", project: "Mobilité Grand Ouest", phase: "Phase 2", status: "en cours", progress: 60, dueDate: "30 avr 2026" },
  { id: "l3", name: "Cartographie des flux", project: "Mobilité Grand Ouest", phase: "Phase 2", status: "en cours", progress: 40, dueDate: "15 mai 2026" },
  { id: "l4", name: "CCTP annoté", project: "PLUi Littoral", phase: "Phase 1", status: "en cours", progress: 80, dueDate: "20 mar 2026" },
  { id: "l5", name: "Synthèse concertation", project: "PLUi Littoral", phase: "Phase 2", status: "à venir", progress: 0, dueDate: "30 jun 2026" },
  { id: "l6", name: "Rapport final enquête", project: "ZAC Centre", phase: "Phase 4", status: "en retard", progress: 75, dueDate: "10 fév 2026" },
  { id: "l7", name: "Bilan de concertation", project: "ZAC Centre", phase: "Phase 4", status: "en cours", progress: 50, dueDate: "25 fév 2026" },
];

const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  validé: { icon: CheckCircle2, className: "bg-success/15 text-success" },
  "en cours": { icon: Clock, className: "bg-primary/15 text-primary" },
  "à venir": { icon: Clock, className: "bg-muted text-muted-foreground" },
  "en retard": { icon: AlertCircle, className: "bg-destructive/15 text-destructive" },
};

export default function Livrables() {
  const [deleteTarget, setDeleteTarget] = useState<(typeof livrablesData)[0] | null>(null);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.name, type: "livrable" });
    setDeleteTarget(null);
  };

  const visibleLivrables = livrablesData.filter((l) => !isDeleted(l.id));

  const renderList = (items: typeof visibleLivrables) =>
    items.map((l) => {
      const config = statusConfig[l.status];
      const Icon = config.icon;
      return (
        <div key={l.id} className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${l.status === "validé" ? "text-success" : l.status === "en retard" ? "text-destructive" : "text-primary"}`} />
              <div className="min-w-0">
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{l.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{l.project} · {l.phase}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:block">{l.dueDate}</span>
              <Badge variant="secondary" className={`${config.className} border-0 text-[11px]`}>
                {l.status}
              </Badge>
              <EntityActions
                entityName={l.name}
                onEdit={() => toast.info("Modifier : " + l.name)}
                onRename={() => toast.info("Renommer : " + l.name)}
                onDuplicate={() => toast.info("Dupliquer : " + l.name)}
                onDelete={() => setDeleteTarget(l)}
              />
            </div>
          </div>
          {l.progress > 0 && l.progress < 100 && (
            <div className="mt-3 flex items-center gap-3 pl-7">
              <Progress value={l.progress} className="flex-1 h-1" />
              <span className="text-[11px] text-muted-foreground w-8 text-right">{l.progress}%</span>
            </div>
          )}
        </div>
      );
    });

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Livrables</h1>
            <p className="text-muted-foreground text-sm mt-1">Suivi de la production et validation</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Ajouter un livrable
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="en cours">En cours</TabsTrigger>
            <TabsTrigger value="en retard">En retard</TabsTrigger>
            <TabsTrigger value="validé">Validés</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            {renderList(visibleLivrables)}
          </TabsContent>
          <TabsContent value="en cours" className="mt-4 space-y-3">
            {renderList(visibleLivrables.filter((l) => l.status === "en cours"))}
          </TabsContent>
          <TabsContent value="en retard" className="mt-4 space-y-3">
            {renderList(visibleLivrables.filter((l) => l.status === "en retard"))}
          </TabsContent>
          <TabsContent value="validé" className="mt-4 space-y-3">
            {renderList(visibleLivrables.filter((l) => l.status === "validé"))}
          </TabsContent>
        </Tabs>
      </div>

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le livrable"
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
