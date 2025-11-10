import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProposalSectionUnifiedInsert } from '@/types/database'

/**
 * GET /api/proposals/[id]/sections
 * Get all sections for a proposal
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found or unauthorized' }, { status: 404 })
  }

  // Fetch sections
  const { data: sections, error } = await supabase
    .from('proposal_sections')
    .select('*')
    .eq('proposal_id', id)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sections }, { status: 200 })
}

/**
 * POST /api/proposals/[id]/sections
 * Create a new section
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Verify ownership
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found or unauthorized' }, { status: 404 })
  }

  const newSection: ProposalSectionUnifiedInsert = {
    proposal_id: id,
    section_type: body.section_type || 'text',
    title: body.title || null,
    content: body.content || {},
    display_order: body.display_order ?? 0,
    is_visible: body.is_visible ?? true,
  }

  const { data, error } = await supabase
    .from('proposal_sections')
    .insert(newSection)
    .select()
    .single()

  if (error) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ section: data }, { status: 201 })
}

