// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { Session, SessionStatus } from '@/models'
import { SessionPersistenceService } from './SessionPersistenceService'

describe('SessionPersistenceService', () => {
  const service = new SessionPersistenceService()

  beforeEach(() => {
    localStorage.clear()
  })

  it('upserts a Session while preserving other Sessions', () => {
    const firstSession = new Session(
      'location-1', 1, null, null, undefined, undefined, 'session-1'
    )
    const secondSession = new Session(
      'location-2', 1, null, null, undefined, undefined, 'session-2'
    )
    service.saveAll([firstSession, secondSession])

    firstSession.updateAttendingPlayers([])
    service.save(firstSession)

    expect(service.getAll().map(session => session.id))
      .toEqual(['session-1', 'session-2'])
  })

  it('rejects a second started Session for the same Location', () => {
    service.save(new Session(
      'location-1',
      1,
      new Date('2026-08-20T08:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      undefined,
      'session-1'
    ))

    expect(() => service.save(new Session(
      'location-1',
      2,
      new Date('2026-08-20T09:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      undefined,
      'session-2'
    ))).toThrow('This location already has a started session')
    expect(service.getAll().map(session => session.id))
      .toEqual(['session-1'])
  })
})
