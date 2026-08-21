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
import { SessionGraphPersistenceService } from './SessionGraphPersistenceService'

function createGraph() {
  const location = new LocationBuilder()
    .withId('location-1')
    .withName('Central Club')
    .withNbCourts(1)
    .build()
  const attendees = Array.from({ length: 4 }, (_, index) =>
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
  const court = new Court(location.id, 1, 'court-1')
  const teams = [
    new Team(null, null, 'team-a'),
    new Team(null, null, 'team-b')
  ]
  const game = new Game({
    number: 1,
    courtId: court.id,
    teamAId: teams[0].id,
    teamBId: teams[1].id,
    scoreTeamA: null,
    scoreTeamB: null,
    winnerTeam: null,
    loserTeam: null
  }, 'game-1')
  const rotation = new Rotation(
    session.id,
    1,
    [game],
    attendees,
    'rotation-1'
  )

  return { location, session, rotation, courts: [court], teams }
}

describe('SessionGraphPersistenceService', () => {
  const service = new SessionGraphPersistenceService()

  beforeEach(() => {
    localStorage.clear()
  })

  it('persists Games only through Rotation and preserves historical entities', () => {
    const graph = createGraph()
    const historicalCourt = new Court('location-1', 2, 'court-2')
    const legacyGames = [{ id: 'legacy-game' }]
    localStorage.setItem(
      'pickleball_courts',
      JSON.stringify([historicalCourt])
    )
    localStorage.setItem(
      'pickleball_games',
      JSON.stringify(legacyGames)
    )

    service.save(graph)

    expect(JSON.parse(localStorage.getItem('pickleball_games')))
      .toEqual(legacyGames)
    expect(JSON.parse(localStorage.getItem('pickleball_courts'))
      .map(court => court.id).sort()).toEqual(['court-1', 'court-2'])
    expect(JSON.parse(localStorage.getItem('pickleball_rotations'))[0]
      .games[0].id).toBe('game-1')
  })

  it('validates the complete merge before writing any collection', () => {
    const graph = createGraph()
    localStorage.setItem('pickleball_rotations', JSON.stringify([{
      id: 'historical-rotation',
      sessionId: 'historical-session',
      order: 1,
      games: [{
        id: 'historical-game',
        courtId: 'historical-court',
        teamAId: 'historical-team-a',
        teamBId: 'historical-team-b',
        scoreTeamA: null,
        scoreTeamB: null,
        winnerTeam: null,
        loserTeam: null
      }],
      waitingPlayers: []
    }]))
    const invalidSession = new Session(
      'another-location',
      1,
      graph.session.startTime,
      null,
      SessionStatus.STARTED,
      new Map(),
      graph.session.id
    )
    const before = {
      locations: localStorage.getItem('pickleball_locations'),
      sessions: localStorage.getItem('pickleball_sessions'),
      rotations: localStorage.getItem('pickleball_rotations'),
      courts: localStorage.getItem('pickleball_courts'),
      teams: localStorage.getItem('pickleball_teams')
    }

    expect(() => service.save({ ...graph, session: invalidSession }))
      .toThrow('does not belong to Location')
    expect({
      locations: localStorage.getItem('pickleball_locations'),
      sessions: localStorage.getItem('pickleball_sessions'),
      rotations: localStorage.getItem('pickleball_rotations'),
      courts: localStorage.getItem('pickleball_courts'),
      teams: localStorage.getItem('pickleball_teams')
    }).toEqual(before)
  })

  it('discards a never-started Rotation and its orphan Teams', () => {
    const graph = createGraph()
    const firstRotation = graph.rotation
    firstRotation.start(new Date('2026-08-20T08:05:00.000Z'))
    firstRotation.startScoring()
    firstRotation.games[0].recordScore(11, 7)
    firstRotation.finish(new Date('2026-08-20T08:20:00.000Z'))
    service.save(graph)

    const nextTeams = [
      new Team(null, null, 'next-team-a'),
      new Team(null, null, 'next-team-b')
    ]
    const nextGame = new Game({
      number: 2,
      courtId: graph.courts[0].id,
      teamAId: nextTeams[0].id,
      teamBId: nextTeams[1].id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    }, 'game-2')
    const nextRotation = new Rotation(
      graph.session.id,
      2,
      [nextGame],
      [...graph.session.attendingPlayers],
      'rotation-2'
    )
    service.save({
      ...graph,
      rotation: nextRotation,
      teams: nextTeams
    })

    graph.session.finish(new Date('2026-08-20T08:25:00.000Z'))
    service.save({
      ...graph,
      rotation: nextRotation,
      teams: nextTeams,
      discardRotation: true
    })

    expect(JSON.parse(localStorage.getItem('pickleball_rotations'))
      .map(rotation => rotation.id)).toEqual([firstRotation.id])
    expect(JSON.parse(localStorage.getItem('pickleball_teams'))
      .map(team => team.id).sort()).toEqual(['team-a', 'team-b'])
  })
})
