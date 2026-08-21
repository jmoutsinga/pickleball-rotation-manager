import { Game } from '@/models/Game'
import { Team } from '@/models/Team'

export interface RotationPlan {
  games: Game[]
  teams: Team[]
}

export class RotationService {
  planNextRotation(currentGames: readonly Game[]): RotationPlan {
    if (currentGames.length === 0) {
      throw new Error('Current Rotation requires at least one Game')
    }

    const firstGameNumber = Math.max(
      ...currentGames.map(game => game.number)
    ) + 1
    const teams = currentGames.flatMap(() => [new Team(), new Team()])
    const games = currentGames.map((currentGame, index) => new Game({
      number: firstGameNumber + index,
      courtId: currentGame.courtId,
      teamAId: teams[index * 2].id,
      teamBId: teams[index * 2 + 1].id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    }))

    return { games, teams }
  }
}

export default new RotationService()
