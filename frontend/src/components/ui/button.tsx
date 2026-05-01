import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'secondary'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  default:     'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive/80 text-destructive-foreground hover:bg-destructive',
  outline:     'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
  ghost:       'text-foreground hover:bg-accent hover:text-accent-foreground',
  link:        'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm:      'h-8 rounded-md px-3 text-xs',
  lg:      'h-11 rounded-md px-8 text-base',
  icon:    'h-9 w-9',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
