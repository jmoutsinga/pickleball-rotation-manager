import { Game } from '@/models/Game'
import { Rotation } from '@/models/Rotation'
import { RotationStatus } from '@/models/RotationStatus'

export interface UpdateGameScoreCommand {
  rotation: Rotation
  gameId: string
  scoreTeamA: number
  scoreTeamB: number
}

export interface DesignateGameWinnerCommand {
  rotation: Rotation
  gameId: string
  winnerTeamId: string
}

export class GameScoreService {
  updateScore(command: UpdateGameScoreCommand): Game {
    const game = this.getScoringGame(command.rotation, command.gameId)
    game.recordScore(command.scoreTeamA, command.scoreTeamB)
    return game
  }

  designateWinner(command: DesignateGameWinnerCommand): Game {
    const game = this.getScoringGame(command.rotation, command.gameId)
    game.designateWinner(command.winnerTeamId)
    return game
  }

  private getScoringGame(rotation: Rotation, gameId: string): Game {
    if (rotation.status !== RotationStatus.SCORING) {
      throw new Error(
        'Game scores can only be changed while Rotation is SCORING'
      )
    }

    const game = rotation.games.find(candidate => candidate.id === gameId)
    if (!game) {
      throw new Error(
        `Game "${gameId}" does not belong to Rotation "${rotation.id}"`
      )
    }

    return game
  }
}

export default new GameScoreService()
