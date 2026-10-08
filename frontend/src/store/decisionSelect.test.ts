import { beforeEach, describe, expect, it, vi } from 'vitest'

const track = vi.fn()
vi.mock('../lib/analytics', async (orig) => ({ ...(await orig<typeof import('../lib/analytics')>()), track: (...a: unknown[]) => track(...a) }))

const { useSession1 } = await import('./session1')
const { useSession } = await import('./session')

beforeEach(() => {
  track.mockClear()
  useSession1.getState().resetSession()
  useSession.getState().resetSession()
  track.mockClear()
})

const decisions = () => track.mock.calls.filter(([name]) => name === 'decision_select').map(([, props]) => props)

describe('decision_select activity', () => {
  it('logs each change of the round choice before submit, but not a re-click of the same option', () => {
    const s1 = useSession1.getState()
    s1.selectChoice(0)
    s1.selectChoice(0)
    s1.selectChoice(1)
    expect(decisions()).toEqual([
      { target: 'round_1', choice: 0 },
      { target: 'round_1', choice: 1 },
    ])
  })

  it('logs a vendor pick by index only — vendor names are typed by the user and stay out of the log', () => {
    useSession.getState().selectVendor(2)
    useSession.getState().selectVendor(2)
    expect(decisions()).toEqual([{ target: 'vendor', index: 2 }])
  })
})
