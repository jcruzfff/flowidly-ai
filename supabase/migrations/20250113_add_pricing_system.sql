-- =====================================================
-- PRICING SYSTEM FOR PROPOSALS
-- =====================================================
-- This migration adds support for line items and pricing tables
-- with hybrid support for custom items and Stripe product catalog

-- Create proposal_line_items table
CREATE TABLE IF NOT EXISTS public.proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Line item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  
  -- Stripe integration (optional - for future use)
  stripe_product_id TEXT, -- Links to Stripe product if selected from catalog
  stripe_price_id TEXT,    -- Links to Stripe price object
  is_custom BOOLEAN NOT NULL DEFAULT true, -- true = manual entry, false = from Stripe catalog
  
  -- Display order
  display_order INTEGER NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add pricing fields to proposals table
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS pricing_summary JSONB DEFAULT '{
    "subtotal": 0,
    "discount_type": "none",
    "discount_value": 0,
    "discount_amount": 0,
    "total": 0,
    "currency": "USD"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_proposal_id 
  ON public.proposal_line_items(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_line_items_display_order 
  ON public.proposal_line_items(proposal_id, display_order);

CREATE INDEX IF NOT EXISTS idx_proposals_payment_status 
  ON public.proposals(payment_status);

CREATE INDEX IF NOT EXISTS idx_proposals_stripe_payment_intent 
  ON public.proposals(stripe_payment_intent_id);

-- Enable RLS on proposal_line_items
ALTER TABLE public.proposal_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposal_line_items

-- Users can view line items of their own proposals
CREATE POLICY "Users can view line items of own proposals"
  ON public.proposal_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_line_items.proposal_id
        AND proposals.created_by = auth.uid()
    )
  );

-- Users can create line items in their own proposals
CREATE POLICY "Users can create line items in own proposals"
  ON public.proposal_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_line_items.proposal_id
        AND proposals.created_by = auth.uid()
    )
  );

-- Users can update line items in their own proposals
CREATE POLICY "Users can update line items in own proposals"
  ON public.proposal_line_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_line_items.proposal_id
        AND proposals.created_by = auth.uid()
    )
  );

-- Users can delete line items from their own proposals
CREATE POLICY "Users can delete line items from own proposals"
  ON public.proposal_line_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_line_items.proposal_id
        AND proposals.created_by = auth.uid()
    )
  );

-- Public can view line items of proposals with valid access token
CREATE POLICY "Public can view line items of public proposals"
  ON public.proposal_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_line_items.proposal_id
        AND proposals.access_token IS NOT NULL
        AND proposals.is_template = false
        AND (proposals.token_expires_at IS NULL OR proposals.token_expires_at > NOW())
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.proposal_line_items IS 'Line items for proposal pricing tables. Supports both custom items and Stripe product catalog items.';
COMMENT ON COLUMN public.proposal_line_items.stripe_product_id IS 'Optional: Stripe product ID if item is from Stripe catalog';
COMMENT ON COLUMN public.proposal_line_items.stripe_price_id IS 'Optional: Stripe price ID if item is from Stripe catalog';
COMMENT ON COLUMN public.proposal_line_items.is_custom IS 'True if manually entered, false if from Stripe catalog';
COMMENT ON COLUMN public.proposals.pricing_summary IS 'Calculated pricing summary including subtotal, discount, and total';
COMMENT ON COLUMN public.proposals.payment_status IS 'Payment status: unpaid, pending, processing, succeeded, failed';
COMMENT ON COLUMN public.proposals.stripe_payment_intent_id IS 'Stripe Payment Intent ID for tracking payments';
COMMENT ON COLUMN public.proposals.stripe_checkout_session_id IS 'Stripe Checkout Session ID for payment flow';

