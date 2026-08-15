import { describe, expect, it } from 'vitest'
import { Session } from './Session'
import { SessionStatus } from './SessionStatus'

describe('Session', () => {
  it.each(['', 'location-1'])(
    'enforces its location and order invariants for location %j',
    locationId => {
      if (!locationId) {
        expect(() => new Session(locationId, 1))
          .toThrow('Session locationId is required')
      } else {
        expect(() => new Session(locationId, 0))
          .toThrow('Session order must be a positive integer')
      }
    }
  )

  it('finishes at the requested time', () => {
    const session = new Session('location-1', 1)
    const endTime = new Date('2026-08-13T16:00:00.000Z')

    session.finish(endTime)

    expect(session.status).toBe(SessionStatus.FINISHED)
    expect(session.endTime).toEqual(endTime)
  })

  it('restores dates and waiting times from JSON', () => {
    const session = new Session(
      'location-1',
      2,
      new Date('2026-08-13T14:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map([['player-1', 45]]),
      'session-1'
    )

    const restoredSession = Session.fromJson(session.toJSON())

    expect(restoredSession).toBeInstanceOf(Session)
    expect(restoredSession.startTime).toEqual(new Date('2026-08-13T14:00:00.000Z'))
    expect(restoredSession.playerWaitingTimes).toEqual(new Map([['player-1', 45]]))
    expect(restoredSession.toJSON()).toEqual(session.toJSON())
  })
})
