import { BarChart3, Settings2, Timer, UsersRound } from 'lucide-react'

export const NAVIGATION_ITEMS = [
  { label: '오늘', path: '/app', icon: Timer, end: true },
  { label: '기록', path: '/app/records', icon: BarChart3, end: false },
  { label: '그룹', path: '/app/groups', icon: UsersRound, end: false },
  { label: '설정', path: '/app/settings', icon: Settings2, end: false },
] as const
