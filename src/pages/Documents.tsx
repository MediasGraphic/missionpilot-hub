import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, FileSpreadsheet, Mail, File } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

interface DocData {
  id: string;
  name: string;
  type: string;
  format: string;
  project: string;
  tags: string[];
  date: string;
  size: string;
  versions: number;
}

const documentsData: DocData[] = [
  { id: "d1", name: "CCTP Mission Mobilité v3", type: "CCTP", format: "pdf", project: "Mobilité Grand Ouest", tags: ["contractuel", "v3"], date: "12 jan 2026", size: "2.4 Mo", versions: 3 },
  { id: "d2", name: "CR Comité de pilotage #4", type: "CR", format: "docx", project: "Mobilité Grand Ouest", tags: ["COPIL", "phase 2"], date: "8 fév 2026", size: "890 Ko", versions: 1 },
  { id: "d3", name: "Note de cadrage PLUi", type: "Note", format: "pdf", project: "PLUi Littoral", tags: ["cadrage"], date: "5 mar 2026", size: "1.1 Mo", versions: 2 },
  { id: "d4", name: "Échange client - retours diagnostic", type: "Email", format: "eml", project: "Mobilité Grand Ouest", tags: ["client", "diagnostic"], date: "10 fév 2026", size: "45 Ko", versions: 1 },
  { id: "d5", name: "Données enquête ménages", type: "Data", format: "xlsx", project: "Mobilité Grand Ouest", tags: ["données", "enquête"], date: "3 fév 2026", size: "5.8 Mo", versions: 1 },
  { id: "d6", name: "PV réunion publique #2", type: "CR", format: "pdf", project: "ZAC Centre", tags: ["concertation", "public"], date: "20 jan 2026", size: "1.3 Mo", versions: 1 },
  { id: "d7", name: "Rapport intermédiaire", type: "Livrable", format: "pdf", project: "ZAC Centre", tags: ["livrable", "v2"], date: "1 fév 2026", size: "4.2 Mo", versions: 2 },
];

const formatIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  eml: Mail,
};

export default function Documents() {
  const [deleteTarget, setDeleteTarget] = useState<DocData | null>(null);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.name, type: "document" });
    setDeleteTarget(null);
  };

  const visibleDocs = documentsData.filter((d) => !isDeleted(d.id));

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground text-sm mt-1">Centralisez et versionnez vos documents projet</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Importer
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un document..." className="pl-9 bg-secondary/50" />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Document</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Projet</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Tags</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Taille</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {visibleDocs.map((doc) => {
                  const Icon = formatIcons[doc.format] || File;
                  return (
                    <tr key={doc.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium truncate group-hover:text-primary transition-colors">{doc.name}</p>
                              {doc.versions > 1 && (
                                <Badge variant="outline" className="text-[9px] shrink-0">
                                  v{doc.versions}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground md:hidden">{doc.project}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{doc.project}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary border-0">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">{doc.date}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">{doc.size}</td>
                      <td className="py-2 px-2">
                        <EntityActions
                          entityName={doc.name}
                          onEdit={() => toast.info("Modifier : " + doc.name)}
                          onRename={() => toast.info("Renommer : " + doc.name)}
                          onDuplicate={() => toast.info("Dupliquer : " + doc.name)}
                          onDelete={() => setDeleteTarget(doc)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le document"
          relatedCount={deleteTarget.versions > 1 ? deleteTarget.versions : undefined}
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
