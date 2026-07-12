import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { NAVIGATION_ITEMS } from './navigation-items'

export function MobileNavigation() {
  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {NAVIGATION_ITEMS.map(({ end, icon: Icon, label, path }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground transition-colors',
                isActive && 'bg-accent text-accent-foreground',
              )
            }
            end={end}
            key={path}
            to={path}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
