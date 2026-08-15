import type { IconProps } from './types'

export function ProfileIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10 11.667C16.6667 11.667 20 13.834 20 15.834C19.9992 17.8338 16.6659 20 10 20C3.33417 20 0.00083647 17.8338 0 15.834C0 13.834 3.33333 11.667 10 11.667ZM10 0C12.7614 0 15 2.23858 15 5C15 7.76142 12.7614 10 10 10C7.23858 10 5 7.76142 5 5C5 2.23858 7.23858 0 10 0Z"
        fill="currentColor"
      />
    </svg>
  )
}
