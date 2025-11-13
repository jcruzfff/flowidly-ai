-- Add missing columns to proposals table for token-based sharing
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Add index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_proposals_access_token ON public.proposals(access_token);

-- Add comments
COMMENT ON COLUMN proposals.access_token IS 'Secure token for public proposal access via /p/[token]';
COMMENT ON COLUMN proposals.token_expires_at IS 'Expiration timestamp for the access token';
COMMENT ON COLUMN proposals.viewed_at IS 'First time the proposal was viewed by client';

-- Add audit trail columns to existing proposal_events table
ALTER TABLE public.proposal_events
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS user_company TEXT;

-- Add comments for documentation
COMMENT ON COLUMN proposal_events.user_email IS 'Email of the user who triggered the event';
COMMENT ON COLUMN proposal_events.user_name IS 'Name of the user who triggered the event';
COMMENT ON COLUMN proposal_events.user_company IS 'Company of the user who triggered the event';

