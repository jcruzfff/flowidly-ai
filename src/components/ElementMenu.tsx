'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  PlusIcon,
  DocumentTextIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
  VideoCameraIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'
import { ElementType } from '@/types/database'

type ElementMenuProps = {
  onSelectType: (type: ElementType) => void
  trigger?: React.ReactNode
}

const elementTypes = [
  { type: 'text' as ElementType, label: 'Text', icon: DocumentTextIcon, description: 'Start typing with rich text' },
  { type: 'button' as ElementType, label: 'Button', icon: CursorArrowRaysIcon, description: 'Add a clickable button' },
  { type: 'image' as ElementType, label: 'Image', icon: PhotoIcon, description: 'Upload or embed an image' },
  { type: 'video' as ElementType, label: 'Video', icon: VideoCameraIcon, description: 'Embed a video' },
  { type: 'divider' as ElementType, label: 'Divider', icon: MinusIcon, description: 'Visual separator' },
]

export default function ElementMenu({ onSelectType, trigger }: ElementMenuProps) {
  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button className="inline-flex items-center justify-center">
        {trigger || (
          <div className="w-8 h-8 rounded-md bg-bg-card border border-border-default hover:border-accent-primary hover:bg-accent-light flex items-center justify-center transition-all shadow-sm">
            <PlusIcon className="w-4 h-4 text-text-secondary hover:text-accent-primary transition-colors" />
          </div>
        )}
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
        <Menu.Items className="absolute left-0 top-10 w-72 bg-bg-card border border-border-default rounded-2xl shadow-xl py-2 focus:outline-none z-50 overflow-hidden">
          <div className="px-4 py-2 text-xs text-text-muted font-medium uppercase tracking-wider">
            Add Element
          </div>
          
          {elementTypes.map((elementType) => {
            const Icon = elementType.icon
            return (
              <Menu.Item key={elementType.type}>
                {({ active }) => (
                  <button
                    onClick={() => onSelectType(elementType.type)}
                    className={`${
                      active ? 'bg-bg-hover' : ''
                    } w-full px-4 py-3.5 text-left flex items-start gap-3.5 transition-colors`}
                  >
                    <Icon className="w-6 h-6 text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-text-primary">
                        {elementType.label}
                      </div>
                      <div className="text-sm text-text-muted mt-0.5">
                        {elementType.description}
                      </div>
                    </div>
                  </button>
                )}
              </Menu.Item>
            )
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

