import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot,
  FileText,
  Upload,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Calendar,
  BarChart3,
  ClipboardList,
  Loader2,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

/* ── Types ── */
interface Source {
  id: string;
  name: string;
  content: string;
  type: "document" | "text" | "cr" | "email";
}

interface Requirement {
  title: string;
  category: string;
  priority: string;
  description: string;
  due_date: string | null;
  deliverable: string | null;
  source_ref: string;
  confidence: "faible" | "moyen" | "fort";
}

interface PlanningPhase {
  name: string;
  start_offset_weeks: number;
  duration_weeks: number;
  tasks: { name: string; duration_days: number; deliverable: string | null }[];
  source_ref?: string;
  confidence?: "faible" | "moyen" | "fort";
}

interface KPI {
  name: string;
  definition: string;
  formula: string;
  target: string | number;
  frequency: string;
  source_ref: string;
  confidence: "faible" | "moyen" | "fort";
}

interface AnalysisResult {
  requirements: Requirement[];
  planning: { phases: PlanningPhase[] };
  kpis: KPI[];
}

const TEMPLATES = [
  { value: "etude-enquete", label: "Étude + enquête terrain" },
  { value: "concertation-multi", label: "Concertation publique multi-événements" },
  { value: "communication-multicanal", label: "Communication multicanal" },
  { value: "mixte", label: "Mixte (étude + concertation + comm)" },
];

const confidenceColors: Record<string, string> = {
  faible: "bg-destructive/15 text-destructive",
  moyen: "bg-warning/15 text-warning",
  fort: "bg-success/15 text-success",
};

const priorityColors: Record<string, string> = {
  haute: "bg-destructive/15 text-destructive",
  moyenne: "bg-warning/15 text-warning",
  basse: "bg-muted text-muted-foreground",
};

export default function AIAssistant() {
  const [sources, setSources] = useState<Source[]>([]);
  const [newText, setNewText] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Source["type"]>("text");
  const [template, setTemplate] = useState("mixte");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const addSource = () => {
    if (!newText.trim()) return;
    const src: Source = {
      id: crypto.randomUUID(),
      name: newName.trim() || `Source ${sources.length + 1}`,
      content: newText.trim(),
      type: newType,
    };
    setSources((prev) => [...prev, src]);
    setNewText("");
    setNewName("");
    toast.success("Source ajoutée");
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const text = await file.text();
      setSources((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: file.name, content: text, type: "document" },
      ]);
    }
    toast.success(`${files.length} fichier(s) importé(s)`);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (sources.length === 0) {
      toast.error("Ajoutez au moins une source avant d'analyser.");
      return;
    }
    setIsAnalyzing(true);
    setResult(null);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          sources: sources.map((s) => ({ name: s.name, content: s.content })),
          template,
        }),
      });

      if (resp.status === 429) {
        toast.error("Trop de requêtes. Réessayez dans quelques instants.");
        return;
      }
      if (resp.status === 402) {
        toast.error("Crédits IA insuffisants.");
        return;
      }
      if (!resp.ok) throw new Error("Erreur serveur");

      const data: AnalysisResult = await resp.json();
      setResult(data);
      toast.success("Analyse terminée !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'analyse IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleValidate = async () => {
    if (!result) return;
    setIsValidating(true);
    // Simulate WBS creation - in production this would insert into Supabase
    await new Promise((r) => setTimeout(r, 1500));
    setIsValidating(false);
    toast.success("Projet WBS créé avec ScheduleVersion v1 !");
  };

  const typeLabels: Record<Source["type"], string> = {
    document: "Document",
    text: "Texte libre",
    cr: "Compte-rendu",
    email: "Email",
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Assistant IA</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Extraction d'exigences & proposition de planning
              </p>
            </div>
          </div>
        </div>

        {/* Workflow */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info/10 text-info font-medium">
              <Upload className="h-3.5 w-3.5" />
              1. Sources
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
              <Search className="h-3.5 w-3.5" />
              2. Analyser
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning font-medium">
              <ClipboardList className="h-3.5 w-3.5" />
              3. Réviser
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              4. Valider
            </div>
          </div>
        </div>

        {/* Sources Zone */}
        <div className="glass-card p-5">
          <h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Sources
          </h2>

          {/* Existing sources */}
          {sources.length > 0 && (
            <div className="space-y-2 mb-4">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {typeLabels[s.type]} · {s.content.length} caractères
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSource(s.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add source */}
          <div className="space-y-3 p-4 rounded-lg border border-dashed border-border/50 bg-secondary/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de la source"
                className="flex-1 px-3 py-2 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Select value={newType} onValueChange={(v) => setNewType(v as Source["type"])}>
                <SelectTrigger className="w-[160px] bg-secondary/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texte libre</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="cr">Compte-rendu</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Collez le contenu ici (texte d'un document, email, CR…)"
              className="bg-secondary/30 border-border/50 min-h-[100px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addSource} disabled={!newText.trim()} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Ajouter source
              </Button>
              <label>
                <input type="file" multiple accept=".txt,.md,.csv,.json,.xml" onChange={handleFileUpload} className="hidden" />
                <Button size="sm" variant="ghost" className="gap-1.5" asChild>
                  <span>
                    <Upload className="h-3.5 w-3.5" />
                    Importer fichier(s)
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        {/* Template + Analyze */}
        <div className="glass-card p-5">
          <h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Template de planning
          </h2>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="bg-secondary/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end mt-4">
            <Button onClick={handleAnalyze} disabled={isAnalyzing || sources.length === 0} className="gap-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyser les sources
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="glass-card p-5 glow-border">
            <Tabs defaultValue="requirements">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="requirements" className="gap-1.5 text-xs">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Exigences ({result.requirements?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="planning" className="gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Planning ({result.planning?.phases?.length || 0} phases)
                </TabsTrigger>
                <TabsTrigger value="kpis" className="gap-1.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                  KPI ({result.kpis?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-3">
                {(result.requirements || []).map((req, i) => (
                  <div key={i} className="p-4 rounded-lg bg-secondary/20 border border-border/30">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-medium">{req.title}</h3>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge className={`text-[10px] ${priorityColors[req.priority] || "bg-muted text-muted-foreground"}`}>
                          {req.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{req.category}</Badge>
                        <Badge className={`text-[10px] ${confidenceColors[req.confidence] || ""}`}>
                          ★ {req.confidence}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{req.description}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      {req.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {req.due_date}
                        </span>
                      )}
                      {req.deliverable && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {req.deliverable}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground/70">
                        <AlertTriangle className="h-3 w-3" /> {req.source_ref}
                      </span>
                    </div>
                  </div>
                ))}
                {(!result.requirements || result.requirements.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune exigence extraite.</p>
                )}
              </TabsContent>

              {/* Planning Tab */}
              <TabsContent value="planning" className="space-y-4">
                {(result.planning?.phases || []).map((phase, pi) => (
                  <div key={pi} className="p-4 rounded-lg bg-secondary/20 border border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                          {pi + 1}
                        </div>
                        {phase.name}
                      </h3>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          S+{phase.start_offset_weeks} → {phase.duration_weeks} sem.
                        </Badge>
                        {phase.confidence && (
                          <Badge className={`text-[10px] ${confidenceColors[phase.confidence] || ""}`}>
                            ★ {phase.confidence}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {(phase.tasks || []).map((task, ti) => (
                        <div key={ti} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-secondary/30">
                          <span>{task.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.duration_days}j</span>
                            {task.deliverable && (
                              <Badge variant="outline" className="text-[10px]">{task.deliverable}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!result.planning?.phases || result.planning.phases.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune phase proposée.</p>
                )}
              </TabsContent>

              {/* KPI Tab */}
              <TabsContent value="kpis" className="space-y-3">
                {(result.kpis || []).map((kpi, i) => (
                  <div key={i} className="p-4 rounded-lg bg-secondary/20 border border-border/30">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        {kpi.name}
                      </h3>
                      <Badge className={`text-[10px] ${confidenceColors[kpi.confidence] || ""}`}>
                        ★ {kpi.confidence}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{kpi.definition}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                      <span><strong>Formule :</strong> {kpi.formula}</span>
                      <span><strong>Cible :</strong> {kpi.target}</span>
                      <span><strong>Fréquence :</strong> {kpi.frequency}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground/70">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      {kpi.source_ref}
                    </div>
                  </div>
                ))}
                {(!result.kpis || result.kpis.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun KPI proposé.</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Validate Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-border/30">
              <Button onClick={handleValidate} disabled={isValidating} className="gap-2" size="lg">
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création WBS…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Valider & créer le projet WBS (v1)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
