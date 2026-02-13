import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; client: string; description: string; domain: string; start_date: string; end_date: string }) => void;
  isLoading?: boolean;
}

export function AddProjectDialog({ open, onOpenChange, onConfirm, isLoading }: AddProjectDialogProps) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est obligatoire"); return; }
    onConfirm({ name: name.trim(), client: client.trim(), description: description.trim(), domain: domain.trim(), start_date: startDate, end_date: endDate });
    setName(""); setClient(""); setDescription(""); setDomain(""); setStartDate(""); setEndDate(""); setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Nouveau projet
          </DialogTitle>
          <DialogDescription>Créez un nouveau projet de mission.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Nom du projet *</Label>
            <Input id="proj-name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Ex: Étude mobilité..." autoFocus className="bg-secondary/30" />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="proj-client">Client</Label>
              <Input id="proj-client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-domain">Domaine</Label>
              <Input id="proj-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Mobilité, Urbanisme..." className="bg-secondary/30" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du projet..." className="bg-secondary/30 min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="proj-start">Date début</Label>
              <Input id="proj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-end">Date fin</Label>
              <Input id="proj-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-secondary/30" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Créer le projet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
