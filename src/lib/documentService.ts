import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Doc = Tables<"documents">;

const BUCKET = "project-documents";

/**
 * Upload a file to storage and create a document record in DB.
 */
export async function uploadDocument(
  file: File,
  metadata: {
    title: string;
    project_id: string;
    source_type?: Doc["source_type"];
    folder?: string;
    tags?: string[];
  }
): Promise<Doc> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const storagePath = `${metadata.project_id}/${crypto.randomUUID()}.${ext}`;

  // 1. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload échoué: ${uploadError.message}`);

  // 2. Create DB record with storage path
  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      title: metadata.title,
      project_id: metadata.project_id,
      source_type: metadata.source_type || "Autre",
      folder: metadata.folder || null,
      tags_json: metadata.tags || [],
      file_url: storagePath, // store PATH, not signed URL
      type: ext,
    })
    .select()
    .single();

  if (dbError) {
    // Rollback: remove uploaded file
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Enregistrement échoué: ${dbError.message}`);
  }

  return data;
}

/**
 * Get a temporary signed URL for previewing a document.
 */
export async function getPreviewUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error) throw new Error(`URL de preview échouée: ${error.message}`);
  return data.signedUrl;
}

/**
 * Get a temporary signed URL for downloading a document.
 */
export async function getDownloadUrl(storagePath: string, filename: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 300, { download: filename });

  if (error) throw new Error(`URL de téléchargement échouée: ${error.message}`);
  return data.signedUrl;
}

/**
 * Rename a document (DB only).
 */
export async function renameDocument(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ title })
    .eq("id", id);

  if (error) throw new Error(`Renommage échoué: ${error.message}`);
}

/**
 * Soft delete a document (set deleted_at, keep file in storage).
 */
export async function softDeleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Suppression échouée: ${error.message}`);
}

/**
 * Hard delete: remove file from storage + delete DB record.
 */
export async function hardDeleteDocument(doc: Doc): Promise<void> {
  if (doc.file_url) {
    await supabase.storage.from(BUCKET).remove([doc.file_url]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(`Suppression définitive échouée: ${error.message}`);
}

/**
 * Detect file extension and map to source_type.
 */
export function detectSourceType(filename: string): Doc["source_type"] {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "Autre";
  if (ext === "eml" || ext === "msg") return "Email";
  return "Autre";
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
