import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WorkSidePanel } from './NegotiationPanels'
import { stageNeighbors, useSession } from '../store/session'

beforeEach(() => {
  localStorage.clear()
  useSession.getState().resetSession()
})

describe('work notes panel', () => {
  function renderPanel() {
    return render(
      <MemoryRouter>
        <WorkSidePanel messenger={{ defaultActive: 'senior' }} />
      </MemoryRouter>,
    )
  }

  it('shows the pending task count, opens the notes in place of the messenger, and Done lowers the count', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /업무노트/ }))
    expect(screen.getByRole('heading', { name: '시방서 작성하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /메신저/ })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getAllByRole('button', { name: 'Done' })[0])
    await user.click(screen.getByRole('button', { name: /메신저/ }))
    expect(screen.getByLabelText('남은 할 일 1개')).toBeInTheDocument()
  })

  it('lists conversation memos and saved answers under 메모장', async () => {
    const user = userEvent.setup()
    useSession.getState().saveNote('저장한 내용', 'engineering')
    renderPanel()
    await user.click(screen.getByRole('button', { name: /업무노트/ }))
    await user.click(screen.getByRole('tab', { name: '메모장' }))
    expect(screen.getByRole('heading', { name: '고프로와의 대화' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '박책임와의 대화' })).toBeInTheDocument()
    expect(screen.getByText('저장한 내용')).toBeInTheDocument()
  })
})

describe('stage arrows', () => {
  it('goes back freely but forward only up to the furthest stage reached', () => {
    expect(stageNeighbors({ currentStage: 'workspace', furthestStage: 'workspace', branch: null })).toEqual({ prev: 'materials', next: null })
    expect(stageNeighbors({ currentStage: 'materials', furthestStage: 'final_feedback', branch: null })).toEqual({ prev: null, next: 'workspace' })
    // 외주업체 조사는 외부 업체 탐색을 골랐을 때만 거친다
    expect(stageNeighbors({ currentStage: 'self_assessment', furthestStage: 'self_assessment', branch: 'sheet_wrap' }).prev).toBe('final_feedback')
    expect(stageNeighbors({ currentStage: 'self_assessment', furthestStage: 'self_assessment', branch: 'outsourcing' }).prev).toBe('vendor_compare')
  })

  it('records the furthest stage as the session moves forward, not back', () => {
    useSession.getState().goTo('final_feedback')
    useSession.getState().goTo('workspace')
    expect(useSession.getState().furthestStage).toBe('final_feedback')
  })
})
