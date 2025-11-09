import React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', children, className = '', ...props }, ref) => {
    // Base styles
    const baseStyles = 'inline-flex items-center font-medium rounded-md'

    // Variant styles
    const variantStyles = {
      default: 'bg-bg-secondary text-text-secondary border border-border-default',
      success: 'bg-success-bg text-success border border-success-border',
      warning: 'bg-warning-bg text-warning border border-warning',
      error: 'bg-error-bg text-error border border-error-border',
      info: 'bg-accent-light text-accent-primary border border-accent-primary/20'
    }

    // Size styles
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm'
    }

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge

