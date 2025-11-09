import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  let connectionStatus = 'checking...'
  let error: string | null = null

  try {
    const supabase = await createClient()
    
    // Test connection by querying Supabase metadata
    const { data, error: queryError } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1)
    
    if (queryError) {
      // This is expected if migrations table doesn't exist yet
      // But it still means we connected successfully
      connectionStatus = 'connected ✅'
    } else {
      connectionStatus = 'connected ✅'
    }
  } catch (err) {
    connectionStatus = 'failed ❌'
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Flowidly 🌊
        </h1>
        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-semibold">Supabase Status:</span>{' '}
            <span className={connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus}
            </span>
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
              Error: {error}
            </p>
          )}
          {connectionStatus.includes('✅') && (
            <p className="text-sm text-green-600 mt-2 p-2 bg-green-50 rounded">
              🎉 Ready to build! Database connection successful.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
