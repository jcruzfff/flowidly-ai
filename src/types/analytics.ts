import { ProposalEvent, AggregatedMetrics } from './database'

// Event types (string in DB, but we can define common ones)
export type EventType = 'viewed' | 'section_viewed' | 'downloaded' | 'signed' | 'paid' | 'expired' | 'link_clicked' | string

// Analytics dashboard data
export interface DashboardAnalytics {
  overview: {
    totalProposals: number
    totalViews: number
    totalSignatures: number
    totalRevenue: number
    conversionRate: number
  }
  trends: {
    proposalsCreated: TimeSeriesData[]
    proposalsViewed: TimeSeriesData[]
    proposalsSigned: TimeSeriesData[]
    revenue: TimeSeriesData[]
  }
  topProposals: ProposalAnalytics[]
  recentActivity: ProposalEvent[]
}

// Time series data point
export interface TimeSeriesData {
  date: string
  value: number
}

// Individual proposal analytics
export interface ProposalAnalytics {
  proposalId: string
  proposalTitle: string
  viewCount: number
  uniqueViewers: number
  averageViewDuration: number
  lastViewedAt: string | null
  signedAt: string | null
  paidAt: string | null
  totalAmount: number | null
  events: ProposalEventSummary[]
}

// Proposal event summary
export interface ProposalEventSummary {
  event_type: EventType
  created_at: string
  event_data: Record<string, any> | null
}

// Metrics from materialized view
export type ProposalMetrics = AggregatedMetrics

// Analytics filters
export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  status?: string[]
  minAmount?: number
  maxAmount?: number
}

// Export data payload
export interface AnalyticsExportRequest {
  format: 'csv' | 'json' | 'pdf'
  filters?: AnalyticsFilters
  includeEvents?: boolean
}

