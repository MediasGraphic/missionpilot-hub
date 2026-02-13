import { useState } from "react";
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
import {
  ClipboardList,
  Plus,
  Search,
  GripVertical,
  Trash2,
  Copy,
  Settings2,
  Share2,
  BarChart3,
  FileDown,
  Eye,
  Link2,
  Lock,
  Globe,
  Mail,
  Bot,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  Loader2,
  ExternalLink,
  X,
  Smartphone,
  Monitor,
} from "lucide-react";
import { EntityActions } from "@/components/EntityActions";
import { SoftDeleteDialog } from "@/components/SoftDeleteDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { toast } from "sonner";

/* ── Types ── */
type QuestionType =
  | "text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "scale"
  | "date"
  | "file"
  | "consent";

interface QuestionOption {
  id: string;
  label: string;
}

interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  conditionalOn?: { questionId: string; value: string } | null;
}

interface Section {
  id: string;
  title: string;
  description?: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  project: string;
  status: "brouillon" | "publié" | "fermé";
  version: number;
  sections: Section[];
  questions: Question[];
  access: "public" | "restricted" | "email_list";
  collectIdentity: boolean;
  responsesCount: number;
  createdAt: string;
  shareLink?: string;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Texte court",
  long_text: "Texte long",
  single_choice: "Choix unique",
  multiple_choice: "Choix multiple",
  dropdown: "Liste déroulante",
  scale: "Échelle",
  date: "Date",
  file: "Fichier",
  consent: "Consentement",
};

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = Object.entries(
  QUESTION_TYPE_LABELS
).map(([value, label]) => ({ value: value as QuestionType, label }));

const ACCESS_LABELS: Record<string, { label: string; icon: typeof Globe }> = {
  public: { label: "Public", icon: Globe },
  restricted: { label: "Utilisateurs connectés", icon: Lock },
  email_list: { label: "Liste d'emails", icon: Mail },
};

/* ── Mock data ── */
const MOCK_QUESTIONNAIRES: Questionnaire[] = [
  {
    id: "q1",
    title: "Enquête mobilité douce – Habitants",
    description: "Questionnaire sur les habitudes de déplacement et attentes en mobilité douce",
    project: "Mobilité Grand Ouest",
    status: "publié",
    version: 2,
    sections: [
      { id: "s1", title: "Profil du répondant" },
      { id: "s2", title: "Habitudes de déplacement" },
      { id: "s3", title: "Attentes & priorités" },
    ],
    questions: [
      { id: "qq1", sectionId: "s1", type: "text", label: "Code postal", required: true },
      { id: "qq2", sectionId: "s1", type: "single_choice", label: "Tranche d'âge", required: true, options: [{ id: "o1", label: "18-25" }, { id: "o2", label: "26-35" }, { id: "o3", label: "36-50" }, { id: "o4", label: "51-65" }, { id: "o5", label: "65+" }] },
      { id: "qq3", sectionId: "s2", type: "multiple_choice", label: "Modes de transport utilisés", required: true, options: [{ id: "o6", label: "Voiture" }, { id: "o7", label: "Transport en commun" }, { id: "o8", label: "Vélo" }, { id: "o9", label: "Marche" }, { id: "o10", label: "Trottinette" }] },
      { id: "qq4", sectionId: "s2", type: "scale", label: "Satisfaction du réseau actuel", required: false, scaleMin: 1, scaleMax: 10 },
      { id: "qq5", sectionId: "s3", type: "long_text", label: "Quelles améliorations souhaitez-vous ?", required: false, placeholder: "Décrivez vos attentes..." },
      { id: "qq6", sectionId: "s3", type: "consent", label: "J'accepte que mes réponses soient utilisées dans le cadre de cette étude", required: true },
    ],
    access: "public",
    collectIdentity: false,
    responsesCount: 312,
    createdAt: "2026-01-15",
    shareLink: "https://missionpilot.app/forms/q1",
  },
  {
    id: "q2",
    title: "Consultation parties prenantes – PLUi",
    description: "Recueil des positions des acteurs institutionnels sur le PLUi",
    project: "PLUi Littoral",
    status: "brouillon",
    version: 1,
    sections: [{ id: "s1", title: "Identification" }, { id: "s2", title: "Avis et propositions" }],
    questions: [
      { id: "qq7", sectionId: "s1", type: "text", label: "Organisme", required: true },
      { id: "qq8", sectionId: "s2", type: "long_text", label: "Votre avis sur le projet de PLUi", required: true },
    ],
    access: "restricted",
    collectIdentity: true,
    responsesCount: 0,
    createdAt: "2026-02-10",
  },
  {
    id: "q3",
    title: "Satisfaction post-concertation",
    description: "Évaluation de la qualité du processus de concertation",
    project: "ZAC Centre",
    status: "fermé",
    version: 1,
    sections: [{ id: "s1", title: "Évaluation" }],
    questions: [
      { id: "qq9", sectionId: "s1", type: "scale", label: "Note globale de satisfaction", required: true, scaleMin: 1, scaleMax: 5 },
      { id: "qq10", sectionId: "s1", type: "long_text", label: "Commentaire libre", required: false },
    ],
    access: "email_list",
    collectIdentity: true,
    responsesCount: 47,
    createdAt: "2026-01-20",
  },
];

/* ── Responses mock ── */
const MOCK_RESPONSES = [
  { id: "r1", questionnaireId: "q1", respondent: "Anonyme", date: "2026-02-12", channel: "Web", completionRate: 100 },
  { id: "r2", questionnaireId: "q1", respondent: "Anonyme", date: "2026-02-11", channel: "Web", completionRate: 85 },
  { id: "r3", questionnaireId: "q1", respondent: "Anonyme", date: "2026-02-11", channel: "Terrain", completionRate: 100 },
  { id: "r4", questionnaireId: "q1", respondent: "Anonyme", date: "2026-02-10", channel: "Web", completionRate: 60 },
  { id: "r5", questionnaireId: "q3", respondent: "j.martin@commune.fr", date: "2026-01-25", channel: "Email", completionRate: 100 },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  publié: { label: "Publié", className: "bg-success/15 text-success" },
  fermé: { label: "Fermé", className: "bg-warning/15 text-warning" },
};

export default function Questionnaires() {
  const [questionnaires, setQuestionnaires] = useState(MOCK_QUESTIONNAIRES);
  const [activeTab, setActiveTab] = useState("list");
  const [deleteTarget, setDeleteTarget] = useState<Questionnaire | null>(null);
  const [renameTarget, setRenameTarget] = useState<Questionnaire | null>(null);
  const [previewQ, setPreviewQ] = useState<Questionnaire | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const { softDelete, isDeleted } = useSoftDelete();

  /* ── Builder state ── */
  const [builderMode, setBuilderMode] = useState(false);
  const [editingQ, setEditingQ] = useState<Questionnaire | null>(null);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderSections, setBuilderSections] = useState<Section[]>([
    { id: "s1", title: "Section 1" },
  ]);
  const [builderQuestions, setBuilderQuestions] = useState<Question[]>([]);
  const [builderAccess, setBuilderAccess] = useState<"public" | "restricted" | "email_list">("public");
  const [builderCollectIdentity, setBuilderCollectIdentity] = useState(false);

  /* ── AI generation state ── */
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  /* ── Selected questionnaire for detail ── */
  const [selectedQ, setSelectedQ] = useState<Questionnaire | null>(null);

  const visibleQuestionnaires = questionnaires.filter((q) => !isDeleted(q.id));

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDelete({ id: deleteTarget.id, name: deleteTarget.title, type: "questionnaire" });
    setDeleteTarget(null);
  };

  const openBuilder = (q?: Questionnaire) => {
    if (q) {
      setEditingQ(q);
      setBuilderTitle(q.title);
      setBuilderDesc(q.description);
      setBuilderSections(q.sections);
      setBuilderQuestions(q.questions);
      setBuilderAccess(q.access);
      setBuilderCollectIdentity(q.collectIdentity);
    } else {
      setEditingQ(null);
      setBuilderTitle("");
      setBuilderDesc("");
      setBuilderSections([{ id: "s1", title: "Section 1" }]);
      setBuilderQuestions([]);
      setBuilderAccess("public");
      setBuilderCollectIdentity(false);
    }
    setBuilderMode(true);
    setActiveTab("builder");
  };

  const addQuestion = (sectionId: string) => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      sectionId,
      type: "text",
      label: "",
      required: false,
    };
    setBuilderQuestions((prev) => [...prev, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setBuilderQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setBuilderQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setBuilderQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), { id: `o_${Date.now()}`, label: "" }] }
          : q
      )
    );
  };

  const addSection = () => {
    setBuilderSections((prev) => [
      ...prev,
      { id: `s_${Date.now()}`, title: `Section ${prev.length + 1}` },
    ]);
  };

  const saveQuestionnaire = (status: "brouillon" | "publié") => {
    if (!builderTitle.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }
    const newQ: Questionnaire = {
      id: editingQ?.id || `q_${Date.now()}`,
      title: builderTitle,
      description: builderDesc,
      project: "Mobilité Grand Ouest",
      status,
      version: editingQ ? editingQ.version + 1 : 1,
      sections: builderSections,
      questions: builderQuestions,
      access: builderAccess,
      collectIdentity: builderCollectIdentity,
      responsesCount: editingQ?.responsesCount || 0,
      createdAt: new Date().toISOString().split("T")[0],
      shareLink: status === "publié" ? `https://missionpilot.app/forms/q_${Date.now()}` : undefined,
    };

    if (editingQ) {
      setQuestionnaires((prev) => prev.map((q) => (q.id === editingQ.id ? newQ : q)));
    } else {
      setQuestionnaires((prev) => [...prev, newQ]);
    }

    setBuilderMode(false);
    setActiveTab("list");
    toast.success(
      status === "publié"
        ? `Questionnaire "${builderTitle}" publié avec lien de partage !`
        : `Questionnaire "${builderTitle}" sauvegardé en brouillon`
    );
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Décrivez le questionnaire souhaité.");
      return;
    }
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-questionnaire", {
        body: { prompt: aiPrompt },
      });

      if (error) throw error;

      const title = data.title || "Questionnaire généré par IA";
      const description = data.description || "";
      const sections: Section[] = (data.sections || []).map((s: any, i: number) => ({
        id: s.id || `s_${Date.now()}_${i}`,
        title: s.title || `Section ${i + 1}`,
        description: s.description,
      }));
      const questions: Question[] = (data.questions || []).map((q: any, i: number) => ({
        id: q.id || `q_${Date.now()}_${i}`,
        sectionId: q.sectionId || sections[0]?.id || "s1",
        type: q.type || "text",
        label: q.label || "",
        description: q.description,
        placeholder: q.placeholder,
        required: q.required ?? false,
        options: q.options,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        conditionalOn: q.conditionalOn || null,
      }));

      setBuilderTitle(title);
      setBuilderDesc(description);
      setBuilderSections(sections.length > 0 ? sections : [{ id: "s1", title: "Questionnaire" }]);
      setBuilderQuestions(questions);
      setBuilderMode(true);
      setActiveTab("builder");
      toast.success("Questionnaire généré ! Vous pouvez l'éditer avant publication.");
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Erreur lors de la génération du questionnaire.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCSVImport = () => {
    toast.info("Import CSV : sélectionnez un fichier au format Titre;Type;Obligatoire;Options");
  };

  const handleCloseForm = (q: Questionnaire) => {
    setQuestionnaires((prev) =>
      prev.map((item) =>
        item.id === q.id ? { ...item, status: "fermé" as const } : item
      )
    );
    toast.success(`Collecte fermée pour "${q.title}"`);
  };

  const handlePublish = (q: Questionnaire) => {
    setQuestionnaires((prev) =>
      prev.map((item) =>
        item.id === q.id
          ? { ...item, status: "publié" as const, shareLink: `https://missionpilot.app/forms/${q.id}` }
          : item
      )
    );
    toast.success(`"${q.title}" publié !`);
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
              <p className="text-muted-foreground text-sm mt-0.5">
                Créez, diffusez et analysez vos enquêtes
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCSVImport}>
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => openBuilder()}>
              <Plus className="h-3.5 w-3.5" />
              Nouveau questionnaire
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="list" className="gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              Questionnaires
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-1.5 text-xs" disabled={!builderMode}>
              <Settings2 className="h-3.5 w-3.5" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs" disabled={!previewQ && !builderMode}>
              <Eye className="h-3.5 w-3.5" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5" />
              Générer via IA
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Réponses
            </TabsTrigger>
          </TabsList>

          {/* ── LIST ── */}
          <TabsContent value="list" className="mt-4 space-y-3">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un questionnaire..." className="pl-9 bg-secondary/50" />
              </div>
            </div>

            {visibleQuestionnaires.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-heading text-lg font-semibold text-muted-foreground">
                  Aucun questionnaire
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Créez votre premier questionnaire via le builder ou l'assistant IA.
                </p>
              </div>
            ) : (
              visibleQuestionnaires.map((q) => {
                const statusCfg = statusConfig[q.status];
                const AccessIcon = ACCESS_LABELS[q.access].icon;
                return (
                  <div
                    key={q.id}
                    className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group animate-slide-up"
                    onClick={() => setSelectedQ(selectedQ?.id === q.id ? null : q)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {q.title}
                          </h3>
                          <Badge className={`text-[10px] border-0 ${statusCfg.className}`}>
                            {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-[9px]">
                            v{q.version}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{q.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                          <span>{q.project}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <AccessIcon className="h-3 w-3" />
                            {ACCESS_LABELS[q.access].label}
                          </span>
                          <span>·</span>
                          <span>{q.questions.length} questions</span>
                          <span>·</span>
                          <span className="font-medium text-primary">{q.responsesCount} réponses</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 h-7"
                          onClick={(e) => { e.stopPropagation(); setPreviewQ(q); setActiveTab("preview"); }}
                        >
                          <Eye className="h-3 w-3" />
                          Aperçu
                        </Button>
                        {q.status === "brouillon" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1 text-success border-success/30 hover:bg-success/10"
                            onClick={(e) => { e.stopPropagation(); handlePublish(q); }}
                          >
                            <Share2 className="h-3 w-3" />
                            Publier
                          </Button>
                        )}
                        {q.status === "publié" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1 text-warning border-warning/30 hover:bg-warning/10"
                            onClick={(e) => { e.stopPropagation(); handleCloseForm(q); }}
                          >
                            <X className="h-3 w-3" />
                            Fermer
                          </Button>
                        )}
                        <EntityActions
                          entityName={q.title}
                          onEdit={() => openBuilder(q)}
                          onRename={() => setRenameTarget(q)}
                          onDuplicate={() => {
                            const dup = { ...q, id: `q_${Date.now()}`, title: q.title + " (copie)", status: "brouillon" as const, responsesCount: 0 };
                            setQuestionnaires((prev) => [...prev, dup]);
                            toast.success("Questionnaire dupliqué");
                          }}
                          onDelete={() => setDeleteTarget(q)}
                        />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selectedQ?.id === q.id && (
                      <div className="mt-4 pt-4 border-t border-border/30 space-y-3 animate-fade-in">
                        {q.shareLink && (
                          <div className="flex items-center gap-2 p-2 rounded bg-secondary/30 text-xs">
                            <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate text-muted-foreground">{q.shareLink}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[10px] shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(q.shareLink || "");
                                toast.success("Lien copié !");
                              }}
                            >
                              Copier
                            </Button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-2 rounded bg-secondary/20 text-center">
                            <span className="font-heading text-lg font-bold text-primary">{q.sections.length}</span>
                            <p className="text-muted-foreground mt-0.5">Section(s)</p>
                          </div>
                          <div className="p-2 rounded bg-secondary/20 text-center">
                            <span className="font-heading text-lg font-bold text-primary">{q.questions.length}</span>
                            <p className="text-muted-foreground mt-0.5">Question(s)</p>
                          </div>
                          <div className="p-2 rounded bg-secondary/20 text-center">
                            <span className="font-heading text-lg font-bold text-primary">{q.responsesCount}</span>
                            <p className="text-muted-foreground mt-0.5">Réponse(s)</p>
                          </div>
                          <div className="p-2 rounded bg-secondary/20 text-center">
                            <span className="font-heading text-lg font-bold text-primary">{q.questions.filter((qq) => qq.required).length}</span>
                            <p className="text-muted-foreground mt-0.5">Obligatoire(s)</p>
                          </div>
                        </div>
                      </div>
                    )}
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
                <p className="text-muted-foreground text-sm">
                  Cliquez sur "Nouveau questionnaire" ou éditez un existant pour ouvrir le builder.
                </p>
              </div>
            ) : (
              <>
                {/* Title & description */}
                <div className="glass-card p-5 space-y-3">
                  <Input
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    placeholder="Titre du questionnaire *"
                    className="bg-secondary/30 border-border/50 text-base font-medium"
                  />
                  <Textarea
                    value={builderDesc}
                    onChange={(e) => setBuilderDesc(e.target.value)}
                    placeholder="Description (facultatif)"
                    className="bg-secondary/30 border-border/50 min-h-[60px] text-sm"
                  />
                </div>

                {/* Sharing settings */}
                <div className="glass-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Paramètres de partage
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Accès</Label>
                      <Select value={builderAccess} onValueChange={(v) => setBuilderAccess(v as typeof builderAccess)}>
                        <SelectTrigger className="bg-secondary/30 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">🌍 Public</SelectItem>
                          <SelectItem value="restricted">🔒 Utilisateurs connectés</SelectItem>
                          <SelectItem value="email_list">📧 Liste d'emails autorisés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={builderCollectIdentity}
                        onCheckedChange={setBuilderCollectIdentity}
                      />
                      <Label className="text-sm">Collecter l'identité du répondant</Label>
                    </div>
                  </div>
                </div>

                {/* Sections & Questions */}
                {builderSections.map((section) => (
                  <div key={section.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          setBuilderSections((prev) =>
                            prev.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s))
                          )
                        }
                        className="bg-transparent border-0 font-semibold text-sm p-0 h-auto focus-visible:ring-0"
                        placeholder="Titre de la section"
                      />
                      {builderSections.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setBuilderSections((prev) => prev.filter((s) => s.id !== section.id));
                            setBuilderQuestions((prev) => prev.filter((q) => q.sectionId !== section.id));
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {builderQuestions
                      .filter((q) => q.sectionId === section.id)
                      .map((question) => (
                        <div
                          key={question.id}
                          className="p-3 rounded-lg bg-secondary/20 border border-border/30 space-y-2"
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2 shrink-0 cursor-grab" />
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={question.label}
                                  onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                                  placeholder="Intitulé de la question *"
                                  className="bg-secondary/30 border-border/50 text-sm flex-1"
                                />
                                <Select
                                  value={question.type}
                                  onValueChange={(v) => updateQuestion(question.id, { type: v as QuestionType })}
                                >
                                  <SelectTrigger className="w-[160px] bg-secondary/30 border-border/50 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {QUESTION_TYPE_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Options for choice types */}
                              {["single_choice", "multiple_choice", "dropdown"].includes(question.type) && (
                                <div className="space-y-1.5 pl-2">
                                  {(question.options || []).map((opt, oi) => (
                                    <div key={opt.id} className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground w-4">{oi + 1}.</span>
                                      <Input
                                        value={opt.label}
                                        onChange={(e) => {
                                          const newOptions = [...(question.options || [])];
                                          newOptions[oi] = { ...opt, label: e.target.value };
                                          updateQuestion(question.id, { options: newOptions });
                                        }}
                                        placeholder={`Option ${oi + 1}`}
                                        className="bg-secondary/30 border-border/50 text-xs h-8 flex-1"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                          const newOptions = (question.options || []).filter((_, i) => i !== oi);
                                          updateQuestion(question.id, { options: newOptions });
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-primary gap-1"
                                    onClick={() => addOption(question.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                    Ajouter une option
                                  </Button>
                                </div>
                              )}

                              {/* Scale settings */}
                              {question.type === "scale" && (
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-muted-foreground">Min :</span>
                                  <Input
                                    type="number"
                                    value={question.scaleMin || 1}
                                    onChange={(e) => updateQuestion(question.id, { scaleMin: parseInt(e.target.value) })}
                                    className="w-16 h-7 bg-secondary/30 border-border/50 text-xs"
                                  />
                                  <span className="text-muted-foreground">Max :</span>
                                  <Input
                                    type="number"
                                    value={question.scaleMax || 5}
                                    onChange={(e) => updateQuestion(question.id, { scaleMax: parseInt(e.target.value) })}
                                    className="w-16 h-7 bg-secondary/30 border-border/50 text-xs"
                                  />
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={question.required}
                                    onCheckedChange={(v) => updateQuestion(question.id, { required: v })}
                                    className="scale-75"
                                  />
                                  <span className="text-[11px] text-muted-foreground">Obligatoire</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      const dup = { ...question, id: `q_${Date.now()}` };
                                      setBuilderQuestions((prev) => [...prev, dup]);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeQuestion(question.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 border-dashed"
                      onClick={() => addQuestion(section.id)}
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter une question
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-dashed w-full"
                  onClick={addSection}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une section
                </Button>

                {/* Save actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBuilderMode(false);
                      setActiveTab("list");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveQuestionnaire("brouillon")}
                  >
                    Sauvegarder brouillon
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => saveQuestionnaire("publié")}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Publier
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── PREVIEW ── */}
          <TabsContent value="preview" className="mt-4 space-y-4">
            {(() => {
              const qToPreview = previewQ || (builderMode ? {
                id: "preview",
                title: builderTitle || "Sans titre",
                description: builderDesc,
                project: "",
                status: "brouillon" as const,
                version: 1,
                sections: builderSections,
                questions: builderQuestions,
                access: builderAccess,
                collectIdentity: builderCollectIdentity,
                responsesCount: 0,
                createdAt: "",
              } : null);

              if (!qToPreview) {
                return (
                  <div className="glass-card p-12 text-center">
                    <Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Sélectionnez un questionnaire pour afficher l'aperçu.</p>
                  </div>
                );
              }

              return (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm font-semibold">Aperçu du formulaire</h2>
                    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
                      <Button
                        variant={previewDevice === "desktop" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setPreviewDevice("desktop")}
                      >
                        <Monitor className="h-3 w-3" /> Desktop
                      </Button>
                      <Button
                        variant={previewDevice === "mobile" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setPreviewDevice("mobile")}
                      >
                        <Smartphone className="h-3 w-3" /> Mobile
                      </Button>
                    </div>
                  </div>

                  <div className={`mx-auto transition-all ${previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
                    <div className="glass-card p-6 space-y-6 glow-border">
                      <div>
                        <h2 className="font-heading text-xl font-bold">{qToPreview.title}</h2>
                        {qToPreview.description && (
                          <p className="text-sm text-muted-foreground mt-1">{qToPreview.description}</p>
                        )}
                        <Separator className="mt-4" />
                      </div>

                      {qToPreview.sections.map((section) => {
                        const sectionQuestions = qToPreview.questions.filter((q) => q.sectionId === section.id);
                        if (sectionQuestions.length === 0) return null;
                        return (
                          <div key={section.id} className="space-y-4">
                            <h3 className="font-heading text-sm font-semibold text-primary">{section.title}</h3>
                            {sectionQuestions.map((q) => (
                              <div key={q.id} className="space-y-1.5">
                                <Label className="text-sm">
                                  {q.label || "Question sans titre"}
                                  {q.required && <span className="text-destructive ml-0.5">*</span>}
                                </Label>
                                {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}

                                {q.type === "text" && (
                                  <Input placeholder={q.placeholder || "Votre réponse"} disabled className="bg-secondary/20" />
                                )}
                                {q.type === "long_text" && (
                                  <Textarea placeholder={q.placeholder || "Votre réponse..."} disabled className="bg-secondary/20 min-h-[80px]" />
                                )}
                                {q.type === "single_choice" && (
                                  <RadioGroup disabled className="space-y-1.5">
                                    {(q.options || []).map((opt) => (
                                      <div key={opt.id} className="flex items-center gap-2">
                                        <RadioGroupItem value={opt.id} disabled />
                                        <Label className="text-sm font-normal">{opt.label || "Option"}</Label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                )}
                                {q.type === "multiple_choice" && (
                                  <div className="space-y-1.5">
                                    {(q.options || []).map((opt) => (
                                      <div key={opt.id} className="flex items-center gap-2">
                                        <Checkbox disabled />
                                        <Label className="text-sm font-normal">{opt.label || "Option"}</Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {q.type === "dropdown" && (
                                  <Select disabled>
                                    <SelectTrigger className="bg-secondary/20"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                    <SelectContent>
                                      {(q.options || []).map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                {q.type === "scale" && (
                                  <div className="flex items-center gap-2">
                                    {Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, i) => (q.scaleMin || 1) + i).map((n) => (
                                      <Button key={n} variant="outline" size="sm" className="h-8 w-8 text-xs" disabled>{n}</Button>
                                    ))}
                                  </div>
                                )}
                                {q.type === "date" && (
                                  <Input type="date" disabled className="bg-secondary/20 max-w-[200px]" />
                                )}
                                {q.type === "consent" && (
                                  <div className="flex items-start gap-2">
                                    <Checkbox disabled />
                                    <Label className="text-sm font-normal">{q.label}</Label>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      <div className="pt-4">
                        <Button disabled className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Soumettre
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* ── AI GENERATION ── */}
          <TabsContent value="ai" className="mt-4 space-y-4">
            <div className="glass-card p-5 glow-border">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-heading text-sm font-semibold">Générer un questionnaire avec l'IA</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Décrivez votre besoin en langage naturel. L'IA proposera un questionnaire complet que vous pourrez éditer avant publication.
              </p>

              <div className="space-y-3">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex : Je veux un questionnaire de satisfaction pour les habitants sur le projet de réaménagement du centre-ville, avec des questions sur la mobilité, les espaces verts, et le commerce local. Inclure une échelle de satisfaction et une question ouverte."
                  className="bg-secondary/30 border-border/50 min-h-[120px] text-sm"
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération en cours…
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        Générer le questionnaire
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick templates */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Prompts suggérés</h3>
              <div className="space-y-2">
                {[
                  "Enquête de satisfaction habitants sur un projet d'aménagement urbain",
                  "Questionnaire de diagnostic mobilité pour une étude territoriale",
                  "Consultation des parties prenantes institutionnelles sur un PLUi",
                  "Évaluation post-concertation : qualité du dispositif et recommandations",
                ].map((p) => (
                  <button
                    key={p}
                    className="w-full text-left p-3 rounded-lg bg-secondary/20 border border-border/30 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                    onClick={() => setAiPrompt(p)}
                  >
                    <Sparkles className="h-3 w-3 inline mr-2 text-primary" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── RESPONSES ── */}
          <TabsContent value="responses" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">
                Réponses collectées ({MOCK_RESPONSES.length})
              </h2>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FileDown className="h-3.5 w-3.5" />
                Exporter CSV
              </Button>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Répondant</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Canal</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Complétion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_RESPONSES.map((r) => (
                      <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-medium">{r.respondent}</td>
                        <td className="py-3 px-4 text-muted-foreground">{r.date}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-[10px] bg-secondary border-0">
                            {r.channel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] border-0 ${
                              r.completionRate === 100
                                ? "bg-success/15 text-success"
                                : "bg-warning/15 text-warning"
                            }`}
                          >
                            {r.completionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.title || ""}
        entityType="le questionnaire"
        onConfirm={(newName) => {
          if (!renameTarget) return;
          setQuestionnaires((prev) => prev.map((q) => (q.id === renameTarget.id ? { ...q, title: newName } : q)));
          setRenameTarget(null);
        }}
      />

      {deleteTarget && (
        <SoftDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          entityName={deleteTarget.title}
          entityType="le questionnaire"
          relatedCount={deleteTarget.responsesCount}
          onConfirm={handleSoftDelete}
        />
      )}
    </Layout>
  );
}
