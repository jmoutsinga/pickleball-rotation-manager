import { describe, expect, it } from 'vitest'
import { Game } from '@/models/Game'
import { RotationService } from './RotationService'

describe('RotationService', () => {
  it('creates an empty Game and two empty Teams for every current Court', () => {
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

    const plan = service.planNextRotation(currentGames)

    expect(plan.games).toHaveLength(1)
    expect(plan.games[0]).toMatchObject({
      number: 2,
      courtId: 'court-1',
      scoreTeamA: null,
      scoreTeamB: null
    })
    expect(plan.teams).toHaveLength(2)
    expect(plan.teams.every(team => team.players.length === 0)).toBe(true)
    expect(plan.games[0].teamAId).toBe(plan.teams[0].id)
    expect(plan.games[0].teamBId).toBe(plan.teams[1].id)
    expect(currentGames).toHaveLength(1)
  })
})
