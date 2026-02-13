import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Presentation, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ExportFormat = "pdf" | "pptx";
type ReportType = "rapport_final" | "compte_rendu" | "note_flash" | "annexes" | "deck_restitution";

const REPORT_TYPES: { value: ReportType; label: string; format: ExportFormat; desc: string }[] = [
  { value: "rapport_final", label: "Rapport final", format: "pdf", desc: "Rapport complet avec sommaire, KPI, synthèses et annexes" },
  { value: "compte_rendu", label: "Compte-rendu", format: "pdf", desc: "CR de réunion / COPIL avec décisions et suites" },
  { value: "note_flash", label: "Note flash", format: "pdf", desc: "Synthèse courte (2–3 pages) des points clés" },
  { value: "annexes", label: "Annexes", format: "pdf", desc: "Données brutes, tableaux détaillés, questionnaires" },
  { value: "deck_restitution", label: "Deck restitution", format: "pptx", desc: "Présentation : contexte, objectifs, KPI, graphiques, prochaines étapes" },
];

const SECTIONS = [
  { id: "contexte", label: "Contexte & objectifs" },
  { id: "kpi", label: "KPI & indicateurs" },
  { id: "planning", label: "Avancement planning" },
  { id: "questionnaires", label: "Résultats questionnaires" },
  { id: "contributions", label: "Contributions & qualité" },
  { id: "suites", label: "Suites apportées" },
  { id: "graphiques", label: "Graphiques & dashboards" },
  { id: "prochaines", label: "Prochaines étapes" },
];

interface ReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
}

export function ReportExportDialog({ open, onOpenChange, projectName = "Mobilité Grand Ouest" }: ReportExportDialogProps) {
  const [reportType, setReportType] = useState<ReportType>("rapport_final");
  const [selectedSections, setSelectedSections] = useState<string[]>(SECTIONS.map((s) => s.id));
  const [period, setPeriod] = useState("all");
  const [generating, setGenerating] = useState(false);

  const currentType = REPORT_TYPES.find((t) => t.value === reportType);
  const isPpt = currentType?.format === "pptx";

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onOpenChange(false);

      const fileName = `${currentType?.label || "Rapport"} – ${projectName}`;
      const ext = isPpt ? "pptx" : "pdf";

      toast.success(`${fileName}.${ext} généré avec succès`, {
        description: "Le fichier a été enregistré dans Documents > Exports & annexes",
        duration: 6000,
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter un rapport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de rapport</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      {t.format === "pptx" ? (
                        <Presentation className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>{t.label}</span>
                      <Badge variant="outline" className="text-[9px] ml-1">{t.format.toUpperCase()}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentType && (
              <p className="text-xs text-muted-foreground mt-1">{currentType.desc}</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Période</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la durée du projet</SelectItem>
                <SelectItem value="q4_2025">T4 2025</SelectItem>
                <SelectItem value="q1_2026">T1 2026</SelectItem>
                <SelectItem value="jan_2026">Janvier 2026</SelectItem>
                <SelectItem value="feb_2026">Février 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Sections à inclure</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={() =>
                  setSelectedSections(
                    selectedSections.length === SECTIONS.length ? [] : SECTIONS.map((s) => s.id)
                  )
                }
              >
                {selectedSections.length === SECTIONS.length ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((section) => (
                <label
                  key={section.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <span className="text-xs">{section.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || selectedSections.length === 0}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Générer {isPpt ? "PPT" : "PDF"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
