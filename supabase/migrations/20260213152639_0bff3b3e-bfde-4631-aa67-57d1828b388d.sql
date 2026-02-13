
-- ============================================================
-- MissionPilot – Modèle de données relationnel complet
-- ============================================================

-- Soft-delete support: deleted_at column on relevant tables

-- ======================== ENUMS ==============================

CREATE TYPE public.project_status AS ENUM ('brouillon', 'actif', 'en_pause', 'terminé', 'archivé');
CREATE TYPE public.source_type AS ENUM ('CCTP', 'NoteCadrage', 'MemoireTechnique', 'CR', 'Email', 'Annexe', 'Autre');
CREATE TYPE public.extracted_by AS ENUM ('IA', 'Humain');
CREATE TYPE public.change_request_status AS ENUM ('proposé', 'validé', 'rejeté');
CREATE TYPE public.impact_type AS ENUM ('délai', 'coût', 'ressource', 'livrable', 'risque');
CREATE TYPE public.severity_level AS ENUM ('faible', 'moyen', 'élevé', 'critique');
CREATE TYPE public.deliverable_status AS ENUM ('à_venir', 'en_cours', 'en_revue', 'validé', 'en_retard');
CREATE TYPE public.task_status AS ENUM ('à_faire', 'en_cours', 'terminé', 'bloqué');
CREATE TYPE public.schedule_item_type AS ENUM ('phase', 'task', 'deliverable');
CREATE TYPE public.constraint_rule_type AS ENUM ('date_fixed', 'dependency', 'min_duration', 'max_duration', 'must_follow', 'resource_limit');
CREATE TYPE public.module_key AS ENUM ('planning', 'documents', 'concertation', 'questionnaires', 'contributions', 'dashboards');

-- ======================== PROJECTS ===========================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT,
  description TEXT,
  domain TEXT,
  status public.project_status NOT NULL DEFAULT 'brouillon',
  start_date DATE,
  end_date DATE,
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_deleted_at ON public.projects (deleted_at);

-- ======================== MODULE TOGGLES =====================

CREATE TABLE public.module_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_key public.module_key NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(project_id, module_key)
);

CREATE INDEX idx_module_toggles_project ON public.module_toggles (project_id);

-- ======================== STAKEHOLDERS =======================

CREATE TABLE public.stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  org TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  influence_level INTEGER CHECK (influence_level BETWEEN 1 AND 5),
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_stakeholders_project ON public.stakeholders (project_id);

-- ======================== DOCUMENTS ==========================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder TEXT,
  title TEXT NOT NULL,
  type TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags_json JSONB DEFAULT '[]',
  source_type public.source_type NOT NULL DEFAULT 'Autre',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_project ON public.documents (project_id);
CREATE INDEX idx_documents_source_type ON public.documents (source_type);
CREATE INDEX idx_documents_created_at ON public.documents (created_at);

-- ======================== REQUIREMENTS =======================

CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  due_constraint_date DATE,
  acceptance_criteria TEXT,
  extracted_by public.extracted_by NOT NULL DEFAULT 'Humain',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_requirements_project ON public.requirements (project_id);
CREATE INDEX idx_requirements_due ON public.requirements (due_constraint_date);

-- ======================== CHANGE REQUESTS ====================

CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  status public.change_request_status NOT NULL DEFAULT 'proposé',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_change_requests_project ON public.change_requests (project_id);
CREATE INDEX idx_change_requests_created_at ON public.change_requests (created_at);

-- ======================== CHANGE IMPACTS =====================

CREATE TABLE public.change_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES public.change_requests(id) ON DELETE CASCADE,
  impact_type public.impact_type NOT NULL,
  description TEXT,
  severity public.severity_level NOT NULL DEFAULT 'moyen'
);

CREATE INDEX idx_change_impacts_cr ON public.change_impacts (change_request_id);

-- ======================== LOTS ===============================

CREATE TABLE public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lots_project ON public.lots (project_id);

-- ======================== PHASES =============================

CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  template_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_phases_project ON public.phases (project_id);
CREATE INDEX idx_phases_lot ON public.phases (lot_id);

-- ======================== DELIVERABLES =======================

CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT,
  due_date DATE,
  status public.deliverable_status NOT NULL DEFAULT 'à_venir',
  owner_user_id UUID,
  link_to_requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deliverables_project ON public.deliverables (project_id);
CREATE INDEX idx_deliverables_due_date ON public.deliverables (due_date);
CREATE INDEX idx_deliverables_phase ON public.deliverables (phase_id);

-- ======================== TASKS ==============================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  dependencies_json JSONB DEFAULT '[]',
  assigned_to_user_id UUID,
  status public.task_status NOT NULL DEFAULT 'à_faire',
  effort_points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_project ON public.tasks (project_id);
CREATE INDEX idx_tasks_phase ON public.tasks (phase_id);
CREATE INDEX idx_tasks_due ON public.tasks (end_date);
CREATE INDEX idx_tasks_status ON public.tasks (status);

-- ======================== SCHEDULE VERSIONS ==================

CREATE TABLE public.schedule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  reason TEXT
);

CREATE INDEX idx_schedule_versions_project ON public.schedule_versions (project_id);
CREATE INDEX idx_schedule_versions_created_at ON public.schedule_versions (created_at);

-- ======================== SCHEDULE ITEMS =====================

CREATE TABLE public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_version_id UUID NOT NULL REFERENCES public.schedule_versions(id) ON DELETE CASCADE,
  item_type public.schedule_item_type NOT NULL,
  ref_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

CREATE INDEX idx_schedule_items_version ON public.schedule_items (schedule_version_id);

-- ======================== CONSTRAINT RULES ===================

CREATE TABLE public.constraint_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type public.constraint_rule_type NOT NULL,
  rule_json JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_constraint_rules_project ON public.constraint_rules (project_id);

-- ======================== KPIs ===============================

CREATE TABLE public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  definition TEXT,
  formula TEXT,
  target NUMERIC,
  frequency TEXT,
  data_source TEXT,
  owner_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_kpis_project ON public.kpis (project_id);

-- ======================== AUDIT LOG ==========================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata_json JSONB DEFAULT '{}'
);

CREATE INDEX idx_audit_logs_project ON public.audit_logs (project_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs (timestamp);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

-- ======================== UPDATED_AT TRIGGER =================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ======================== RLS ================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraint_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies for authenticated users
-- These should be refined with proper project membership later

CREATE POLICY "Authenticated users full access on projects"
  ON public.projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on module_toggles"
  ON public.module_toggles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on stakeholders"
  ON public.stakeholders FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on documents"
  ON public.documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on requirements"
  ON public.requirements FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on change_requests"
  ON public.change_requests FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on change_impacts"
  ON public.change_impacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on lots"
  ON public.lots FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on phases"
  ON public.phases FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on deliverables"
  ON public.deliverables FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on schedule_versions"
  ON public.schedule_versions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on schedule_items"
  ON public.schedule_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on constraint_rules"
  ON public.constraint_rules FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on kpis"
  ON public.kpis FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on audit_logs"
  ON public.audit_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
