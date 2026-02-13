import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ClipboardList, Plus, Search, GripVertical, Trash2, Copy, Settings2, Share2,
  BarChart3, FileDown, Eye, Link2, Lock, Globe, Mail, Bot, Upload, X,
  Smartphone, Monitor, Sparkles, Loader2, CheckCircle2, RefreshCw, Calendar, Hash, Users,
} from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ── Types ── */
type QuestionType = "text" | "long_text" | "single_choice" | "multiple_choice" | "dropdown" | "scale" | "date" | "file" | "consent";
interface QuestionOption { id: string; label: string; }
interface Question {
  id: string; sectionId: string; type: QuestionType; label: string;
  description?: string; placeholder?: string; required: boolean;
  options?: QuestionOption[]; scaleMin?: number; scaleMax?: number;
  conditionalOn?: { questionId: string; value: string } | null;
}
interface Section { id: string; title: string; description?: string; }

interface QRow {
  id: string; project_id: string | null; title: string; description: string | null;
  status: string; version: number; sections_json: any; questions_json: any;
  access_mode: string; collect_identity: boolean; created_at: string; updated_at: string; deleted_at: string | null;
}

interface ShareRow {
  id: string; questionnaire_id: string; token: string; share_type: string;
  access_mode: string; pin_code: string | null; starts_at: string | null; ends_at: string | null;
  max_responses: number | null; one_per_device: boolean; created_at: string;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Texte court", long_text: "Texte long", single_choice: "Choix unique",
  multiple_choice: "Choix multiple", dropdown: "Liste déroulante", scale: "Échelle",
  date: "Date", file: "Fichier", consent: "Consentement",
};
const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({ value: value as QuestionType, label }));

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  published: { label: "Publié", className: "bg-success/15 text-success" },
  closed: { label: "Fermé", className: "bg-warning/15 text-warning" },
};

export default function Questionnaires() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [deleteTarget, setDeleteTarget] = useState<QRow | null>(null);
  const [renameTarget, setRenameTarget] = useState<QRow | null>(null);
  const [previewQ, setPreviewQ] = useState<QRow | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const { softDelete, isDeleted } = useSoftDelete();
  const [selectedQ, setSelectedQ] = useState<QRow | null>(null);
  const [shareDialogQ, setShareDialogQ] = useState<QRow | null>(null);

  /* ── Builder state ── */
  const [builderMode, setBuilderMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderSections, setBuilderSections] = useState<Section[]>([{ id: "s1", title: "Section 1" }]);
  const [builderQuestions, setBuilderQuestions] = useState<Question[]>([]);
  const [builderAccess, setBuilderAccess] = useState<string>("public");
  const [builderCollectIdentity, setBuilderCollectIdentity] = useState(false);

  /* ── AI ── */
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  /* ── Data fetching ── */
  const { data: questionnaires = [], isLoading } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionnaires")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QRow[];
    },
  });

  const { data: responseCounts = {} } = useQuery({
    queryKey: ["questionnaire-response-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionnaire_responses")
        .select("questionnaire_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.questionnaire_id] = (counts[r.questionnaire_id] || 0) + 1;
      });
      return counts;
    },
  });

  /* ── Shares for dialog ── */
  const { data: shares = [], refetch: refetchShares } = useQuery({
    queryKey: ["shares", shareDialogQ?.id],
    queryFn: async () => {
      if (!shareDialogQ) return [];
      const { data, error } = await supabase
        .from("questionnaire_shares")
        .select("*")
        .eq("questionnaire_id", shareDialogQ.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShareRow[];
    },
    enabled: !!shareDialogQ,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["questionnaire-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionnaire_responses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const visibleQuestionnaires = questionnaires.filter((q) => !isDeleted(q.id));

  /* ── Mutations ── */
  const upsertMutation = useMutation({
    mutationFn: async (payload: { id?: string; title: string; description: string; status: string; sections: Section[]; questions: Question[]; access: string; collectIdentity: boolean; version?: number }) => {
      const row: any = {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        sections_json: payload.sections,
        questions_json: payload.questions,
        access_mode: payload.access,
        collect_identity: payload.collectIdentity,
      };
      if (payload.id) {
        row.version = (payload.version || 1) + 1;
        const { error } = await supabase.from("questionnaires").update(row).eq("id", payload.id);
        if (error) throw error;
        return payload.id;
      } else {
        const { data, error } = await supabase.from("questionnaires").insert(row).select("id").single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questionnaires"] }),
  });

  const publishMutation = useMutation({
    mutationFn: async (qId: string) => {
      await supabase.from("questionnaires").update({ status: "published" }).eq("id", qId);
      // Create respond share if none
      const { data: existing } = await supabase
        .from("questionnaire_shares")
        .select("id")
        .eq("questionnaire_id", qId)
        .eq("share_type", "respond")
        .limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("questionnaire_shares").insert({ questionnaire_id: qId, share_type: "respond" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaires"] });
      toast.success("Questionnaire publié !");
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (qId: string) => {
      await supabase.from("questionnaires").update({ status: "closed" }).eq("id", qId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaires"] });
      toast.success("Collecte fermée");
    },
  });

  const createShareMutation = useMutation({
    mutationFn: async (payload: { questionnaire_id: string; share_type: string; access_mode?: string }) => {
      const { error } = await supabase.from("questionnaire_shares").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => refetchShares(),
  });

  const rotateTokenMutation = useMutation({
    mutationFn: async (shareId: string) => {
      // Delete old and create new
      const share = shares.find((s) => s.id === shareId);
      if (!share) return;
      await supabase.from("questionnaire_shares").delete().eq("id", shareId);
      await supabase.from("questionnaire_shares").insert({
        questionnaire_id: share.questionnaire_id,
        share_type: share.share_type,
        access_mode: share.access_mode,
        pin_code: share.pin_code,
        starts_at: share.starts_at,
        ends_at: share.ends_at,
        max_responses: share.max_responses,
        one_per_device: share.one_per_device,
      });
    },
    onSuccess: () => {
      refetchShares();
      toast.success("Nouveau lien généré (ancien invalidé)");
    },
  });

  const updateShareMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShareRow> & { id: string }) => {
      const { error } = await supabase.from("questionnaire_shares").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refetchShares(),
  });

  /* ── Builder helpers ── */
  const openBuilder = (q?: QRow) => {
    if (q) {
      setEditingId(q.id);
      setBuilderTitle(q.title);
      setBuilderDesc(q.description || "");
      setBuilderSections(q.sections_json || [{ id: "s1", title: "Section 1" }]);
      setBuilderQuestions(q.questions_json || []);
      setBuilderAccess(q.access_mode);
      setBuilderCollectIdentity(q.collect_identity);
    } else {
      setEditingId(null);
      setBuilderTitle(""); setBuilderDesc("");
      setBuilderSections([{ id: "s1", title: "Section 1" }]);
      setBuilderQuestions([]); setBuilderAccess("public"); setBuilderCollectIdentity(false);
    }
    setBuilderMode(true);
    setActiveTab("builder");
  };

  const addQuestion = (sectionId: string) => {
    setBuilderQuestions((prev) => [...prev, { id: `q_${Date.now()}`, sectionId, type: "text", label: "", required: false }]);
  };
  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setBuilderQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };
  const removeQuestion = (id: string) => setBuilderQuestions((prev) => prev.filter((q) => q.id !== id));
  const addOption = (qId: string) => {
    setBuilderQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, options: [...(q.options || []), { id: `o_${Date.now()}`, label: "" }] } : q));
  };
  const addSection = () => {
    setBuilderSections((prev) => [...prev, { id: `s_${Date.now()}`, title: `Section ${prev.length + 1}` }]);
  };

  const saveQuestionnaire = async (status: "draft" | "published") => {
    if (!builderTitle.trim()) { toast.error("Le titre est obligatoire."); return; }
    const existingQ = editingId ? questionnaires.find((q) => q.id === editingId) : null;
    try {
      const newId = await upsertMutation.mutateAsync({
        id: editingId || undefined,
        title: builderTitle, description: builderDesc, status,
        sections: builderSections, questions: builderQuestions,
        access: builderAccess, collectIdentity: builderCollectIdentity,
        version: existingQ?.version,
      });
      if (status === "published") {
        await publishMutation.mutateAsync(newId);
      }
      setBuilderMode(false);
      setActiveTab("list");
      toast.success(status === "published" ? "Questionnaire publié !" : "Brouillon sauvegardé");
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde");
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error("Décrivez le questionnaire souhaité."); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questionnaire", { body: { prompt: aiPrompt } });
      if (error) throw error;
      setBuilderTitle(data.title || "Questionnaire généré");
      setBuilderDesc(data.description || "");
      const sections: Section[] = (data.sections || []).map((s: any, i: number) => ({ id: s.id || `s_${Date.now()}_${i}`, title: s.title || `Section ${i + 1}`, description: s.description }));
      const questions: Question[] = (data.questions || []).map((q: any, i: number) => ({
        id: q.id || `q_${Date.now()}_${i}`, sectionId: q.sectionId || sections[0]?.id || "s1",
        type: q.type || "text", label: q.label || "", description: q.description, placeholder: q.placeholder,
        required: q.required ?? false, options: q.options, scaleMin: q.scaleMin, scaleMax: q.scaleMax,
        conditionalOn: q.conditionalOn || null,
      }));
      setBuilderSections(sections.length > 0 ? sections : [{ id: "s1", title: "Questionnaire" }]);
      setBuilderQuestions(questions);
      setEditingId(null);
      setBuilderMode(true);
      setActiveTab("builder");
      toast.success("Questionnaire généré !");
    } catch (err: any) {
      toast.error(err.message || "Erreur IA");
    } finally { setIsGenerating(false); }
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/s/${token}`;
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Questionnaires</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Créez, diffusez et analysez vos enquêtes</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => openBuilder()}>
            <Plus className="h-3.5 w-3.5" /> Nouveau questionnaire
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="list" className="gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" />Questionnaires</TabsTrigger>
            <TabsTrigger value="builder" className="gap-1.5 text-xs" disabled={!builderMode}><Settings2 className="h-3.5 w-3.5" />Builder</TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs" disabled={!previewQ && !builderMode}><Eye className="h-3.5 w-3.5" />Aperçu</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs"><Bot className="h-3.5 w-3.5" />Générer via IA</TabsTrigger>
            <TabsTrigger value="responses" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Réponses</TabsTrigger>
          </TabsList>

          {/* ── LIST ── */}
          <TabsContent value="list" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="glass-card p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
            ) : visibleQuestionnaires.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-heading text-lg font-semibold text-muted-foreground">Aucun questionnaire</h3>
                <p className="text-sm text-muted-foreground mt-1">Créez votre premier questionnaire via le builder ou l'IA.</p>
              </div>
            ) : (
              visibleQuestionnaires.map((q) => {
                const statusCfg = statusConfig[q.status] || statusConfig.draft;
                const count = responseCounts[q.id] || 0;
                return (
                  <div key={q.id} className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group animate-slide-up" onClick={() => setSelectedQ(selectedQ?.id === q.id ? null : q)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{q.title}</h3>
                          <Badge className={`text-[10px] border-0 ${statusCfg.className}`}>{statusCfg.label}</Badge>
                          <Badge variant="outline" className="text-[9px]">v{q.version}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{q.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                          <span>{(q.questions_json || []).length} questions</span>
                          <span>·</span>
                          <span className="font-medium text-primary">{count} réponses</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="text-xs gap-1 h-7" onClick={(e) => { e.stopPropagation(); setPreviewQ(q); setActiveTab("preview"); }}>
                          <Eye className="h-3 w-3" /> Aperçu
                        </Button>
                        {q.status === "published" && (
                          <Button size="sm" variant="ghost" className="text-xs gap-1 h-7 text-primary" onClick={(e) => { e.stopPropagation(); setShareDialogQ(q); }}>
                            <Share2 className="h-3 w-3" /> Partager
                          </Button>
                        )}
                        {q.status === "draft" && (
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-success border-success/30 hover:bg-success/10" onClick={(e) => { e.stopPropagation(); publishMutation.mutate(q.id); }}>
                            <Share2 className="h-3 w-3" /> Publier
                          </Button>
                        )}
                        {q.status === "published" && (
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-warning border-warning/30 hover:bg-warning/10" onClick={(e) => { e.stopPropagation(); closeMutation.mutate(q.id); }}>
                            <X className="h-3 w-3" /> Fermer
                          </Button>
                        )}
                        <EntityActions
                          entityName={q.title}
                          onEdit={() => openBuilder(q)}
                          onRename={() => setRenameTarget(q)}
                          onDuplicate={async () => {
                            await supabase.from("questionnaires").insert({
                              title: q.title + " (copie)", description: q.description,
                              sections_json: q.sections_json, questions_json: q.questions_json,
                              access_mode: q.access_mode, collect_identity: q.collect_identity,
                              project_id: q.project_id,
                            });
                            queryClient.invalidateQueries({ queryKey: ["questionnaires"] });
                            toast.success("Questionnaire dupliqué");
                          }}
                          onDelete={() => setDeleteTarget(q)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ── BUILDER ── */}
          <TabsContent value="builder" className="mt-4 space-y-4">
            {!builderMode ? (
              <div className="glass-card p-12 text-center">
                <Settings2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Cliquez sur "Nouveau questionnaire" ou éditez un existant.</p>
              </div>
            ) : (
              <>
                <div className="glass-card p-5 space-y-3">
                  <Input value={builderTitle} onChange={(e) => setBuilderTitle(e.target.value)} placeholder="Titre du questionnaire *" className="bg-secondary/30 border-border/50 text-base font-medium" />
                  <Textarea value={builderDesc} onChange={(e) => setBuilderDesc(e.target.value)} placeholder="Description (facultatif)" className="bg-secondary/30 border-border/50 min-h-[60px] text-sm" />
                </div>

                <div className="glass-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" />Paramètres</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Accès</Label>
                      <Select value={builderAccess} onValueChange={setBuilderAccess}>
                        <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">🌍 Public</SelectItem>
                          <SelectItem value="restricted">🔒 Restreint (invitations)</SelectItem>
                          <SelectItem value="pin">🔑 Code PIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={builderCollectIdentity} onCheckedChange={setBuilderCollectIdentity} />
                      <Label className="text-sm">Collecter l'identité</Label>
                    </div>
                  </div>
                </div>

                {builderSections.map((section) => (
                  <div key={section.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input value={section.title} onChange={(e) => setBuilderSections((prev) => prev.map((s) => s.id === section.id ? { ...s, title: e.target.value } : s))} className="bg-transparent border-0 font-semibold text-sm p-0 h-auto focus-visible:ring-0" placeholder="Titre de la section" />
                      {builderSections.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { setBuilderSections((p) => p.filter((s) => s.id !== section.id)); setBuilderQuestions((p) => p.filter((q) => q.sectionId !== section.id)); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {builderQuestions.filter((q) => q.sectionId === section.id).map((question) => (
                      <div key={question.id} className="p-3 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <Input value={question.label} onChange={(e) => updateQuestion(question.id, { label: e.target.value })} placeholder="Intitulé *" className="bg-secondary/30 border-border/50 text-sm flex-1" />
                              <Select value={question.type} onValueChange={(v) => updateQuestion(question.id, { type: v as QuestionType })}>
                                <SelectTrigger className="w-[160px] bg-secondary/30 border-border/50 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{QUESTION_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            {["single_choice", "multiple_choice", "dropdown"].includes(question.type) && (
                              <div className="space-y-1.5 pl-2">
                                {(question.options || []).map((opt, oi) => (
                                  <div key={opt.id} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-4">{oi + 1}.</span>
                                    <Input value={opt.label} onChange={(e) => { const n = [...(question.options || [])]; n[oi] = { ...opt, label: e.target.value }; updateQuestion(question.id, { options: n }); }} placeholder={`Option ${oi + 1}`} className="bg-secondary/30 border-border/50 text-xs h-8 flex-1" />
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => updateQuestion(question.id, { options: (question.options || []).filter((_, i) => i !== oi) })}><X className="h-3 w-3" /></Button>
                                  </div>
                                ))}
                                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => addOption(question.id)}><Plus className="h-3 w-3" />Ajouter option</Button>
                              </div>
                            )}
                            {question.type === "scale" && (
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">Min :</span>
                                <Input type="number" value={question.scaleMin || 1} onChange={(e) => updateQuestion(question.id, { scaleMin: parseInt(e.target.value) })} className="w-16 h-7 bg-secondary/30 border-border/50 text-xs" />
                                <span className="text-muted-foreground">Max :</span>
                                <Input type="number" value={question.scaleMax || 5} onChange={(e) => updateQuestion(question.id, { scaleMax: parseInt(e.target.value) })} className="w-16 h-7 bg-secondary/30 border-border/50 text-xs" />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch checked={question.required} onCheckedChange={(v) => updateQuestion(question.id, { required: v })} className="scale-75" />
                                <span className="text-[11px] text-muted-foreground">Obligatoire</span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBuilderQuestions((p) => [...p, { ...question, id: `q_${Date.now()}` }])}><Copy className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(question.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 border-dashed" onClick={() => addQuestion(section.id)}><Plus className="h-3 w-3" />Ajouter une question</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-dashed w-full" onClick={addSection}><Plus className="h-3.5 w-3.5" />Ajouter une section</Button>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setBuilderMode(false); setActiveTab("list"); }}>Annuler</Button>
                  <Button variant="outline" size="sm" onClick={() => saveQuestionnaire("draft")} disabled={upsertMutation.isPending}>Sauvegarder brouillon</Button>
                  <Button size="sm" className="gap-1.5" onClick={() => saveQuestionnaire("published")} disabled={upsertMutation.isPending}>
                    <Share2 className="h-3.5 w-3.5" />Publier
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── PREVIEW ── */}
          <TabsContent value="preview" className="mt-4 space-y-4">
            {(() => {
              const qp = previewQ || (builderMode ? { id: "preview", title: builderTitle || "Sans titre", description: builderDesc, sections_json: builderSections, questions_json: builderQuestions } as any : null);
              if (!qp) return <div className="glass-card p-12 text-center"><Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground text-sm">Sélectionnez un questionnaire.</p></div>;
              const sections: Section[] = qp.sections_json || qp.sections || [];
              const questions: Question[] = qp.questions_json || qp.questions || [];
              return (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm font-semibold">Aperçu</h2>
                    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
                      <Button variant={previewDevice === "desktop" ? "default" : "ghost"} size="sm" className="h-7 gap-1 text-xs" onClick={() => setPreviewDevice("desktop")}><Monitor className="h-3 w-3" />Desktop</Button>
                      <Button variant={previewDevice === "mobile" ? "default" : "ghost"} size="sm" className="h-7 gap-1 text-xs" onClick={() => setPreviewDevice("mobile")}><Smartphone className="h-3 w-3" />Mobile</Button>
                    </div>
                  </div>
                  <div className={`mx-auto transition-all ${previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
                    <div className="glass-card p-6 space-y-6 glow-border">
                      <div>
                        <h2 className="font-heading text-xl font-bold">{qp.title}</h2>
                        {qp.description && <p className="text-sm text-muted-foreground mt-1">{qp.description}</p>}
                        <Separator className="mt-4" />
                      </div>
                      {sections.map((section) => {
                        const sQs = questions.filter((q) => q.sectionId === section.id);
                        if (sQs.length === 0) return null;
                        return (
                          <div key={section.id} className="space-y-4">
                            <h3 className="font-heading text-sm font-semibold text-primary">{section.title}</h3>
                            {sQs.map((q) => (
                              <div key={q.id} className="space-y-1.5">
                                <Label className="text-sm">{q.label || "Question sans titre"}{q.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                                {q.type === "text" && <Input disabled className="bg-secondary/20" placeholder={q.placeholder || "Votre réponse"} />}
                                {q.type === "long_text" && <Textarea disabled className="bg-secondary/20 min-h-[80px]" placeholder={q.placeholder || "..."} />}
                                {q.type === "single_choice" && <RadioGroup disabled className="space-y-1.5">{(q.options || []).map((o) => <div key={o.id} className="flex items-center gap-2"><RadioGroupItem value={o.id} disabled /><Label className="text-sm font-normal">{o.label}</Label></div>)}</RadioGroup>}
                                {q.type === "multiple_choice" && <div className="space-y-1.5">{(q.options || []).map((o) => <div key={o.id} className="flex items-center gap-2"><Checkbox disabled /><Label className="text-sm font-normal">{o.label}</Label></div>)}</div>}
                                {q.type === "dropdown" && <Select disabled><SelectTrigger className="bg-secondary/20"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger></Select>}
                                {q.type === "scale" && <div className="flex items-center gap-2">{Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, i) => (q.scaleMin || 1) + i).map((n) => <Button key={n} variant="outline" size="sm" className="h-8 w-8 text-xs" disabled>{n}</Button>)}</div>}
                                {q.type === "date" && <Input type="date" disabled className="bg-secondary/20 max-w-[200px]" />}
                                {q.type === "consent" && <div className="flex items-start gap-2"><Checkbox disabled /><Label className="text-sm font-normal">{q.label}</Label></div>}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      <div className="pt-4"><Button disabled className="gap-2"><CheckCircle2 className="h-4 w-4" />Soumettre</Button></div>
                    </div>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* ── AI ── */}
          <TabsContent value="ai" className="mt-4 space-y-4">
            <div className="glass-card p-5 glow-border">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-primary" /><span className="font-heading text-sm font-semibold">Générer via IA</span></div>
              <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ex : Enquête de satisfaction habitants..." className="bg-secondary/30 border-border/50 min-h-[120px] text-sm" />
              <div className="flex gap-2 justify-end mt-3">
                <Button onClick={handleAIGenerate} disabled={isGenerating || !aiPrompt.trim()} className="gap-2">
                  {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Génération…</> : <><Bot className="h-4 w-4" />Générer</>}
                </Button>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Prompts suggérés</h3>
              <div className="space-y-2">
                {["Enquête de satisfaction habitants sur un projet d'aménagement urbain", "Questionnaire diagnostic mobilité", "Consultation parties prenantes PLUi", "Évaluation post-concertation"].map((p) => (
                  <button key={p} className="w-full text-left p-3 rounded-lg bg-secondary/20 border border-border/30 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors" onClick={() => setAiPrompt(p)}>
                    <Sparkles className="h-3 w-3 inline mr-2 text-primary" />{p}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── RESPONSES ── */}
          <TabsContent value="responses" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">Réponses ({responses.length})</h2>
            </div>
            {responses.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune réponse pour le moment.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Répondant</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Complétion</th>
                    </tr></thead>
                    <tbody>
                      {responses.map((r: any) => (
                        <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4 font-medium">{r.respondent_email || "Anonyme"}</td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="secondary" className={`text-[10px] border-0 ${r.completion_rate === 100 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{r.completion_rate}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── SHARE DIALOG ── */}
      <Dialog open={!!shareDialogQ} onOpenChange={(open) => !open && setShareDialogQ(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" />Partager : {shareDialogQ?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {shares.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun lien de partage</p>
            ) : (
              shares.map((s) => (
                <div key={s.id} className="p-3 rounded-lg bg-secondary/20 border border-border/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={s.share_type === "respond" ? "bg-primary/15 text-primary" : "bg-info/15 text-info"} variant="secondary">
                      {s.share_type === "respond" ? "Répondre" : "Aperçu"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {s.access_mode === "public" ? "🌍 Public" : s.access_mode === "pin" ? "🔑 PIN" : "🔒 Restreint"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={getShareUrl(s.token)} className="bg-secondary/30 text-xs flex-1" />
                    <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => { navigator.clipboard.writeText(getShareUrl(s.token)); toast.success("Lien copié !"); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => rotateTokenMutation.mutate(s.id)} title="Régénérer le lien">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Share settings */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Accès</Label>
                      <Select value={s.access_mode} onValueChange={(v) => updateShareMutation.mutate({ id: s.id, access_mode: v } as any)}>
                        <SelectTrigger className="h-8 text-xs bg-secondary/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="restricted">Restreint</SelectItem>
                          <SelectItem value="pin">PIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Max réponses</Label>
                      <Input type="number" value={s.max_responses || ""} placeholder="∞" className="h-8 text-xs bg-secondary/30" onChange={(e) => updateShareMutation.mutate({ id: s.id, max_responses: e.target.value ? parseInt(e.target.value) : null } as any)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={s.one_per_device} onCheckedChange={(v) => updateShareMutation.mutate({ id: s.id, one_per_device: v } as any)} className="scale-75" />
                    <span className="text-[11px] text-muted-foreground">1 réponse par appareil</span>
                  </div>
                  {s.access_mode === "pin" && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Code PIN</Label>
                      <Input value={s.pin_code || ""} placeholder="Ex: 1234" className="h-8 text-xs bg-secondary/30" onChange={(e) => updateShareMutation.mutate({ id: s.id, pin_code: e.target.value } as any)} />
                    </div>
                  )}
                </div>
              ))
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => createShareMutation.mutate({ questionnaire_id: shareDialogQ!.id, share_type: "respond" })}>
                <Plus className="h-3 w-3" /> Lien répondre
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => createShareMutation.mutate({ questionnaire_id: shareDialogQ!.id, share_type: "preview" })}>
                <Eye className="h-3 w-3" /> Lien aperçu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.title || ""}
        entityType="le questionnaire"
        onConfirm={async (newName) => {
          if (!renameTarget) return;
          await supabase.from("questionnaires").update({ title: newName }).eq("id", renameTarget.id);
          queryClient.invalidateQueries({ queryKey: ["questionnaires"] });
          setRenameTarget(null);
        }}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.title}
          entityType="le questionnaire"
          relatedCount={responseCounts[deleteTarget.id] || 0}
          onConfirm={async () => {
            await supabase.from("questionnaires").update({ deleted_at: new Date().toISOString() }).eq("id", deleteTarget.id);
            queryClient.invalidateQueries({ queryKey: ["questionnaires"] });
            setDeleteTarget(null);
            toast.success("Questionnaire supprimé");
          }}
        />
      )}
    </Layout>
  );
}
