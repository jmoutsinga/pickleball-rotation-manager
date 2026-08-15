import { describe, expect, it } from 'vitest'
import { Game } from './Game'
import { PlayerBuilder } from './Player'
import { Rotation } from './Rotation'

describe('Rotation', () => {
  it('restores games and waiting players from JSON', () => {
    const game = new Game({
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
    expect(restoredRotation.toJSON()).toEqual(rotation.toJSON())
  })

  it('requires a session and a positive order', () => {
    expect(() => new Rotation('', 1, [], []))
      .toThrow('Rotation sessionId is required')
    expect(() => new Rotation('session-1', 0, [], []))
      .toThrow('Rotation order must be a positive integer')
  })
})
