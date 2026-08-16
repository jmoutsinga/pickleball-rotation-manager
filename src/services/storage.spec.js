// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { PlayerBuilder, PlayerStatus, SessionStatus } from '@/models'
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
