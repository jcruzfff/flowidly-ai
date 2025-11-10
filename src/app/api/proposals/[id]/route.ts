import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProposalUnifiedUpdate } from '@/types/database'

/**
 * GET /api/proposals/[id]
 * Get a single proposal with its sections
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  // Fetch proposal with sections
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      proposal_sections (*)
    `)
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  return NextResponse.json({ proposal }, { status: 200 })
}

/**
 * PUT /api/proposals/[id]
 * Update a proposal
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const body = await request.json()

  // Validate ownership
  const { count } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('id', id)
    .eq('created_by', user.id)

  if (count === 0) {
    return NextResponse.json({ error: 'Proposal not found or unauthorized' }, { status: 404 })
  }

  const updates: ProposalUnifiedUpdate = {
    title: body.title,
    client_name: body.client_name,
    client_email: body.client_email,
    client_company: body.client_company,
    status: body.status,
  }

  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposal: data }, { status: 200 })
}

/**
 * DELETE /api/proposals/[id]
 * Delete a proposal
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}

