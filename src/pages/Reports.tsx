import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, CalendarRange, BarChart3, Eye, Presentation } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { DocumentPreviewDialog, type DocumentMeta } from "@/components/DocumentPreviewDialog";
import { ReportExportDialog } from "@/components/ReportExportDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

const initialReportsData = [
  { id: "r1", name: "Rapport d'avancement mensuel – Janvier 2026", type: "Avancement", project: "Mobilité Grand Ouest", date: "31 jan 2026", pages: 12 },
  { id: "r2", name: "Bilan de concertation intermédiaire", type: "Concertation", project: "ZAC Centre", date: "25 jan 2026", pages: 24 },
  { id: "r3", name: "Synthèse COPIL #3", type: "COPIL", project: "Mobilité Grand Ouest", date: "20 jan 2026", pages: 8 },
  { id: "r4", name: "Tableau de bord KPI – T4 2025", type: "KPI", project: "Tous", date: "5 jan 2026", pages: 6 },
  { id: "r5", name: "Note de synthèse diagnostic", type: "Technique", project: "PLUi Littoral", date: "15 fév 2026", pages: 18 },
];

const typeIcons: Record<string, typeof FileText> = {
  Avancement: CalendarRange,
  Concertation: FileText,
  COPIL: FileText,
  KPI: BarChart3,
  Technique: FileText,
};

export default function Reports() {
  const [reports, setReports] = useState(initialReportsData);
  const [deleteTarget, setDeleteTarget] = useState<(typeof initialReportsData)[0] | null>(null);
  const [renameTarget, setRenameTarget] = useState<(typeof initialReportsData)[0] | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentMeta | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.name, type: "rapport" });
    setDeleteTarget(null);
  };

  const handleRename = (newName: string) => {
    if (!renameTarget) return;
    setReports((prev) => prev.map((r) => (r.id === renameTarget.id ? { ...r, name: newName } : r)));
    setRenameTarget(null);
  };

  const visibleReports = reports.filter((r) => !isDeleted(r.id));

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Rapports</h1>
            <p className="text-muted-foreground text-sm mt-1">Générez et consultez vos rapports de mission</p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Générer un rapport
          </Button>
        </div>

        <div className="space-y-3">
          {visibleReports.map((report) => {
            const Icon = typeIcons[report.type] || FileText;
            return (
              <div key={report.id} className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{report.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{report.project}</span>
                      <span>·</span>
                      <span>{report.date}</span>
                      <span>·</span>
                      <span>{report.pages} pages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => setPreviewDoc({
                        id: report.id,
                        name: report.name,
                        format: "pdf",
                        type: report.type,
                        date: report.date,
                        project: report.project,
                        size: `${report.pages * 150} Ko`,
                      })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                    <EntityActions
                      entityName={report.name}
                      onEdit={() => toast.info("Modifier : " + report.name)}
                      onRename={() => setRenameTarget(report)}
                      onDuplicate={() => toast.info("Dupliquer : " + report.name)}
                      onDelete={() => setDeleteTarget(report)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        document={previewDoc}
      />

      <ReportExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ""}
        entityType="le rapport"
        onConfirm={handleRename}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le rapport"
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
