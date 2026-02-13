import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  FolderKanban,
  Package,
  FileText,
  BarChart3,
  ClipboardList,
  Users,
  MessageSquare,
  CalendarRange,
  Layers,
  History,
} from "lucide-react";

export interface ImpactDetail {
  label: string;
  count: number;
  icon?: React.ElementType;
}

interface HardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: string;
  onConfirm: () => void;
  relatedCount?: number;
  /** Detailed impact breakdown per sub-entity */
  impactDetails?: ImpactDetail[];
  /** Extra warning message (e.g. "Vous perdrez l'historique de ce planning") */
  warningMessage?: string;
  /** If true, prevents deletion entirely and shows a block message */
  blocked?: boolean;
  blockedReason?: string;
  /** Alternative action label + handler (e.g. "Désactiver" instead of delete) */
  alternativeAction?: { label: string; onClick: () => void };
}

const defaultIcons: Record<string, React.ElementType> = {
  contributions: MessageSquare,
  documents: FileText,
  phases: CalendarRange,
  tâches: ClipboardList,
  livrables: Package,
  KPI: BarChart3,
  exigences: ClipboardList,
  "parties prenantes": Users,
  versions: History,
  projets: FolderKanban,
  rapports: FileText,
  dashboards: Layers,
};

export function HardDeleteDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
  relatedCount,
  impactDetails,
  warningMessage,
  blocked = false,
  blockedReason,
  alternativeAction,
}: HardDeleteDialogProps) {
  const [typedName, setTypedName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const canDelete = !blocked && typedName === entityName && confirmed;

  const handleClose = (val: boolean) => {
    if (!val) {
      setTypedName("");
      setConfirmed(false);
    }
    onOpenChange(val);
  };

  const totalImpact = impactDetails
    ? impactDetails.reduce((sum, d) => sum + d.count, 0)
    : relatedCount || 0;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Suppression définitive
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <span className="block">
                Vous êtes sur le point de supprimer définitivement {entityType}{" "}
                <strong>"{entityName}"</strong>. Cette action est{" "}
                <strong className="text-destructive">irréversible</strong>.
              </span>

              {/* Detailed impact breakdown */}
              {impactDetails && impactDetails.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
                  <span className="text-sm font-medium text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Impact de la suppression :
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {impactDetails.map((detail) => {
                      const Icon = detail.icon || defaultIcons[detail.label] || FileText;
                      return (
                        <div
                          key={detail.label}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            <strong className="text-foreground">{detail.count}</strong>{" "}
                            {detail.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Simple related count fallback */}
              {!impactDetails && relatedCount !== undefined && relatedCount > 0 && (
                <span className="block p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  ⚠ {relatedCount} élément(s) lié(s) seront définitivement supprimé(s).
                </span>
              )}

              {/* Extra warning */}
              {warningMessage && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{warningMessage}</span>
                </div>
              )}

              {/* Blocked state */}
              {blocked && blockedReason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  🚫 {blockedReason}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!blocked && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">
                Tapez <strong className="text-foreground">"{entityName}"</strong> pour confirmer :
              </label>
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={entityName}
                className="bg-secondary/30 border-border/50"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="hard-delete-confirm"
                checked={confirmed}
                onCheckedChange={(c) => setConfirmed(c === true)}
              />
              <label
                htmlFor="hard-delete-confirm"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                Je comprends que cette suppression est irréversible et que toutes les données associées seront perdues.
              </label>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          {alternativeAction && (
            <Button
              variant="outline"
              className="text-warning border-warning/30 hover:bg-warning/10"
              onClick={() => {
                alternativeAction.onClick();
                handleClose(false);
              }}
            >
              {alternativeAction.label}
            </Button>
          )}
          {!blocked && (
            <Button
              variant="destructive"
              disabled={!canDelete}
              onClick={() => {
                onConfirm();
                handleClose(false);
              }}
            >
              Supprimer définitivement
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
