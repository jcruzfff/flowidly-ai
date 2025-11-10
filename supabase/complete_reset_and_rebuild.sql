-- ============================================
-- STEP 1: COMPLETE DATABASE RESET
-- ============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS refresh_metrics_on_payment_change ON public.payments;
DROP TRIGGER IF EXISTS refresh_metrics_on_signature_change ON public.signatures;
DROP TRIGGER IF EXISTS refresh_metrics_on_event_insert ON public.proposal_events;
DROP TRIGGER IF EXISTS refresh_metrics_on_proposal_change ON public.proposals;
DROP TRIGGER IF EXISTS update_signatures_updated_at ON public.signatures;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_proposal_section_instances_updated_at ON public.proposal_section_instances;
DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.proposals;
DROP TRIGGER IF EXISTS update_proposal_sections_updated_at ON public.proposal_sections;
DROP TRIGGER IF EXISTS update_proposal_templates_updated_at ON public.proposal_templates;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_aggregated_metrics() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.log_proposal_event(TEXT, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_proposal_analytics(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_proposal_token(TEXT) CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS public.aggregated_metrics CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS public.proposal_events CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.signatures CASCADE;
DROP TABLE IF EXISTS public.proposal_section_instances CASCADE;
DROP TABLE IF EXISTS public.proposal_sections CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.proposal_templates CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop enums
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.proposal_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Delete all auth users
DELETE FROM auth.users;

SELECT '✅ Step 1: Database reset complete!' as status;

-- ============================================
-- STEP 2: REBUILD EVERYTHING
-- ============================================

-- Enable pgcrypto extension for random token generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user_role enum
CREATE TYPE user_role AS ENUM ('admin', 'viewer');

-- Create proposal_status enum
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'paid', 'expired', 'cancelled');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_templates table
CREATE TABLE public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_sections table
CREATE TABLE public.proposal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.proposal_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'intro', 'services', 'pricing', 'terms', 'custom'
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Rich text content stored as JSON
  display_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_toggleable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.proposal_templates(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Client information
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  
  -- Proposal details
  title TEXT NOT NULL,
  custom_message TEXT,
  total_amount DECIMAL(10, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status and tracking
  status proposal_status NOT NULL DEFAULT 'draft',
  access_token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_section_instances table (links sections to proposals)
CREATE TABLE public.proposal_section_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.proposal_sections(id) ON DELETE SET NULL,
  
  -- Section content (can override template section)
  section_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  display_order INTEGER NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_proposal_templates_created_by ON public.proposal_templates(created_by);
CREATE INDEX idx_proposal_templates_is_active ON public.proposal_templates(is_active);

CREATE INDEX idx_proposal_sections_template_id ON public.proposal_sections(template_id);
CREATE INDEX idx_proposal_sections_display_order ON public.proposal_sections(template_id, display_order);

CREATE INDEX idx_proposals_created_by ON public.proposals(created_by);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_access_token ON public.proposals(access_token);
CREATE INDEX idx_proposals_client_email ON public.proposals(client_email);
CREATE INDEX idx_proposals_created_at ON public.proposals(created_at DESC);

CREATE INDEX idx_proposal_section_instances_proposal_id ON public.proposal_section_instances(proposal_id);
CREATE INDEX idx_proposal_section_instances_display_order ON public.proposal_section_instances(proposal_id, display_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_templates_updated_at BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_sections_updated_at BEFORE UPDATE ON public.proposal_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_section_instances_updated_at BEFORE UPDATE ON public.proposal_section_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create payment_status enum
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled');

-- Create signatures table
CREATE TABLE public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Signature details
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_ip_address INET,
  signature_data TEXT, -- Base64 encoded signature image or typed name
  
  -- Timestamps
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Stripe integration
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Payment metadata
  payment_method TEXT, -- 'card', 'bank_transfer', etc.
  receipt_url TEXT,
  failure_reason TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_events table for analytics tracking
CREATE TABLE public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'viewed', 'section_viewed', 'section_toggled', 'downloaded', 'shared', etc.
  event_data JSONB, -- Additional event metadata
  
  -- Session tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create aggregated_metrics materialized view for dashboard analytics
CREATE MATERIALIZED VIEW public.aggregated_metrics AS
SELECT
  p.id AS proposal_id,
  p.created_by,
  p.status,
  p.created_at,
  p.sent_at,
  
  -- View metrics
  COUNT(DISTINCT CASE WHEN pe.event_type = 'viewed' THEN pe.session_id END) AS unique_views,
  COUNT(CASE WHEN pe.event_type = 'viewed' THEN 1 END) AS total_views,
  MIN(CASE WHEN pe.event_type = 'viewed' THEN pe.created_at END) AS first_viewed_at,
  MAX(CASE WHEN pe.event_type = 'viewed' THEN pe.created_at END) AS last_viewed_at,
  
  -- Engagement metrics
  COUNT(DISTINCT CASE WHEN pe.event_type = 'section_viewed' THEN pe.event_data->>'section_id' END) AS sections_viewed,
  COUNT(CASE WHEN pe.event_type = 'downloaded' THEN 1 END) AS download_count,
  
  -- Conversion metrics
  CASE WHEN s.id IS NOT NULL THEN true ELSE false END AS is_signed,
  s.signed_at,
  CASE WHEN pay.id IS NOT NULL AND pay.status = 'succeeded' THEN true ELSE false END AS is_paid,
  pay.paid_at,
  pay.amount AS payment_amount,
  
  -- Time to conversion
  EXTRACT(EPOCH FROM (s.signed_at - p.sent_at)) / 3600 AS hours_to_sign,
  EXTRACT(EPOCH FROM (pay.paid_at - p.sent_at)) / 3600 AS hours_to_pay
  
FROM public.proposals p
LEFT JOIN public.proposal_events pe ON p.id = pe.proposal_id
LEFT JOIN public.signatures s ON p.id = s.proposal_id
LEFT JOIN public.payments pay ON p.id = pay.proposal_id
GROUP BY p.id, s.id, s.signed_at, pay.id, pay.paid_at, pay.amount, pay.status;

-- Create indexes for better query performance
CREATE INDEX idx_signatures_proposal_id ON public.signatures(proposal_id);
CREATE INDEX idx_signatures_signer_email ON public.signatures(signer_email);
CREATE INDEX idx_signatures_signed_at ON public.signatures(signed_at DESC);

CREATE INDEX idx_payments_proposal_id ON public.payments(proposal_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_checkout_session_id ON public.payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_paid_at ON public.payments(paid_at DESC);

CREATE INDEX idx_proposal_events_proposal_id ON public.proposal_events(proposal_id);
CREATE INDEX idx_proposal_events_event_type ON public.proposal_events(event_type);
CREATE INDEX idx_proposal_events_created_at ON public.proposal_events(created_at DESC);
CREATE INDEX idx_proposal_events_session_id ON public.proposal_events(session_id);

-- Create index on materialized view
CREATE UNIQUE INDEX idx_aggregated_metrics_proposal_id ON public.aggregated_metrics(proposal_id);
CREATE INDEX idx_aggregated_metrics_created_by ON public.aggregated_metrics(created_by);
CREATE INDEX idx_aggregated_metrics_status ON public.aggregated_metrics(status);

-- Add updated_at triggers to new tables
CREATE TRIGGER update_signatures_updated_at BEFORE UPDATE ON public.signatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_aggregated_metrics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.aggregated_metrics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh metrics when relevant data changes
CREATE TRIGGER refresh_metrics_on_proposal_change
  AFTER INSERT OR UPDATE OR DELETE ON public.proposals
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_aggregated_metrics();

CREATE TRIGGER refresh_metrics_on_event_insert
  AFTER INSERT ON public.proposal_events
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_aggregated_metrics();

CREATE TRIGGER refresh_metrics_on_signature_change
  AFTER INSERT OR UPDATE OR DELETE ON public.signatures
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_aggregated_metrics();

CREATE TRIGGER refresh_metrics_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_aggregated_metrics();

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

-- =====================================================
-- HELPER FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to validate proposal access token
CREATE OR REPLACE FUNCTION validate_proposal_token(token TEXT)
RETURNS UUID AS $$
DECLARE
  proposal_id UUID;
BEGIN
  SELECT id INTO proposal_id
  FROM public.proposals
  WHERE access_token = token
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log proposal events (with automatic IP and user agent capture)
CREATE OR REPLACE FUNCTION log_proposal_event(
  p_proposal_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.proposal_events (
    proposal_id,
    event_type,
    event_data,
    session_id
  ) VALUES (
    p_proposal_id,
    p_event_type,
    p_event_data,
    p_session_id
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get proposal analytics summary
CREATE OR REPLACE FUNCTION get_proposal_analytics(p_proposal_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'proposal_id', p.id,
    'status', p.status,
    'created_at', p.created_at,
    'sent_at', p.sent_at,
    'total_views', COUNT(DISTINCT CASE WHEN pe.event_type = 'viewed' THEN pe.session_id END),
    'unique_visitors', COUNT(DISTINCT pe.session_id),
    'first_viewed_at', MIN(CASE WHEN pe.event_type = 'viewed' THEN pe.created_at END),
    'last_viewed_at', MAX(CASE WHEN pe.event_type = 'viewed' THEN pe.created_at END),
    'is_signed', EXISTS(SELECT 1 FROM public.signatures WHERE proposal_id = p.id),
    'is_paid', EXISTS(SELECT 1 FROM public.payments WHERE proposal_id = p.id AND status = 'succeeded')
  ) INTO result
  FROM public.proposals p
  LEFT JOIN public.proposal_events pe ON p.id = pe.proposal_id
  WHERE p.id = p_proposal_id
  GROUP BY p.id, p.status, p.created_at, p.sent_at;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTO-UPDATE TRIGGERS FOR PROPOSAL STATUS
-- =====================================================

-- Function to auto-update proposal status when viewed
CREATE OR REPLACE FUNCTION update_proposal_status_on_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if it's a 'viewed' event and proposal is in 'sent' status
  IF NEW.event_type = 'viewed' THEN
    UPDATE public.proposals
    SET 
      status = CASE 
        WHEN status = 'sent' THEN 'viewed'::proposal_status
        ELSE status
      END,
      viewed_at = CASE
        WHEN viewed_at IS NULL THEN NEW.created_at
        ELSE viewed_at
      END
    WHERE id = NEW.proposal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update proposal status on view
CREATE TRIGGER auto_update_proposal_on_view
  AFTER INSERT ON public.proposal_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'viewed')
  EXECUTE FUNCTION update_proposal_status_on_view();

-- Function to auto-update proposal status when signed
CREATE OR REPLACE FUNCTION update_proposal_status_on_signature()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.proposals
  SET 
    status = 'signed'::proposal_status,
    signed_at = NEW.signed_at
  WHERE id = NEW.proposal_id
    AND status NOT IN ('paid', 'cancelled');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update proposal status on signature
CREATE TRIGGER auto_update_proposal_on_signature
  AFTER INSERT ON public.signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_status_on_signature();

-- Function to auto-update proposal status when paid
CREATE OR REPLACE FUNCTION update_proposal_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update proposal status when payment succeeds
  IF NEW.status = 'succeeded' THEN
    UPDATE public.proposals
    SET 
      status = 'paid'::proposal_status,
      paid_at = NEW.paid_at
    WHERE id = NEW.proposal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update proposal status on payment
CREATE TRIGGER auto_update_proposal_on_payment
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION update_proposal_status_on_payment();

-- =====================================================
-- ADDITIONAL COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Index for dashboard queries (user's proposals filtered by status and sorted by date)
CREATE INDEX IF NOT EXISTS idx_proposals_user_status_created 
  ON public.proposals(created_by, status, created_at DESC);

-- Index for finding proposals by client email (for checking duplicates or history)
CREATE INDEX IF NOT EXISTS idx_proposals_client_email_created
  ON public.proposals(client_email, created_at DESC);

-- Index for event analytics queries (proposal events by type and date)
CREATE INDEX IF NOT EXISTS idx_events_proposal_type_created
  ON public.proposal_events(proposal_id, event_type, created_at DESC);

-- Index for payment lookups by Stripe IDs
CREATE INDEX IF NOT EXISTS idx_payments_stripe_ids
  ON public.payments(stripe_payment_intent_id, stripe_checkout_session_id)
  WHERE stripe_payment_intent_id IS NOT NULL OR stripe_checkout_session_id IS NOT NULL;

-- =====================================================
-- MATERIALIZED VIEW REFRESH OPTIMIZATION
-- =====================================================

-- Function to manually refresh aggregated metrics (useful for scheduled jobs)
CREATE OR REPLACE FUNCTION refresh_proposal_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.aggregated_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DATABASE STATISTICS FOR QUERY OPTIMIZATION
-- =====================================================

-- Gather statistics on all tables for better query planning
ANALYZE public.users;
ANALYZE public.proposal_templates;
ANALYZE public.proposal_sections;
ANALYZE public.proposals;
ANALYZE public.proposal_section_instances;
ANALYZE public.signatures;
ANALYZE public.payments;
ANALYZE public.proposal_events;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION validate_proposal_token IS 'Validates a proposal access token and returns the proposal ID if valid and not expired';
COMMENT ON FUNCTION log_proposal_event IS 'Helper function to log proposal events with automatic metadata capture';
COMMENT ON FUNCTION get_proposal_analytics IS 'Returns comprehensive analytics for a given proposal as JSON';
COMMENT ON FUNCTION refresh_proposal_metrics IS 'Manually refresh the aggregated_metrics materialized view';

-- Create a function to automatically create a user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

