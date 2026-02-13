import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileText, FileSpreadsheet, Mail, File, Eye, FolderPlus, Folder, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { DocumentPreviewDialog, type DocumentMeta } from "@/components/DocumentPreviewDialog";
import { RenameDialog } from "@/components/RenameDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Doc = Tables<"documents">;

const formatIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  eml: Mail,
};

const SOURCE_TYPE_OPTIONS = ["CCTP", "NoteCadrage", "MemoireTechnique", "CR", "Email", "Annexe", "Autre"] as const;

export default function Documents() {
  const queryClient = useQueryClient();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentMeta | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "document" | "dossier" } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Add doc form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("Autre");
  const [newFolder, setNewFolder] = useState("");
  const [newProjectId, setNewProjectId] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").is("deleted_at", null).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Derive folders from document folder field
  const allFolders = [...new Set(documents.map((d) => d.folder).filter(Boolean))] as string[];

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; source_type: string; folder: string; project_id: string }) => {
      const { data, error } = await supabase.from("documents").insert({
        title: input.title,
        source_type: input.source_type as Doc["source_type"],
        folder: input.folder || null,
        project_id: input.project_id,
        type: input.source_type,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setAddOpen(false);
      setNewTitle(""); setNewType("Autre"); setNewFolder(""); setNewProjectId("");
      toast.success(`Document "${data.title}" créé !`);
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from("documents").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setRenameTarget(null);
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTarget(null);
      toast.success("Document déplacé dans la corbeille");
    },
    onError: (err: Error) => toast.error("Erreur : " + err.message),
  });

  const visibleDocs = documents.filter((d) => {
    const matchFolder = currentFolder ? d.folder === currentFolder : !d.folder;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const visibleFolders = currentFolder ? [] : allFolders.filter((f) =>
    !search || f.toLowerCase().includes(search.toLowerCase())
  );

  const projectName = (pid: string) => projects.find((p) => p.id === pid)?.name || "—";

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { toast.error("Le titre est obligatoire"); return; }
    if (!newProjectId) { toast.error("Sélectionnez un projet"); return; }
    createMutation.mutate({ title: newTitle.trim(), source_type: newType, folder: newFolder.trim(), project_id: newProjectId });
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground text-sm mt-1">Centralisez et versionnez vos documents projet</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 shrink-0" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un document
            </Button>
          </div>
        </div>

        {currentFolder && (
          <div className="flex items-center gap-1.5 text-sm">
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setCurrentFolder(null)}>
              <ArrowLeft className="h-3 w-3" />
              Documents
            </Button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-sm">{currentFolder}</span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un document..." className="pl-9 bg-secondary/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {visibleFolders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleFolders.map((folder) => {
                  const count = documents.filter((d) => d.folder === folder).length;
                  return (
                    <div
                      key={folder}
                      className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group"
                      onClick={() => setCurrentFolder(folder)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Folder className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{folder}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{count} fichier(s)</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Document</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Projet</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Tags</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Version</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          {currentFolder ? "Ce dossier est vide" : "Aucun document"}
                        </td>
                      </tr>
                    ) : (
                      visibleDocs.map((doc) => {
                        const tags = Array.isArray(doc.tags_json) ? doc.tags_json as string[] : [];
                        const Icon = formatIcons[doc.source_type?.toLowerCase() || ""] || File;
                        return (
                          <tr key={doc.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-medium truncate group-hover:text-primary transition-colors">{doc.title}</p>
                                    {doc.version > 1 && (
                                      <Badge variant="outline" className="text-[9px] shrink-0">v{doc.version}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{projectName(doc.project_id)}</td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <div className="flex gap-1 flex-wrap">
                                {tags.map((tag) => (
                                  <Badge key={String(tag)} variant="secondary" className="text-[10px] bg-secondary border-0">{String(tag)}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                              {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">v{doc.version}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  onClick={() => setPreviewDoc({
                                    id: doc.id,
                                    name: doc.title,
                                    format: doc.source_type?.toLowerCase() || "pdf",
                                    type: doc.type || doc.source_type,
                                    date: new Date(doc.uploaded_at).toLocaleDateString("fr-FR"),
                                    project: projectName(doc.project_id),
                                    tags,
                                    versions: doc.version,
                                  })}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <EntityActions
                                  entityName={doc.title}
                                  onRename={() => setRenameTarget({ id: doc.id, name: doc.title, type: "document" })}
                                  onDelete={() => setDeleteTarget(doc)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add document dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Ajouter un document</DialogTitle>
            <DialogDescription>Ajoutez un document au projet.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nom du document" autoFocus className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Projet *</Label>
              <Select value={newProjectId} onValueChange={setNewProjectId}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dossier</Label>
                <Input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Ex: Exports & annexes" className="bg-secondary/30" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        document={previewDoc}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ""}
        entityType={renameTarget?.type === "dossier" ? "le dossier" : "le document"}
        onConfirm={(newName) => renameTarget && renameMutation.mutate({ id: renameTarget.id, title: newName })}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.title}
          entityType="le document"
          onConfirm={() => deleteTarget && softDeleteMutation.mutate(deleteTarget.id)}
        />
      )}
    </Layout>
  );
}
