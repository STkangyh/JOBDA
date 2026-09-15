import { describe, expect, it } from 'vitest'
import { chat } from './client'

// VITE_API_BASE_URL is unset in the test env (as it is for anyone running the app locally
// without a .env), so client.ts's mock fallback is the branch actually exercised here — this
// pins that a request with no configured backend still resolves instead of hanging or throwing
// on the network path.
describe('client.chat (no VITE_API_BASE_URL configured)', () => {
  it('resolves via the mock responder instead of attempting a network call', async () => {
    const res = await chat({ persona: 'senior', history: [], message: '시방서 서식 확인 부탁드려요' })

    expect(res.disclose).toContain('spec_format')
    expect(res.reply.length).toBeGreaterThan(0)
  })

  it('rejects for an empty message, same as the real backend\'s invalid_message case', async () => {
    await expect(chat({ persona: 'senior', history: [], message: '' })).rejects.toThrow()
  })
})
