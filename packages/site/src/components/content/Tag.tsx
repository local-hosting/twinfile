import clsx from 'clsx'

const variantStyles = {
  small: '',
  medium: 'rounded-lg px-1.5 ring-1 ring-inset',
}

const colorStyles = {
  accent: {
    small: 'text-accent-text',
    medium: 'ring-accent-ring bg-accent-wash text-accent-text',
  },
  info: {
    small: 'text-info',
    medium: 'ring-info-ring bg-info-wash text-info',
  },
  warning: {
    small: 'text-warning',
    medium: 'ring-warning-ring bg-warning-wash text-warning',
  },
  danger: {
    small: 'text-danger',
    medium: 'ring-danger-ring bg-danger-wash text-danger',
  },
  muted: {
    small: 'text-prose-subtle',
    medium: 'ring-line bg-hover-wash text-prose-muted',
  },
}

const valueColorMap = {
  GET: 'accent',
  POST: 'info',
  PUT: 'warning',
  DELETE: 'danger',
} as Record<string, keyof typeof colorStyles>

export function Tag({
  children,
  variant = 'medium',
  color = valueColorMap[children] ?? 'accent',
}: {
  children: keyof typeof valueColorMap & (string | {})
  variant?: keyof typeof variantStyles
  color?: keyof typeof colorStyles
}) {
  return (
    <span
      className={clsx(
        'font-mono text-[0.625rem]/6 font-bold',
        variantStyles[variant],
        colorStyles[color][variant],
      )}
    >
      {children}
    </span>
  )
}
