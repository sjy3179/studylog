import { Info, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { BrandMark } from '@/components/brand/BrandMark'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { NAVIGATION_ITEMS } from './navigation-items'

export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar px-4 py-5 lg:flex lg:flex-col">
      <div className="px-2">
        <BrandMark to="/app" />
      </div>

      <nav aria-label="주요 메뉴" className="mt-10 space-y-1.5">
        {NAVIGATION_ITEMS.map(({ end, icon: Icon, label, path }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm',
              )
            }
            end={end}
            key={path}
            to={path}
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <Separator />
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <Badge className="gap-1.5" variant="secondary">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Demo mode
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label="Mock 모드 안내" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
                  <Info aria-hidden="true" className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">카메라 없이 데모 센서 동작을 확인합니다.</TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            AI 융합 · 안정화 타이머
          </p>
        </div>
      </div>
    </aside>
  )
}
