'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'

type Template = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function FromTemplatePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      // Fetch proposals where is_template = true
      const response = await fetch('/api/proposals?include_templates=true')
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      const templateProposals = data.proposals.filter((p: any) => p.is_template === true)
      setTemplates(templateProposals)
      
      // Auto-select first template
      if (templateProposals.length > 0) {
        setSelectedTemplate(templateProposals[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = async () => {
    if (!selectedTemplate) return
    
    setCreating(true)
    try {
      // TODO: Copy template sections to new proposal
      // For now, just create a blank proposal based on template title
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${selectedTemplate.title} - Copy`,
          is_template: false,
          status: 'draft',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create proposal')
      }

      const { proposal } = await response.json()
      router.push(`/proposals/${proposal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <Card className="p-8">Loading templates...</Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Top Nav */}
      <nav className="border-b border-border-default bg-bg-card">
        <div className="mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/proposals">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Templates</h1>
          </div>

          {selectedTemplate && (
            <Button
              variant="primary"
              size="md"
              onClick={handleCreatePage}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create page'}
            </Button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Sidebar: Template List */}
        <div className="w-96 border-r border-border-default bg-bg-card overflow-y-auto">
          {/* Tabs */}
          <div className="border-b border-border-default p-4">
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-md bg-accent-light text-accent-primary text-sm font-medium">
                Your Library
              </button>
              <button className="px-4 py-2 rounded-md text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors" disabled>
                Explore
              </button>
            </div>
          </div>

          {/* Template List */}
          <div className="p-4 space-y-2">
            {error && (
              <div className="p-4 bg-error-bg border border-error-border rounded-md text-sm text-error mb-4">
                {error}
              </div>
            )}

            {templates.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <p className="mb-4">No templates yet</p>
                <p className="text-sm">
                  Create a proposal and save it as a template
                </p>
              </div>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`
                    w-full text-left p-4 rounded-md border transition-all
                    ${
                      selectedTemplate?.id === template.id
                        ? 'border-accent-primary bg-accent-light'
                        : 'border-border-default bg-bg-main hover:border-border-hover'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary text-sm mb-1 truncate">
                        {template.title}
                      </h3>
                      <p className="text-xs text-text-muted">
                        Last edited: {new Date(template.updated_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-text-muted">
                        Created by: You
                      </p>
                    </div>
                    
                    <Link
                      href={`/proposals/${template.id}`}
                      className="p-1 hover:bg-bg-hover rounded transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PencilIcon className="w-4 h-4 text-text-muted" />
                    </Link>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-y-auto bg-bg-secondary">
          {selectedTemplate ? (
            <div className="max-w-4xl mx-auto py-12 px-6">
              <Card className="p-12">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-text-primary mb-2">
                      {selectedTemplate.title}
                    </h2>
                    <p className="text-text-secondary">
                      Template Preview
                    </p>
                  </div>

                  <div className="border-t border-border-default pt-6">
                    <p className="text-text-muted text-center py-12">
                      Template content preview will appear here
                    </p>
                  </div>

                  <div className="flex justify-center pt-6">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleCreatePage}
                      disabled={creating}
                    >
                      {creating ? 'Creating...' : 'Create page from this template'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-muted">
                Select a template to preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

