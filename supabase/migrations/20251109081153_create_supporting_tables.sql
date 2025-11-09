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

