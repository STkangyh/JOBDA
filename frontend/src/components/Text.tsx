import type { ElementType, ReactNode } from 'react'

// Figma design system typography scale (Baseline = font-normal, Emphasis = font-medium/semibold).
export type TextVariant =
  | 'display-xl'
  | 'display-lg'
  | 'display-md'
  | 'headline-lg'
  | 'headline-md'
  | 'title-lg'
  | 'title-md'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'caption-lg'
  | 'caption-sm'

const SIZE_CLASS: Record<TextVariant, string> = {
  'display-xl': 'text-display-xl',
  'display-lg': 'text-display-lg',
  'display-md': 'text-display-md',
  'headline-lg': 'text-headline-lg',
  'headline-md': 'text-headline-md',
  'title-lg': 'text-title-lg',
  'title-md': 'text-title-md',
  'body-lg': 'text-body-lg',
  'body-md': 'text-body-md',
  'body-sm': 'text-body-sm',
  'caption-lg': 'text-caption-lg',
  'caption-sm': 'text-caption-sm',
}

interface TextProps {
  variant: TextVariant
  /** Baseline (default) uses font-normal; Emphasis bumps weight — semibold for title-md, medium otherwise. */
  emphasis?: boolean
  as?: ElementType
  className?: string
  children: ReactNode
}

export function Text({ variant, emphasis = false, as, className = '', children }: TextProps) {
  const Tag = as ?? 'p'
  const weightClass = emphasis ? (variant === 'title-md' ? 'font-semibold' : 'font-medium') : 'font-normal'
  return (
    <Tag className={`${SIZE_CLASS[variant]} ${weightClass} ${className}`}>
      {children}
    </Tag>
  )
}
