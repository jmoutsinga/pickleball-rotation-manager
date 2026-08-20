export interface GameJson {
  id: string
  number?: number
  courtId: string
  teamAId: string
  teamBId: string
  scoreTeamA: number | null
  scoreTeamB: number | null
  winnerTeam: string | null
  loserTeam: string | null
}

type GameInput = Omit<GameJson, 'id' | 'number'> & { number: number }

export class Game {
  readonly id: string
  readonly number: number
  readonly courtId: string
  readonly teamAId: string
  readonly teamBId: string
  private _scoreTeamA: number | null
  private _scoreTeamB: number | null
  private _winnerTeam: string | null
  private _loserTeam: string | null

  constructor(json: GameInput, id: string = crypto.randomUUID()) {
    if (!Number.isInteger(json.number) || json.number < 1) {
      throw new Error('Game number must be a positive integer')
    }
    this.id = id
    this.number = json.number
    this.courtId = json.courtId
    this.teamAId = json.teamAId
    this.teamBId = json.teamBId
    this._scoreTeamA = null
    this._scoreTeamB = null
    this._winnerTeam = null
    this._loserTeam = null
    this.restoreResult(json)
  }

  get scoreTeamA(): number | null {
    return this._scoreTeamA
  }

  get scoreTeamB(): number | null {
    return this._scoreTeamB
  }

  get winnerTeam(): string | null {
    return this._winnerTeam
  }

  get loserTeam(): string | null {
    return this._loserTeam
  }

  get isResolved(): boolean {
    return this._scoreTeamA !== null &&
      this._scoreTeamB !== null &&
      this.isGameTeam(this._winnerTeam) &&
      this.isGameTeam(this._loserTeam) &&
      this._winnerTeam !== this._loserTeam
  }

  recordScore(scoreTeamA: number, scoreTeamB: number): void {
    Game.validateScore(scoreTeamA)
    Game.validateScore(scoreTeamB)

    const keepsManualWinner =
      scoreTeamA === scoreTeamB &&
      scoreTeamA === this._scoreTeamA &&
      scoreTeamB === this._scoreTeamB &&
      this.isGameTeam(this._winnerTeam)

    this._scoreTeamA = scoreTeamA
    this._scoreTeamB = scoreTeamB

    if (scoreTeamA > scoreTeamB) {
      this.setResult(this.teamAId)
    } else if (scoreTeamB > scoreTeamA) {
      this.setResult(this.teamBId)
    } else if (!keepsManualWinner) {
      this.clearResult()
    }
  }

  designateWinner(winnerTeamId: string): void {
    if (
      this._scoreTeamA === null ||
      this._scoreTeamB === null ||
      this._scoreTeamA !== this._scoreTeamB
    ) {
      throw new Error('A winner can only be designated for a tied Game')
    }
    if (!this.isGameTeam(winnerTeamId)) {
      throw new Error('Winner must be one of the Game teams')
    }

    this.setResult(winnerTeamId)
  }

  static fromJson(json: GameJson, migrationNumber = 1): Game {
    return new Game({
      ...json,
      number: json.number ?? migrationNumber
    }, json.id)
  }

  toJSON(): GameJson {
    return {
      id: this.id,
      number: this.number,
      courtId: this.courtId,
      teamAId: this.teamAId,
      teamBId: this.teamBId,
      scoreTeamA: this._scoreTeamA,
      scoreTeamB: this._scoreTeamB,
      winnerTeam: this._winnerTeam,
      loserTeam: this._loserTeam
    }
  }

  private restoreResult(json: GameInput): void {
    if (json.scoreTeamA !== null) Game.validateScore(json.scoreTeamA)
    if (json.scoreTeamB !== null) Game.validateScore(json.scoreTeamB)

    this._scoreTeamA = json.scoreTeamA
    this._scoreTeamB = json.scoreTeamB

    if (json.scoreTeamA === null || json.scoreTeamB === null) return

    if (json.scoreTeamA > json.scoreTeamB) {
      this.setResult(this.teamAId)
    } else if (json.scoreTeamB > json.scoreTeamA) {
      this.setResult(this.teamBId)
    } else if (json.winnerTeam !== null) {
      if (!this.isGameTeam(json.winnerTeam)) {
        throw new Error('Winner must be one of the Game teams')
      }
      this.setResult(json.winnerTeam)
    }
  }

  private setResult(winnerTeamId: string): void {
    this._winnerTeam = winnerTeamId
    this._loserTeam = winnerTeamId === this.teamAId
      ? this.teamBId
      : this.teamAId
  }

  private clearResult(): void {
    this._winnerTeam = null
    this._loserTeam = null
  }

  private isGameTeam(teamId: string | null): teamId is string {
    return teamId === this.teamAId || teamId === this.teamBId
  }

  private static validateScore(score: number): void {
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error('Game scores must be integers between 0 and 100')
    }
  }
}
