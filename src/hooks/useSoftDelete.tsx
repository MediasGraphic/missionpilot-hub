import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export interface SoftDeletableItem {
  id: string | number;
  name: string;
  type: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

interface UseSoftDeleteOptions {
  undoDelayMs?: number;
  onDelete?: (item: SoftDeletableItem) => void;
  onRestore?: (item: SoftDeletableItem) => void;
  onHardDelete?: (item: SoftDeletableItem) => void;
  onAuditLog?: (action: string, item: SoftDeletableItem) => void;
}

export function useSoftDelete(options: UseSoftDeleteOptions = {}) {
  const { undoDelayMs = 8000, onDelete, onRestore, onHardDelete, onAuditLog } = options;
  const [deletedItems, setDeletedItems] = useState<SoftDeletableItem[]>([]);
  const undoTimers = useRef<Map<string | number, ReturnType<typeof setTimeout>>>(new Map());

  const softDelete = useCallback(
    (item: SoftDeletableItem) => {
      const deletedItem = { ...item, deletedAt: new Date().toISOString() };
      setDeletedItems((prev) => [...prev, deletedItem]);
      onDelete?.(deletedItem);
      onAuditLog?.("soft_delete", deletedItem);

      const toastId = toast(`"${item.name}" déplacé dans la corbeille`, {
        description: "Cet élément est restaurable depuis la corbeille.",
        action: {
          label: "Annuler",
          onClick: () => {
            clearTimeout(undoTimers.current.get(item.id));
            undoTimers.current.delete(item.id);
            setDeletedItems((prev) => prev.filter((d) => d.id !== item.id));
            onRestore?.(deletedItem);
            onAuditLog?.("restore_undo", deletedItem);
            toast.success(`"${item.name}" restauré`);
          },
        },
        duration: undoDelayMs,
      });

      const timer = setTimeout(() => {
        undoTimers.current.delete(item.id);
      }, undoDelayMs + 500);
      undoTimers.current.set(item.id, timer);
    },
    [undoDelayMs, onDelete, onRestore, onAuditLog]
  );

  const restore = useCallback(
    (item: SoftDeletableItem) => {
      setDeletedItems((prev) => prev.filter((d) => d.id !== item.id));
      onRestore?.(item);
      onAuditLog?.("restore", item);
      toast.success(`"${item.name}" restauré avec succès`);
    },
    [onRestore, onAuditLog]
  );

  const hardDelete = useCallback(
    (item: SoftDeletableItem) => {
      setDeletedItems((prev) => prev.filter((d) => d.id !== item.id));
      onHardDelete?.(item);
      onAuditLog?.("hard_delete", item);
      toast.success(`"${item.name}" supprimé définitivement`);
    },
    [onHardDelete, onAuditLog]
  );

  const isDeleted = useCallback(
    (id: string | number) => deletedItems.some((d) => d.id === id),
    [deletedItems]
  );

  return { deletedItems, softDelete, restore, hardDelete, isDeleted };
}
