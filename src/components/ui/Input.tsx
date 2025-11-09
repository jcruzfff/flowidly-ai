import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const baseStyles = 'w-full px-3 py-2 rounded-md bg-bg-main border text-text-primary text-sm placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1'
    const errorStyles = error
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-border-default focus:border-accent-primary focus:ring-accent-primary'
    
    const combinedClassName = `${baseStyles} ${errorStyles} ${className}`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={combinedClassName}
          {...props}
        />
        
        {error && (
          <p className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

