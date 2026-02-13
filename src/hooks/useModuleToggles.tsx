import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ModuleKey =
  | "documents"
  | "planning"
  | "livrables"
  | "concertation"
  | "questionnaires"
  | "contributions"
  | "dashboards";

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  description: string;
  alwaysOn?: boolean;
  defaultEnabled: boolean;
}

export const MODULE_DEFINITIONS: ModuleConfig[] = [
  { key: "documents", label: "Documents", description: "Gestion documentaire et sources", alwaysOn: true, defaultEnabled: true },
  { key: "planning", label: "Planning", description: "Planning adaptatif avec IA", defaultEnabled: true },
  { key: "livrables", label: "Livrables", description: "Suivi des livrables et échéances", defaultEnabled: true },
  { key: "concertation", label: "Concertation / Événements", description: "Ateliers, réunions et concertation publique", defaultEnabled: false },
  { key: "questionnaires", label: "Questionnaires / Collecte", description: "Enquêtes en ligne et collecte terrain", defaultEnabled: false },
  { key: "contributions", label: "Contributions & Analyse", description: "Analyse thématique des contributions", defaultEnabled: false },
  { key: "dashboards", label: "Dashboard KPI", description: "Indicateurs de pilotage et tableaux de bord", defaultEnabled: false },
];

interface ModuleTogglesContextType {
  modules: Record<ModuleKey, boolean>;
  toggleModule: (key: ModuleKey) => void;
  isModuleEnabled: (key: ModuleKey) => boolean;
}

const ModuleTogglesContext = createContext<ModuleTogglesContextType | null>(null);

const getInitialState = (): Record<ModuleKey, boolean> => {
  const saved = localStorage.getItem("missionpilot_modules");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure documents is always on
      return { ...parsed, documents: true };
    } catch {
      // fall through
    }
  }
  const initial: Record<string, boolean> = {};
  MODULE_DEFINITIONS.forEach((m) => {
    initial[m.key] = m.alwaysOn || m.defaultEnabled;
  });
  return initial as Record<ModuleKey, boolean>;
};

export function ModuleTogglesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<Record<ModuleKey, boolean>>(getInitialState);

  const toggleModule = useCallback((key: ModuleKey) => {
    const def = MODULE_DEFINITIONS.find((m) => m.key === key);
    if (def?.alwaysOn) return;
    setModules((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("missionpilot_modules", JSON.stringify(next));
      return next;
    });
  }, []);

  const isModuleEnabled = useCallback(
    (key: ModuleKey) => modules[key] ?? false,
    [modules]
  );

  return (
    <ModuleTogglesContext.Provider value={{ modules, toggleModule, isModuleEnabled }}>
      {children}
    </ModuleTogglesContext.Provider>
  );
}

export function useModuleToggles() {
  const ctx = useContext(ModuleTogglesContext);
  if (!ctx) throw new Error("useModuleToggles must be inside ModuleTogglesProvider");
  return ctx;
}
