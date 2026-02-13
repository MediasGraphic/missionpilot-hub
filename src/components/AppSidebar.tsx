import {
  LayoutDashboard,
  FolderKanban,
  CalendarRange,
  Package,
  FileText,
  MessageSquare,
  BarChart3,
  ClipboardList,
  Settings,
  Compass,
  Sparkles,
  Layers,
  Settings2,
  Bot,
  GitCompare,
  Trash2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useModuleToggles, type ModuleKey } from "@/hooks/useModuleToggles";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  moduleKey?: ModuleKey;
}

const mainNav: NavItem[] = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Projets", url: "/projets", icon: FolderKanban },
  { title: "Planning", url: "/planning", icon: CalendarRange, moduleKey: "planning" },
  { title: "Planning IA", url: "/planning-ia", icon: Sparkles, moduleKey: "planning" },
  { title: "Livrables", url: "/livrables", icon: Package, moduleKey: "livrables" },
  { title: "Documents", url: "/documents", icon: FileText, moduleKey: "documents" },
  { title: "Assistant IA", url: "/assistant-ia", icon: Bot },
  { title: "Changements", url: "/changements", icon: GitCompare },
];

const secondaryNav: NavItem[] = [
  { title: "Concertation", url: "/activites", icon: MessageSquare, moduleKey: "concertation" },
  { title: "Questionnaires", url: "/questionnaires", icon: ClipboardList, moduleKey: "questionnaires" },
  { title: "Contributions", url: "/contributions", icon: Layers, moduleKey: "contributions" },
  { title: "KPI", url: "/kpi", icon: BarChart3, moduleKey: "dashboards" },
  { title: "Rapports", url: "/rapports", icon: ClipboardList },
];

const adminNav: NavItem[] = [
  { title: "Corbeille", url: "/corbeille", icon: Trash2 },
  { title: "Configuration", url: "/configuration", icon: Settings2 },
  { title: "Administration", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isModuleEnabled } = useModuleToggles();

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !item.moduleKey || isModuleEnabled(item.moduleKey));

  const renderItems = (items: NavItem[]) =>
    filterItems(items).map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-heading text-sm font-bold text-foreground truncate">MissionPilot</h1>
              <p className="text-[10px] text-muted-foreground truncate">Études & Concertation</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-wider">
            {!collapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-wider">
            {!collapsed && "Analyse"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(secondaryNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>{renderItems(adminNav)}</SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
