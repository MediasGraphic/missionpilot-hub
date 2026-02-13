import { useState } from "react";
import Layout from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

const kpisData = [
  { id: "k1", label: "Taux d'avancement global", value: 48, target: 55, unit: "%", trend: "down" },
  { id: "k2", label: "Livrables validés", value: 4, target: 6, unit: "", trend: "stable" },
  { id: "k3", label: "Respect des délais", value: 72, target: 90, unit: "%", trend: "down" },
  { id: "k4", label: "Taux de participation (concertation)", value: 85, target: 70, unit: "%", trend: "up" },
  { id: "k5", label: "Satisfaction client", value: 4.2, target: 4.0, unit: "/5", trend: "up" },
  { id: "k6", label: "Budget consommé", value: 42, target: 50, unit: "%", trend: "stable" },
];

const trendIcons: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors: Record<string, string> = {
  up: "text-success",
  down: "text-destructive",
  stable: "text-muted-foreground",
};

export default function KPI() {
  const [deleteTarget, setDeleteTarget] = useState<(typeof kpisData)[0] | null>(null);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.label, type: "kpi" });
    setDeleteTarget(null);
  };

  const visibleKpis = kpisData.filter((k) => !isDeleted(k.id));

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Indicateurs (KPI)</h1>
            <p className="text-muted-foreground text-sm mt-1">Performance et suivi des objectifs</p>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px] bg-secondary/50">
              <SelectValue placeholder="Projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              <SelectItem value="mobilite">Mobilité Grand Ouest</SelectItem>
              <SelectItem value="plui">PLUi Littoral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleKpis.map((kpi) => {
            const TrendIcon = trendIcons[kpi.trend];
            const isAboveTarget = kpi.value >= kpi.target;
            return (
              <div key={kpi.id} className="glass-card p-5 animate-slide-up">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-medium leading-tight flex-1">{kpi.label}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendIcon className={`h-4 w-4 ${trendColors[kpi.trend]}`} />
                    <EntityActions
                      entityName={kpi.label}
                      onEdit={() => toast.info("Modifier : " + kpi.label)}
                      onRename={() => toast.info("Renommer : " + kpi.label)}
                      onDuplicate={() => toast.info("Dupliquer : " + kpi.label)}
                      onDelete={() => setDeleteTarget(kpi)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-bold">{kpi.value}</span>
                  <span className="text-muted-foreground text-sm">{kpi.unit}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Objectif : {kpi.target}{kpi.unit}</span>
                    <span className={isAboveTarget ? "text-success" : "text-warning"}>
                      {isAboveTarget ? "Atteint" : "En dessous"}
                    </span>
                  </div>
                  <Progress
                    value={kpi.unit === "%" ? kpi.value : (kpi.value / kpi.target) * 100}
                    className="h-1.5"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.label}
          entityType="le KPI"
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
