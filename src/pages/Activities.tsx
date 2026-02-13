import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, ClipboardList, CalendarDays, Plus, BarChart } from "lucide-react";

const events = [
  { name: "Réunion publique #1", type: "Réunion", date: "15 jan 2026", participants: 45, project: "ZAC Centre", status: "Terminé" },
  { name: "Atelier participatif – Mobilité douce", type: "Atelier", date: "22 fév 2026", participants: 28, project: "Mobilité Grand Ouest", status: "Terminé" },
  { name: "Questionnaire en ligne habitants", type: "Enquête", date: "1-28 fév 2026", participants: 312, project: "Mobilité Grand Ouest", status: "En cours" },
  { name: "Marche exploratoire centre-ville", type: "Terrain", date: "10 mar 2026", participants: 15, project: "PLUi Littoral", status: "Planifié" },
  { name: "Réunion publique de restitution", type: "Réunion", date: "20 fév 2026", participants: 60, project: "ZAC Centre", status: "Planifié" },
];

const contributions = [
  { channel: "Questionnaire en ligne", count: 312, themes: ["mobilité", "sécurité", "cadre de vie"] },
  { channel: "Boîte à idées", count: 47, themes: ["espaces verts", "commerce", "logement"] },
  { channel: "Registre papier", count: 23, themes: ["bruit", "circulation"] },
  { channel: "Email / courrier", count: 15, themes: ["opposition projet", "information"] },
];

const typeColors: Record<string, string> = {
  Réunion: "bg-info/15 text-info",
  Atelier: "bg-primary/15 text-primary",
  Enquête: "bg-success/15 text-success",
  Terrain: "bg-warning/15 text-warning",
};

export default function Activities() {
  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Concertation</h1>
            <p className="text-muted-foreground text-sm mt-1">Collecte multi-canal, événements et analyse des contributions</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Button>
        </div>

        <Tabs defaultValue="events">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="events" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="contributions" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Contributions
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5">
              <BarChart className="h-3.5 w-3.5" />
              Analyse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4 space-y-3">
            {events.map((event, i) => (
              <div key={i} className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{event.name}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{event.project}</p>
                  </div>
                  <Badge variant="secondary" className={`${typeColors[event.type]} border-0 shrink-0 text-[11px]`}>
                    {event.type}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.participants} participants
                  </div>
                  <Badge variant="outline" className="text-[10px]">{event.status}</Badge>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contributions" className="mt-4 space-y-3">
            {contributions.map((c, i) => (
              <div key={i} className="glass-card p-4 animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-sm">{c.channel}</h3>
                    <p className="text-primary font-heading text-2xl font-bold mt-1">{c.count}</p>
                    <p className="text-muted-foreground text-xs">contributions</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {c.themes.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] bg-secondary border-0">{t}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <div className="glass-card p-8 text-center">
              <BarChart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">L'analyse des contributions sera disponible avec l'intégration IA.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
