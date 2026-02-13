import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2, Lock, AlertTriangle, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface QuestionOption { id: string; label: string; }
interface Question {
  id: string; sectionId: string; type: string; label: string;
  description?: string; placeholder?: string; required: boolean;
  options?: QuestionOption[]; scaleMin?: number; scaleMax?: number;
}
interface Section { id: string; title: string; description?: string; }

function getDeviceHash(): string {
  let hash = localStorage.getItem("_dh");
  if (!hash) {
    hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("_dh", hash);
  }
  return hash;
}

export default function PublicForm() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [formData, setFormData] = useState<{
    id: string; title: string; description: string;
    sections: Section[]; questions: Question[];
    collectIdentity: boolean; shareType: string;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadForm();
  }, [token]);

  const loadForm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-public?token=${token}&action=get`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      if (json.data.requiresPin) {
        setRequiresPin(true);
        setFormData({ id: "", title: json.data.title, description: "", sections: [], questions: [], collectIdentity: false, shareType: json.data.shareType });
        return;
      }
      setFormData(json.data);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async () => {
    setPinLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-public?token=${token}&action=verify-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ pin: pinInput }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      setRequiresPin(false);
      setFormData(json.data);
    } catch {
      toast.error("Erreur de vérification");
    } finally {
      setPinLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;
    // Validate required
    const missing = formData.questions.filter(
      (q) => q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
    );
    if (missing.length > 0) {
      toast.error(`Veuillez remplir tous les champs obligatoires (${missing.length} manquant${missing.length > 1 ? "s" : ""})`);
      return;
    }
    if (formData.collectIdentity && !email) {
      toast.error("Veuillez renseigner votre email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-public?token=${token}&action=submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ answers, email: email || undefined, deviceHash: getDeviceHash() }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleMulti = (qId: string, optId: string) => {
    setAnswers((prev) => {
      const arr: string[] = prev[qId] || [];
      return { ...prev, [qId]: arr.includes(optId) ? arr.filter((x) => x !== optId) : [...arr, optId] };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h1 className="font-heading text-xl font-bold text-foreground">{error}</h1>
          <p className="text-sm text-muted-foreground">Ce lien n'est plus disponible ou le questionnaire est inaccessible.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Merci !</h1>
          <p className="text-muted-foreground">Votre réponse a été enregistrée avec succès.</p>
        </div>
      </div>
    );
  }

  if (requiresPin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6 text-center">
          <Lock className="h-12 w-12 text-primary mx-auto" />
          <h1 className="font-heading text-xl font-bold">{formData?.title}</h1>
          <p className="text-sm text-muted-foreground">Ce questionnaire nécessite un code d'accès</p>
          <div className="space-y-3">
            <Input
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Code PIN"
              className="text-center text-lg tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && verifyPin()}
            />
            <Button onClick={verifyPin} disabled={pinLoading || !pinInput} className="w-full">
              {pinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accéder"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  const isPreview = formData.shareType === "preview";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {isPreview && (
          <div className="bg-warning/10 border border-warning/30 text-warning rounded-lg p-3 text-sm text-center">
            🔍 Mode aperçu — Les réponses ne seront pas enregistrées
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h1 className="font-heading text-xl font-bold text-foreground">{formData.title}</h1>
            </div>
            {formData.description && (
              <p className="text-sm text-muted-foreground">{formData.description}</p>
            )}
            <Separator className="mt-4" />
          </div>

          {formData.collectIdentity && (
            <div className="space-y-1.5">
              <Label className="text-sm">Votre email <span className="text-destructive">*</span></Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
            </div>
          )}

          {(formData.sections || []).map((section) => {
            const sectionQs = (formData.questions || []).filter((q) => q.sectionId === section.id);
            if (sectionQs.length === 0) return null;
            return (
              <div key={section.id} className="space-y-4">
                <h3 className="font-heading text-sm font-semibold text-primary">{section.title}</h3>
                {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
                {sectionQs.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <Label className="text-sm">
                      {q.label}{q.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}

                    {q.type === "text" && (
                      <Input value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || "Votre réponse"} disabled={isPreview} />
                    )}
                    {q.type === "long_text" && (
                      <Textarea value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || "Votre réponse..."} className="min-h-[80px]" disabled={isPreview} />
                    )}
                    {q.type === "single_choice" && (
                      <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswer(q.id, v)} disabled={isPreview}>
                        {(q.options || []).map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <RadioGroupItem value={opt.id} />
                            <Label className="text-sm font-normal">{opt.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    {q.type === "multiple_choice" && (
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={(answers[q.id] || []).includes(opt.id)}
                              onCheckedChange={() => toggleMulti(q.id, opt.id)}
                              disabled={isPreview}
                            />
                            <Label className="text-sm font-normal">{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === "dropdown" && (
                      <Select value={answers[q.id] || ""} onValueChange={(v) => setAnswer(q.id, v)} disabled={isPreview}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                        <SelectContent>
                          {(q.options || []).map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {q.type === "scale" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {Array.from({ length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 }, (_, i) => (q.scaleMin || 1) + i).map((n) => (
                          <Button
                            key={n}
                            variant={answers[q.id] === n ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 text-xs"
                            onClick={() => !isPreview && setAnswer(q.id, n)}
                            disabled={isPreview}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    )}
                    {q.type === "date" && (
                      <Input type="date" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} className="max-w-[200px]" disabled={isPreview} />
                    )}
                    {q.type === "consent" && (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={answers[q.id] === true}
                          onCheckedChange={(v) => setAnswer(q.id, !!v)}
                          disabled={isPreview}
                        />
                        <Label className="text-sm font-normal">{q.label}</Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {!isPreview && (
            <div className="pt-4">
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Soumettre
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Propulsé par MissionPilot
        </p>
      </div>
    </div>
  );
}
