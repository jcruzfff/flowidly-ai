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

