import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProposalSectionUnifiedUpdate } from '@/types/database'

/**
 * GET /api/proposals/[id]/sections/[sectionId]
 * Get a specific section
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, sectionId } = await params

  // Verify ownership through proposal
  const { data: section, error } = await supabase
    .from('proposal_sections')
    .select(`
      *,
      proposals!inner (
        id,
        created_by
      )
    `)
    .eq('id', sectionId)
    .eq('proposal_id', id)
    .eq('proposals.created_by', user.id)
    .single()

  if (error || !section) {
    return NextResponse.json({ error: 'Section not found or unauthorized' }, { status: 404 })
  }

  return NextResponse.json({ section }, { status: 200 })
}

/**
 * PUT /api/proposals/[id]/sections/[sectionId]
 * Update a section
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, sectionId } = await params
  const body = await request.json()

  // Verify ownership through proposal
  const { count } = await supabase
    .from('proposal_sections')
    .select('id', { count: 'exact', head: true })
    .eq('id', sectionId)
    .eq('proposal_id', id)

  if (count === 0) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 })
  }

  const updates: ProposalSectionUnifiedUpdate = {
    section_type: body.section_type,
    title: body.title,
    content: body.content,
    display_order: body.display_order,
    is_visible: body.is_visible,
  }

  const { data, error } = await supabase
    .from('proposal_sections')
    .update(updates)
    .eq('id', sectionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating section:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ section: data }, { status: 200 })
}

/**
 * DELETE /api/proposals/[id]/sections/[sectionId]
 * Delete a section
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, sectionId } = await params

  // Verify ownership through proposal
  const { count } = await supabase
    .from('proposal_sections')
    .select('id', { count: 'exact', head: true })
    .eq('id', sectionId)
    .eq('proposal_id', id)

  if (count === 0) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('proposal_sections')
    .delete()
    .eq('id', sectionId)

  if (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}

