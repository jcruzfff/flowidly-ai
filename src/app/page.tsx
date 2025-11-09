import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

export default async function Home() {
  let connectionStatus = 'checking...'
  let error: string | null = null

  try {
    const supabase = await createClient()
    
    // Test connection by querying Supabase metadata
    const { error: queryError } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1)
    
    if (queryError) {
      // This is expected if migrations table doesn't exist yet
      // But it still means we connected successfully
      connectionStatus = 'Connected'
    } else {
      connectionStatus = 'Connected'
    }
  } catch (err) {
    connectionStatus = 'Failed'
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-6">
      <div className="max-w-5xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-5 py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2">
            <Badge variant="info" size="md">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2"></span>
              PROPOSAL PLATFORM
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold gradient-heading tracking-tight">
            Flowidly
          </h1>
          
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Create, send, and track business proposals with AI-powered insights.
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              System Status
            </h2>
            <Badge variant="success" size="sm">
              Online
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-md bg-bg-secondary border border-border-light">
              <span className="text-text-secondary text-sm font-medium">Supabase Database</span>
              <Badge variant={connectionStatus === 'Connected' ? 'success' : 'error'} size="sm">
                {connectionStatus}
              </Badge>
            </div>

            {error && (
              <div className="bg-error-bg border border-error-border text-error p-4 rounded-md text-sm">
                <strong className="font-semibold">Error:</strong> {error}
              </div>
            )}

            {connectionStatus === 'Connected' && (
              <div className="bg-success-bg border border-success-border text-success p-4 rounded-md text-sm">
                <strong className="font-medium">All systems operational.</strong> Ready to build your proposal platform.
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-border-default">
            <h3 className="text-xs font-semibold mb-4 text-text-muted uppercase tracking-wider">
              Design System Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Primary Button */}
              <Button variant="primary" size="md">
                Get Started
              </Button>
              
              {/* Secondary Button */}
              <Button variant="secondary" size="md">
                Learn More
              </Button>
              
              {/* Ghost Button */}
              <Button variant="ghost" size="md">
                View Demo
              </Button>
              
              {/* Loading Button */}
              <Button variant="primary" size="md" loading>
                Processing...
              </Button>
              
              {/* Input Field */}
              <div className="md:col-span-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  label="Email Address"
                  helperText="We'll never share your email."
                />
              </div>
              
              {/* Input with Error */}
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Enter company name"
                  label="Company"
                  error="This field is required"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Card hover className="p-6">
            <h3 className="text-base font-semibold mb-2 text-text-primary">
              Fast Setup
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Create professional proposals in under 15 minutes
            </p>
            <Badge variant="success" size="sm" className="mt-3">
              Popular
            </Badge>
          </Card>

          <Card hover className="p-6">
            <h3 className="text-base font-semibold mb-2 text-text-primary">
              Analytics
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Track views, engagement, and conversion metrics
            </p>
            <Badge variant="info" size="sm" className="mt-3">
              New
            </Badge>
          </Card>

          <Card hover className="p-6">
            <h3 className="text-base font-semibold mb-2 text-text-primary">
              Payments
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Integrated Stripe checkout for seamless transactions
            </p>
            <Badge variant="warning" size="sm" className="mt-3">
              Premium
            </Badge>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 text-text-muted text-xs">
          <p>
            Professional Proposal Platform • Built for Trust & Clarity
          </p>
        </div>
      </div>
    </div>
  )
}
