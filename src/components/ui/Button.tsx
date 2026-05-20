import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-accent text-black hover:bg-amber-500 focus-visible:ring-amber-500/50",
  secondary:
    "bg-surface border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)]",
  ghost: "text-[var(--color-text)] hover:bg-surface focus-visible:ring-[var(--color-border)]",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500/50",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";
