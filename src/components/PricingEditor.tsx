'use client'

import { Fragment, useRef, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
}

type Discount = {
  type: 'none' | 'percentage' | 'fixed'
  value: number
}

type PricingEditorProps = {
  content: {
    lineItems?: LineItem[]
    discount?: Discount
    currency?: string
    [key: string]: unknown // Allow additional properties from BlockElement content
  }
  onChangeAction: (content: Record<string, unknown>) => void
}

export default function PricingEditor({ content, onChangeAction }: PricingEditorProps) {
  const lineItems = content.lineItems || []
  const discount = content.discount || { type: 'none', value: 0 }
  const currency = content.currency || 'USD'
  const discountMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  
  let discountAmount = 0
  if (discount.type === 'percentage') {
    discountAmount = subtotal * (discount.value / 100)
  } else if (discount.type === 'fixed') {
    discountAmount = discount.value
  }
  
  const total = subtotal - discountAmount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const handleAddLineItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newItem: LineItem = {
      id: `item-${crypto.randomUUID()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
    }
    onChangeAction({
      ...content,
      lineItems: [...lineItems, newItem],
    })
    // Remove focus from button after click
    e.currentTarget.blur()
  }

  const handleUpdateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    )
    onChangeAction({
      ...content,
      lineItems: updatedItems,
    })
  }

  const handleDeleteLineItem = (id: string) => {
    onChangeAction({
      ...content,
      lineItems: lineItems.filter(item => item.id !== id),
    })
  }

  const handleDiscountChange = (field: 'type' | 'value', value: string | number) => {
    onChangeAction({
      ...content,
      discount: {
        ...discount,
        [field]: value,
      },
    })
  }

  return (
    <div className="w-full overflow-visible space-y-6">
      {/* Collapsed Header Bar (Sleek View) */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900 text-white rounded-xl px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors shadow-lg"
        >
          <div className="flex items-center gap-3">
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={content.title || 'Investment'}
              onChange={(e) => {
                e.stopPropagation()
                onChangeAction({
                  ...content,
                  title: e.target.value,
                })
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Go ahead and start typing"
              className="bg-transparent text-white text-lg font-medium placeholder-gray-500 focus:outline-none border-none w-96"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Subtotal</div>
              <div className="text-xl font-semibold">{formatCurrency(subtotal)}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <PencilIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Edit View */}
      {isExpanded && (
        <>
          <div className="relative bg-white border border-gray-300 rounded-xl shadow-sm group">
            {/* Header with Collapse Button */}
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors focus:outline-none"
                >
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={content.title || 'Investment'}
                  onChange={(e) => onChangeAction({
                    ...content,
                    title: e.target.value,
                  })}
                  placeholder="Go ahead and start typing"
                  className="bg-transparent text-white text-lg font-medium placeholder-gray-500 focus:outline-none border-none w-96"
                />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Subtotal</div>
                <div className="text-xl font-semibold">{formatCurrency(subtotal)}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-visible relative">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 flex items-center gap-2">
                      Description
                      <span className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">?</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-48">
                      <div className="flex items-center gap-2">
                        Item
                        <span className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">?</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-32">
                      <div className="flex items-center gap-2">
                        Quantity
                        <span className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">?</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-40">
                      <div className="flex items-center gap-2">
                        Price
                        <span className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">?</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        Click the + button below to add your first line item
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="relative hover:bg-gray-50 transition-colors"
                        onMouseEnter={() => setHoveredRow(item.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                            placeholder="Add some text"
                            className="w-full px-3 py-2 bg-transparent border-none text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded-lg transition-all"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              onFocus={(e) => e.target.value === '0' && e.target.select()}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-7 pr-3 py-2 bg-transparent border-none text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded-lg transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onFocus={(e) => e.target.value === '1' && e.target.select()}
                              min="0"
                              step="1"
                              className="w-16 px-3 py-2 bg-transparent border-none text-gray-700 focus:outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded-lg transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-gray-500 text-sm">Unit</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left font-semibold text-gray-700">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </td>

                        {/* Right Side: Line Item Options Menu (Half on/half off right edge) */}
                        {hoveredRow === item.id && (
                          <td className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                            <Menu as="div" className="relative">
                              <Menu.Button className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 hover:border-gray-400 hover:scale-110 transition-all focus:outline-none">
                                <PencilIcon className="w-4 h-4 text-gray-600" />
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
                                <Menu.Items className="absolute left-full ml-3 top-1/2 -translate-y-1/2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 focus:outline-none z-[100]">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => {
                                          // TODO: Add to saved items functionality
                                          alert('Add to saved items - Coming soon!')
                                        }}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors rounded-lg mx-1`}
                                      >
                                        Add to saved items
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDeleteLineItem(item.id)}
                                        className={`${
                                          active ? 'bg-red-50' : ''
                                        } w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors rounded-lg mx-1`}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <div className="border-t border-gray-200 my-2"></div>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => {
                                          // TODO: Add discount to this line item
                                          alert('Add discount to line item - Coming soon!')
                                        }}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors rounded-lg mx-1`}
                                      >
                                        Add discount
                                      </button>
                                    )}
                                  </Menu.Item>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Add Line Item Button - Left edge, below table */}
              <div className="relative border-t border-gray-200">
                <div className="absolute left-0 bottom-4 -translate-x-1/2">
                  <Menu as="div" className="relative">
                    <Menu.Button 
                      onMouseEnter={() => setHoveredRow('add-button')}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 hover:border-gray-400 hover:scale-110 transition-all focus:outline-none"
                    >
                      <PlusIcon className="w-4 h-4 text-gray-600" />
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
                      <Menu.Items className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 focus:outline-none z-[100]">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                handleAddLineItem(e)
                              }}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors rounded-lg mx-1`}
                            >
                              New line item
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                // TODO: Saved line items functionality
                                alert('Saved line items - Coming soon!')
                              }}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors rounded-lg mx-1`}
                            >
                              Saved line item
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
                <div className="h-16"></div>
              </div>
            </div>
          </div>

          {/* Total Box - Separate and Centered */}
          <div className="flex justify-center">
            <div className="bg-gray-900 text-white px-8 py-5 rounded-xl shadow-xl flex items-center justify-between min-w-[400px]">
              <span className="text-xl font-semibold">Total</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{formatCurrency(total)}</span>
                <button
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none"
                  title="Edit total"
                >
                  <PencilIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

