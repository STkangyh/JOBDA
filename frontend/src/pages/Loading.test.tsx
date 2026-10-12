import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Loading, LOADING_DURATION_MS } from './Loading'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function renderLoading() {
  return render(
    <MemoryRouter initialEntries={['/loading']}>
      <Routes>
        <Route path="/loading" element={<Loading />} />
        <Route path="/explore/job" element={<p>직무 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const bar = () => screen.getByRole('progressbar', { name: '체험 자료 불러오는 중' })
const percentText = () => screen.getByText(/^\d+%$/)

describe('loading splash', () => {
  it('raises the number together with the bar fill and keeps the spinner spinning until it is full', () => {
    const { container } = renderLoading()
    expect(bar()).toHaveAttribute('aria-valuenow', '0')
    expect(percentText()).toHaveTextContent('0%')
    expect(container.querySelector('.animate-spin')).not.toBeNull()

    act(() => vi.advanceTimersByTime(LOADING_DURATION_MS / 2))
    const mid = Number(bar().getAttribute('aria-valuenow'))
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)
    expect(percentText()).toHaveTextContent(`${mid}%`)
    expect((bar().firstElementChild as HTMLElement).style.width).toBe(`${mid}%`)
    expect(container.querySelector('.animate-spin')).not.toBeNull()

    act(() => vi.advanceTimersByTime(LOADING_DURATION_MS / 2))
    expect(bar()).toHaveAttribute('aria-valuenow', '100')
    expect(percentText()).toHaveTextContent('100%')
  })

  it('moves on to the next screen shortly after reaching 100%', () => {
    renderLoading()
    act(() => vi.advanceTimersByTime(LOADING_DURATION_MS))
    expect(screen.queryByText('직무 상세')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(400))
    expect(screen.getByText('직무 상세')).toBeInTheDocument()
  })
})
