import { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  name?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s/g, "-");
    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--color-text)] mb-1"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={inputId}
          className={`w-full rounded-md border bg-surface px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 ${
            error ? "border-red-500" : "border-[var(--color-border)]"
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
