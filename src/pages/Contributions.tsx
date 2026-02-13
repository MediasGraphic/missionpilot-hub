import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Copy,
  XCircle,
  BarChart3,
  MessageSquare,
  FileDown,
} from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

interface Contribution {
  id: string;
  content: string;
  channel: string;
  theme: string;
  status: "brut" | "traité" | "doublon" | "incomplet";
  quality: number;
  respondent?: string;
  date: string;
  project: string;
  suiteApportee?: string;
}

const contributionsData: Contribution[] = [
  { id: "c1", content: "Il manque des pistes cyclables sécurisées sur l'axe principal", channel: "Questionnaire", theme: "Mobilité", status: "traité", quality: 90, date: "2026-02-12", project: "Mobilité Grand Ouest", suiteApportee: "Intégré au diagnostic" },
  { id: "c2", content: "Problème de stationnement sauvage devant l'école", channel: "Atelier", theme: "Sécurité", status: "traité", quality: 85, date: "2026-02-11", project: "Mobilité Grand Ouest", suiteApportee: "Transmis au service voirie" },
  { id: "c3", content: "Pas assez d'espaces verts dans le quartier sud", channel: "Boîte à idées", theme: "Cadre de vie", status: "brut", quality: 70, date: "2026-02-10", project: "PLUi Littoral" },
  { id: "c4", content: "Il manque des pistes cyclables sécurisées", channel: "Registre", theme: "Mobilité", status: "doublon", quality: 50, date: "2026-02-09", project: "Mobilité Grand Ouest" },
  { id: "c5", content: "...", channel: "Web", theme: "Non classé", status: "incomplet", quality: 10, date: "2026-02-08", project: "ZAC Centre" },
  { id: "c6", content: "Le bruit des camions est insupportable la nuit", channel: "Email", theme: "Nuisances", status: "brut", quality: 80, date: "2026-02-07", project: "ZAC Centre" },
  { id: "c7", content: "On aimerait un marché bio le dimanche", channel: "Questionnaire", theme: "Commerce", status: "traité", quality: 75, date: "2026-02-06", project: "PLUi Littoral", suiteApportee: "Proposition retenue pour étude de faisabilité" },
];

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  brut: { label: "Brut", className: "bg-muted text-muted-foreground", icon: MessageSquare },
  traité: { label: "Traité", className: "bg-success/15 text-success", icon: CheckCircle2 },
  doublon: { label: "Doublon", className: "bg-warning/15 text-warning", icon: Copy },
  incomplet: { label: "Incomplet", className: "bg-destructive/15 text-destructive", icon: XCircle },
};

export default function Contributions() {
  const [contributions, setContributions] = useState(contributionsData);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Contribution | null>(null);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.content.slice(0, 40), type: "contribution" });
    setDeleteTarget(null);
  };

  const handleMarkAs = (id: string, status: Contribution["status"]) => {
    setContributions((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success(`Contribution marquée comme "${statusConfig[status].label}"`);
  };

  const visible = contributions.filter(
    (c) =>
      !isDeleted(c.id) &&
      (!search || c.content.toLowerCase().includes(search.toLowerCase()) || c.theme.toLowerCase().includes(search.toLowerCase()))
  );

  const themes = [...new Set(contributions.map((c) => c.theme))];
  const themeStats = themes.map((t) => ({
    theme: t,
    count: visible.filter((c) => c.theme === t).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Contributions & Qualité</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Analyse, tri et suivi des contributions collectées
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <FileDown className="h-3.5 w-3.5" />
            Exporter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-3 text-center">
            <span className="font-heading text-2xl font-bold text-primary">{visible.length}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
          </div>
          <div className="glass-card p-3 text-center">
            <span className="font-heading text-2xl font-bold text-success">{visible.filter((c) => c.status === "traité").length}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Traitées</p>
          </div>
          <div className="glass-card p-3 text-center">
            <span className="font-heading text-2xl font-bold text-warning">{visible.filter((c) => c.status === "doublon").length}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Doublons</p>
          </div>
          <div className="glass-card p-3 text-center">
            <span className="font-heading text-2xl font-bold text-destructive">{visible.filter((c) => c.status === "incomplet").length}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Incomplets</p>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all" className="text-xs">Toutes</TabsTrigger>
            <TabsTrigger value="brut" className="text-xs">Brutes</TabsTrigger>
            <TabsTrigger value="themes" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              Par thème
            </TabsTrigger>
            <TabsTrigger value="suites" className="text-xs">Suites apportées</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>

            {visible.map((c) => {
              const cfg = statusConfig[c.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={c.id} className="glass-card p-4 animate-slide-up">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-[10px] border-0 ${cfg.className}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{c.theme}</Badge>
                        <Badge variant="secondary" className="text-[10px] bg-secondary border-0">{c.channel}</Badge>
                      </div>
                      <p className="text-sm">{c.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span>{c.project}</span>
                        <span>·</span>
                        <span>{c.date}</span>
                        <span>·</span>
                        <span>Qualité : {c.quality}%</span>
                      </div>
                      {c.suiteApportee && (
                        <div className="mt-2 p-2 rounded bg-success/5 border border-success/20 text-xs text-success">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          Suite : {c.suiteApportee}
                        </div>
                      )}
                    </div>
                    <EntityActions
                      entityName={c.content.slice(0, 30)}
                      onEdit={() => toast.info("Modifier contribution")}
                      onDelete={() => setDeleteTarget(c)}
                    />
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="brut" className="mt-4 space-y-3">
            {visible.filter((c) => c.status === "brut").map((c) => (
              <div key={c.id} className="glass-card p-4 animate-slide-up">
                <p className="text-sm mb-2">{c.content}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs gap-1 text-success border-success/30" onClick={() => handleMarkAs(c.id, "traité")}>
                    <CheckCircle2 className="h-3 w-3" /> Traiter
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1 text-warning border-warning/30" onClick={() => handleMarkAs(c.id, "doublon")}>
                    <Copy className="h-3 w-3" /> Doublon
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1 text-destructive border-destructive/30" onClick={() => handleMarkAs(c.id, "incomplet")}>
                    <XCircle className="h-3 w-3" /> Incomplet
                  </Button>
                </div>
              </div>
            ))}
            {visible.filter((c) => c.status === "brut").length === 0 && (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                Toutes les contributions ont été traitées.
              </div>
            )}
          </TabsContent>

          <TabsContent value="themes" className="mt-4 space-y-3">
            {themeStats.map((t) => (
              <div key={t.theme} className="glass-card p-4 flex items-center gap-4">
                <Badge variant="outline" className="shrink-0">{t.theme}</Badge>
                <Progress value={(t.count / visible.length) * 100} className="flex-1 h-2" />
                <span className="text-sm font-medium w-12 text-right">{t.count}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="suites" className="mt-4 space-y-3">
            {visible.filter((c) => c.suiteApportee).map((c) => (
              <div key={c.id} className="glass-card p-4 animate-slide-up">
                <p className="text-sm text-muted-foreground mb-1">{c.content}</p>
                <div className="p-2 rounded bg-success/5 border border-success/20 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5 text-success" />
                  {c.suiteApportee}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                  <span>{c.project}</span>
                  <span>·</span>
                  <span>{c.theme}</span>
                </div>
              </div>
            ))}
            {visible.filter((c) => c.suiteApportee).length === 0 && (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                Aucune suite apportée enregistrée.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.content.slice(0, 40)}
          entityType="la contribution"
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
