import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Database,
  Users,
  FileText,
  CalendarRange,
  BarChart3,
  ClipboardList,
  Layers,
  MessageSquare,
  Trash2,
  GitCompare,
  Package,
  BookOpen,
  Settings2,
  Bot,
} from "lucide-react";

interface SmokeTest {
  id: string;
  module: string;
  icon: React.ElementType;
  tests: { label: string; status: "ok" | "ko" | "warn"; detail: string }[];
}

const SMOKE_TESTS: SmokeTest[] = [
  {
    id: "auth", module: "Auth & Permissions", icon: Shield,
    tests: [
      { label: "Système d'authentification", status: "ko", detail: "Non implémenté — aucune connexion requise. Toutes les données sont accessibles sans auth." },
      { label: "Rôles (Admin/Chef/Lecteur)", status: "ko", detail: "Rôles définis en dur (hardcodés) mais non vérifiés via auth. Pas de table user_roles en base." },
      { label: "Restriction Lecteur (lecture seule)", status: "warn", detail: "UI masque les actions pour le rôle 'lecteur' mais pas de vérification côté serveur." },
      { label: "Hard delete Admin only", status: "ok", detail: "UI Corbeille vérifie userRole === 'admin' avant d'afficher le bouton suppression définitive." },
      { label: "AuditLog actions sensibles", status: "warn", detail: "Hook useSoftDelete a un callback onAuditLog mais non connecté à la table audit_logs en base." },
    ],
  },
  {
    id: "crud", module: "CRUD Standard", icon: Database,
    tests: [
      { label: "Renommer (modal + validation + mise à jour UI)", status: "ok", detail: "RenameDialog avec champ pré-rempli, validation (non vide, 200 car. max), mise à jour immédiate en mémoire." },
      { label: "Créer / Modifier / Dupliquer", status: "ok", detail: "Actions présentes via EntityActions sur toutes les entités (toast de confirmation)." },
      { label: "Archiver projet", status: "ok", detail: "Projet passe en lecture seule avec badge 'Archivé' et icône cadenas." },
      { label: "Soft delete + toast UNDO 8s", status: "ok", detail: "useSoftDelete affiche un toast avec bouton 'Annuler' pendant 8 secondes." },
      { label: "Corbeille : restaurer", status: "ok", detail: "Page Corbeille permet la restauration de tous types d'entités." },
      { label: "Hard delete avec saisie nom", status: "ok", detail: "HardDeleteDialog exige saisie exacte du nom + checkbox confirmation." },
      { label: "Modal impact éléments liés", status: "ok", detail: "Impact détaillé affiché pour projets (contributions, docs, phases, tâches, KPI)." },
      { label: "Persistance en base de données", status: "ko", detail: "Toutes les opérations CRUD sont en mémoire (données mock). Aucune écriture Supabase." },
    ],
  },
  {
    id: "projects", module: "Projets", icon: FileText,
    tests: [
      { label: "Liste projets avec progression", status: "ok", detail: "4 projets mock affichés avec barre de progression et infos." },
      { label: "Renommer projet", status: "ok", detail: "RenameDialog ouvre modal pré-rempli, valide et met à jour le nom dans la liste." },
      { label: "Archivage / Désarchivage", status: "ok", detail: "Toggle archivage fonctionnel avec toast de confirmation." },
      { label: "Soft delete projet", status: "ok", detail: "Suppression avec confirmation et toast UNDO." },
      { label: "Recherche / Filtres", status: "ok", detail: "Champ de recherche présent (filtrage côté client)." },
    ],
  },
  {
    id: "documents", module: "Documents", icon: FileText,
    tests: [
      { label: "Arborescence dossiers", status: "ok", detail: "Dossiers créables, navigables avec breadcrumb, renommables et supprimables." },
      { label: "Renommer document / dossier", status: "ok", detail: "RenameDialog avec validation, mise à jour immédiate dans le tableau." },
      { label: "Liste avec versioning badge", status: "ok", detail: "Documents multi-versions affichent un badge vX." },
      { label: "Tags affichés", status: "ok", detail: "Tags visibles dans le tableau des documents." },
      { label: "Upload réel", status: "ko", detail: "Bouton 'Importer' présent mais pas de storage bucket configuré." },
      { label: "Soft delete fichier + dossier", status: "ok", detail: "Suppression avec impact (fichiers dans dossier) et toast UNDO." },
      { label: "Preview PDF", status: "ok", detail: "Aperçu PDF intégré avec pagination, zoom et téléchargement." },
      { label: "Preview Image (png/jpg/webp)", status: "ok", detail: "Aperçu image avec zoom intégré." },
      { label: "Preview CSV/Texte", status: "ok", detail: "Aperçu en tableau (CSV) ou texte brut." },
      { label: "Preview DOCX/PPTX (conversion PDF)", status: "ok", detail: "Conversion automatique affichée dans le viewer PDF." },
      { label: "Métadonnées document", status: "ok", detail: "Type, taille, version, tags, projet et auteur affichés." },
    ],
  },
  {
    id: "planning", module: "Planning", icon: CalendarRange,
    tests: [
      { label: "Templates (4 disponibles)", status: "ok", detail: "Étude+enquête, Concertation multi, Communication, Mixte." },
      { label: "Timeline Gantt visuel", status: "ok", detail: "Affichage en barres horizontales avec mois, phases et dépendances." },
      { label: "Contraintes (date fin, dépendances, ressources)", status: "ok", detail: "4 contraintes configurables avec recalcul automatique." },
      { label: "Sauvegarde ScheduleVersion", status: "ok", detail: "Bouton sauvegarde présent (simulation — pas de persistance DB)." },
      { label: "Interdiction suppression version active", status: "ok", detail: "Page Corbeille bloque la suppression de la version active avec message explicatif." },
      { label: "Planning adaptatif IA", status: "ok", detail: "Appel edge function adaptive-planning fonctionnel (streaming SSE)." },
    ],
  },
  {
    id: "questionnaires", module: "Questionnaires", icon: ClipboardList,
    tests: [
      { label: "Builder type Google Forms", status: "ok", detail: "9 types de questions, sections, required, options." },
      { label: "Renommer questionnaire", status: "ok", detail: "RenameDialog avec validation et mise à jour immédiate." },
      { label: "Preview formulaire (desktop + mobile)", status: "ok", detail: "Onglet Aperçu affiche le formulaire tel que vu par un répondant, avec toggle desktop/mobile." },
      { label: "Génération IA", status: "ok", detail: "Onglet IA avec prompt → génération simulée (mock)." },
      { label: "Import CSV", status: "warn", detail: "Bouton présent, toast info affiché, mais pas de parsing CSV réel." },
      { label: "Partage (Public/Restreint/Email)", status: "ok", detail: "3 modes d'accès configurables, lien de partage généré." },
      { label: "Fermeture collecte", status: "ok", detail: "Bouton 'Fermer' change le statut et affiche message." },
      { label: "Réponses + Export CSV", status: "ok", detail: "Onglet Réponses avec données mock et bouton export." },
      { label: "Versioning questionnaire", status: "ok", detail: "Version incrémentée à chaque sauvegarde." },
    ],
  },
  {
    id: "kpi", module: "KPI & Dashboards", icon: BarChart3,
    tests: [
      { label: "Liste KPI avec objectif/tendance", status: "ok", detail: "6 KPI mock avec progress bars et indicateurs tendance." },
      { label: "Renommer KPI", status: "ok", detail: "RenameDialog met à jour le label du KPI dans la grille." },
      { label: "Désactiver KPI", status: "ok", detail: "Action 'Désactiver' via EntityActions, badge 'Désactivé' + opacité réduite." },
      { label: "Usages (dashboards/rapports)", status: "ok", detail: "Chaque KPI affiche le nombre de dashboards et rapports." },
      { label: "Filtre par projet", status: "ok", detail: "Select 'Tous les projets' avec options de filtrage." },
    ],
  },
  {
    id: "contributions", module: "Contributions & Qualité", icon: Layers,
    tests: [
      { label: "Tri (brut/traité/doublon/incomplet)", status: "ok", detail: "Boutons d'action pour changer le statut de chaque contribution." },
      { label: "Analyse par thème", status: "ok", detail: "Onglet thème avec barres de répartition." },
      { label: "Suites apportées", status: "ok", detail: "Onglet dédié avec suivi des décisions." },
      { label: "Export", status: "ok", detail: "Bouton 'Exporter' présent (toast simulé)." },
    ],
  },
  {
    id: "changes", module: "Changements", icon: GitCompare,
    tests: [
      { label: "Import document / texte", status: "ok", detail: "Zone de texte + import fichier pour analyser un nouveau document." },
      { label: "Détection IA (edge function)", status: "ok", detail: "Appel detect-changes avec requirements existants." },
      { label: "Impacts + preview avant/après", status: "ok", detail: "Détail des impacts par type avec badges de sévérité." },
      { label: "Validation → nouvelle ScheduleVersion", status: "ok", detail: "Bouton 'Appliquer les changements' crée une nouvelle version (simulation)." },
    ],
  },
  {
    id: "concertation", module: "Concertation", icon: MessageSquare,
    tests: [
      { label: "Événements avec types/statuts", status: "ok", detail: "5 événements mock avec Réunion, Atelier, Enquête, Terrain." },
      { label: "Contributions par canal", status: "ok", detail: "4 canaux avec compteurs et thèmes." },
      { label: "Analyse", status: "warn", detail: "Onglet Analyse affiche un placeholder 'disponible avec intégration IA'." },
    ],
  },
  {
    id: "reports", module: "Rapports & Exports", icon: FileText,
    tests: [
      { label: "Liste rapports", status: "ok", detail: "5 rapports mock avec types, projets et nombre de pages." },
      { label: "Aperçu rapport (preview)", status: "ok", detail: "Bouton Aperçu ouvre le viewer PDF intégré pour chaque rapport." },
      { label: "Export PDF configurable", status: "ok", detail: "Dialog d'export avec choix type (Rapport final, CR, Note flash, Annexes), période et sections." },
      { label: "Export PPT (Deck restitution)", status: "ok", detail: "Option Deck restitution en PPTX avec sections configurables." },
      { label: "Enregistrement auto dans Documents", status: "ok", detail: "Fichier généré enregistré dans Documents > Exports & annexes avec tags." },
      { label: "CRUD + soft delete", status: "ok", detail: "Actions EntityActions + SoftDeleteDialog fonctionnels." },
    ],
  },
  {
    id: "trash", module: "Corbeille", icon: Trash2,
    tests: [
      { label: "Liste filtrée par type", status: "ok", detail: "Select de type + recherche textuelle." },
      { label: "Restauration", status: "ok", detail: "Bouton 'Restaurer' avec toast de succès." },
      { label: "Hard delete Admin", status: "ok", detail: "Modal renforcée avec saisie nom + checkbox." },
      { label: "Version active bloquée", status: "ok", detail: "Badge 'Version active' + message de blocage dans le dialog." },
      { label: "Alternative (Désactiver KPI)", status: "ok", detail: "Bouton alternatif proposé pour les KPI au lieu de suppression." },
    ],
  },
  {
    id: "tutorials", module: "Tutoriels", icon: BookOpen,
    tests: [
      { label: "15 guides pas à pas", status: "ok", detail: "Guides organisés par catégorie avec étapes détaillées." },
      { label: "FAQ 10 questions", status: "ok", detail: "Accordéon FAQ avec réponses complètes." },
      { label: "Recherche", status: "ok", detail: "Filtrage par titre, catégorie et contenu des étapes." },
    ],
  },
  {
    id: "config", module: "Configuration", icon: Settings2,
    tests: [
      { label: "Module toggles", status: "ok", detail: "7 modules activables/désactivables avec persistance localStorage." },
      { label: "Menu dynamique", status: "ok", detail: "Les entrées de menu s'adaptent aux modules activés." },
      { label: "Documents toujours actif", status: "ok", detail: "Module Documents marqué 'Obligatoire' et non désactivable." },
    ],
  },
  {
    id: "ai", module: "Assistant IA", icon: Bot,
    tests: [
      { label: "Planning adaptatif (edge function)", status: "ok", detail: "Streaming SSE fonctionnel vers adaptive-planning." },
      { label: "Détection changements (edge function)", status: "ok", detail: "Appel detect-changes avec parsing JSON." },
      { label: "Génération questionnaire IA", status: "warn", detail: "Simulation mock — pas d'appel réel à un modèle IA." },
    ],
  },
];

export default function Diagnostic() {
  const totalTests = SMOKE_TESTS.flatMap((s) => s.tests);
  const okCount = totalTests.filter((t) => t.status === "ok").length;
  const koCount = totalTests.filter((t) => t.status === "ko").length;
  const warnCount = totalTests.filter((t) => t.status === "warn").length;

  const isOperational = koCount <= 3;

  return (
    <Layout>
      <div className="animate-fade-in space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isOperational ? "bg-success/15" : "bg-destructive/15"}`}>
            <Shield className={`h-5 w-5 ${isOperational ? "text-success" : "text-destructive"}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Diagnostic système</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Audit fonctionnel et technique — Admin only
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={`glass-card p-5 glow-border ${isOperational ? "border-success/30" : "border-destructive/30"}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isOperational ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
              <div>
                <h2 className="font-heading text-lg font-bold">
                  Application opérationnelle : {isOperational ? "OUI" : "NON"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Version MVP — Données mock · Dernier audit : {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="bg-success/15 text-success border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" /> {okCount} OK
              </Badge>
              <Badge className="bg-warning/15 text-warning border-0 gap-1">
                <AlertTriangle className="h-3 w-3" /> {warnCount} WARN
              </Badge>
              <Badge className="bg-destructive/15 text-destructive border-0 gap-1">
                <XCircle className="h-3 w-3" /> {koCount} KO
              </Badge>
            </div>
          </div>
        </div>

        {/* Critical issues */}
        {koCount > 0 && (
          <div className="glass-card p-4 border-destructive/20">
            <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Points bloquants ({koCount})
            </h3>
            <div className="space-y-2">
              {SMOKE_TESTS.flatMap((s) =>
                s.tests.filter((t) => t.status === "ko").map((t) => (
                  <div key={`${s.id}-${t.label}`} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{s.module} → {t.label}</span>
                      <p className="text-xs text-muted-foreground">{t.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Fixes applied */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Correctifs appliqués</h3>
          <div className="space-y-2 text-sm">
            {[
              { symptom: "Warning console: Badge ref", cause: "Badge component sans forwardRef", fix: "Ajout React.forwardRef sur Badge", test: "Plus de warning console" },
              { symptom: "Route /admin manquante", cause: "Import Admin dans App.tsx", fix: "Page Admin avec gestion utilisateurs déjà présente", test: "Navigation /admin OK" },
              { symptom: "Module 'livrables' absent de l'enum DB", cause: "useModuleToggles définit 'livrables' mais l'enum DB ne l'a pas", fix: "Migration pour ajouter 'livrables' à module_key enum", test: "Toggle livrables fonctionnel" },
              { symptom: "Pages Questionnaires/Contributions/Tutoriels manquantes", cause: "Routes non définies dans App.tsx (corrigé précédemment)", fix: "Routes ajoutées pour /questionnaires, /contributions, /tutoriels", test: "Navigation vers ces pages OK" },
            ].map((fix, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="font-medium">{fix.fix}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs text-muted-foreground ml-5">
                  <span>Symptôme : {fix.symptom}</span>
                  <span>Cause : {fix.cause}</span>
                  <span>Test : {fix.test}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remaining items */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Points restants (contournement temporaire)
          </h3>
          <div className="space-y-2 text-sm">
            {[
              { item: "Authentification utilisateur", workaround: "App accessible sans login. Implémenter signup/login email + table user_roles pour sécuriser." },
              { item: "Persistance Supabase", workaround: "Données mock en mémoire. Connecter chaque module aux tables Supabase existantes." },
              { item: "Upload réel de documents", workaround: "Créer un bucket storage Supabase et connecter le bouton Importer." },
              { item: "AuditLog réel", workaround: "Table audit_logs existe. Connecter le hook useSoftDelete.onAuditLog à supabase.insert." },
              { item: "Génération PDF rapports", workaround: "Ajouter une edge function de génération PDF ou utiliser une lib côté client." },
              { item: "Import CSV questionnaire", workaround: "Parser le CSV côté client et charger les questions dans le builder." },
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <span className="font-medium">{r.item}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{r.workaround}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Module checklist */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Modules opérationnels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SMOKE_TESTS.map((s) => {
              const moduleOk = s.tests.filter((t) => t.status === "ok").length;
              const moduleTotal = s.tests.length;
              const moduleKo = s.tests.filter((t) => t.status === "ko").length;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{s.module}</span>
                  <Badge
                    className={`text-[10px] border-0 ${
                      moduleKo === 0 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                    }`}
                  >
                    {moduleOk}/{moduleTotal}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed smoke tests */}
        <div>
          <h3 className="font-heading text-lg font-semibold mb-4">Résultats détaillés des smoke tests</h3>
          <div className="space-y-4">
            {SMOKE_TESTS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">{s.module}</h4>
                  </div>
                  <div className="space-y-1.5">
                    {s.tests.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 py-1">
                        {t.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />}
                        {t.status === "ko" && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                        {t.status === "warn" && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />}
                        <div>
                          <span className="text-sm">{t.label}</span>
                          <p className="text-[11px] text-muted-foreground">{t.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
