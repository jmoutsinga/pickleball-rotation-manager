// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  Court,
  Game,
  LocationBuilder,
  PlayerBuilder,
  PlayerStatus,
  Rotation,
  Session,
  SessionStatus,
  Team
} from '@/models'
import storageService from './storage'

function playerJson(id, name, status = PlayerStatus.AVAILABLE) {
  return new PlayerBuilder()
    .withId(id)
    .withName(name)
    .withStatus(status)
    .build()
    .toJSON()
}

function legacySessionJson(id, status = SessionStatus.STARTED) {
  return {
    id,
    locationId: 'location-1',
    order: 1,
    startTime: '2026-08-15T10:00:00.000Z',
    endTime: null,
    status,
    playerWaitingTimes: {}
  }
}

describe('storageService session attendee migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('rebuilds legacy attendees from waiting players and referenced teams', () => {
    const alice = playerJson('player-1', 'alice')
    const bob = playerJson('player-2', 'bob')
    const chloe = playerJson('player-3', 'chloe')
    const unrelated = playerJson('player-4', 'david')

    localStorage.setItem('pickleball_players', JSON.stringify([
      alice,
      bob,
      chloe,
      unrelated
    ]))
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([legacySessionJson('session-1')])
    )
    localStorage.setItem('pickleball_rotations', JSON.stringify([{
      id: 'rotation-1',
      sessionId: 'session-1',
      order: 1,
      games: [{
        id: 'game-1',
        courtId: 'court-1',
        teamAId: 'team-1',
        teamBId: 'team-2',
        scoreTeamA: null,
        scoreTeamB: null,
        winnerTeam: null,
        loserTeam: null
      }],
      waitingPlayers: [alice]
    }]))
    localStorage.setItem('pickleball_teams', JSON.stringify([
      { id: 'team-1', player1: bob, player2: chloe, key: 'bob-chloe' },
      { id: 'team-2', player1: null, player2: null, key: '' }
    ]))

    const [session] = storageService.getSessions()

    expect(session.attendingPlayers.map(player => player.id))
      .toEqual(['player-1', 'player-2', 'player-3'])
    const [persistedSession] = JSON.parse(
      localStorage.getItem('pickleball_sessions')
    )
    expect(persistedSession.attendingPlayers.map(player => player.id))
      .toEqual(['player-1', 'player-2', 'player-3'])
  })

  it('uses every non-deleted player when a legacy session has no graph', () => {
    const alice = playerJson('player-1', 'alice')
    const bob = playerJson('player-2', 'bob', PlayerStatus.DELETED)
    const chloe = playerJson('player-3', 'chloe', PlayerStatus.PLAYING)

    localStorage.setItem(
      'pickleball_players',
      JSON.stringify([alice, bob, chloe])
    )
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([legacySessionJson('session-1')])
    )

    const [session] = storageService.getSessions()

    expect(session.attendingPlayers.map(player => player.id))
      .toEqual(['player-1', 'player-3'])
  })
})

describe('storageService Session graph persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('migrates legacy Game numbers in Rotation and Court order', () => {
    const legacyGame = (id, courtId) => ({
      id,
      courtId,
      teamAId: `${id}-team-a`,
      teamBId: `${id}-team-b`,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    })
    localStorage.setItem('pickleball_rotations', JSON.stringify([
      {
        id: 'rotation-2',
        sessionId: 'session-1',
        order: 2,
        games: [legacyGame('game-3', 'court-1')],
        waitingPlayers: []
      },
      {
        id: 'rotation-1',
        sessionId: 'session-1',
        order: 1,
        games: [
          legacyGame('game-2', 'court-2'),
          legacyGame('game-1', 'court-1')
        ],
        waitingPlayers: []
      }
    ]))
    localStorage.setItem('pickleball_courts', JSON.stringify([
      { id: 'court-1', locationId: 'location-1', number: 1 },
      { id: 'court-2', locationId: 'location-1', number: 2 }
    ]))

    const rotations = storageService.getRotations()

    const firstRotationGames = rotations.find(
      rotation => rotation.order === 1
    ).games
    expect(firstRotationGames.find(game => game.id === 'game-1').number)
      .toBe(1)
    expect(firstRotationGames.find(game => game.id === 'game-2').number)
      .toBe(2)
    expect(rotations.find(rotation => rotation.order === 2)
      .games.map(game => game.number)).toEqual([3])
    const persistedRotations = JSON.parse(
      localStorage.getItem('pickleball_rotations')
    )
    expect(persistedRotations.find(rotation => rotation.order === 2)
      .games.map(game => game.number)).toEqual([3])
  })

  it('persists Games only through Rotation and preserves historical Courts', () => {
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
    const activeCourt = new Court(location.id, 1, 'court-1')
    const historicalCourt = new Court(location.id, 2, 'court-2')
    const teams = [
      new Team(null, null, 'team-a'),
      new Team(null, null, 'team-b')
    ]
    const game = new Game({
      number: 1,
      courtId: activeCourt.id,
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
    const legacyGames = [{ id: 'legacy-game' }]
    localStorage.setItem(
      'pickleball_courts',
      JSON.stringify([historicalCourt])
    )
    localStorage.setItem(
      'pickleball_games',
      JSON.stringify(legacyGames)
    )

    storageService.saveSessionGraph({
      location,
      session,
      rotation,
      courts: [activeCourt],
      teams
    })

    expect(JSON.parse(localStorage.getItem('pickleball_games')))
      .toEqual(legacyGames)
    expect(storageService.getCourts().map(court => court.id).sort())
      .toEqual(['court-1', 'court-2'])
    expect(storageService.getRotations()[0].games[0].id).toBe('game-1')
  })
})
