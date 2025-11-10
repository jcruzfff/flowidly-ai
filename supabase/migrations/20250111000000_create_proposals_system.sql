-- =====================================================
-- PROPOSALS SYSTEM MIGRATION
-- Unified proposals table (handles both proposals AND templates)
-- =====================================================

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core fields
  title TEXT NOT NULL,
  is_template BOOLEAN DEFAULT FALSE NOT NULL, -- Key field: true = template, false = proposal
  
  -- Client info (null for templates)
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  
  -- Proposal status (null for templates)
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'paid')),
  
  -- Shareable link (null for templates)
  token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  
  -- Analytics (null for templates)
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create proposal_sections table (content for both proposals and templates)
CREATE TABLE IF NOT EXISTS proposal_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  
  -- Section content
  section_type TEXT NOT NULL, -- 'hero', 'text', 'pricing', 'gallery', 'video', etc.
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}', -- Flexible JSON for different section types
  
  -- Display
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_proposals_created_by ON proposals(created_by);
CREATE INDEX idx_proposals_is_template ON proposals(is_template);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_token ON proposals(token) WHERE token IS NOT NULL;
CREATE INDEX idx_proposal_sections_proposal_id ON proposal_sections(proposal_id);
CREATE INDEX idx_proposal_sections_display_order ON proposal_sections(proposal_id, display_order);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_sections_updated_at
  BEFORE UPDATE ON proposal_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;

-- Proposals policies
CREATE POLICY "Users can view their own proposals and templates"
  ON proposals FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create their own proposals and templates"
  ON proposals FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own proposals and templates"
  ON proposals FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own proposals and templates"
  ON proposals FOR DELETE
  USING (created_by = auth.uid());

-- Public can view proposals by token (for client viewing)
CREATE POLICY "Anyone can view proposals with valid token"
  ON proposals FOR SELECT
  USING (
    token IS NOT NULL 
    AND (token_expires_at IS NULL OR token_expires_at > NOW())
  );

-- Proposal sections policies
CREATE POLICY "Users can view sections of their own proposals"
  ON proposal_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create sections in their own proposals"
  ON proposal_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update sections in their own proposals"
  ON proposal_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete sections from their own proposals"
  ON proposal_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

-- Public can view sections of proposals with valid token
CREATE POLICY "Anyone can view sections of public proposals"
  ON proposal_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_sections.proposal_id
      AND proposals.token IS NOT NULL
      AND (proposals.token_expires_at IS NULL OR proposals.token_expires_at > NOW())
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE proposals IS 'Unified table for both proposals and templates';
COMMENT ON COLUMN proposals.is_template IS 'TRUE = template (reusable blueprint), FALSE = proposal (client-facing document)';
COMMENT ON COLUMN proposals.token IS 'Secure shareable link token (null for templates)';
COMMENT ON COLUMN proposals.status IS 'Proposal lifecycle status (null for templates)';
COMMENT ON TABLE proposal_sections IS 'Content sections for both proposals and templates';

