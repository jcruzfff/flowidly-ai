-- Add RLS policy for public proposal access via access_token
-- This allows anyone to view proposals with a valid access_token (for /p/[token] route)

CREATE POLICY "Public can view proposals with valid access_token"
  ON public.proposals FOR SELECT
  USING (
    access_token IS NOT NULL 
    AND is_template = false
    AND (token_expires_at IS NULL OR token_expires_at > NOW())
  );

-- Add RLS policy for public access to proposal sections
CREATE POLICY "Public can view sections of proposals with valid token"
  ON public.proposal_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_sections.proposal_id
        AND proposals.access_token IS NOT NULL
        AND proposals.is_template = false
        AND (proposals.token_expires_at IS NULL OR proposals.token_expires_at > NOW())
    )
  );

