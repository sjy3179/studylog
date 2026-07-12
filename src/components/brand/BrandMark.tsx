import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface BrandMarkProps {
  compact?: boolean
  className?: string
  to?: string
}

export function BrandMark({ compact = false, className, to = '/' }: BrandMarkProps) {
  return (
    <Link
      aria-label="studylog 홈"
      className={cn(
        'inline-flex min-h-11 items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      to={to}
    >
      <img
        alt=""
        aria-hidden="true"
        className={cn(
          'rounded-[30%] bg-white object-contain shadow-sm ring-1 ring-slate-200/70',
          compact ? 'size-10' : 'size-12',
        )}
        decoding="async"
        src="/studylog_logo.svg"
      />
    </Link>
  )
}
