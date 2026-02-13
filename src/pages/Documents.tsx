import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, FileSpreadsheet, Mail, File, Eye, FolderPlus, Folder, ChevronRight, ArrowLeft } from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { DocumentPreviewDialog, type DocumentMeta } from "@/components/DocumentPreviewDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

interface DocData {
  id: string;
  name: string;
  type: string;
  format: string;
  project: string;
  tags: string[];
  date: string;
  size: string;
  versions: number;
  folderId: string | null;
}

interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
}

const foldersData: FolderData[] = [
  { id: "f1", name: "Documents contractuels", parentId: null, fileCount: 2 },
  { id: "f2", name: "Comptes-rendus", parentId: null, fileCount: 2 },
  { id: "f3", name: "Données & analyses", parentId: null, fileCount: 1 },
  { id: "f4", name: "Exports & annexes", parentId: null, fileCount: 1 },
];

const documentsData: DocData[] = [
  { id: "d1", name: "CCTP Mission Mobilité v3", type: "CCTP", format: "pdf", project: "Mobilité Grand Ouest", tags: ["contractuel", "v3"], date: "12 jan 2026", size: "2.4 Mo", versions: 3, folderId: "f1" },
  { id: "d2", name: "CR Comité de pilotage #4", type: "CR", format: "docx", project: "Mobilité Grand Ouest", tags: ["COPIL", "phase 2"], date: "8 fév 2026", size: "890 Ko", versions: 1, folderId: "f2" },
  { id: "d3", name: "Note de cadrage PLUi", type: "Note", format: "pdf", project: "PLUi Littoral", tags: ["cadrage"], date: "5 mar 2026", size: "1.1 Mo", versions: 2, folderId: "f1" },
  { id: "d4", name: "Échange client - retours diagnostic", type: "Email", format: "eml", project: "Mobilité Grand Ouest", tags: ["client", "diagnostic"], date: "10 fév 2026", size: "45 Ko", versions: 1, folderId: null },
  { id: "d5", name: "Données enquête ménages", type: "Data", format: "xlsx", project: "Mobilité Grand Ouest", tags: ["données", "enquête"], date: "3 fév 2026", size: "5.8 Mo", versions: 1, folderId: "f3" },
  { id: "d6", name: "PV réunion publique #2", type: "CR", format: "pdf", project: "ZAC Centre", tags: ["concertation", "public"], date: "20 jan 2026", size: "1.3 Mo", versions: 1, folderId: "f2" },
  { id: "d7", name: "Rapport intermédiaire", type: "Livrable", format: "pdf", project: "ZAC Centre", tags: ["livrable", "v2"], date: "1 fév 2026", size: "4.2 Mo", versions: 2, folderId: "f4" },
];

const formatIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  eml: Mail,
};

export default function Documents() {
  const [docs, setDocs] = useState(documentsData);
  const [folders, setFolders] = useState(foldersData);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocData | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderData | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentMeta | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "document" | "dossier" } | null>(null);
  const { softDelete, isDeleted } = useSoftDelete();

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.name, type: "document" });
    setDeleteTarget(null);
  };

  const handleFolderSoftDelete = () => {
    if (!deleteFolderTarget) return;
    // Also soft-delete files inside the folder
    const filesInFolder = docs.filter((d) => d.folderId === deleteFolderTarget.id);
    filesInFolder.forEach((f) => softDelete({ id: f.id, name: f.name, type: "document" }));
    softDelete({ id: deleteFolderTarget.id, name: deleteFolderTarget.name, type: "dossier" });
    setDeleteFolderTarget(null);
    if (currentFolder === deleteFolderTarget.id) setCurrentFolder(null);
  };

  const handleRename = (newName: string) => {
    if (!renameTarget) return;
    if (renameTarget.type === "document") {
      setDocs((prev) => prev.map((d) => (d.id === renameTarget.id ? { ...d, name: newName } : d)));
    } else {
      setFolders((prev) => prev.map((f) => (f.id === renameTarget.id ? { ...f, name: newName } : f)));
    }
    setRenameTarget(null);
  };

  const createFolder = () => {
    const newFolder: FolderData = {
      id: `f_${Date.now()}`,
      name: "Nouveau dossier",
      parentId: currentFolder,
      fileCount: 0,
    };
    setFolders((prev) => [...prev, newFolder]);
    toast.success("Dossier créé — cliquez sur ⋯ pour le renommer");
  };

  const visibleDocs = docs.filter((d) => !isDeleted(d.id) && d.folderId === currentFolder);
  const visibleFolders = folders.filter((f) => !isDeleted(f.id) && f.parentId === currentFolder);
  const currentFolderData = folders.find((f) => f.id === currentFolder);

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground text-sm mt-1">Centralisez et versionnez vos documents projet</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 shrink-0" onClick={createFolder}>
              <FolderPlus className="h-4 w-4" />
              Nouveau dossier
            </Button>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Importer
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        {currentFolder && (
          <div className="flex items-center gap-1.5 text-sm">
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setCurrentFolder(null)}>
              <ArrowLeft className="h-3 w-3" />
              Documents
            </Button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-sm">{currentFolderData?.name}</span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un document..." className="pl-9 bg-secondary/50" />
          </div>
        </div>

        {/* Folders */}
        {visibleFolders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleFolders.map((folder) => {
              const filesInside = docs.filter((d) => d.folderId === folder.id && !isDeleted(d.id)).length;
              return (
                <div
                  key={folder.id}
                  className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{folder.name}</span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <EntityActions
                        entityName={folder.name}
                        onRename={() => setRenameTarget({ id: folder.id, name: folder.name, type: "dossier" })}
                        onDelete={() => setDeleteFolderTarget(folder)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{filesInside} fichier(s)</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Files table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Document</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Projet</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Tags</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Taille</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {visibleDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      {currentFolder ? "Ce dossier est vide" : "Aucun fichier à la racine"}
                    </td>
                  </tr>
                ) : (
                  visibleDocs.map((doc) => {
                    const Icon = formatIcons[doc.format] || File;
                    return (
                      <tr key={doc.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium truncate group-hover:text-primary transition-colors">{doc.name}</p>
                                {doc.versions > 1 && (
                                  <Badge variant="outline" className="text-[9px] shrink-0">v{doc.versions}</Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground md:hidden">{doc.project}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{doc.project}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary border-0">{tag}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">{doc.date}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">{doc.size}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => setPreviewDoc({
                                id: doc.id,
                                name: doc.name,
                                format: doc.format,
                                type: doc.type,
                                size: doc.size,
                                date: doc.date,
                                project: doc.project,
                                tags: doc.tags,
                                versions: doc.versions,
                              })}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <EntityActions
                              entityName={doc.name}
                              onEdit={() => toast.info("Modifier métadonnées : " + doc.name)}
                              onRename={() => setRenameTarget({ id: doc.id, name: doc.name, type: "document" })}
                              onDuplicate={() => toast.info("Dupliquer : " + doc.name)}
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
      </div>

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
        onConfirm={handleRename}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.name}
          entityType="le document"
          relatedCount={deleteTarget.versions > 1 ? deleteTarget.versions : undefined}
          onConfirm={handleSoftDelete}
        />
      )}

      {deleteFolderTarget && (
        <SoftDeleteDialog
          open={!!deleteFolderTarget}
          onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
          entityName={deleteFolderTarget.name}
          entityType="le dossier"
          relatedCount={docs.filter((d) => d.folderId === deleteFolderTarget.id && !isDeleted(d.id)).length}
          onConfirm={handleFolderSoftDelete}
        />
      )}
    </Layout>
  );
}
