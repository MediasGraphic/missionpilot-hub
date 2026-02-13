import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Type,
  Copy,
  Archive,
  Trash2,
} from "lucide-react";

export type UserRole = "admin" | "chef_projet" | "lecteur";

interface EntityActionsProps {
  entityName: string;
  userRole?: UserRole;
  onEdit?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  isArchived?: boolean;
}

export function EntityActions({
  entityName,
  userRole = "chef_projet",
  onEdit,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
  isArchived = false,
}: EntityActionsProps) {
  if (userRole === "lecteur") return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </DropdownMenuItem>
        )}
        {onRename && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }} className="gap-2">
            <Type className="h-3.5 w-3.5" /> Renommer
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="gap-2">
            <Copy className="h-3.5 w-3.5" /> Dupliquer
          </DropdownMenuItem>
        )}
        {onArchive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }} className="gap-2">
              <Archive className="h-3.5 w-3.5" /> {isArchived ? "Désarchiver" : "Archiver"}
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
