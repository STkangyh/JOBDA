import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useSession } from './store/session'

// App.tsx used to branch on window.location.pathname by hand, tracking a KNOWN_PATHS set in
// lockstep with an if-chain — missing either one for a new screen silently fell through to
// ErrorPage. These tests pin the react-router-dom <Routes> that replaced it: each real path
// still resolves to its screen, and anything else still falls back to the error page.

beforeEach(() => {
  useSession.getState().resetSession()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('renders Explore at "/"', async () => {
    renderAt('/')
    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
  })

  it('renders Explore at the "/explore" alias too', async () => {
    renderAt('/explore')
    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
  })

  it('renders JobDetail at "/explore/job"', async () => {
    renderAt('/explore/job')
    expect(await screen.findByText('생활 가전 제품디자이너')).toBeInTheDocument()
  })

  it('falls back to ErrorPage for an unregistered path', async () => {
    renderAt('/this-route-does-not-exist')
    expect(await screen.findByText('Error')).toBeInTheDocument()
  })

  it('ErrorPage\'s confirm button navigates back to "/"', async () => {
    const user = userEvent.setup()
    renderAt('/this-route-does-not-exist')

    await user.click(await screen.findByRole('button', { name: '확인' }))

    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
  })
})
