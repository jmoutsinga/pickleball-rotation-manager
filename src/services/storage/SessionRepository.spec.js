// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { PlayerBuilder, Session } from '@/models'
import { SessionRepository } from './SessionRepository'

describe('SessionRepository', () => {
  const repository = new SessionRepository()

  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and rehydrates Sessions and their attendees', () => {
    const attendee = new PlayerBuilder()
      .withId('player-1')
      .withName('Alice')
      .build()
    const session = new Session(
      'location-1',
      1,
      null,
      null,
      undefined,
      undefined,
      'session-1',
      [attendee]
    )

    repository.saveAll([session])

    const [restoredSession] = repository.getAll()
    expect(restoredSession).toBeInstanceOf(Session)
    expect(restoredSession.startTime).toBeNull()
    expect(restoredSession.toJSON()).toEqual(session.toJSON())
  })

  it('exposes a detached raw collection for contextual migrations', () => {
    repository.saveAll([
      new Session('location-1', 1, null, null, undefined, undefined, 'session-1')
    ])

    const rawSessions = repository.getRaw()
    rawSessions[0].order = 99

    expect(repository.getRaw()[0].order).toBe(1)
  })
})
