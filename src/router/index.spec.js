// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationError, ErrorCode } from '@/errors/ApplicationError'
import router from './index'

const { ensureSession } = vi.hoisted(() => ({
  ensureSession: vi.fn()
}))

vi.mock('@/stores/session', () => ({
  useSessionStore: () => ({ ensureSession })
}))

describe('router', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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

  it('redirects to not found if ensureSession fails in the identified guard', async () => {
    ensureSession.mockRejectedValue(new ApplicationError(
      ErrorCode.SESSION_NOT_FOUND,
      'Session not found',
      { httpStatus: 404 }
    ))

    const route = router.resolve({
      name: 'manageSession',
      params: {
        locationId: 'location-1',
        sessionId: 'session-1'
      }
    })
    const guard = route.matched.at(-1).beforeEnter

    const result = await guard(route)

    expect(result).toEqual({ name: 'notFound' })
  })

  it('redirects unexpected identified-session errors to a correlated 500 page', async () => {
    const error = new Error('Storage unavailable')
    ensureSession.mockRejectedValue(error)
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValue('8f7f3978-14f7-43a2-a1b5-2d958889c191')
    const consoleError = vi.spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const route = router.resolve({
      name: 'manageSession',
      params: {
        locationId: 'location-1',
        sessionId: 'session-1'
      }
    })
    const guard = route.matched.at(-1).beforeEnter

    const result = await guard(route)

    expect(result).toEqual({
      name: 'internalError',
      query: {
        codeError: ErrorCode.SESSION_LOAD_FAILED,
        errorUuid: '8f7f3978-14f7-43a2-a1b5-2d958889c191'
      }
    })
    expect(consoleError).toHaveBeenCalledWith(
      'Internal application error',
      {
        codeError: ErrorCode.SESSION_LOAD_FAILED,
        errorUuid: '8f7f3978-14f7-43a2-a1b5-2d958889c191',
        error
      }
    )
  })

  it('preserves a classified internal error code on the 500 page', async () => {
    ensureSession.mockRejectedValue(new ApplicationError(
      ErrorCode.SESSION_GRAPH_MIGRATION_FAILED,
      'Migration failed'
    ))
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValue('2a53524d-47e7-43bc-b00e-977801448f19')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const route = router.resolve({
      name: 'manageSession',
      params: {
        locationId: 'location-1',
        sessionId: 'session-1'
      }
    })

    const result = await route.matched.at(-1).beforeEnter(route)

    expect(result.query.codeError)
      .toBe(ErrorCode.SESSION_GRAPH_MIGRATION_FAILED)
  })

  it('redirects to not found if parameters are invalid', async () => {
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

    expect(result).toEqual({ name: 'notFound' })
  })

  it('resolves unknown URLs to the not-found route', () => {
    const route = router.resolve('/unknown/path')

    expect(route.name).toBe('notFoundCatchAll')
    expect(route.params.pathMatch).toEqual(['unknown', 'path'])
    expect(route.matched.at(-1).redirect).toEqual({ name: 'notFound' })
  })

  it('maps the 500 route query to view props', () => {
    const route = router.resolve({
      name: 'internalError',
      query: {
        codeError: 'SESSION_GRAPH_INVALID',
        errorUuid: 'error-uuid'
      }
    })
    const routeRecord = route.matched.at(-1)

    expect(route.path).toBe('/500')
    expect(routeRecord.props.default(route)).toEqual({
      codeError: 'SESSION_GRAPH_INVALID',
      errorUuid: 'error-uuid'
    })
  })
})
