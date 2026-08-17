import type { IconProps } from './types'

export function MailIcon(props: IconProps) {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M2 18C1.45 18 0.979167 17.7797 0.5875 17.3391C0.195833 16.8984 0 16.3688 0 15.75V2.25C0 1.63125 0.195833 1.10156 0.5875 0.660938C0.979167 0.220313 1.45 0 2 0H18C18.55 0 19.0208 0.220313 19.4125 0.660938C19.8042 1.10156 20 1.63125 20 2.25V15.75C20 16.3688 19.8042 16.8984 19.4125 17.3391C19.0208 17.7797 18.55 18 18 18H2ZM10 10.125L18 4.5V2.25L10 7.875L2 2.25V4.5L10 10.125Z"
        fill="currentColor"
      />
    </svg>
  )
}
