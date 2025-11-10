'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type AppLayoutProps = {
  children: React.ReactNode
  user?: {
    email: string
    full_name?: string | null
  } | null
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [creating, setCreating] = useState(false)

  const handleSignOut = async () => {
    const response = await fetch('/api/auth/signout', { method: 'POST' })
    if (response.ok) {
      router.push('/login')
    }
  }

  const handleCreateBlankPage = async () => {
    if (creating) return
    
    setCreating(true)
    try {
      // Create a new blank proposal
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          is_template: false,
          status: 'draft',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create page')
      }

      const data = await response.json()
      
      // Navigate to the editor
      router.push(`/proposals/${data.proposal.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating blank page:', error)
      alert('Failed to create page. Please try again.')
      setCreating(false)
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '??'
    if (user.full_name) {
      const names = user.full_name.split(' ')
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border-default bg-bg-card shadow-sm">
        <div className="mx-auto px-6 py-3 flex items-center justify-between gap-6">
          {/* Left: Logo */}
          <Link href="/proposals" className="flex items-center gap-2 shrink-0">
            <h1 className="text-2xl font-bold gradient-heading">Flowidly</h1>
            <Badge variant="info" size="sm">Beta</Badge>
          </Link>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search proposals..."
                className="w-full pl-10 pr-4 py-2 rounded-md bg-bg-main border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors"
              />
            </div>
          </div>

          {/* Right: Create New + User Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Create New Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button as={Fragment}>
                <Button variant="primary" size="md">
                  <PlusIcon className="w-5 h-5 mr-1.5" />
                  Create new
                  <ChevronDownIcon className="w-4 h-4 ml-1.5" />
                </Button>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-bg-card border border-border-default shadow-lg focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleCreateBlankPage}
                          disabled={creating}
                          className={`${
                            active ? 'bg-bg-hover' : ''
                          } w-full text-left px-4 py-2.5 text-sm text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="font-medium">
                            {creating ? 'Creating...' : 'Blank page'}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            Start from scratch
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/proposals/new/from-template"
                          className={`${
                            active ? 'bg-bg-hover' : ''
                          } block px-4 py-2.5 text-sm text-text-primary transition-colors`}
                        >
                          <div className="font-medium">From template</div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            Use a pre-built template
                          </div>
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* User Avatar Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-bg-hover transition-colors">
                <div className="w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center text-sm font-semibold">
                  {getUserInitials()}
                </div>
                <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-bg-card border border-border-default shadow-lg focus:outline-none">
                  <div className="px-4 py-3 border-b border-border-default">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {user?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      {user?.email}
                    </div>
                  </div>

                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings/profile"
                          className={`${
                            active ? 'bg-bg-hover' : ''
                          } flex items-center gap-3 px-4 py-2 text-sm text-text-primary transition-colors`}
                        >
                          <Cog6ToothIcon className="w-5 h-5 text-text-secondary" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                  </div>

                  <div className="py-1 border-t border-border-default">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          className={`${
                            active ? 'bg-bg-hover' : ''
                          } flex items-center gap-3 px-4 py-2 text-sm text-text-primary transition-colors w-full text-left`}
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5 text-text-secondary" />
                          Log out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}

