export interface GameJson {
  id: string
  courtId: string
  teamAId: string
  teamBId: string
  scoreTeamA: number | null
  scoreTeamB: number | null
  winnerTeam: string | null
  loserTeam: string | null
}

export class Game {
  readonly id: string
  readonly courtId: string
  readonly teamAId: string
  readonly teamBId: string
  scoreTeamA: number | null
  scoreTeamB: number | null
  winnerTeam: string | null
  loserTeam: string | null

  constructor(json: Omit<GameJson, 'id'>, id: string = crypto.randomUUID()) {
    this.id = id
    this.courtId = json.courtId
    this.teamAId = json.teamAId
    this.teamBId = json.teamBId
    this.scoreTeamA = json.scoreTeamA
    this.scoreTeamB = json.scoreTeamB
    this.winnerTeam = json.winnerTeam
    this.loserTeam = json.loserTeam
  }

  static fromJson(json: GameJson): Game {
    return new Game(json, json.id)
  }

  toJSON(): GameJson {
    return {
      id: this.id,
      courtId: this.courtId,
      teamAId: this.teamAId,
      teamBId: this.teamBId,
      scoreTeamA: this.scoreTeamA,
      scoreTeamB: this.scoreTeamB,
      winnerTeam: this.winnerTeam,
      loserTeam: this.loserTeam
    }
  }
}
