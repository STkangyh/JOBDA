import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const NOTICE = '대화 내용은 서비스 개선을 위해 저장되며 30일 후 삭제돼요.'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('ChatRetentionNotice', () => {
  it('tells users chats are stored when chat logging is on', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
    const { ChatRetentionNotice } = await import('./ChatRetentionNotice')
    render(<ChatRetentionNotice />)
    expect(screen.getByText(NOTICE)).toBeInTheDocument()
  })

  it('stays hidden when nothing is being stored', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const { ChatRetentionNotice } = await import('./ChatRetentionNotice')
    render(<ChatRetentionNotice />)
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()
  })
})
