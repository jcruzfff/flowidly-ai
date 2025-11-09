import {
  Proposal,
  ProposalInsert,
  ProposalStatus,
  ProposalSectionInstance,
  Signature,
  Payment,
  ProposalEvent
} from './database'

// Proposal with related data
export interface ProposalWithDetails extends Proposal {
  sections: ProposalSectionInstance[]
  signature?: Signature
  payment?: Payment
  events: ProposalEvent[]
}

// Proposal for display/preview (transformed from DB snake_case)
export interface ProposalPreview {
  id: string
  title: string
  status: ProposalStatus
  client_name: string
  client_email: string
  total_amount: number | null
  created_at: string
  viewed_at: string | null
  sent_at: string | null
  signed_at: string | null
  expires_at: string | null
}

// Proposal creation payload (matches DB schema)
export interface CreateProposalPayload {
  title: string
  client_name: string
  client_email: string
  client_company?: string
  total_amount?: number
  expires_at?: string
  template_id?: string
  custom_message?: string
  sections: CreateProposalSectionPayload[]
}

// Proposal section creation payload (matches DB schema)
export interface CreateProposalSectionPayload {
  section_id?: string
  title: string
  content: Record<string, any> // Json type from DB
  section_type: string
  display_order: number
  is_enabled?: boolean
}

// Proposal update payload (matches DB schema)
export interface UpdateProposalPayload {
  title?: string
  client_name?: string
  client_email?: string
  client_company?: string
  total_amount?: number
  expires_at?: string
  custom_message?: string
  status?: ProposalStatus
}

// Proposal statistics
export interface ProposalStats {
  totalProposals: number
  sentProposals: number
  viewedProposals: number
  signedProposals: number
  paidProposals: number
  conversionRate: number
  averageTimeToSign: number | null
  totalRevenue: number
}

// Proposal share/view response
export interface ProposalShareInfo {
  shareUrl: string
  viewToken: string
  expiresAt: string | null
}

