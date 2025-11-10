import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-main">
      {/* Navigation */}
      <nav className="border-b border-border-default bg-bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold gradient-heading">
              Flowidly
            </h1>
            <Badge variant="info" size="sm">
              Beta
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="space-y-5">
          <Badge variant="info" size="md">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2"></span>
            PROPOSAL PLATFORM
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold gradient-heading tracking-tight">
            Close More Deals
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Create, send, and track business proposals with AI-powered insights. 
            Win clients faster with beautiful, professional proposals.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/signup">
            <Button variant="primary" size="lg">
              Start Free Trial
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </Link>
        </div>

        <p className="text-sm text-text-muted pt-2">
          No credit card required • Free 14-day trial
        </p>
      </div>

      {/* Feature Cards */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Everything you need to win
          </h2>
          <p className="text-text-secondary">
            Professional proposals that impress clients and close deals faster
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover className="p-8">
            <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">
              Fast Setup
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Create professional proposals in under 15 minutes with our intuitive builder
            </p>
            <Badge variant="success" size="sm">
              Popular
            </Badge>
          </Card>

          <Card hover className="p-8">
            <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">
              Real-time Analytics
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Track views, engagement, and conversion metrics in real-time
            </p>
            <Badge variant="info" size="sm">
              New
            </Badge>
          </Card>

          <Card hover className="p-8">
            <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">
              Instant Payments
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Integrated Stripe checkout for seamless payment collection
            </p>
            <Badge variant="warning" size="sm">
              Premium
            </Badge>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Card className="p-12 text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to close more deals?
          </h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses using Flowidly to create winning proposals
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg">
              Start Your Free Trial
            </Button>
          </Link>
          <p className="text-sm text-text-muted mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-primary hover:text-accent-hover font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-default bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-text-muted text-sm">
          <p>
            © 2025 Flowidly • Professional Proposal Platform • Built for Trust & Clarity
          </p>
        </div>
      </footer>
    </div>
  )
}
