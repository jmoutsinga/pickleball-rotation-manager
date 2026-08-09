import { Player, PlayerBuilder, PlayerJson } from './Player'

export interface TeamJson {
  id: string
  player1: PlayerJson | null
  player2: PlayerJson | null
  key: string
}

export class Team {
  readonly id: string
  player1: Player | null
  player2: Player | null

  constructor(player1: Player | null = null, player2: Player | null = null, id: string = crypto.randomUUID()) {
    if (player1 && player2 && player1.id === player2.id) {
      throw new Error('A team requires two different players')
    }
    this.id = id
    this.player1 = player1
    this.player2 = player2
  }

  get players(): Player[] {
    return [this.player1, this.player2].filter((player): player is Player => player !== null)
  }

  get key(): string {
    return this.players.map(player => player.name).sort((a, b) => a.localeCompare(b)).join('-')
  }

  addPlayer(player: Player): boolean {
    if (this.players.some(existing => existing.id === player.id)) return true
    if (!this.player1) this.player1 = player
    else if (!this.player2) this.player2 = player
    else return false
    return true
  }

  removePlayer(playerId: string): void {
    if (this.player1?.id === playerId) this.player1 = null
    if (this.player2?.id === playerId) this.player2 = null
  }

  static fromJson(json: TeamJson): Team {
    return new Team(
      json.player1 ? PlayerBuilder.fromJson(json.player1) : null,
      json.player2 ? PlayerBuilder.fromJson(json.player2) : null,
      json.id
    )
  }

  toJSON(): TeamJson {
    return {
      id: this.id,
      player1: this.player1?.toJSON() ?? null,
      player2: this.player2?.toJSON() ?? null,
      key: this.key
    }
  }
}
