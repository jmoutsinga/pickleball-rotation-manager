import { describe, expect, it } from 'vitest'
import { Game } from './Game'
import { PlayerBuilder } from './Player'
import { Rotation } from './Rotation'
import { PlayerStatus } from './PlayerStatus'
import { Session } from './Session'
import { SessionStatus } from './SessionStatus'

describe('Session', () => {
  it('calculates the next Rotation order and Game number in its own history', () => {
    const game = new Game({
      number: 5,
      courtId: 'court-1',
      teamAId: 'team-a',
      teamBId: 'team-b',
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    })
    const session = new Session('location-1', 1, null, null, undefined,
      undefined, 'session-1')
    const rotations = [
      new Rotation(session.id, 2, [game], []),
      new Rotation('other-session', 9, [new Game({
        number: 99,
        courtId: 'court-2',
        teamAId: 'team-c',
        teamBId: 'team-d',
        scoreTeamA: null,
        scoreTeamB: null,
        winnerTeam: null,
        loserTeam: null
      })], [])
    ]

    expect(session.getNextRotationOrder(rotations)).toBe(3)
    expect(session.getNextGameNumber(rotations)).toBe(6)
    expect(session.getNextRotationOrder([])).toBe(1)
    expect(session.getNextGameNumber([])).toBe(1)
  })

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
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder().withName(`player-${index + 1}`).build()
    )
    const endTime = new Date('2026-08-13T16:00:00.000Z')

    session.updateAttendingPlayers(players)
    session.start(new Date('2026-08-13T14:00:00.000Z'))
    session.finish(endTime)

    expect(session.status).toBe(SessionStatus.FINISHED)
    expect(session.endTime).toEqual(endTime)
  })

  it('restores dates and waiting times from JSON', () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder().withName(`player-${index + 1}`).build()
    )
    const session = new Session(
      'location-1',
      2,
      new Date('2026-08-13T14:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map([['player-1', 45]]),
      'session-1',
      players
    )

    const restoredSession = Session.fromJson(session.toJSON())

    expect(restoredSession).toBeInstanceOf(Session)
    expect(restoredSession.startTime).toEqual(new Date('2026-08-13T14:00:00.000Z'))
    expect(restoredSession.playerWaitingTimes).toEqual(new Map([['player-1', 45]]))
    expect(restoredSession.attendingPlayers.map(player => player.id))
      .toEqual(players.map(player => player.id))
    expect(restoredSession.toJSON()).toEqual(session.toJSON())
  })

  it('creates a session in preparation without a start time or attendees', () => {
    const session = new Session('location-1', 1)

    expect(session.status).toBe(SessionStatus.CREATED)
    expect(session.startTime).toBeNull()
    expect(session.attendingPlayers).toEqual([])
  })

  it('persists attendee selection while the session is created', () => {
    const session = new Session('location-1', 1)
    const players = [
      new PlayerBuilder().withName('alice').build(),
      new PlayerBuilder().withName('bob').build()
    ]

    session.updateAttendingPlayers(players)

    const restoredSession = Session.fromJson(session.toJSON())
    expect(restoredSession.status).toBe(SessionStatus.CREATED)
    expect(restoredSession.startTime).toBeNull()
    expect(restoredSession.attendingPlayers.map(player => player.id))
      .toEqual(players.map(player => player.id))
  })

  it('requires four available attendees before starting', () => {
    const session = new Session('location-1', 1)
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder().withName(`player-${index + 1}`).build()
    )

    session.updateAttendingPlayers(players.slice(0, 3))
    expect(() => session.start()).toThrow(
      'A session requires at least 4 attending players'
    )

    session.updateAttendingPlayers(players)
    players[3].changeStatus(PlayerStatus.WAITING)
    expect(() => session.start()).toThrow(
      'Attending players must be available when the session starts'
    )
  })

  it('starts once and makes attendee membership immutable', () => {
    const session = new Session('location-1', 1)
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder().withName(`player-${index + 1}`).build()
    )
    const startTime = new Date('2026-08-16T10:00:00.000Z')

    session.updateAttendingPlayers(players)
    session.start(startTime)

    expect(session.status).toBe(SessionStatus.STARTED)
    expect(session.startTime).toEqual(startTime)
    expect(() => session.updateAttendingPlayers(players.slice(0, 3)))
      .toThrow('Attending players can only be changed while the session is created')
    expect(() => session.start(startTime))
      .toThrow('Only a created session can be started')
  })
})
