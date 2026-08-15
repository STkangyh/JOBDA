import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  active?: boolean
  className?: string
}

export function Chip({ children, active = false, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-caption-lg font-medium ${
        active
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-400 bg-neutral-200 text-neutral-900'
      } ${className}`}
    >
      {children}
    </span>
  )
}
