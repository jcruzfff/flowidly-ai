import Link from 'next/link'
import Button from '@/components/ui/Button'

/**
 * Custom 404 page for invalid proposal tokens
 */
export default function ProposalNotFound() {
  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-error-bg rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Proposal Not Found
          </h1>
          <p className="text-text-secondary">
            This proposal link is invalid or has been removed.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button variant="primary">
              Go to Homepage
            </Button>
          </Link>
        </div>

        <p className="text-sm text-text-muted">
          If you believe this is an error, please contact the sender for a new link.
        </p>
      </div>
    </div>
  )
}

