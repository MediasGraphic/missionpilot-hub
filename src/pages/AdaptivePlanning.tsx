import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  impact: string;
  risk: "faible" | "moyen" | "élevé";
  status: "pending" | "accepted" | "rejected";
}

const riskColors: Record<string, string> = {
  faible: "bg-success/15 text-success",
  moyen: "bg-warning/15 text-warning",
  élevé: "bg-destructive/15 text-destructive",
};

export default function AdaptivePlanning() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([
    {
      id: "1",
      title: "Décaler la phase Diagnostic de 2 semaines",
      description:
        "Le chevauchement entre Diagnostic territorial et Initialisation PLUi crée une surcharge. Décaler de 2 semaines libère 1 ressource senior sans impact sur l'échéance finale.",
      impact: "Libère 1 ETP senior, +2 semaines de marge sur la phase suivante",
      risk: "faible",
      status: "pending",
    },
    {
      id: "2",
      title: "Regrouper les livrables CR intermédiaires",
      description:
        "3 CR intermédiaires sont prévus à 1 semaine d'intervalle. Fusionner en 1 CR consolidé réduit la charge de rédaction de 40%.",
      impact: "−3 jours de rédaction, 1 seule validation client au lieu de 3",
      risk: "moyen",
      status: "pending",
    },
  ]);
  const [streamedResponse, setStreamedResponse] = useState("");

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setStreamedResponse("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/adaptive-planning`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (resp.status === 429) {
        toast.error("Trop de requêtes. Réessayez dans quelques instants.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Crédits IA insuffisants. Rechargez votre espace.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        throw new Error("Erreur lors de l'appel IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setStreamedResponse(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur IA. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  const handleSuggestionAction = (id: string, action: "accepted" | "rejected") => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: action } : s))
    );
    toast.success(
      action === "accepted"
        ? "Suggestion acceptée — une nouvelle version du planning sera créée."
        : "Suggestion rejetée."
    );
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Planning adaptatif</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                L'IA propose · Vous validez · L'app versionne
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            v1.0 — baseline
          </Badge>
        </div>

        {/* Workflow visual */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
              <Bot className="h-3.5 w-3.5" />
              IA propose
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning font-medium">
              <Clock className="h-3.5 w-3.5" />
              Humain valide
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">
              <GitBranch className="h-3.5 w-3.5" />
              App versionne
            </div>
          </div>
        </div>

        {/* AI Prompt */}
        <div className="glass-card p-5 glow-border">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-semibold">Demander à l'IA</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Décrivez votre contexte ou contrainte. L'IA analysera le planning et proposera des ajustements.
          </p>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex : Le client demande d'avancer la restitution de 3 semaines. Quels ajustements proposez-vous ?"
            className="bg-secondary/30 border-border/50 min-h-[80px] text-sm"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
              className="gap-2"
              size="sm"
            >
              {isLoading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyse en cours…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Analyser
                </>
              )}
            </Button>
          </div>

          {streamedResponse && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Réponse IA</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {streamedResponse}
              </p>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">Suggestions en attente</h2>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className={`glass-card p-5 transition-all ${
                  s.status !== "pending" ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium">{s.title}</h3>
                      <Badge className={`text-[10px] ${riskColors[s.risk]}`}>
                        Risque {s.risk}
                      </Badge>
                      {s.status === "accepted" && (
                        <Badge className="bg-success/15 text-success text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Acceptée
                        </Badge>
                      )}
                      {s.status === "rejected" && (
                        <Badge className="bg-destructive/15 text-destructive text-[10px] gap-1">
                          <XCircle className="h-3 w-3" />
                          Rejetée
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {s.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      Impact : {s.impact}
                    </div>
                  </div>
                </div>

                {s.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 text-success border-success/30 hover:bg-success/10"
                      onClick={() => handleSuggestionAction(s.id, "accepted")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Accepter & versionner
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground gap-1.5"
                      onClick={() => handleSuggestionAction(s.id, "rejected")}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
