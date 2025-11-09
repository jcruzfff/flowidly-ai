import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, className = '', ...props }, ref) => {
    const baseStyles = 'bg-bg-card border border-border-default rounded-lg'
    const hoverStyles = hover ? 'hover:border-border-hover transition-colors cursor-pointer' : ''
    const combinedClassName = `${baseStyles} ${hoverStyles} ${className}`

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card

