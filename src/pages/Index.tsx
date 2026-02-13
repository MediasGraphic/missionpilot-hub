import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  CalendarRange,
  Package,
  FileText,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";

const stats = [
  { label: "Projets actifs", value: "4", icon: FolderKanban, trend: "+1 ce mois" },
  { label: "Livrables en cours", value: "12", icon: Package, trend: "3 en retard" },
  { label: "Documents", value: "87", icon: FileText, trend: "+14 cette semaine" },
  { label: "Échéances proches", value: "5", icon: Clock, trend: "sous 7 jours" },
];

const projects = [
  {
    name: "Étude mobilité Grand Ouest",
    client: "Métropole de Nantes",
    progress: 65,
    status: "En cours",
    phase: "Phase 2 – Diagnostic",
    dueDate: "15 juin 2026",
  },
  {
    name: "Concertation PLUi Littoral",
    client: "CC Côte d'Opale",
    progress: 30,
    status: "En cours",
    phase: "Phase 1 – Cadrage",
    dueDate: "30 sept 2026",
  },
  {
    name: "Enquête publique ZAC Centre",
    client: "Ville de Bordeaux",
    progress: 90,
    status: "Finalisation",
    phase: "Phase 4 – Restitution",
    dueDate: "28 fév 2026",
  },
  {
    name: "Schéma directeur Énergie",
    client: "Région Bretagne",
    progress: 10,
    status: "Démarrage",
    phase: "Phase 0 – Initialisation",
    dueDate: "31 déc 2026",
  },
];

const recentActivity = [
  { text: "CR réunion T2 ajouté", project: "Mobilité Grand Ouest", time: "il y a 2h" },
  { text: "Planning mis à jour", project: "PLUi Littoral", time: "il y a 4h" },
  { text: "Livrable validé par le client", project: "ZAC Centre", time: "hier" },
  { text: "Nouveau projet créé", project: "Schéma Énergie", time: "il y a 2j" },
  { text: "Questionnaire en ligne publié", project: "Mobilité Grand Ouest", time: "il y a 3j" },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de vos missions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 animate-slide-up">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">{stat.label}</p>
                  <p className="font-heading text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground text-[11px] mt-2">{stat.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">Projets actifs</h2>
              <Badge variant="outline" className="text-primary border-primary/30">
                {projects.length} projets
              </Badge>
            </div>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-0.5">{project.client}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        project.status === "Finalisation"
                          ? "bg-success/15 text-success border-0"
                          : project.status === "Démarrage"
                          ? "bg-info/15 text-info border-0"
                          : "bg-primary/15 text-primary border-0"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={project.progress} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground font-medium w-10 text-right">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{project.phase}</span>
                    <span>Échéance : {project.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="glass-card p-5">
            <h2 className="font-heading text-lg font-semibold mb-4">Activité récente</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm">{item.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-primary/70">{item.project}</span>
                      <span className="text-[11px] text-muted-foreground">· {item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="glass-card p-5 glow-border border-warning/30" style={{ boxShadow: "0 0 20px hsl(38 92% 50% / 0.1)" }}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-heading text-sm font-semibold">Alertes</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="text-warning font-medium">3 livrables</span> approchent leur échéance sans validation client.
            </p>
            <p className="text-muted-foreground">
              Le planning <span className="text-warning font-medium">Mobilité Grand Ouest</span> présente un glissement de 5 jours.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
