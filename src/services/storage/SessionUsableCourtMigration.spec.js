// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  Court,
  Game,
  LocationBuilder,
  PlayerBuilder,
  Rotation,
  Session,
  SessionStatus,
  Team
} from '@/models'
import courtRepository from './CourtRepository'
import rotationRepository from './RotationRepository'
import { SessionUsableCourtMigration } from './SessionUsableCourtMigration'
import teamRepository from './TeamRepository'

function createLegacyGraph({ attendeeCount = 4, courtCount = 2 } = {}) {
  const location = new LocationBuilder()
    .withId('location-1')
    .withName('Central Club')
    .withNbCourts(courtCount)
    .build()
  const attendees = Array.from({ length: attendeeCount }, (_, index) =>
    new PlayerBuilder()
      .withId(`player-${index + 1}`)
      .withName(`player-${index + 1}`)
      .build()
  )
  const session = new Session(
    location.id,
    1,
    new Date('2026-08-20T08:00:00.000Z'),
    null,
    SessionStatus.STARTED,
    new Map(),
    'session-1',
    attendees
  )
  const courts = Array.from({ length: courtCount }, (_, index) =>
    new Court(location.id, index + 1, `court-${index + 1}`)
  )
  const teams = courts.flatMap((court, index) => [
    new Team(attendees[index * 2] ?? null, null, `team-${court.number}-a`),
    new Team(attendees[index * 2 + 1] ?? null, null, `team-${court.number}-b`)
  ])
  const games = courts.map((court, index) => new Game({
    number: index + 1,
    courtId: court.id,
    teamAId: teams[index * 2].id,
    teamBId: teams[index * 2 + 1].id,
    scoreTeamA: null,
    scoreTeamB: null,
    winnerTeam: null,
    loserTeam: null
  }, `game-${index + 1}`))
  const rotation = new Rotation(
    session.id,
    1,
    games,
    attendees.slice(courtCount * 2),
    'rotation-1'
  )

  courtRepository.saveAll(courts)
  rotationRepository.saveAll([rotation])
  teamRepository.saveAll(teams)

  return { location, session }
}

describe('SessionUsableCourtMigration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes excess Games and moves their Players off Court', () => {
    const { location, session } = createLegacyGraph()
    const [legacyRotation] = rotationRepository.getAll()
    legacyRotation.games[0].recordScore(11, 7)
    rotationRepository.saveAll([legacyRotation])
    const migration = new SessionUsableCourtMigration()

    const result = migration.migrate({ location, session })

    expect(result.migrated).toBe(true)
    expect(result.rotations[0].games).toHaveLength(1)
    expect(result.rotations[0].games[0]).toMatchObject({
      id: 'game-1',
      number: 1,
      courtId: 'court-1'
    })
    expect(result.rotations[0].games[0].scoreTeamA).toBe(11)
    expect(result.rotations[0].games[0].winnerTeam).toBe('team-1-a')
    expect(result.rotations[0].waitingPlayers.map(player => player.id))
      .toEqual(['player-3', 'player-4'])
    expect(result.teams.map(team => team.id))
      .toEqual(['team-1-a', 'team-1-b'])
    expect(rotationRepository.getAll()[0].games).toHaveLength(1)
  })

  it('renumbers retained Games across Rotations and is idempotent', () => {
    const { location, session } = createLegacyGraph()
    const teams = teamRepository.getAll()
    const secondRotationTeams = [
      new Team(session.attendingPlayers[0], null, 'rotation-2-team-1-a'),
      new Team(session.attendingPlayers[1], null, 'rotation-2-team-1-b'),
      new Team(session.attendingPlayers[2], null, 'rotation-2-team-2-a'),
      new Team(session.attendingPlayers[3], null, 'rotation-2-team-2-b')
    ]
    const secondRotation = new Rotation(
      session.id,
      2,
      [
        new Game({
          ...rotationRepository.getAll()[0].games[0].toJSON(),
          number: 3,
          teamAId: secondRotationTeams[0].id,
          teamBId: secondRotationTeams[1].id
        }, 'game-3'),
        new Game({
          ...rotationRepository.getAll()[0].games[1].toJSON(),
          number: 4,
          teamAId: secondRotationTeams[2].id,
          teamBId: secondRotationTeams[3].id
        }, 'game-4')
      ],
      [],
      'rotation-2'
    )
    rotationRepository.saveAll([
      rotationRepository.getAll()[0],
      secondRotation
    ])
    teamRepository.saveAll([...teams, ...secondRotationTeams])
    const migration = new SessionUsableCourtMigration()

    const firstResult = migration.migrate({ location, session })
    const persistedAfterFirstRun = JSON.stringify({
      rotations: rotationRepository.getRaw(),
      teams: teamRepository.getAll()
    })
    const secondResult = migration.migrate({ location, session })

    expect(firstResult.rotations.flatMap(rotation =>
      rotation.games.map(game => game.number)
    )).toEqual([1, 2])
    expect(secondResult.migrated).toBe(false)
    expect(JSON.stringify({
      rotations: rotationRepository.getRaw(),
      teams: teamRepository.getAll()
    })).toBe(persistedAfterFirstRun)
  })

  it('creates a missing usable Court Game before validation', () => {
    const { location, session } = createLegacyGraph({
      attendeeCount: 8,
      courtCount: 2
    })
    const [legacyRotation] = rotationRepository.getAll()
    rotationRepository.saveAll([
      new Rotation(
        session.id,
        legacyRotation.order,
        [legacyRotation.games[0]],
        [...session.attendingPlayers.slice(2)],
        legacyRotation.id
      )
    ])
    teamRepository.saveAll(teamRepository.getAll().slice(0, 2))
    const migration = new SessionUsableCourtMigration()

    const result = migration.migrate({ location, session })

    expect(result.rotations[0].games.map(game => game.courtId))
      .toEqual(['court-1', 'court-2'])
    expect(result.rotations[0].games.map(game => game.number))
      .toEqual([1, 2])
    expect(result.teams).toHaveLength(4)
  })

  it('preserves an empty next Rotation placeholder', () => {
    const { location, session } = createLegacyGraph()
    const firstRotation = rotationRepository.getAll()[0]
    const nextRotation = new Rotation(
      session.id,
      2,
      [],
      [...session.attendingPlayers],
      'rotation-2'
    )
    rotationRepository.saveAll([firstRotation, nextRotation])
    const migration = new SessionUsableCourtMigration()

    const result = migration.migrate({ location, session })
    const migratedNextRotation = result.rotations.find(
      rotation => rotation.id === nextRotation.id
    )

    expect(migratedNextRotation.games).toEqual([])
    expect(migratedNextRotation.waitingPlayers.map(player => player.id))
      .toEqual(session.attendingPlayers.map(player => player.id))
  })

  it('does not write a graph that remains invalid', () => {
    const { location, session } = createLegacyGraph()
    const [rotation] = rotationRepository.getAll()
    rotationRepository.saveAll([
      new Rotation(
        session.id,
        rotation.order,
        [Game.fromJson({
          ...rotation.games[0].toJSON(),
          teamAId: 'unknown-team'
        })],
        [...session.attendingPlayers],
        rotation.id
      )
    ])
    const rotationsBefore = localStorage.getItem('pickleball_rotations')
    const migration = new SessionUsableCourtMigration()

    expect(() => migration.migrate({ location, session }))
      .toThrow('Unable to migrate Session "session-1" graph')
    expect(localStorage.getItem('pickleball_rotations'))
      .toBe(rotationsBefore)
  })
})
