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

