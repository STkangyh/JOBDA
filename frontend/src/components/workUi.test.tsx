import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CoachTour } from './CoachTour'
import { WorkSidePanel } from './NegotiationPanels'
import { ExpandableArea } from './WorkFrame'
import { ProfileMenu } from './ProfileMenu'
import { maskEmail } from '../lib/auth'
import { stageNeighbors, understandingPercent, useSession } from '../store/session'

beforeEach(() => {
  localStorage.clear()
  useSession.getState().resetSession()
})

describe('coach marks', () => {
  const steps = [
    { target: 'a', side: 'bottom' as const, title: '첫 단계', body: '첫 설명' },
    { target: 'b', side: 'left' as const, title: '둘째 단계', body: '둘째 설명' },
  ]

  it('walks through the steps with Next and is not shown again once finished', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <>
        <div data-coach="a" />
        <div data-coach="b" />
        <CoachTour id="t" steps={steps} enabled />
      </>,
    )
    expect(screen.getByRole('dialog', { name: '첫 단계' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: '둘째 단계' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()

    render(<CoachTour id="t" steps={steps} enabled />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Skip ends the tour right away', async () => {
    const user = userEvent.setup()
    render(<CoachTour id="s" steps={steps} enabled />)
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem('jobda-coach-s')).toBe('1')
  })
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

  it('shows tasks for the current stage and keeps each stage\'s done/removed state separately', async () => {
    const user = userEvent.setup()
    useSession.setState({ draftSubmitted: true })
    renderPanel()
    await user.click(screen.getByRole('button', { name: /업무노트/ }))
    expect(screen.getByRole('heading', { name: '시방서 수정하기' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '시방서 작성하기' })).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(screen.queryByRole('heading', { name: '시방서 수정하기' })).not.toBeInTheDocument()
    expect(useSession.getState().workTaskStatus).toEqual({ revise_spec: 'removed' })
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

describe('understanding', () => {
  it('is the share of the five things to take care of, not the reasoning fields', () => {
    const s = useSession.getState()
    expect(understandingPercent(s)).toBe(0)
    useSession.setState({ askedCapability: true, askedBudget: true, final: { ...s.final, limitSampleAttached: true } })
    expect(understandingPercent(useSession.getState())).toBe(60)
  })
})

describe('work area fullscreen', () => {
  it('opens from an empty spot, ignores clicks on inputs, and closes from the blurred surroundings or Escape', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ExpandableArea>
        <p>빈 곳</p>
        <input aria-label="소재" />
      </ExpandableArea>,
    )
    const area = container.querySelector('[data-coach="fullscreen"]')!
    await user.click(screen.getByLabelText('소재'))
    expect(area).not.toHaveAttribute('data-expanded')

    await user.click(screen.getByText('빈 곳'))
    expect(area).toHaveAttribute('data-expanded')
    await user.click(screen.getByText(/바깥을 누르거나/))
    expect(area).not.toHaveAttribute('data-expanded')

    await user.click(screen.getByText('빈 곳'))
    await user.keyboard('{Escape}')
    expect(area).not.toHaveAttribute('data-expanded')
  })
})

describe('profile menu', () => {
  it('offers login when no account is signed in', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProfileMenu />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '내 계정' }))
    expect(await screen.findByText('로그인하지 않았어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('hides most of the email address', () => {
    expect(maskEmail('abcdef@gmail.com')).toBe('ab****@gmail.com')
    expect(maskEmail('ab@x.com')).toBe('ab***@x.com')
  })
})
