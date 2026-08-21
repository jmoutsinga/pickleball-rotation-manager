import type { Game, Team } from '@/models'

export interface RotationCourtPresentation {
  id: string
  number: number
  isUsable: boolean
  game: Game | null
  teams: {
    A: Team
    B: Team
  } | null
}

export interface ScoreGameCommand {
  gameId: string
  scoreTeamA: number
  scoreTeamB: number
}

export interface ScoreEditingCommand {
  gameId: string
  isEditing: boolean
}

export interface DesignateWinnerCommand {
  gameId: string
  winnerTeamId: string
}

export interface SwapPlayerCommand {
  playerId: string
  targetPlayerId: string
}
