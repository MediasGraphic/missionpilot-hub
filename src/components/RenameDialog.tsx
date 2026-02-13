import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { toast } from "sonner";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  entityType: string; // e.g. "le projet", "le KPI", "le document"
  onConfirm: (newName: string) => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  entityType,
  onConfirm,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError("");
    }
  }, [open, currentName]);

  const validate = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "Le nom ne peut pas être vide.";
    if (trimmed.length > 200) return "200 caractères maximum.";
    if (/[<>{}|\\^`]/.test(trimmed)) return "Caractères spéciaux non autorisés : < > { } | \\ ^ `";
    if (trimmed === currentName) return "Le nom est identique à l'actuel.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(name);
    if (err) {
      setError(err);
      return;
    }
    onConfirm(name.trim());
    onOpenChange(false);
    toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} renommé(e) avec succès`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Renommer {entityType}
          </DialogTitle>
          <DialogDescription>
            Saisissez le nouveau nom pour {entityType}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 py-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(validate(e.target.value));
              }}
              placeholder="Nouveau nom"
              autoFocus
              className="bg-secondary/30"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="mt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!!validate(name)}>
              Renommer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
