import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, ChevronLeft, ChevronRight } from "lucide-react";

const months = ["Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep"];

const tasks = [
  { name: "Cadrage & lancement", project: "Mobilité Grand Ouest", start: 0, duration: 1, status: "done" },
  { name: "Diagnostic territorial", project: "Mobilité Grand Ouest", start: 1, duration: 2, status: "active" },
  { name: "Scénarios & propositions", project: "Mobilité Grand Ouest", start: 3, duration: 2, status: "upcoming" },
  { name: "Restitution finale", project: "Mobilité Grand Ouest", start: 5, duration: 1, status: "upcoming" },
  { name: "Initialisation", project: "PLUi Littoral", start: 1, duration: 1, status: "active" },
  { name: "Diagnostic partagé", project: "PLUi Littoral", start: 2, duration: 2, status: "upcoming" },
  { name: "Ateliers de concertation", project: "PLUi Littoral", start: 4, duration: 2, status: "upcoming" },
  { name: "Synthèse & restitution", project: "PLUi Littoral", start: 6, duration: 2, status: "upcoming" },
  { name: "Bilan & clôture", project: "ZAC Centre", start: 0, duration: 1, status: "active" },
];

const statusColors: Record<string, string> = {
  done: "bg-success/70",
  active: "bg-primary",
  upcoming: "bg-muted-foreground/30",
};

export default function Planning() {
  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Planning</h1>
            <p className="text-muted-foreground text-sm mt-1">Visualisez et ajustez le calendrier de vos missions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 text-primary border-primary/30 hover:bg-primary/10">
              <Bot className="h-4 w-4" />
              Assistant IA
            </Button>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-secondary/50">
                <SelectValue placeholder="Projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                <SelectItem value="mobilite">Mobilité Grand Ouest</SelectItem>
                <SelectItem value="plui">PLUi Littoral</SelectItem>
                <SelectItem value="zac">ZAC Centre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="glass-card p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-heading font-semibold text-sm">2026</span>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-success/70" />
                Terminé
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                En cours
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />
                À venir
              </div>
            </div>
          </div>

          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-[200px_1fr] border-b border-border/50 pb-2 mb-2">
              <div className="text-xs font-medium text-muted-foreground">Tâche</div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                {months.map((m) => (
                  <div key={m} className="text-xs text-muted-foreground text-center font-medium">
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            {tasks.map((task, i) => (
              <div
                key={i}
                className="grid grid-cols-[200px_1fr] items-center py-1.5 group hover:bg-secondary/20 rounded transition-colors"
              >
                <div className="pr-4 min-w-0">
                  <p className="text-sm truncate">{task.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{task.project}</p>
                </div>
                <div
                  className="grid relative h-7"
                  style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}
                >
                  {/* Grid lines */}
                  {months.map((_, mi) => (
                    <div key={mi} className="border-l border-border/20 h-full" />
                  ))}
                  {/* Bar */}
                  <div
                    className={`absolute top-1 h-5 rounded-md ${statusColors[task.status]} transition-all group-hover:opacity-90`}
                    style={{
                      left: `${(task.start / months.length) * 100}%`,
                      width: `${(task.duration / months.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="glass-card p-5 glow-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold">Suggestion IA</h3>
              <p className="text-[11px] text-muted-foreground">Basée sur l'analyse du planning actuel</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le chevauchement entre « Diagnostic territorial » et « Initialisation PLUi » pourrait créer une
            surcharge pour l'équipe A. Décaler le démarrage du PLUi de 2 semaines libérerait 1 ressource
            senior, sans impact sur l'échéance finale.
          </p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" className="text-xs">
              Appliquer la suggestion
            </Button>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
              Ignorer
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
