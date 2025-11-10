import { Database } from './database.types'

// Database table and view types
export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']
export type Enums = Database['public']['Enums']

// User types
export type User = Tables['users']['Row']
export type UserInsert = Tables['users']['Insert']
export type UserUpdate = Tables['users']['Update']
export type UserRole = Enums['user_role']

// Proposal Template types
export type ProposalTemplate = Tables['proposal_templates']['Row']
export type ProposalTemplateInsert = Tables['proposal_templates']['Insert']
export type ProposalTemplateUpdate = Tables['proposal_templates']['Update']

// Proposal Section types
export type ProposalSection = Tables['proposal_sections']['Row']
export type ProposalSectionInsert = Tables['proposal_sections']['Insert']
export type ProposalSectionUpdate = Tables['proposal_sections']['Update']

// Proposal types
export type Proposal = Tables['proposals']['Row']
export type ProposalInsert = Tables['proposals']['Insert']
export type ProposalUpdate = Tables['proposals']['Update']
export type ProposalStatus = Enums['proposal_status']

// Proposal Section Instance types
export type ProposalSectionInstance = Tables['proposal_section_instances']['Row']
export type ProposalSectionInstanceInsert = Tables['proposal_section_instances']['Insert']
export type ProposalSectionInstanceUpdate = Tables['proposal_section_instances']['Update']

// Signature types
export type Signature = Tables['signatures']['Row']
export type SignatureInsert = Tables['signatures']['Insert']
export type SignatureUpdate = Tables['signatures']['Update']

// Payment types
export type Payment = Tables['payments']['Row']
export type PaymentInsert = Tables['payments']['Insert']
export type PaymentUpdate = Tables['payments']['Update']
export type PaymentStatus = Enums['payment_status']

// Proposal Event types
export type ProposalEvent = Tables['proposal_events']['Row']
export type ProposalEventInsert = Tables['proposal_events']['Insert']
export type ProposalEventUpdate = Tables['proposal_events']['Update']
// Note: event_type is a string in the database, not an enum

// Aggregated Metrics types (Materialized View)
export type AggregatedMetrics = Views['aggregated_metrics']['Row']

// =====================================================
// SIMPLIFIED UNIFIED PROPOSALS SYSTEM
// =====================================================

// Proposal (unified for both proposals AND templates)
export type ProposalUnified = {
  id: string
  created_by: string
  title: string
  is_template: boolean // true = template, false = proposal
  client_name?: string | null
  client_email?: string | null
  client_company?: string | null
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'paid' | null
  token?: string | null
  token_expires_at?: string | null
  view_count: number
  last_viewed_at?: string | null
  accepted_at?: string | null
  created_at: string
  updated_at: string
}

export type ProposalUnifiedInsert = Omit<ProposalUnified, 'id' | 'created_at' | 'updated_at' | 'view_count'> & {
  view_count?: number
}

export type ProposalUnifiedUpdate = Partial<Omit<ProposalUnified, 'id' | 'created_by' | 'created_at' | 'updated_at'>>

// Proposal Section (content for both proposals and templates)
export type ProposalSectionUnified = {
  id: string
  proposal_id: string
  section_type: string
  title?: string | null
  content: Record<string, any> // JSONB
  display_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export type ProposalSectionUnifiedInsert = Omit<ProposalSectionUnified, 'id' | 'created_at' | 'updated_at'>

export type ProposalSectionUnifiedUpdate = Partial<Omit<ProposalSectionUnified, 'id' | 'proposal_id' | 'created_at' | 'updated_at'>>

