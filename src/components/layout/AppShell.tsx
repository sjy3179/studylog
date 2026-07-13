import { Settings2 } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

import { BrandMark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import { useSessionClock } from '@/hooks/useSessionClock'
import { ActiveSessionRecovery } from '@/components/records/ActiveSessionRecovery'

import { DesktopSidebar } from '../navigation/DesktopSidebar'
import { MobileNavigation } from '../navigation/MobileNavigation'

export function AppShell() {
  useSessionClock()

  return (
    <div className="min-h-svh bg-background">
      <ActiveSessionRecovery />
      <a
        className="sr-only z-50 rounded-lg bg-background px-4 py-3 text-sm font-semibold text-primary shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#app-main"
      >
        본문으로 건너뛰기
      </a>
      <DesktopSidebar />

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/92 px-4 backdrop-blur lg:hidden">
        <BrandMark to="/app" />
        <Button aria-label="설정 열기" asChild className="size-11" size="icon" variant="ghost">
          <Link to="/app/settings">
            <Settings2 aria-hidden="true" className="size-5" />
          </Link>
        </Button>
      </header>

      <main className="pb-24 lg:ml-64 lg:pb-0" id="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      <MobileNavigation />
    </div>
  )
}
