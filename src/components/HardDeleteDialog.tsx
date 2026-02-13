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
import { AlertTriangle } from "lucide-react";

interface HardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: string;
  onConfirm: () => void;
  relatedCount?: number;
}

export function HardDeleteDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
  relatedCount,
}: HardDeleteDialogProps) {
  const [typedName, setTypedName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const canDelete = typedName === entityName && confirmed;

  const handleClose = (val: boolean) => {
    if (!val) {
      setTypedName("");
      setConfirmed(false);
    }
    onOpenChange(val);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Suppression définitive
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              Vous êtes sur le point de supprimer définitivement {entityType}{" "}
              <strong>"{entityName}"</strong>. Cette action est{" "}
              <strong className="text-destructive">irréversible</strong>.
            </span>
            {relatedCount !== undefined && relatedCount > 0 && (
              <span className="block p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                ⚠ {relatedCount} élément(s) lié(s) seront définitivement supprimé(s).
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

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

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
