import { lazy, Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'

const LandingPage = lazy(() =>
  import('@/pages/landing/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const TodayPage = lazy(() =>
  import('@/pages/today/TodayPage').then((module) => ({ default: module.TodayPage })),
)
const RecordsPage = lazy(() =>
  import('@/pages/records/RecordsPage').then((module) => ({ default: module.RecordsPage })),
)
const GroupsPage = lazy(() =>
  import('@/pages/groups/GroupsPage').then((module) => ({ default: module.GroupsPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const EvaluationPage = lazy(() =>
  import('@/pages/evaluation/EvaluationPage').then((module) => ({
    default: module.EvaluationPage,
  })),
)
const ReportPage = lazy(() =>
  import('@/pages/report/ReportPage').then((module) => ({
    default: module.ReportPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function RouteLoading() {
  return (
    <div className="grid min-h-[60svh] place-items-center" role="status">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        화면을 준비하고 있습니다.
      </div>
    </div>
  )
}

export function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<AppShell />} path="/app">
          <Route element={<TodayPage />} index />
          <Route element={<RecordsPage />} path="records" />
          <Route element={<GroupsPage />} path="groups" />
          <Route element={<SettingsPage />} path="settings" />
        </Route>
        <Route element={<EvaluationPage />} path="/evaluate" />
        <Route element={<ReportPage />} path="/report/:sessionId" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  )
}
