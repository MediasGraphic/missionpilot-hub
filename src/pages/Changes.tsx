import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GitCompare,
  FileText,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Clock,
  DollarSign,
  Users,
  Package,
  ShieldAlert,
  Calendar,
  ChevronRight,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

/* ── Types ── */
interface PlanningChange {
  element: string;
  element_type: string;
  change_description: string;
  before: string;
  after: string;
  delta_days: number;
  dependencies_affected: string[];
}

interface ChangeImpact {
  impact_type: "délai" | "coût" | "ressource" | "livrable" | "risque";
  description: string;
  severity: "faible" | "moyen" | "élevé" | "critique";
}

interface ChangeRequest {
  title: string;
  description: string;
  source: string;
  impacts: ChangeImpact[];
  planning_changes: PlanningChange[];
  status: "proposé" | "validé" | "rejeté";
}

interface DetectionResult {
  change_requests: ChangeRequest[];
  summary: string;
  risk_assessment: string;
}

const impactIcons: Record<string, React.ElementType> = {
  délai: Clock,
  coût: DollarSign,
  ressource: Users,
  livrable: Package,
  risque: ShieldAlert,
};

const severityColors: Record<string, string> = {
  faible: "bg-success/15 text-success",
  moyen: "bg-warning/15 text-warning",
  élevé: "bg-destructive/15 text-destructive",
  critique: "bg-destructive/20 text-destructive border border-destructive/30",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  proposé: { label: "Proposé", color: "bg-warning/15 text-warning", icon: Clock },
  validé: { label: "Validé", color: "bg-success/15 text-success", icon: CheckCircle2 },
  rejeté: { label: "Rejeté", color: "bg-destructive/15 text-destructive", icon: XCircle },
};

/* ── Mock existing requirements ── */
const MOCK_REQUIREMENTS = [
  { title: "Diagnostic territorial complet", category: "Technique", description: "Réaliser un diagnostic territorial incluant analyse socio-économique et environnementale", due_date: "2026-06-15" },
  { title: "3 ateliers de concertation", category: "Organisationnelle", description: "Organiser 3 ateliers participatifs avec les parties prenantes", due_date: "2026-09-30" },
  { title: "Rapport final de synthèse", category: "Livrable", description: "Livrer le rapport final de synthèse de l'étude", due_date: "2026-12-15" },
  { title: "Enquête terrain 500 répondants", category: "Technique", description: "Réaliser une enquête terrain auprès de 500 répondants minimum", due_date: "2026-07-30" },
  { title: "Budget plafonné à 150k€", category: "Budgétaire", description: "Le budget total ne doit pas excéder 150 000€ HT", due_date: null },
];

export default function Changes() {
  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docType, setDocType] = useState("email");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [selectedCR, setSelectedCR] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setDocName(file.name);
    setDocContent(text);
    toast.success(`Fichier "${file.name}" importé`);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!docContent.trim()) {
      toast.error("Ajoutez un document ou du texte à analyser.");
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    setSelectedCR(null);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-changes`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          newDocument: { name: docName || "Document sans nom", content: docContent },
          existingRequirements: MOCK_REQUIREMENTS,
        }),
      });

      if (resp.status === 429) { toast.error("Trop de requêtes. Réessayez."); return; }
      if (resp.status === 402) { toast.error("Crédits IA insuffisants."); return; }
      if (!resp.ok) throw new Error("Erreur serveur");

      const data: DetectionResult = await resp.json();
      const crs = (data.change_requests || []).map((cr) => ({ ...cr, status: "proposé" as const }));
      setResult({ ...data, change_requests: crs });
      setChangeRequests(crs);
      toast.success(`${crs.length} changement(s) détecté(s) !`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'analyse IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = (index: number, status: "validé" | "rejeté") => {
    setChangeRequests((prev) =>
      prev.map((cr, i) => (i === index ? { ...cr, status } : cr))
    );
    toast.success(status === "validé" ? "Changement validé" : "Changement rejeté");
  };

  const handleApply = async () => {
    const validated = changeRequests.filter((cr) => cr.status === "validé");
    if (validated.length === 0) {
      toast.error("Validez au moins un changement avant d'appliquer.");
      return;
    }
    setIsApplying(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsApplying(false);
    toast.success(`ScheduleVersion v2 créée avec ${validated.length} changement(s) appliqué(s) !`);
  };

  const validatedCount = changeRequests.filter((cr) => cr.status === "validé").length;
  const rejectedCount = changeRequests.filter((cr) => cr.status === "rejeté").length;
  const pendingCount = changeRequests.filter((cr) => cr.status === "proposé").length;

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <GitCompare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Détection de changements</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Comparer un nouveau document aux exigences existantes
              </p>
            </div>
          </div>
          {changeRequests.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-warning border-warning/30 gap-1">
                <Clock className="h-3 w-3" /> {pendingCount} en attente
              </Badge>
              <Badge variant="outline" className="text-success border-success/30 gap-1">
                <CheckCircle2 className="h-3 w-3" /> {validatedCount} validé(s)
              </Badge>
              <Badge variant="outline" className="text-destructive border-destructive/30 gap-1">
                <XCircle className="h-3 w-3" /> {rejectedCount} rejeté(s)
              </Badge>
            </div>
          )}
        </div>

        {/* Workflow */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info/10 text-info font-medium">
              <Upload className="h-3.5 w-3.5" />
              Document
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
              <Search className="h-3.5 w-3.5" />
              Détection IA
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Révision humaine
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">
              <GitBranch className="h-3.5 w-3.5" />
              Nouvelle version
            </div>
          </div>
        </div>

        {/* Input Zone */}
        <div className="glass-card p-5">
          <h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Nouveau document à analyser
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Nom du document"
                className="flex-1 px-3 py-2 text-sm rounded-md bg-secondary/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-[180px] bg-secondary/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email client</SelectItem>
                  <SelectItem value="cr">Compte-rendu</SelectItem>
                  <SelectItem value="cctp">CCTP / Note de cadrage</SelectItem>
                  <SelectItem value="avenant">Avenant</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Collez ici le contenu du document (email, CR, nouvelle version CCTP…)"
              className="bg-secondary/30 border-border/50 min-h-[120px] text-sm"
            />
            <div className="flex gap-2 justify-between">
              <label>
                <input type="file" accept=".txt,.md,.csv,.json,.xml" onChange={handleFileUpload} className="hidden" />
                <Button size="sm" variant="ghost" className="gap-1.5" asChild>
                  <span><Upload className="h-3.5 w-3.5" /> Importer fichier</span>
                </Button>
              </label>
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !docContent.trim()} className="gap-2">
                {isAnalyzing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</>
                ) : (
                  <><GitCompare className="h-4 w-4" /> Détecter les changements</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && changeRequests.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`glass-card p-4 glow-border`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                  result.risk_assessment === "critique" || result.risk_assessment === "élevé"
                    ? "text-destructive"
                    : result.risk_assessment === "moyen"
                    ? "text-warning"
                    : "text-success"
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Synthèse</span>
                    <Badge className={`text-[10px] ${severityColors[result.risk_assessment] || ""}`}>
                      Risque {result.risk_assessment}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Change Requests + Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* List */}
              <div className="space-y-3">
                <h2 className="font-heading text-sm font-semibold">
                  Change Requests ({changeRequests.length})
                </h2>
                {changeRequests.map((cr, index) => {
                  const StatusIcon = statusConfig[cr.status].icon;
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedCR(index)}
                      className={`glass-card p-4 cursor-pointer transition-all ${
                        selectedCR === index ? "glow-border" : "hover:border-border"
                      } ${cr.status !== "proposé" ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium">{cr.title}</h3>
                            <Badge className={`text-[10px] ${statusConfig[cr.status].color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[cr.status].label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{cr.description}</p>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {cr.impacts.map((imp, ii) => {
                              const ImpIcon = impactIcons[imp.impact_type] || AlertTriangle;
                              return (
                                <Badge key={ii} variant="outline" className="text-[10px] gap-1">
                                  <ImpIcon className="h-3 w-3" /> {imp.impact_type}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>

                      {cr.status === "proposé" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 text-success border-success/30 hover:bg-success/10"
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(index, "validé"); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground gap-1.5"
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(index, "rejeté"); }}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detail Panel */}
              <div>
                {selectedCR !== null && changeRequests[selectedCR] && (
                  <div className="glass-card p-5 sticky top-4">
                    <Tabs defaultValue="impacts">
                      <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="impacts" className="text-xs gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Impacts ({changeRequests[selectedCR].impacts.length})
                        </TabsTrigger>
                        <TabsTrigger value="planning" className="text-xs gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Planning avant/après
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="impacts" className="space-y-3">
                        <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                          <span className="text-xs text-muted-foreground">Source :</span>
                          <p className="text-sm mt-1 italic text-muted-foreground">"{changeRequests[selectedCR].source}"</p>
                        </div>
                        {changeRequests[selectedCR].impacts.map((imp, i) => {
                          const ImpIcon = impactIcons[imp.impact_type] || AlertTriangle;
                          return (
                            <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                              <div className="flex items-center gap-2 mb-1.5">
                                <ImpIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium capitalize">{imp.impact_type}</span>
                                <Badge className={`text-[10px] ${severityColors[imp.severity] || ""}`}>
                                  {imp.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{imp.description}</p>
                            </div>
                          );
                        })}
                      </TabsContent>

                      <TabsContent value="planning" className="space-y-3">
                        {changeRequests[selectedCR].planning_changes?.length > 0 ? (
                          changeRequests[selectedCR].planning_changes.map((pc, i) => (
                            <div key={i} className="p-4 rounded-lg bg-secondary/20 border border-border/30">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className="text-[10px]">{pc.element_type}</Badge>
                                <span className="text-sm font-medium">{pc.element}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{pc.change_description}</p>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                  <span className="text-[10px] text-destructive font-medium uppercase">Avant</span>
                                  <p className="text-sm mt-1">{pc.before}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                                  <span className="text-[10px] text-success font-medium uppercase">Après</span>
                                  <p className="text-sm mt-1">{pc.after}</p>
                                </div>
                              </div>

                              {pc.delta_days !== 0 && (
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  <Clock className="h-3 w-3 text-warning" />
                                  <span className={pc.delta_days > 0 ? "text-destructive" : "text-success"}>
                                    Delta : {pc.delta_days > 0 ? "+" : ""}{pc.delta_days} jours
                                  </span>
                                </div>
                              )}

                              {pc.dependencies_affected?.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium">Dépendances :</span>{" "}
                                  {pc.dependencies_affected.join(", ")}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Aucun impact planning détecté pour ce changement.
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {selectedCR === null && (
                  <div className="glass-card p-8 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">
                      Sélectionnez un changement pour voir les détails d'impact et le planning avant/après.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Apply Button */}
            <div className="glass-card p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{validatedCount}</span> changement(s) validé(s) prêt(s) à appliquer
                {pendingCount > 0 && <span className="ml-2 text-warning">· {pendingCount} en attente</span>}
              </div>
              <Button
                onClick={handleApply}
                disabled={isApplying || validatedCount === 0}
                className="gap-2"
                size="lg"
              >
                {isApplying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Création version…</>
                ) : (
                  <><GitBranch className="h-4 w-4" /> Appliquer → ScheduleVersion v2</>
                )}
              </Button>
            </div>
          </div>
        )}

        {result && changeRequests.length === 0 && (
          <div className="glass-card p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold">Aucun changement détecté</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Le document est conforme aux exigences existantes.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
