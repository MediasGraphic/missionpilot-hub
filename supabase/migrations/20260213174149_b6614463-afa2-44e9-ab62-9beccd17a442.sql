
-- Questionnaires table
CREATE TABLE public.questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  version integer NOT NULL DEFAULT 1,
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  access_mode text NOT NULL DEFAULT 'public' CHECK (access_mode IN ('public', 'restricted', 'pin')),
  collect_identity boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on questionnaires" ON public.questionnaires FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_questionnaires_updated_at
  BEFORE UPDATE ON public.questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Questionnaire shares table
CREATE TABLE public.questionnaire_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_type text NOT NULL DEFAULT 'respond' CHECK (share_type IN ('respond', 'preview')),
  access_mode text NOT NULL DEFAULT 'public' CHECK (access_mode IN ('public', 'restricted', 'pin')),
  pin_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  max_responses integer,
  one_per_device boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.questionnaire_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on questionnaire_shares" ON public.questionnaire_shares FOR ALL USING (true) WITH CHECK (true);

-- Share invites table (for restricted mode)
CREATE TABLE public.share_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.questionnaire_shares(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(share_id, email)
);

ALTER TABLE public.share_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on share_invites" ON public.share_invites FOR ALL USING (true) WITH CHECK (true);

-- Questionnaire responses table
CREATE TABLE public.questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  share_id uuid REFERENCES public.questionnaire_shares(id) ON DELETE SET NULL,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  device_hash text,
  respondent_email text,
  completion_rate integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on questionnaire_responses" ON public.questionnaire_responses FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_questionnaire_responses_qid ON public.questionnaire_responses(questionnaire_id);
CREATE INDEX idx_questionnaire_shares_token ON public.questionnaire_shares(token);
CREATE INDEX idx_questionnaires_project ON public.questionnaires(project_id);
