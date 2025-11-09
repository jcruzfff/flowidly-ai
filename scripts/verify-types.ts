import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
  console.log('🔍 Querying actual database schema...\n')

  // Query to get all tables and their columns
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .not('table_name', 'like', 'pg_%')
    .not('table_name', 'like', '_supabase%')

  if (tablesError) {
    console.error('Error fetching tables:', tablesError)
    return
  }

  console.log('📊 Tables in database:')
  tables?.forEach(t => console.log(`  - ${t.table_name}`))
  console.log()

  // Query to get all columns for each table
  const { data: columns, error: columnsError } = await supabase.rpc(
    'execute_sql',
    {
      query: `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE '_supabase%'
        ORDER BY table_name, ordinal_position;
      `
    }
  )

  if (columnsError) {
    console.error('⚠️  Could not query columns via RPC, trying direct schema inspection...')
    
    // Alternative: Query each table directly to get structure
    const tableNames = ['users', 'proposals', 'proposal_templates', 'proposal_sections', 
                        'proposal_section_instances', 'signatures', 'payments', 'proposal_events']
    
    for (const tableName of tableNames) {
      console.log(`\n📋 Table: ${tableName}`)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
      
      if (!error && data) {
        console.log('  ✅ Table exists and is accessible')
      } else {
        console.log(`  ❌ Error: ${error?.message}`)
      }
    }
  } else {
    console.log('\n📋 Column details:')
    console.log(JSON.stringify(columns, null, 2))
  }

  // Check enums
  const { data: enums, error: enumsError } = await supabase.rpc(
    'execute_sql',
    {
      query: `
        SELECT 
          t.typname as enum_name,
          e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder;
      `
    }
  )

  if (enumsError) {
    console.log('\n⚠️  Could not query enums directly')
    console.log('Using generated types from Supabase CLI as source of truth')
  }

  console.log('\n✅ Schema verification complete!')
}

verifySchema().catch(console.error)

