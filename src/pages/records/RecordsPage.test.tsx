import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RecordsPage } from './RecordsPage'

describe('RecordsPage', () => {
  it('shows zero summary metrics and an accessible empty daily state', () => {
    render(<RecordsPage />)

    expect(
      screen.getByRole('heading', { name: '아직 일간 기록이 없습니다' }),
    ).not.toBeNull()
    expect(
      screen.getByText(
        '학습 세션을 종료하면 순공 시간과 자세·조도 조건 기록이 이곳에 표시됩니다.',
      ),
    ).not.toBeNull()
    expect(screen.getByText('00:00:00')).not.toBeNull()
    expect(screen.getAllByText('0%')).toHaveLength(3)
  })
})
