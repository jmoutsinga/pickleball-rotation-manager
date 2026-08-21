import { describe, expect, it } from 'vitest'
import { Game } from './Game'

function gameJson(number?: number) {
  return {
    id: 'game-1',
    courtId: 'court-1',
    teamAId: 'team-a',
    teamBId: 'team-b',
    scoreTeamA: null,
    scoreTeamB: null,
    winnerTeam: null,
    loserTeam: null,
    ...(number === undefined ? {} : { number })
  }
}

describe('Game', () => {
  it('serializes and restores its immutable Session number', () => {
    const game = Game.fromJson(gameJson(7))

    expect(game.number).toBe(7)
    expect(game.toJSON().number).toBe(7)
  })

  it('uses the supplied migration number for legacy JSON', () => {
    const game = Game.fromJson(gameJson(), 4)

    expect(game.number).toBe(4)
    expect(game.toJSON().number).toBe(4)
  })

  it.each([0, -1, 1.5])('rejects invalid Game number %s', number => {
    expect(() => Game.fromJson(gameJson(number)))
      .toThrow('Game number must be a positive integer')
  })

  it('records both scores and derives the winner and loser', () => {
    const game = Game.fromJson(gameJson(1))

    game.recordScore(11, 7)

    expect(game.scoreTeamA).toBe(11)
    expect(game.scoreTeamB).toBe(7)
    expect(game.winnerTeam).toBe('team-a')
    expect(game.loserTeam).toBe('team-b')
    expect(game.isResolved).toBe(true)
  })

  it('keeps a tied score unresolved until its winner is designated', () => {
    const game = Game.fromJson(gameJson(1))

    game.recordScore(10, 10)

    expect(game.winnerTeam).toBeNull()
    expect(game.loserTeam).toBeNull()
    expect(game.isResolved).toBe(false)

    game.designateWinner('team-b')

    expect(game.winnerTeam).toBe('team-b')
    expect(game.loserTeam).toBe('team-a')
    expect(game.isResolved).toBe(true)
  })

  it('recomputes an automatic result when a tied score changes', () => {
    const game = Game.fromJson(gameJson(1))
    game.recordScore(8, 8)
    game.designateWinner('team-a')

    game.recordScore(8, 9)

    expect(game.winnerTeam).toBe('team-b')
    expect(game.loserTeam).toBe('team-a')
  })

  it('clears a manual winner when the same tied score is submitted again', () => {
    const game = Game.fromJson(gameJson(1))
    game.recordScore(8, 8)
    game.designateWinner('team-a')

    game.recordScore(8, 8)

    expect(game.winnerTeam).toBeNull()
    expect(game.loserTeam).toBeNull()
    expect(game.isResolved).toBe(false)
  })

  it('clears a manual winner when a tied score changes to another tie', () => {
    const game = Game.fromJson(gameJson(1))
    game.recordScore(8, 8)
    game.designateWinner('team-a')

    game.recordScore(9, 9)

    expect(game.winnerTeam).toBeNull()
    expect(game.loserTeam).toBeNull()
    expect(game.isResolved).toBe(false)
  })

  it.each([
    [-1, 0],
    [0, -1],
    [101, 0],
    [0, 101],
    [1.5, 1],
    [1, 1.5]
  ])('rejects invalid scores %s - %s atomically', (scoreTeamA, scoreTeamB) => {
    const game = Game.fromJson(gameJson(1))

    expect(() => game.recordScore(scoreTeamA, scoreTeamB))
      .toThrow('Game scores must be integers between 0 and 100')
    expect(game.scoreTeamA).toBeNull()
    expect(game.scoreTeamB).toBeNull()
    expect(game.isResolved).toBe(false)
  })

  it('only accepts a participating Team as winner of a tied Game', () => {
    const game = Game.fromJson(gameJson(1))
    game.recordScore(12, 12)

    expect(() => game.designateWinner('team-c'))
      .toThrow('Winner must be one of the Game teams')
    expect(game.isResolved).toBe(false)
  })

  it('refuses a manual winner when the scores are missing or different', () => {
    const game = Game.fromJson(gameJson(1))

    expect(() => game.designateWinner('team-a'))
      .toThrow('A winner can only be designated for a tied Game')

    game.recordScore(11, 8)

    expect(() => game.designateWinner('team-b'))
      .toThrow('A winner can only be designated for a tied Game')
    expect(game.winnerTeam).toBe('team-a')
    expect(game.loserTeam).toBe('team-b')
  })
})
