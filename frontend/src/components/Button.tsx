import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'secondary' | 'ghost'

// primary/outline states come from Figma's CTA 버튼 component (Default/Hovering/Pressed/
// Outline/Disabled) — colors are spec-accurate, not the generic opacity-40 fallback.
const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-green-500 text-neutral-900 hover:bg-green-100 hover:text-green-700 active:bg-green-700 disabled:bg-green-200 disabled:text-neutral-400',
  outline:
    'border border-green-900 text-neutral-900 hover:bg-green-50 disabled:border-neutral-300 disabled:text-neutral-400',
  secondary:
    'border border-neutral-300 text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800',
  ghost: 'text-neutral-500 hover:text-neutral-900 disabled:opacity-40 dark:hover:text-neutral-100',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  )
}
