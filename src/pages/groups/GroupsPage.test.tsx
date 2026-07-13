import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'

import { GroupsPage } from './GroupsPage'

const disabledGroupActions = [
  '방 만들기',
  '초대하기',
  '초대 코드 입력',
  '참가하기',
  '초대 링크 복사',
  '그룹 설정',
] as const

describe('GroupsPage', () => {
  it('marks the page as a UI demo and keeps every group action disabled', () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <GroupsPage />
        </TooltipProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('UI 데모')).not.toBeNull()

    for (const actionName of disabledGroupActions) {
      const action = screen.getByRole('button', { name: actionName })

      expect(action).toBeInstanceOf(HTMLButtonElement)
      expect((action as HTMLButtonElement).disabled).toBe(true)
    }
  })
})
