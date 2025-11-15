'use client'

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

type PricingTableProps = {
  content: {
    lineItems?: LineItem[]
    discount?: Discount
    currency?: string
  }
}

export default function PricingTable({ content }: PricingTableProps) {
  const lineItems = content.lineItems || []
  const discount = content.discount || { type: 'none', value: 0 }
  const currency = content.currency || 'USD'

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

  if (lineItems.length === 0) {
    return (
      <div className="w-full my-8">
        <div className="bg-bg-card border border-border-default rounded-lg p-8 text-center">
          <p className="text-text-muted">No pricing information available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full my-8">
      <div className="bg-bg-card border border-border-default rounded-lg overflow-hidden shadow-md">
        {/* Header */}
        <div className="bg-bg-hover px-6 py-4 border-b border-border-default">
          <h3 className="text-xl font-bold text-text-primary">Investment</h3>
        </div>

        {/* Line Items */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-hover border-b border-border-default">
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-text-primary w-32">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary w-40">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary w-40">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-base text-text-primary font-medium">
                      {item.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-text-secondary">
                    {item.quantity} {item.quantity === 1 ? 'Unit' : 'Units'}
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-text-primary">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-6 border-t border-border-default bg-bg-hover space-y-3">
          <div className="flex justify-between items-center text-base text-text-secondary">
            <span className="font-medium">Subtotal:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          
          {discount.type !== 'none' && discountAmount > 0 && (
            <div className="flex justify-between items-center text-base text-success">
              <span className="font-medium">
                Discount {discount.type === 'percentage' ? `(${discount.value}%)` : ''}:
              </span>
              <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center text-2xl font-bold text-text-primary pt-3 border-t border-border-default">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

