import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModuleTogglesProvider } from "@/hooks/useModuleToggles";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Planning from "./pages/Planning";
import AdaptivePlanning from "./pages/AdaptivePlanning";
import Livrables from "./pages/Livrables";
import Documents from "./pages/Documents";
import Activities from "./pages/Activities";
import KPI from "./pages/KPI";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Configuration from "./pages/Configuration";
import AIAssistant from "./pages/AIAssistant";
import Changes from "./pages/Changes";
import Trash from "./pages/Trash";
import Questionnaires from "./pages/Questionnaires";
import Contributions from "./pages/Contributions";
import Tutorials from "./pages/Tutorials";
import Diagnostic from "./pages/Diagnostic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModuleTogglesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projets" element={<Projects />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/planning-ia" element={<AdaptivePlanning />} />
            <Route path="/livrables" element={<Livrables />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/activites" element={<Activities />} />
            <Route path="/kpi" element={<KPI />} />
            <Route path="/rapports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/assistant-ia" element={<AIAssistant />} />
            <Route path="/changements" element={<Changes />} />
            <Route path="/corbeille" element={<Trash />} />
            <Route path="/questionnaires" element={<Questionnaires />} />
            <Route path="/contributions" element={<Contributions />} />
            <Route path="/tutoriels" element={<Tutorials />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ModuleTogglesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
