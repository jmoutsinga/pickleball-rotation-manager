import { describe, expect, it } from 'vitest'
import { Game } from './Game'
import { PlayerBuilder } from './Player'
import { Rotation } from './Rotation'
import { RotationStatus } from './RotationStatus'

describe('Rotation', () => {
  it('restores games and waiting players from JSON', () => {
    const game = new Game({
      number: 1,
      courtId: 'court-1',
      teamAId: 'team-a',
      teamBId: 'team-b',
      scoreTeamA: 11,
      scoreTeamB: 7,
      winnerTeam: 'team-a',
      loserTeam: 'team-b'
    }, 'game-1')
    const player = new PlayerBuilder()
      .withId('player-1')
      .withName('alice')
      .build()
    const rotation = new Rotation(
      'session-1',
      1,
      [game],
      [player],
      'rotation-1'
    )

    const restoredRotation = Rotation.fromJson(rotation.toJSON())

    expect(restoredRotation).toBeInstanceOf(Rotation)
    expect(restoredRotation.games[0]).toBeInstanceOf(Game)
    expect(restoredRotation.waitingPlayers[0].id).toBe('player-1')
    expect(restoredRotation.status).toBe(RotationStatus.CREATED)
    expect(restoredRotation.startTime).toBeNull()
    expect(restoredRotation.endTime).toBeNull()
    expect(restoredRotation.toJSON()).toEqual(rotation.toJSON())
  })

  it('restores a legacy rotation without status as CREATED', () => {
    const restoredRotation = Rotation.fromJson({
      id: 'rotation-1',
      sessionId: 'session-1',
      order: 1,
      games: [],
      waitingPlayers: []
    })

    expect(restoredRotation.status).toBe(RotationStatus.CREATED)
    expect(restoredRotation.startTime).toBeNull()
    expect(restoredRotation.endTime).toBeNull()
    expect(restoredRotation.toJSON().status).toBe(RotationStatus.CREATED)
    expect(restoredRotation.toJSON().startTime).toBeNull()
    expect(restoredRotation.toJSON().endTime).toBeNull()
  })

  it('records and serializes its lifecycle times', () => {
    const rotation = new Rotation('session-1', 1, [], [])
    const startTime = new Date('2026-08-20T08:00:00.000Z')
    const endTime = new Date('2026-08-20T08:15:00.000Z')

    rotation.start(startTime)
    expect(rotation.status).toBe(RotationStatus.IN_PROGRESS)
    expect(rotation.startTime).toEqual(startTime)
    expect(rotation.endTime).toBeNull()

    rotation.startScoring()
    expect(rotation.status).toBe(RotationStatus.SCORING)
    expect(rotation.startTime).toEqual(startTime)
    expect(rotation.endTime).toBeNull()

    rotation.finish(endTime)
    expect(rotation.status).toBe(RotationStatus.FINISHED)
    expect(rotation.endTime).toEqual(endTime)
    expect(rotation.toJSON()).toMatchObject({
      status: RotationStatus.FINISHED,
      startTime: '2026-08-20T08:00:00.000Z',
      endTime: '2026-08-20T08:15:00.000Z'
    })
  })

  it('restores lifecycle times from JSON', () => {
    const restoredRotation = Rotation.fromJson({
      id: 'rotation-1',
      sessionId: 'session-1',
      order: 1,
      games: [],
      waitingPlayers: [],
      status: RotationStatus.FINISHED,
      startTime: '2026-08-20T08:00:00.000Z',
      endTime: '2026-08-20T08:15:00.000Z'
    })

    expect(restoredRotation.startTime)
      .toEqual(new Date('2026-08-20T08:00:00.000Z'))
    expect(restoredRotation.endTime)
      .toEqual(new Date('2026-08-20T08:15:00.000Z'))
    expect(restoredRotation.toJSON()).toMatchObject({
      startTime: '2026-08-20T08:00:00.000Z',
      endTime: '2026-08-20T08:15:00.000Z'
    })
  })

  it('refuses to finish before its start time without changing state', () => {
    const rotation = new Rotation('session-1', 1, [], [])
    const startTime = new Date('2026-08-20T08:00:00.000Z')

    rotation.start(startTime)
    rotation.startScoring()

    expect(() => rotation.finish(new Date('2026-08-20T07:59:59.999Z')))
      .toThrow('Rotation endTime cannot be before startTime')
    expect(rotation.status).toBe(RotationStatus.SCORING)
    expect(rotation.startTime).toEqual(startTime)
    expect(rotation.endTime).toBeNull()
  })

  it('refuses to finish while a Game is unresolved without changing state', () => {
    const game = Game.fromJson({
      id: 'game-1',
      number: 1,
      courtId: 'court-1',
      teamAId: 'team-a',
      teamBId: 'team-b',
      scoreTeamA: 10,
      scoreTeamB: 10,
      winnerTeam: null,
      loserTeam: null
    })
    const rotation = new Rotation(
      'session-1',
      1,
      [game],
      [],
      'rotation-1',
      RotationStatus.SCORING,
      new Date('2026-08-20T08:00:00.000Z')
    )

    expect(() => rotation.finish(new Date('2026-08-20T08:15:00.000Z')))
      .toThrow('Cannot finish Rotation with unresolved Games: game-1')
    expect(rotation.status).toBe(RotationStatus.SCORING)
    expect(rotation.endTime).toBeNull()
  })

  it('finishes when automatic and manually designated results are resolved', () => {
    const automaticGame = Game.fromJson({
      id: 'game-1',
      number: 1,
      courtId: 'court-1',
      teamAId: 'team-a',
      teamBId: 'team-b',
      scoreTeamA: 11,
      scoreTeamB: 7,
      winnerTeam: null,
      loserTeam: null
    })
    const tiedGame = Game.fromJson({
      id: 'game-2',
      number: 2,
      courtId: 'court-2',
      teamAId: 'team-c',
      teamBId: 'team-d',
      scoreTeamA: 9,
      scoreTeamB: 9,
      winnerTeam: 'team-d',
      loserTeam: 'team-c'
    })
    const rotation = new Rotation(
      'session-1',
      1,
      [automaticGame, tiedGame],
      [],
      'rotation-1',
      RotationStatus.SCORING,
      new Date('2026-08-20T08:00:00.000Z')
    )

    rotation.finish(new Date('2026-08-20T08:15:00.000Z'))

    expect(rotation.status).toBe(RotationStatus.FINISHED)
    expect(rotation.endTime)
      .toEqual(new Date('2026-08-20T08:15:00.000Z'))
  })

  it.each([
    [RotationStatus.CREATED, 'startScoring', RotationStatus.SCORING],
    [RotationStatus.CREATED, 'finish', RotationStatus.FINISHED],
    [RotationStatus.IN_PROGRESS, 'start', RotationStatus.IN_PROGRESS],
    [RotationStatus.IN_PROGRESS, 'finish', RotationStatus.FINISHED],
    [RotationStatus.SCORING, 'start', RotationStatus.IN_PROGRESS],
    [RotationStatus.SCORING, 'startScoring', RotationStatus.SCORING],
    [RotationStatus.FINISHED, 'start', RotationStatus.IN_PROGRESS],
    [RotationStatus.FINISHED, 'startScoring', RotationStatus.SCORING],
    [RotationStatus.FINISHED, 'finish', RotationStatus.FINISHED]
  ] as const)(
    'refuses to transition from %s with %s',
    (currentStatus, command, targetStatus) => {
      const rotation = new Rotation(
        'session-1',
        1,
        [],
        [],
        'rotation-1',
        currentStatus
      )

      expect(() => rotation[command]()).toThrow(
        `Cannot transition Rotation from ${currentStatus} to ${targetStatus}`
      )
      expect(rotation.status).toBe(currentStatus)
      expect(rotation.startTime).toBeNull()
      expect(rotation.endTime).toBeNull()
    }
  )

  it('requires a session and a positive order', () => {
    expect(() => new Rotation('', 1, [], []))
      .toThrow('Rotation sessionId is required')
    expect(() => new Rotation('session-1', 0, [], []))
      .toThrow('Rotation order must be a positive integer')
  })
})
