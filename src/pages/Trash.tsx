import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Search,
  RotateCcw,
  AlertTriangle,
  FolderKanban,
  Package,
  FileText,
  BarChart3,
  MessageSquare,
  GitCompare,
  ClipboardList,
  Users,
} from "lucide-react";
import { HardDeleteDialog } from "@/components/HardDeleteDialog";
import { toast } from "sonner";

interface TrashItem {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  project?: string;
  deletedAt: string;
  deletedBy: string;
  relatedCount: number;
}

const typeIcons: Record<string, React.ElementType> = {
  projet: FolderKanban,
  livrable: Package,
  document: FileText,
  kpi: BarChart3,
  événement: MessageSquare,
  changement: GitCompare,
  exigence: ClipboardList,
  "partie prenante": Users,
  rapport: FileText,
  tâche: ClipboardList,
};

const MOCK_TRASH: TrashItem[] = [
  { id: "t1", name: "Rapport intermédiaire v1", type: "document", typeLabel: "Document", project: "Mobilité Grand Ouest", deletedAt: "2026-02-10T14:30:00", deletedBy: "Jean Martin", relatedCount: 0 },
  { id: "t2", name: "KPI Taux d'engagement web", type: "kpi", typeLabel: "KPI", project: "PLUi Littoral", deletedAt: "2026-02-09T10:15:00", deletedBy: "Marie Durand", relatedCount: 0 },
  { id: "t3", name: "Atelier participatif #3", type: "événement", typeLabel: "Événement", project: "ZAC Centre", deletedAt: "2026-02-08T16:45:00", deletedBy: "Sophie Leclerc", relatedCount: 2 },
  { id: "t4", name: "Enquête terrain complémentaire", type: "tâche", typeLabel: "Tâche", project: "Mobilité Grand Ouest", deletedAt: "2026-02-07T09:00:00", deletedBy: "Jean Martin", relatedCount: 1 },
  { id: "t5", name: "Exigence – Accessibilité PMR", type: "exigence", typeLabel: "Exigence", project: "PLUi Littoral", deletedAt: "2026-02-06T11:20:00", deletedBy: "Marie Durand", relatedCount: 3 },
];

export default function Trash() {
  const [items, setItems] = useState<TrashItem[]>(MOCK_TRASH);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hardDeleteTarget, setHardDeleteTarget] = useState<TrashItem | null>(null);

  const userRole = "admin" as "admin" | "chef_projet";

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, typeFilter]);

  const handleRestore = (item: TrashItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success(`"${item.name}" restauré avec succès`);
  };

  const handleHardDelete = (item: TrashItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success(`"${item.name}" supprimé définitivement`);
  };

  const uniqueTypes = [...new Set(MOCK_TRASH.map((i) => i.type))];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-destructive/15 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Corbeille</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {items.length} élément(s) · Restaurez ou supprimez définitivement
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la corbeille..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] bg-secondary/50">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Trash2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold text-muted-foreground">
              Corbeille vide
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aucun élément supprimé correspondant aux filtres.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              return (
                <div
                  key={item.id}
                  className="glass-card p-4 flex items-center gap-4 animate-slide-up"
                >
                  <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium truncate">{item.name}</h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-secondary border-0 capitalize"
                      >
                        {item.typeLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                      {item.project && <span>{item.project}</span>}
                      <span>·</span>
                      <span>Supprimé le {formatDate(item.deletedAt)}</span>
                      <span>·</span>
                      <span>par {item.deletedBy}</span>
                      {item.relatedCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-warning">
                            {item.relatedCount} élément(s) lié(s)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 text-success border-success/30 hover:bg-success/10"
                      onClick={() => handleRestore(item)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurer
                    </Button>
                    {userRole === "admin" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                        onClick={() => setHardDeleteTarget(item)}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hardDeleteTarget && (
        <HardDeleteDialog
          open={!!hardDeleteTarget}
          onOpenChange={(open) => !open && setHardDeleteTarget(null)}
          entityName={hardDeleteTarget.name}
          entityType={hardDeleteTarget.typeLabel}
          relatedCount={hardDeleteTarget.relatedCount}
          onConfirm={() => handleHardDelete(hardDeleteTarget)}
        />
      )}
    </Layout>
  );
}
