import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/templates/[id]/sections
 * List all sections for a template
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: templateId } = await context.params
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

    // Fetch sections
    const { data: sections, error } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching sections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sections' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates/[id]/sections
 * Create a new section
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: templateId } = await context.params
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

    // Validate required fields
    if (!section_type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: section_type, title, content' },
        { status: 400 }
      )
    }

    // Create section
    const { data: section, error } = await supabase
      .from('proposal_sections')
      .insert({
        template_id: templateId,
        section_type,
        title,
        content,
        display_order: display_order ?? 0,
        is_required: is_required ?? true,
        is_toggleable: is_toggleable ?? false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating section:', error)
      return NextResponse.json(
        { error: 'Failed to create section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

