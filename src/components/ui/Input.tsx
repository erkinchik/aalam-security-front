import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s/g, '-')
    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--color-text)] mb-1"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-md border bg-surface px-3 py-2
            text-[var(--color-text)] placeholder-[var(--color-muted)]
            focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg
            disabled:opacity-50
            ${error ? 'border-red-500' : 'border-[var(--color-border)]'}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
