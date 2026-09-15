import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// @testing-library/react's auto-cleanup relies on detecting a global afterEach, which isn't
// present since vitest.config's `test.globals` is off (imports are explicit everywhere else in
// this project) — register it by hand so each render() doesn't leak into the next test's DOM.
afterEach(() => {
  cleanup()
})
