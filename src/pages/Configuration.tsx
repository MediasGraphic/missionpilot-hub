import Layout from "@/components/Layout";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CalendarRange,
  Package,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Layers,
  Settings2,
  Lock,
} from "lucide-react";
import { useModuleToggles, MODULE_DEFINITIONS, type ModuleKey } from "@/hooks/useModuleToggles";

const icons: Record<ModuleKey, React.ElementType> = {
  documents: FileText,
  planning: CalendarRange,
  livrables: Package,
  concertation: MessageSquare,
  questionnaires: ClipboardList,
  contributions: Layers,
  dashboards: BarChart3,
};

export default function Configuration() {
  const { modules, toggleModule } = useModuleToggles();

  const enabledCount = Object.values(modules).filter(Boolean).length;

  return (
    <Layout>
      <div className="animate-fade-in space-y-6 max-w-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Configuration projet</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Activez les modules nécessaires à votre mission
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-1">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modules</span>
            <Badge variant="outline" className="text-primary border-primary/30 text-xs">
              {enabledCount} actifs
            </Badge>
          </div>

          <div className="divide-y divide-border/30">
            {MODULE_DEFINITIONS.map((mod) => {
              const Icon = icons[mod.key];
              const enabled = modules[mod.key];

              return (
                <div
                  key={mod.key}
                  className={`flex items-center justify-between px-4 py-4 transition-colors ${
                    enabled ? "bg-card/50" : "bg-card/20 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        enabled ? "bg-primary/15" : "bg-muted"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{mod.label}</span>
                        {mod.alwaysOn && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                    </div>
                  </div>

                  <Switch
                    checked={enabled}
                    onCheckedChange={() => toggleModule(mod.key)}
                    disabled={mod.alwaysOn}
                    className="shrink-0 ml-4"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Les modules désactivés masquent les pages et entrées de menu correspondantes.
        </p>
      </div>
    </Layout>
  );
}
