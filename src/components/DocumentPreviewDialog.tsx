import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  FileText, FileSpreadsheet, Image as ImageIcon, File, Mail, Eye,
} from "lucide-react";
import { getDownloadUrl } from "@/lib/documentService";
import { toast } from "sonner";

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
  content?: string;
  url?: string; // signed URL for real preview
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentMeta | null;
}

export function DocumentPreviewDialog({ open, onOpenChange, document }: DocumentPreviewDialogProps) {
  const [zoom, setZoom] = useState(100);

  if (!document) return null;

  const format = document.format?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(format);
  const isPdf = format === "pdf";
  const hasRealUrl = !!document.url;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  const handleDownload = async () => {
    if (!document.url) {
      toast.error("Pas de fichier associé");
      return;
    }
    // The url is already a signed URL, open it
    window.open(document.url, "_blank");
  };

  const renderPreview = () => {
    if (hasRealUrl && isPdf) {
      return (
        <div className="w-full" style={{ height: `${28 * (zoom / 100)}rem` }}>
          <iframe
            src={`${document.url}#toolbar=0`}
            className="w-full h-full border-0 rounded"
            title={document.name}
          />
        </div>
      );
    }

    if (hasRealUrl && isImage) {
      return (
        <div className="flex items-center justify-center p-6">
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full rounded-lg border border-border/50"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
          />
        </div>
      );
    }

    if (!hasRealUrl) {
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="bg-secondary/30 rounded-lg border border-border/50 p-8 text-center space-y-3">
            <File className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium">{document.name}</p>
            <p className="text-xs text-muted-foreground">
              Ce document n'a pas de fichier associé.<br />
              Il s'agit d'une référence documentaire.
            </p>
          </div>
        </div>
      );
    }

    // Fallback for other file types with a URL
    return (
      <div className="flex flex-col items-center gap-3 p-8">
        <File className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-sm font-medium">{document.name}</p>
        <p className="text-xs text-muted-foreground">
          Aperçu non disponible pour le format .{format}
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Télécharger
        </Button>
      </div>
    );
  };

  const formatIcon: Record<string, typeof FileText> = {
    pdf: FileText, docx: FileText, xlsx: FileSpreadsheet, eml: Mail,
    csv: FileSpreadsheet, png: ImageIcon, jpg: ImageIcon, jpeg: ImageIcon, webp: ImageIcon,
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
          {hasRealUrl && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Télécharger
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 min-h-0">
          {renderPreview()}
        </ScrollArea>

        <Separator />

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
