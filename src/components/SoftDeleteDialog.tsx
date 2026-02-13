import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface SoftDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: string;
  onConfirm: () => void;
  relatedCount?: number;
}

export function SoftDeleteDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
  relatedCount,
}: SoftDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Confirmer la suppression
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Êtes-vous sûr de vouloir supprimer {entityType} <strong>"{entityName}"</strong> ?
            </span>
            {relatedCount !== undefined && relatedCount > 0 && (
              <span className="block text-warning">
                ⚠ {relatedCount} élément(s) lié(s) seront également masqué(s).
              </span>
            )}
            <span className="block text-muted-foreground text-xs mt-2">
              L'élément sera déplacé dans la corbeille et pourra être restauré.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Déplacer en corbeille
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
