import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Workspace } from './Workspace'
import { useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  // 첫 방문 안내(코치 마크)는 이 테스트와 상관없어 건너뛴다
  localStorage.setItem('jobda-coach-workspace', '1')
  useSession.getState().resetSession()
})

function renderWorkspace() {
  return render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
}

describe('spec model answer', () => {
  it('shows the model answer for the selected part and goes back to my answer', async () => {
    const user = userEvent.setup()
    renderWorkspace()
    await user.type(screen.getByRole('textbox', { name: '소재' }), '자작나무')

    await user.click(screen.getByRole('button', { name: '모범답안' }))
    const wood = screen.getByRole('region', { name: '모범답안 · 목재 흡기구 커버' })
    expect(within(wood).getByText('화이트 오크 원목')).toBeInTheDocument()
    expect(within(wood).getByText('오일 마감')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '가죽 스트랩' }))
    const strap = screen.getByRole('region', { name: '모범답안 · 가죽 스트랩' })
    expect(within(strap).getByText('카멜색')).toBeInTheDocument()
    expect(within(strap).getByText('Panton 1595')).toBeInTheDocument()

    // 다시 누르면 내가 쓴 값이 그대로 있다
    await user.click(screen.getByRole('button', { name: '목재 흡기구 커버' }))
    await user.click(screen.getByRole('button', { name: '모범답안' }))
    expect(screen.queryByRole('region', { name: /모범답안/ })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '소재' })).toHaveValue('자작나무')
  })
})
