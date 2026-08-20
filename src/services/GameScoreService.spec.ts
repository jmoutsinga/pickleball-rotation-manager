import { describe, expect, it } from 'vitest'
import { Game } from '@/models/Game'
import { Rotation } from '@/models/Rotation'
import { RotationStatus } from '@/models/RotationStatus'
import { GameScoreService } from './GameScoreService'

function createRotation(status = RotationStatus.SCORING): Rotation {
  const game = new Game({
    number: 1,
    courtId: 'court-1',
    teamAId: 'team-a',
    teamBId: 'team-b',
    scoreTeamA: null,
    scoreTeamB: null,
    winnerTeam: null,
    loserTeam: null
  }, 'game-1')

  return new Rotation(
    'session-1',
    1,
    [game],
    [],
    'rotation-1',
    status
  )
}

describe('GameScoreService', () => {
  const service = new GameScoreService()

  it('updates only the selected Game score during SCORING', () => {
    const rotation = createRotation()

    const game = service.updateScore({
      rotation,
      gameId: 'game-1',
      scoreTeamA: 11,
      scoreTeamB: 6
    })

    expect(game).toBe(rotation.games[0])
    expect(game.toJSON()).toMatchObject({
      scoreTeamA: 11,
      scoreTeamB: 6,
      winnerTeam: 'team-a',
      loserTeam: 'team-b'
    })
  })

  it('designates the winner of a tied Game during SCORING', () => {
    const rotation = createRotation()
    service.updateScore({
      rotation,
      gameId: 'game-1',
      scoreTeamA: 9,
      scoreTeamB: 9
    })

    const game = service.designateWinner({
      rotation,
      gameId: 'game-1',
      winnerTeamId: 'team-b'
    })

    expect(game.winnerTeam).toBe('team-b')
    expect(game.loserTeam).toBe('team-a')
  })

  it.each([
    RotationStatus.CREATED,
    RotationStatus.IN_PROGRESS,
    RotationStatus.FINISHED
  ])('refuses score commands while Rotation is %s', status => {
    const rotation = createRotation(status)

    expect(() => service.updateScore({
      rotation,
      gameId: 'game-1',
      scoreTeamA: 11,
      scoreTeamB: 6
    })).toThrow('Game scores can only be changed while Rotation is SCORING')

    expect(rotation.games[0].scoreTeamA).toBeNull()
    expect(rotation.games[0].scoreTeamB).toBeNull()
  })

  it('rejects an unknown Game without changing the Rotation', () => {
    const rotation = createRotation()

    expect(() => service.updateScore({
      rotation,
      gameId: 'unknown-game',
      scoreTeamA: 11,
      scoreTeamB: 6
    })).toThrow('Game "unknown-game" does not belong to Rotation "rotation-1"')

    expect(rotation.games[0].scoreTeamA).toBeNull()
  })
})
