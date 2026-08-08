import { Player, PlayerBuilder, PlayerJson } from './Player'

export interface TeamJson {
  id: string
  player1: PlayerJson
  player2: PlayerJson
  key: string
}

export class Team {
  readonly id: string
  readonly player1: Player
  readonly player2: Player
  readonly key: string

  constructor(player1: Player, player2: Player, id: string = crypto.randomUUID()) {
    if (player1.id === player2.id) throw new Error('A team requires two different players')
    this.id = id
    this.player1 = player1
    this.player2 = player2
    this.key = [player1.name, player2.name].sort((a, b) => a.localeCompare(b)).join('-')
  }

  static fromJson(json: TeamJson): Team {
    return new Team(
      PlayerBuilder.fromJson(json.player1),
      PlayerBuilder.fromJson(json.player2),
      json.id
    )
  }

  toJSON(): TeamJson {
    return {
      id: this.id,
      player1: this.player1.toJSON(),
      player2: this.player2.toJSON(),
      key: this.key
    }
  }
}
