import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/auth'
import { handleSignOut } from './actions'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default async function DashboardPage() {
  // Get the authenticated user
  const user = await getUser()

  // This should never happen due to middleware, but just in case
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Navigation */}
      <nav className="border-b border-border-default bg-bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold gradient-heading">
              Flowidly
            </h1>
            <Badge variant="success" size="sm">
              Dashboard
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-text-secondary">
              {user.email}
            </div>
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-4xl font-bold text-text-primary mb-2">
              Welcome back{user.full_name ? `, ${user.full_name}` : ''}! 👋
            </h2>
            <p className="text-text-secondary text-lg">
              You're now signed in to your Flowidly account.
            </p>
          </div>

          {/* User Info Card */}
          <Card className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-1">
                  Account Information
                </h3>
                <p className="text-sm text-text-secondary">
                  Your profile details and account status
                </p>
              </div>
              <Badge variant={user.role === 'admin' ? 'warning' : 'info'} size="md">
                {user.role === 'admin' ? 'Admin' : 'Viewer'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Full Name
                  </label>
                  <p className="text-text-primary mt-1">
                    {user.full_name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Email Address
                  </label>
                  <p className="text-text-primary mt-1">
                    {user.email}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    User ID
                  </label>
                  <p className="text-text-primary mt-1 font-mono text-xs">
                    {user.id}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Account Created
                  </label>
                  <p className="text-text-primary mt-1">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Success Message */}
          <Card className="p-6 bg-success-bg border-success-border">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-success mb-1">
                  Authentication Successful!
                </h4>
                <p className="text-sm text-text-secondary">
                  Your authentication system is working correctly. Session is managed securely with HTTP-only cookies.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card hover className="p-6">
                <h4 className="text-base font-semibold mb-2 text-text-primary">
                  Create Proposal
                </h4>
                <p className="text-sm text-text-secondary mb-4">
                  Start a new proposal for your client
                </p>
                <Button variant="primary" size="sm" disabled>
                  Coming Soon
                </Button>
              </Card>

              <Card hover className="p-6">
                <h4 className="text-base font-semibold mb-2 text-text-primary">
                  View Templates
                </h4>
                <p className="text-sm text-text-secondary mb-4">
                  Browse your proposal templates
                </p>
                <Button variant="secondary" size="sm" disabled>
                  Coming Soon
                </Button>
              </Card>

              <Card hover className="p-6">
                <h4 className="text-base font-semibold mb-2 text-text-primary">
                  Analytics
                </h4>
                <p className="text-sm text-text-secondary mb-4">
                  View your proposal performance
                </p>
                <Button variant="ghost" size="sm" disabled>
                  Coming Soon
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

