import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string; sectionId: string }>
}

/**
 * PUT /api/templates/[id]/sections/[sectionId]
 * Update a section
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: templateId, sectionId } = await context.params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify template ownership
    const { data: template, error: templateError } = await supabase
      .from('proposal_templates')
      .select('id')
      .eq('id', templateId)
      .eq('created_by', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { section_type, title, content, display_order, is_required, is_toggleable } = body

    // Update section
    const { data: section, error } = await supabase
      .from('proposal_sections')
      .update({
        section_type,
        title,
        content,
        display_order,
        is_required,
        is_toggleable,
      })
      .eq('id', sectionId)
      .eq('template_id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating section:', error)
      return NextResponse.json(
        { error: 'Failed to update section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id]/sections/[sectionId]
 * Delete a section
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: templateId, sectionId } = await context.params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify template ownership
    const { data: template, error: templateError } = await supabase
      .from('proposal_templates')
      .select('id')
      .eq('id', templateId)
      .eq('created_by', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Delete section
    const { error } = await supabase
      .from('proposal_sections')
      .delete()
      .eq('id', sectionId)
      .eq('template_id', templateId)

    if (error) {
      console.error('Error deleting section:', error)
      return NextResponse.json(
        { error: 'Failed to delete section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

