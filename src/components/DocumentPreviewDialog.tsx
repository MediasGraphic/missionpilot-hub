import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Mail,
  Eye,
} from "lucide-react";

interface DocumentMeta {
  id: string;
  name: string;
  format: string;
  type?: string;
  size?: string;
  date?: string;
  project?: string;
  tags?: string[];
  versions?: number;
  author?: string;
  content?: string; // for text/csv preview
  url?: string; // for actual file URL
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentMeta | null;
}

export function DocumentPreviewDialog({ open, onOpenChange, document }: DocumentPreviewDialogProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  if (!document) return null;

  const format = document.format?.toLowerCase() || "";

  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(format);
  const isPdf = format === "pdf";
  const isText = ["txt", "md", "csv", "json", "xml"].includes(format);
  const isCsv = format === "csv";
  const isOffice = ["docx", "pptx", "xlsx", "xls", "doc", "ppt"].includes(format);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  const renderPreview = () => {
    if (isPdf) {
      return (
        <div className="flex flex-col items-center gap-4 p-6">
          <div
            className="bg-secondary/30 rounded-lg border border-border/50 w-full flex items-center justify-center"
            style={{ minHeight: `${3.5 * (zoom / 100)}rem`, height: `${28 * (zoom / 100)}rem` }}
          >
            <div className="text-center space-y-3 p-8" style={{ transform: `scale(${zoom / 100})` }}>
              <FileText className="h-16 w-16 text-primary/40 mx-auto" />
              <p className="text-sm font-medium">{document.name}</p>
              <p className="text-xs text-muted-foreground">
                Aperçu PDF — Page {page}
              </p>
              <div className="bg-secondary/50 rounded p-4 max-w-sm mx-auto text-left text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Sommaire</p>
                <p>1. Introduction et contexte</p>
                <p>2. Méthodologie</p>
                <p>3. Résultats et analyses</p>
                <p>4. Recommandations</p>
                <p>5. Annexes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page} / {document.versions ? document.versions * 4 : 12}
            </span>
            <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center p-6">
          <div
            className="bg-secondary/30 rounded-lg border border-border/50 overflow-hidden"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
          >
            <div className="w-80 h-60 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <ImageIcon className="h-20 w-20 text-primary/30" />
            </div>
          </div>
        </div>
      );
    }

    if (isCsv) {
      const csvData = document.content || "Nom,Type,Valeur,Date\nÉlément 1,A,42,2026-01-15\nÉlément 2,B,87,2026-01-20\nÉlément 3,A,35,2026-02-01\nÉlément 4,C,63,2026-02-05";
      const rows = csvData.split("\n").map((r) => r.split(","));
      return (
        <div className="p-4 overflow-auto">
          <table className="w-full text-sm border border-border/50 rounded">
            <thead>
              <tr className="bg-secondary/40">
                {rows[0]?.map((h, i) => (
                  <th key={i} className="py-2 px-3 text-left text-xs font-medium text-muted-foreground border-b border-border/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-border/20 hover:bg-secondary/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-1.5 px-3 text-xs">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="p-4">
          <pre className="bg-secondary/30 rounded-lg border border-border/50 p-4 text-xs font-mono overflow-auto max-h-96 text-muted-foreground whitespace-pre-wrap">
            {document.content || `# ${document.name}\n\nContenu du document texte.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}
          </pre>
        </div>
      );
    }

    if (isOffice) {
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="bg-secondary/30 rounded-lg border border-border/50 p-8 text-center space-y-3">
            <FileSpreadsheet className="h-16 w-16 text-primary/40 mx-auto" />
            <p className="text-sm font-medium">{document.name}</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Aperçu converti en PDF. Le document original ({format.toUpperCase()}) a été converti automatiquement pour la prévisualisation.
            </p>
            <div className="bg-secondary/50 rounded p-4 text-left text-xs text-muted-foreground space-y-1.5">
              <p>📄 Format original : {format.toUpperCase()}</p>
              <p>📐 Taille : {document.size || "—"}</p>
              <p>🔄 Conversion : automatique à l'import</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 p-8">
        <File className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Aperçu non disponible pour le format .{format}
        </p>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-3.5 w-3.5" /> Télécharger
        </Button>
      </div>
    );
  };

  const formatIcon: Record<string, typeof FileText> = {
    pdf: FileText,
    docx: FileText,
    xlsx: FileSpreadsheet,
    eml: Mail,
    csv: FileSpreadsheet,
    png: ImageIcon,
    jpg: ImageIcon,
    jpeg: ImageIcon,
    webp: ImageIcon,
  };
  const Icon = formatIcon[format] || File;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base truncate">{document.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="text-[10px]">{format.toUpperCase()}</Badge>
                {document.size && <span>{document.size}</span>}
                {document.date && <span>· {document.date}</span>}
                {document.versions && document.versions > 1 && (
                  <Badge variant="secondary" className="text-[10px]">v{document.versions}</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/20">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Télécharger
          </Button>
        </div>

        <Separator />

        {/* Preview content */}
        <ScrollArea className="flex-1 min-h-0">
          {renderPreview()}
        </ScrollArea>

        <Separator />

        {/* Metadata */}
        <div className="px-5 py-3 bg-secondary/10">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Métadonnées</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Type : </span>
              <span className="font-medium">{document.type || format.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Taille : </span>
              <span className="font-medium">{document.size || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Projet : </span>
              <span className="font-medium">{document.project || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Auteur : </span>
              <span className="font-medium">{document.author || "Système"}</span>
            </div>
          </div>
          {document.tags && document.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary border-0">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { type DocumentMeta };
