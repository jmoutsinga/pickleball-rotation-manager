import { describe, expect, it } from 'vitest'
import { Game } from '@/models/Game'
import { RotationService } from './RotationService'

describe('RotationService', () => {
  it('accepts all current Games and returns an empty first plan', () => {
    const currentGames = [new Game({
      number: 1,
      courtId: 'court-1',
      teamAId: 'team-a',
      teamBId: 'team-b',
      scoreTeamA: 11,
      scoreTeamB: 7,
      winnerTeam: 'team-a',
      loserTeam: 'team-b'
    }, 'game-1')]
    const service = new RotationService()

    const nextGames = service.planNextRotation(currentGames)

    expect(nextGames).toEqual([])
    expect(currentGames).toHaveLength(1)
  })
})
