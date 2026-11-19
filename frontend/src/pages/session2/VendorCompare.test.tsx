import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { VendorCompare } from './VendorCompare'
import { useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  useSession.getState().resetSession()
  useSession.setState({ currentStage: 'vendor_compare' })
})

describe('vendor research model answer', () => {
  it('shows the Figma mock vendor list and still lets me send', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <VendorCompare />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '모범답안' }))
    const answer = screen.getByRole('region', { name: '모범답안 · 외주 업체 리스트' })
    expect(within(answer).getByText('우진 목형')).toBeInTheDocument()
    expect(within(answer).getByText('14,000원')).toBeInTheDocument()

    // 내 표는 비어 있어도 버튼은 눌리고, 내 표로 돌아가 안내한다
    await user.click(screen.getByRole('button', { name: '조사 완료' }))
    expect(screen.queryByRole('region', { name: /모범답안/ })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('모두 채워야')
    expect(screen.getByRole('textbox', { name: '업체 1 이름' })).toBeInTheDocument()
  })
})
