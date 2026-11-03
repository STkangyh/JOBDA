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

describe('color attachment (+) button', () => {
  it('attaches a color chip or a limit sample sheet to the selected part in the draft', async () => {
    const user = userEvent.setup()
    const { container } = renderWorkspace()
    const fileInput = container.querySelector('input[type=file]') as HTMLInputElement

    await user.click(screen.getByRole('button', { name: '컬러칩 또는 한도 견본 판정표 첨부' }))
    await user.click(screen.getByRole('button', { name: '컬러칩 첨부' }))
    await user.upload(fileInput, new File(['x'], 'oak-chip.jpg', { type: 'image/jpeg' }))
    expect(screen.getByRole('button', { name: 'oak-chip.jpg' })).toBeInTheDocument()
    expect(useSession.getState().draftParts[0]).toMatchObject({ attachment: 'colorChip', attachmentFileName: 'oak-chip.jpg' })

    // 다른 부품에 한도 견본 판정표 — 초안의 한도 견본 첨부 여부에도 반영된다
    await user.click(screen.getByRole('button', { name: '가죽 스트랩' }))
    await user.click(screen.getByRole('button', { name: '컬러칩 또는 한도 견본 판정표 첨부' }))
    await user.click(screen.getByRole('button', { name: '한도 견본 판정표 첨부' }))
    await user.upload(fileInput, new File(['x'], '판정표.pdf', { type: 'application/pdf' }))
    expect(useSession.getState().draftParts[3]).toMatchObject({ attachment: 'limitSample', attachmentFileName: '판정표.pdf' })
    expect(useSession.getState().draft.limitSampleAttached).toBe(true)

    // 파일 이름을 누르면 첨부가 빠진다
    await user.click(screen.getByRole('button', { name: '판정표.pdf' }))
    expect(useSession.getState().draftParts[3].attachment).toBeNull()
  })

  it('attaches the limit sample sheet in the final revision, which unlocks resubmitting', async () => {
    useSession.setState({ draftSubmitted: true })
    const user = userEvent.setup()
    const { container } = renderWorkspace()
    expect(screen.getByRole('button', { name: '수정안 제출' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '한도 견본 판정표 첨부' }))
    await user.upload(container.querySelector('input[type=file]') as HTMLInputElement, new File(['x'], '마루 판정표.docx'))
    expect(screen.getByRole('button', { name: '마루 판정표.docx' })).toBeInTheDocument()
    expect(useSession.getState().final.limitSampleAttached).toBe(true)
    expect(screen.getByRole('button', { name: '수정안 제출' })).toBeEnabled()
  })
})
