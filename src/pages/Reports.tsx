import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, CalendarRange, BarChart3 } from "lucide-react";

const reports = [
  { name: "Rapport d'avancement mensuel – Janvier 2026", type: "Avancement", project: "Mobilité Grand Ouest", date: "31 jan 2026", pages: 12 },
  { name: "Bilan de concertation intermédiaire", type: "Concertation", project: "ZAC Centre", date: "25 jan 2026", pages: 24 },
  { name: "Synthèse COPIL #3", type: "COPIL", project: "Mobilité Grand Ouest", date: "20 jan 2026", pages: 8 },
  { name: "Tableau de bord KPI – T4 2025", type: "KPI", project: "Tous", date: "5 jan 2026", pages: 6 },
  { name: "Note de synthèse diagnostic", type: "Technique", project: "PLUi Littoral", date: "15 fév 2026", pages: 18 },
];

const typeIcons: Record<string, typeof FileText> = {
  Avancement: CalendarRange,
  Concertation: FileText,
  COPIL: FileText,
  KPI: BarChart3,
  Technique: FileText,
};

export default function Reports() {
  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Rapports</h1>
            <p className="text-muted-foreground text-sm mt-1">Générez et consultez vos rapports de mission</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Générer un rapport
          </Button>
        </div>

        <div className="space-y-3">
          {reports.map((report, i) => {
            const Icon = typeIcons[report.type] || FileText;
            return (
              <div key={i} className="glass-card p-4 hover:border-primary/20 transition-all cursor-pointer group animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{report.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{report.project}</span>
                      <span>·</span>
                      <span>{report.date}</span>
                      <span>·</span>
                      <span>{report.pages} pages</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
