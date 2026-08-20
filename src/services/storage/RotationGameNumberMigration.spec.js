// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { RotationGameNumberMigration } from './RotationGameNumberMigration'

describe('RotationGameNumberMigration', () => {
  const migration = new RotationGameNumberMigration()

  beforeEach(() => {
    localStorage.clear()
  })

  it('assigns missing Game numbers in Rotation and Court order', () => {
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

    const rotations = migration.migrate()

    const firstRotationGames = rotations.find(
      rotation => rotation.order === 1
    ).games
    expect(firstRotationGames.find(game => game.id === 'game-1').number)
      .toBe(1)
    expect(firstRotationGames.find(game => game.id === 'game-2').number)
      .toBe(2)
    expect(rotations.find(rotation => rotation.order === 2)
      .games.map(game => game.number)).toEqual([3])
    expect(JSON.parse(localStorage.getItem('pickleball_rotations'))
      .find(rotation => rotation.order === 2)
      .games.map(game => game.number)).toEqual([3])
  })

  it('does not rewrite an already numbered collection', () => {
    const rotationJson = {
      id: 'rotation-1',
      sessionId: 'session-1',
      order: 1,
      games: [{
        id: 'game-1',
        number: 1,
        courtId: 'court-1',
        teamAId: 'team-a',
        teamBId: 'team-b',
        scoreTeamA: null,
        scoreTeamB: null,
        winnerTeam: null,
        loserTeam: null
      }],
      waitingPlayers: []
    }
    localStorage.setItem(
      'pickleball_rotations',
      JSON.stringify([rotationJson])
    )

    migration.migrate()

    expect(localStorage.getItem('pickleball_rotations'))
      .toBe(JSON.stringify([rotationJson]))
  })
})
