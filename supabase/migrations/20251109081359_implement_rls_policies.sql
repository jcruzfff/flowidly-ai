-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_section_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow user creation on signup (triggered by Supabase Auth)
CREATE POLICY "Allow user creation on signup"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- PROPOSAL TEMPLATES POLICIES
-- =====================================================

-- Admins can view their own templates
CREATE POLICY "Admins can view own templates"
  ON public.proposal_templates FOR SELECT
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON public.proposal_templates FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update their own templates
CREATE POLICY "Admins can update own templates"
  ON public.proposal_templates FOR UPDATE
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete their own templates
CREATE POLICY "Admins can delete own templates"
  ON public.proposal_templates FOR DELETE
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PROPOSAL SECTIONS POLICIES
-- =====================================================

-- Admins can view sections from their own templates
CREATE POLICY "Admins can view own template sections"
  ON public.proposal_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_templates pt
      WHERE pt.id = template_id
      AND pt.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create sections for their own templates
CREATE POLICY "Admins can create sections for own templates"
  ON public.proposal_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposal_templates pt
      WHERE pt.id = template_id
      AND pt.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update sections from their own templates
CREATE POLICY "Admins can update own template sections"
  ON public.proposal_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_templates pt
      WHERE pt.id = template_id
      AND pt.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete sections from their own templates
CREATE POLICY "Admins can delete own template sections"
  ON public.proposal_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_templates pt
      WHERE pt.id = template_id
      AND pt.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PROPOSALS POLICIES
-- =====================================================

-- Admins can view their own proposals
CREATE POLICY "Admins can view own proposals"
  ON public.proposals FOR SELECT
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clients can view proposals via access token (no auth required)
CREATE POLICY "Anyone can view proposal with valid token"
  ON public.proposals FOR SELECT
  USING (true); -- Token validation will happen in application layer

-- Admins can create proposals
CREATE POLICY "Admins can create proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update their own proposals
CREATE POLICY "Admins can update own proposals"
  ON public.proposals FOR UPDATE
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete their own proposals
CREATE POLICY "Admins can delete own proposals"
  ON public.proposals FOR DELETE
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PROPOSAL SECTION INSTANCES POLICIES
-- =====================================================

-- Admins can view section instances from their own proposals
CREATE POLICY "Admins can view own proposal sections"
  ON public.proposal_section_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clients can view section instances for proposals they have access to
CREATE POLICY "Anyone can view proposal section instances"
  ON public.proposal_section_instances FOR SELECT
  USING (true); -- Token validation will happen in application layer

-- Admins can create section instances for their own proposals
CREATE POLICY "Admins can create section instances"
  ON public.proposal_section_instances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update section instances from their own proposals
CREATE POLICY "Admins can update own proposal sections"
  ON public.proposal_section_instances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete section instances from their own proposals
CREATE POLICY "Admins can delete own proposal sections"
  ON public.proposal_section_instances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- SIGNATURES POLICIES
-- =====================================================

-- Admins can view signatures for their own proposals
CREATE POLICY "Admins can view signatures for own proposals"
  ON public.signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can create signatures (clients signing proposals)
CREATE POLICY "Anyone can create signatures"
  ON public.signatures FOR INSERT
  WITH CHECK (true); -- Proposal access validation in application layer

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Admins can view payments for their own proposals
CREATE POLICY "Admins can view payments for own proposals"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can create payments (via Stripe webhooks)
CREATE POLICY "System can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (true); -- Webhook validation in application layer

-- System can update payments (via Stripe webhooks)
CREATE POLICY "System can update payments"
  ON public.payments FOR UPDATE
  USING (true); -- Webhook validation in application layer

-- =====================================================
-- PROPOSAL EVENTS POLICIES
-- =====================================================

-- Admins can view events for their own proposals
CREATE POLICY "Admins can view events for own proposals"
  ON public.proposal_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can insert events (for client tracking)
CREATE POLICY "Anyone can create proposal events"
  ON public.proposal_events FOR INSERT
  WITH CHECK (true); -- Event tracking for both admins and clients

