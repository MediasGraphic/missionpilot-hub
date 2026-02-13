
-- Fix ROOT CAUSE: All policies are RESTRICTIVE (Permissive: No) which blocks ALL access.
-- Replace with PERMISSIVE policies to allow operations.
-- Temporary: allow all access for development. Auth will lock down later.

-- projects
DROP POLICY IF EXISTS "Authenticated users full access on projects" ON public.projects;
CREATE POLICY "Allow all access on projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- documents
DROP POLICY IF EXISTS "Authenticated users full access on documents" ON public.documents;
CREATE POLICY "Allow all access on documents" ON public.documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- kpis
DROP POLICY IF EXISTS "Authenticated users full access on kpis" ON public.kpis;
CREATE POLICY "Allow all access on kpis" ON public.kpis FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- tasks
DROP POLICY IF EXISTS "Authenticated users full access on tasks" ON public.tasks;
CREATE POLICY "Allow all access on tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- phases
DROP POLICY IF EXISTS "Authenticated users full access on phases" ON public.phases;
CREATE POLICY "Allow all access on phases" ON public.phases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- lots
DROP POLICY IF EXISTS "Authenticated users full access on lots" ON public.lots;
CREATE POLICY "Allow all access on lots" ON public.lots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- deliverables
DROP POLICY IF EXISTS "Authenticated users full access on deliverables" ON public.deliverables;
CREATE POLICY "Allow all access on deliverables" ON public.deliverables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- requirements
DROP POLICY IF EXISTS "Authenticated users full access on requirements" ON public.requirements;
CREATE POLICY "Allow all access on requirements" ON public.requirements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- change_requests
DROP POLICY IF EXISTS "Authenticated users full access on change_requests" ON public.change_requests;
CREATE POLICY "Allow all access on change_requests" ON public.change_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- change_impacts
DROP POLICY IF EXISTS "Authenticated users full access on change_impacts" ON public.change_impacts;
CREATE POLICY "Allow all access on change_impacts" ON public.change_impacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- constraint_rules
DROP POLICY IF EXISTS "Authenticated users full access on constraint_rules" ON public.constraint_rules;
CREATE POLICY "Allow all access on constraint_rules" ON public.constraint_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- stakeholders
DROP POLICY IF EXISTS "Authenticated users full access on stakeholders" ON public.stakeholders;
CREATE POLICY "Allow all access on stakeholders" ON public.stakeholders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- audit_logs
DROP POLICY IF EXISTS "Authenticated users full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all access on audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- schedule_versions
DROP POLICY IF EXISTS "Authenticated users full access on schedule_versions" ON public.schedule_versions;
CREATE POLICY "Allow all access on schedule_versions" ON public.schedule_versions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- schedule_items
DROP POLICY IF EXISTS "Authenticated users full access on schedule_items" ON public.schedule_items;
CREATE POLICY "Allow all access on schedule_items" ON public.schedule_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- module_toggles
DROP POLICY IF EXISTS "Authenticated users full access on module_toggles" ON public.module_toggles;
CREATE POLICY "Allow all access on module_toggles" ON public.module_toggles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
