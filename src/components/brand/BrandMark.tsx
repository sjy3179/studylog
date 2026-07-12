import { ScanLine } from 'lucide-react'
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
      className={cn('inline-flex items-center gap-2.5 font-semibold tracking-tight', className)}
      to={to}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <ScanLine aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </span>
      {!compact && <span className="text-lg text-foreground">studylog</span>}
    </Link>
  )
}
