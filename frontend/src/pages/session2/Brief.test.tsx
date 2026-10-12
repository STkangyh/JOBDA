import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const track = vi.fn()
vi.mock('../../lib/analytics', async (orig) => ({ ...(await orig<typeof import('../../lib/analytics')>()), track: (...a: unknown[]) => track(...a) }))

const { Brief } = await import('./Brief')
const { useSession } = await import('../../store/session')

function renderBrief() {
  return render(
    <MemoryRouter initialEntries={['/session2']}>
      <Routes>
        <Route path="/session2" element={<Brief />} />
        <Route path="/" element={<p>홈 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const calls = (name: string) => track.mock.calls.filter(([n]) => n === name).map(([, props]) => props)
const currentChapter = () => screen.getByRole('list', { name: '브리프 진행' }).querySelector('[aria-current="step"]')

beforeEach(() => {
  track.mockClear()
  useSession.getState().resetSession()
})

describe('session2 story brief', () => {
  it('opens on the first scene with the role chapter and no back arrow', () => {
    renderBrief()
    expect(screen.getByText(/김기럭 사원님 반가워요/)).toBeInTheDocument()
    expect(currentChapter()).toHaveTextContent('Your Role')
    expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })

  it('moves between scenes with the arrows and the keyboard, and uses the corrected "Mission" label', async () => {
    const user = userEvent.setup()
    renderBrief()
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(currentChapter()).toHaveTextContent('Background')
    expect(screen.getByText(/탁상용 공기청정기예요/)).toBeInTheDocument()

    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(currentChapter()).toHaveTextContent('Mission')
    expect(screen.queryByText('Misson')).not.toBeInTheDocument()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText(/목재 접합 설비가 없어서/)).toBeInTheDocument()
  })

  it('Skip goes straight to materials and records it as a skipped brief', async () => {
    const user = userEvent.setup()
    renderBrief()
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(calls('step_complete')).toEqual([{ step: 'brief', via: 'skip', scene: 2 }])
    expect(useSession.getState().currentStage).toBe('materials')
  })

  it('the last scene hides the forward arrow, keeps back, fills every chapter and turns Skip into Next', async () => {
    const user = userEvent.setup()
    renderBrief()
    await user.keyboard('{ArrowRight>7/}')
    expect(screen.getByText(/업무를 시작해볼까요/)).toBeInTheDocument()
    expect(currentChapter()).toBeNull()
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(calls('step_complete')).toEqual([{ step: 'brief', via: 'next', scene: 8 }])
    expect(useSession.getState().currentStage).toBe('materials')
  })

  it('Exit records an explicit session exit and goes home', async () => {
    const user = userEvent.setup()
    renderBrief()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    await user.click(screen.getByRole('button', { name: 'Exit' }))
    expect(calls('session_exit')).toEqual([{ step: 'brief', scene: 3 }])
    expect(screen.getByText('홈 화면')).toBeInTheDocument()
  })
})
