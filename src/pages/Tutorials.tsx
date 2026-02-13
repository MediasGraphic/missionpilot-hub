import { useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  FileText,
  ClipboardList,
  CalendarRange,
  Bot,
  BarChart3,
  MessageSquare,
  Layers,
  GitCompare,
  Trash2,
  Settings2,
  HelpCircle,
  Rocket,
  CheckCircle2,
  Clock,
  Upload,
  Share2,
  Sparkles,
} from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
}

interface Tutorial {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  duration: string;
  steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: "onboarding",
    title: "Première prise en main",
    icon: Rocket,
    category: "Démarrage",
    duration: "5 min",
    steps: [
      { title: "Accéder au tableau de bord", description: "Ouvrez l'application MissionPilot. Le tableau de bord s'affiche avec une vue d'ensemble de vos projets actifs, livrables en cours et alertes." },
      { title: "Créer votre premier projet", description: "Cliquez sur 'Nouveau projet' dans la page Projets. Renseignez le nom, le client, les dates et le domaine. Le projet est créé en statut 'Brouillon'." },
      { title: "Configurer les modules", description: "Allez dans Configuration. Activez les modules dont vous avez besoin : Documents, Planning, Concertation, Questionnaires, KPI…" },
      { title: "Importer vos premiers documents", description: "Allez dans Documents, cliquez sur 'Importer'. Ajoutez votre CCTP, notes de cadrage ou tout document de référence." },
      { title: "Explorer le menu", description: "Naviguez dans le menu latéral pour découvrir les différents modules. Chaque module a son propre espace de travail avec actions CRUD complètes." },
    ],
  },
  {
    id: "projects",
    title: "Créer & gérer un projet",
    icon: FolderKanban,
    category: "Projets",
    duration: "3 min",
    steps: [
      { title: "Créer un projet", description: "Page Projets → 'Nouveau projet'. Remplissez nom, client, dates de début/fin, type (Étude, Concertation, Communication)." },
      { title: "Configurer les modules", description: "Allez dans Configuration pour activer/désactiver les modules par projet (Documents, Planning, Concertation, Questionnaires, etc.)." },
      { title: "Archiver un projet", description: "Menu actions (⋯) → 'Archiver'. Le projet passe en lecture seule. Seul un Admin peut le désarchiver." },
      { title: "Supprimer un projet", description: "Menu actions → 'Supprimer'. Le projet est déplacé en corbeille (soft delete). Un toast UNDO apparaît pendant 8 secondes." },
      { title: "Restaurer depuis la corbeille", description: "Page Corbeille → 'Restaurer'. Le projet et tous ses sous-éléments sont restaurés." },
    ],
  },
  {
    id: "documents",
    title: "Importer & organiser les documents",
    icon: FileText,
    category: "Documents",
    duration: "3 min",
    steps: [
      { title: "Importer un document", description: "Page Documents → 'Importer'. Sélectionnez vos fichiers (PDF, DOCX, XLSX…). Chaque document est versionné automatiquement." },
      { title: "Ajouter des tags", description: "Cliquez sur un document pour voir ses tags. Ajoutez des tags pour faciliter la recherche et le filtrage." },
      { title: "Versioning", description: "Les modifications créent automatiquement une nouvelle version (v2, v3…). L'historique des versions est conservé." },
      { title: "Supprimer un document multi-versions", description: "Attention : la suppression définitive d'un document supprime TOUTES ses versions. Une alerte affiche le nombre de versions impactées." },
    ],
  },
  {
    id: "requirements",
    title: "Extraire des exigences via l'IA",
    icon: ClipboardList,
    category: "IA",
    duration: "4 min",
    steps: [
      { title: "Ajouter des sources", description: "Page Assistant IA → Ajoutez vos documents (CCTP, CR, emails) comme sources d'analyse." },
      { title: "Choisir un template", description: "Sélectionnez le template de planning le plus adapté à votre mission (Étude, Concertation, Communication, Mixte)." },
      { title: "Lancer l'analyse", description: "Cliquez 'Analyser les sources'. L'IA extrait les exigences avec catégorie, priorité et niveau de confiance." },
      { title: "Réviser les résultats", description: "L'IA propose mais vous validez. Vérifiez chaque exigence, modifiez si nécessaire, puis validez pour créer le WBS." },
    ],
  },
  {
    id: "planning",
    title: "Générer & ajuster le planning",
    icon: CalendarRange,
    category: "Planning",
    duration: "5 min",
    steps: [
      { title: "Appliquer un template", description: "Page Planning → onglet Template. Choisissez parmi les 4 templates prédéfinis avec phases, tâches et durées." },
      { title: "Configurer les contraintes", description: "Onglet Contraintes : activez 'Date de fin imposée', 'Respecter les dépendances', 'Capacité ressource'." },
      { title: "Recalculer automatiquement", description: "Cliquez 'Recalculer'. Le moteur ajuste les dates en respectant dépendances, ressources et date de fin." },
      { title: "Enregistrer une version", description: "Cliquez 'Enregistrer ScheduleVersion'. Chaque modification structurelle crée une nouvelle version." },
      { title: "Ajuster avec l'IA", description: "Cliquez 'Ajuster avec IA' pour ouvrir le Planning adaptatif. Décrivez votre contrainte, l'IA propose des ajustements." },
    ],
  },
  {
    id: "changes",
    title: "Détecter & appliquer des changements",
    icon: GitCompare,
    category: "Changements",
    duration: "4 min",
    steps: [
      { title: "Importer un nouveau document", description: "Page Changements → Collez ou importez un email client, CR de réunion ou avenant." },
      { title: "Lancer la détection IA", description: "Cliquez 'Détecter les changements'. L'IA compare avec les exigences existantes et identifie les écarts." },
      { title: "Réviser les Change Requests", description: "Chaque changement détecté est présenté avec ses impacts (délai, coût, ressource). Validez ou rejetez." },
      { title: "Appliquer en nouvelle version", description: "Les changements validés créent automatiquement une nouvelle ScheduleVersion du planning." },
    ],
  },
  {
    id: "kpi",
    title: "Définir & piloter les KPI",
    icon: BarChart3,
    category: "KPI",
    duration: "3 min",
    steps: [
      { title: "Créer un KPI", description: "Page KPI → Définissez nom, formule, cible, fréquence de mesure et source de données." },
      { title: "Suivre la performance", description: "Chaque KPI affiche sa valeur actuelle, la cible, la tendance et le % d'atteinte." },
      { title: "Désactiver un KPI", description: "Menu actions → 'Désactiver'. Le KPI reste en base mais est masqué des dashboards et exports. Recommandé plutôt que la suppression." },
      { title: "Voir les usages", description: "Chaque carte KPI affiche dans combien de dashboards et rapports il est utilisé." },
    ],
  },
  {
    id: "questionnaire-builder",
    title: "Créer un questionnaire (Builder)",
    icon: ClipboardList,
    category: "Questionnaires",
    duration: "5 min",
    steps: [
      { title: "Ouvrir le builder", description: "Page Questionnaires → 'Nouveau questionnaire'. Le builder s'ouvre avec une section par défaut." },
      { title: "Ajouter des sections", description: "Cliquez 'Ajouter une section' pour organiser votre questionnaire en pages/thèmes." },
      { title: "Ajouter des questions", description: "Dans chaque section, cliquez 'Ajouter une question'. Choisissez le type : texte, choix unique, choix multiple, échelle, date, fichier, consentement." },
      { title: "Configurer les options", description: "Pour les choix : ajoutez des options. Pour les échelles : définissez min/max. Cochez 'Obligatoire' si nécessaire." },
      { title: "Paramétrer le partage", description: "Configurez l'accès (Public / Restreint / Liste d'emails) et activez ou non la collecte d'identité." },
      { title: "Publier", description: "Cliquez 'Publier'. Un lien de partage est généré automatiquement. Vous pouvez le copier et le diffuser." },
    ],
  },
  {
    id: "questionnaire-csv",
    title: "Importer un questionnaire via CSV",
    icon: Upload,
    category: "Questionnaires",
    duration: "3 min",
    steps: [
      { title: "Préparer le CSV", description: "Format requis : Titre;Type;Obligatoire;Options (séparées par |);Section. Types : text, long_text, single_choice, multiple_choice, dropdown, scale, date, file, consent." },
      { title: "Modèle CSV téléchargeable", description: "Exemple :\nVotre âge;single_choice;oui;18-25|26-35|36-50|51+;Profil\nCommentaire;long_text;non;;Avis" },
      { title: "Importer", description: "Page Questionnaires → 'Import CSV'. Sélectionnez votre fichier. Les questions sont chargées dans le builder pour édition." },
      { title: "Vérifier et publier", description: "Relisez les questions importées dans le builder, ajustez si nécessaire, puis publiez." },
    ],
  },
  {
    id: "questionnaire-ai",
    title: "Générer via l'assistant IA",
    icon: Sparkles,
    category: "Questionnaires",
    duration: "3 min",
    steps: [
      { title: "Ouvrir l'onglet IA", description: "Page Questionnaires → onglet 'Générer via IA'." },
      { title: "Décrire le besoin", description: "Écrivez un prompt en langage naturel : thème, public cible, types de questions souhaitées, contexte du projet." },
      { title: "Générer", description: "Cliquez 'Générer le questionnaire'. L'IA propose un questionnaire complet avec sections, questions, options et consentement RGPD." },
      { title: "Éditer et publier", description: "Le questionnaire généré s'ouvre dans le builder. Modifiez, ajoutez ou supprimez des questions avant publication." },
    ],
  },
  {
    id: "questionnaire-sharing",
    title: "Diffuser & fermer un questionnaire",
    icon: Share2,
    category: "Questionnaires",
    duration: "2 min",
    steps: [
      { title: "Publier le questionnaire", description: "Dans la liste, cliquez 'Publier' sur un brouillon. Un lien unique est généré." },
      { title: "Copier le lien", description: "Cliquez sur le lien dans le détail du questionnaire, puis 'Copier'. Diffusez-le par email, site web ou réseaux." },
      { title: "Paramètres d'accès", description: "Public : tout le monde peut répondre. Restreint : utilisateurs connectés uniquement. Liste d'emails : seuls les emails autorisés." },
      { title: "Fermer la collecte", description: "Cliquez 'Fermer' sur un questionnaire publié. Les répondants verront un message 'Collecte terminée'." },
    ],
  },
  {
    id: "questionnaire-responses",
    title: "Analyser les réponses",
    icon: BarChart3,
    category: "Questionnaires",
    duration: "3 min",
    steps: [
      { title: "Voir les réponses", description: "Page Questionnaires → onglet 'Réponses'. Consultez toutes les réponses collectées avec date, canal et taux de complétion." },
      { title: "Filtrer", description: "Utilisez les filtres pour afficher les réponses par questionnaire, date ou canal de collecte." },
      { title: "Exporter en CSV", description: "Cliquez 'Exporter CSV' pour télécharger toutes les réponses dans un tableur." },
      { title: "Lier aux KPI", description: "Créez des KPI basés sur les réponses : taux de complétion, volume par zone, % de réponses exploitables." },
    ],
  },
  {
    id: "concertation",
    title: "Organiser la concertation",
    icon: MessageSquare,
    category: "Concertation",
    duration: "3 min",
    steps: [
      { title: "Créer un événement", description: "Page Concertation → 'Nouvel événement'. Types : Réunion, Atelier, Enquête, Terrain." },
      { title: "Suivre les participants", description: "Chaque événement affiche le nombre de participants et le statut (Planifié, Terminé, En cours)." },
      { title: "Collecter les contributions", description: "L'onglet Contributions affiche les retours par canal (questionnaire, boîte à idées, registre, email)." },
    ],
  },
  {
    id: "contributions",
    title: "Traiter les contributions",
    icon: Layers,
    category: "Contributions",
    duration: "3 min",
    steps: [
      { title: "Trier les contributions", description: "Page Contributions → onglet 'Brutes'. Marquez chaque contribution comme Traitée, Doublon ou Incomplet." },
      { title: "Analyser par thème", description: "L'onglet 'Par thème' affiche la répartition des contributions par thématique avec barres de progression." },
      { title: "Documenter les suites", description: "L'onglet 'Suites apportées' trace les décisions prises : observation, décision, justification." },
    ],
  },
  {
    id: "reports",
    title: "Produire des rapports",
    icon: FileText,
    category: "Exports",
    duration: "2 min",
    steps: [
      { title: "Générer un rapport", description: "Page Rapports → 'Générer un rapport'. Choisissez le type : Avancement, Concertation, COPIL, KPI, Technique." },
      { title: "Exporter", description: "Chaque rapport peut être téléchargé en PDF ou CSV via le bouton de téléchargement." },
      { title: "Intégrer les questionnaires", description: "Les rapports intègrent automatiquement les résultats des questionnaires : tableaux et synthèses." },
    ],
  },
  {
    id: "trash",
    title: "Gérer la corbeille",
    icon: Trash2,
    category: "Administration",
    duration: "2 min",
    steps: [
      { title: "Consulter la corbeille", description: "Page Corbeille → Tous les éléments supprimés sont listés avec type, date et auteur de la suppression." },
      { title: "Restaurer", description: "Cliquez 'Restaurer' pour remettre un élément à sa place d'origine." },
      { title: "Supprimer définitivement (Admin)", description: "Admin uniquement : cliquez 'Supprimer'. Saisissez le nom exact de l'élément et cochez la confirmation. Irréversible." },
    ],
  },
];

const FAQ = [
  { q: "Qui peut supprimer définitivement un élément ?", a: "Seuls les Administrateurs peuvent effectuer une suppression définitive (hard delete). Les Chefs de projet peuvent uniquement supprimer en corbeille (soft delete)." },
  { q: "Comment restaurer un élément supprimé ?", a: "Deux options : 1) Cliquez 'Annuler' dans le toast UNDO qui apparaît pendant 8 secondes après la suppression. 2) Allez dans la Corbeille et cliquez 'Restaurer'." },
  { q: "Que se passe-t-il quand je supprime un projet ?", a: "Le projet et tous ses sous-éléments (phases, tâches, livrables, KPI, documents) sont masqués mais restaurables ensemble depuis la corbeille." },
  { q: "Comment fonctionne le versioning du planning ?", a: "Toute modification structurelle (dates, dépendances, tâches) crée automatiquement une nouvelle ScheduleVersion. L'historique est conservé et la version active ne peut pas être supprimée." },
  { q: "Le questionnaire est-il versionné ?", a: "Oui. Chaque modification publiée crée une nouvelle version. Les réponses sont liées à la version à laquelle elles ont été soumises, garantissant la cohérence." },
  { q: "D'où viennent les données de l'IA ?", a: "L'IA analyse uniquement les documents et sources que vous lui fournissez. Chaque résultat affiche un indicateur de confiance (faible/moyen/fort) et la référence source." },
  { q: "Comment protéger les données personnelles (RGPD) ?", a: "Les questionnaires incluent un type 'Consentement' obligatoire. La collecte d'identité est optionnelle. Les données sont stockées de manière sécurisée avec traçabilité." },
  { q: "Puis-je désactiver un KPI au lieu de le supprimer ?", a: "Oui, c'est même recommandé. Menu actions → 'Désactiver'. Le KPI est masqué des dashboards et exports mais reste en base pour historique." },
  { q: "Comment fonctionne l'accès restreint aux questionnaires ?", a: "3 niveaux : Public (tout le monde), Restreint (utilisateurs connectés), Liste d'emails (seuls les emails autorisés). Les liens respectent ces droits." },
  { q: "Comment exporter les données ?", a: "Chaque module propose un bouton d'export CSV/PDF. Les réponses aux questionnaires, les rapports et les contributions peuvent tous être exportés." },
];

export default function Tutorials() {
  const [search, setSearch] = useState("");
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>("onboarding");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredTutorials = TUTORIALS.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.steps.some((s) => s.title.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = [...new Set(TUTORIALS.map((t) => t.category))];

  return (
    <Layout>
      <div className="animate-fade-in space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Tutoriels & Guides</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Apprenez à utiliser MissionPilot pas à pas
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un tutoriel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        {/* Tutorials by category */}
        {categories.map((cat) => {
          const catTutorials = filteredTutorials.filter((t) => t.category === cat);
          if (catTutorials.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {cat}
              </h2>
              <div className="space-y-2">
                {catTutorials.map((tutorial) => {
                  const isExpanded = expandedTutorial === tutorial.id;
                  const Icon = tutorial.icon;
                  return (
                    <div key={tutorial.id} className="glass-card overflow-hidden">
                      <button
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
                        onClick={() => setExpandedTutorial(isExpanded ? null : tutorial.id)}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium">{tutorial.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] bg-secondary border-0">
                              {tutorial.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tutorial.duration}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {tutorial.steps.length} étapes
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 animate-fade-in">
                          <div className="ml-11 space-y-3">
                            {tutorial.steps.map((step, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                                  </div>
                                  {i < tutorial.steps.length - 1 && (
                                    <div className="w-px flex-1 bg-border/50 mt-1" />
                                  )}
                                </div>
                                <div className="pb-3">
                                  <h4 className="text-sm font-medium">{step.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* FAQ */}
        <div>
          <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Questions fréquentes
          </h2>
          <div className="space-y-2">
            {FAQ.map((faq, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <p className="text-sm text-muted-foreground ml-7 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
