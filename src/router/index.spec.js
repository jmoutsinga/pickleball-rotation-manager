// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import router from './index'

const { ensureSession } = vi.hoisted(() => ({
  ensureSession: vi.fn()
}))

vi.mock('@/stores/session', () => ({
  useSessionStore: () => ({ ensureSession })
}))

describe('router', () => {
  beforeEach(() => {
    ensureSession.mockReset()
  })

  it('resolves the identified manage-session route', () => {
    const route = router.resolve({
      name: 'manageSession',
      params: {
        locationId: 'location-1',
        sessionId: 'session-1'
      }
    })

    expect(route.path).toBe('/manage/location-1/session-1')
    expect(route.params).toEqual({
      locationId: 'location-1',
      sessionId: 'session-1'
    })
  })

  it('loads the graph identified by the manage-session route', async () => {
    const route = router.resolve({
      name: 'manageSession',
      params: {
        locationId: 'location-1',
        sessionId: 'session-1'
      }
    })
    const guard = route.matched.at(-1).beforeEnter

    expect(guard).toBeTypeOf('function')

    await guard(route)

    expect(ensureSession).toHaveBeenCalledOnce()
    expect(ensureSession).toHaveBeenCalledWith({
      locationId: 'location-1',
      sessionId: 'session-1'
    })
  })

  it('keeps the legacy manage route initialization', async () => {
    const route = router.resolve({ name: 'manage' })
    const guard = route.matched.at(-1).beforeEnter

    await guard(route)

    expect(ensureSession).toHaveBeenCalledOnce()
    expect(ensureSession).toHaveBeenCalledWith()
  })

  it('does not initialize a session for Manage Players', () => {
    const route = router.resolve({ name: 'managePlayers' })

    expect(route.matched.at(-1).beforeEnter).toBeUndefined()
    expect(ensureSession).not.toHaveBeenCalled()
  })

  it('redirects to home if ensureSession fails in the identified guard', async () => {
    ensureSession.mockRejectedValue(new Error('Session not found'))

    const route = router.resolve({
      name: 'manageSession',
      params: {
        locationId: 'location-1',
        sessionId: 'session-1'
      }
    })
    const guard = route.matched.at(-1).beforeEnter

    const result = await guard(route)

    expect(result).toEqual({ name: 'home' })
  })

  it('redirects to home if parameters are invalid', async () => {
    const guard = router.resolve({
      name: 'manageSession',
      params: { locationId: 'l', sessionId: 's' }
    }).matched.at(-1).beforeEnter

    const result = await guard({
      params: {
        locationId: null,
        sessionId: 'session-1'
      }
    })

    expect(result).toEqual({ name: 'home' })
  })
})
