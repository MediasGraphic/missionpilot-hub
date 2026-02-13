import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Planning from "./pages/Planning";
import Livrables from "./pages/Livrables";
import Documents from "./pages/Documents";
import Activities from "./pages/Activities";
import KPI from "./pages/KPI";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projets" element={<Projects />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/livrables" element={<Livrables />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/activites" element={<Activities />} />
          <Route path="/kpi" element={<KPI />} />
          <Route path="/rapports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
