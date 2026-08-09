import { Game, GameJson } from './Game'
import { Player, PlayerBuilder, PlayerJson } from './Player'

export interface RotationJson {
  id: string
  sessionId: string
  order: number
  games: GameJson[]
  waitingPlayers: PlayerJson[]
}

export class Rotation {
  readonly id: string
  readonly sessionId: string
  readonly order: number
  readonly games: Game[]
  waitingPlayers: Player[]

  constructor(sessionId: string, order: number, games: Game[], waitingPlayers: Player[], id: string = crypto.randomUUID()) {
    if (!sessionId) throw new Error('Rotation sessionId is required')
    if (!Number.isInteger(order) || order < 1) throw new Error('Rotation order must be a positive integer')
    this.id = id
    this.sessionId = sessionId
    this.order = order
    this.games = games
    this.waitingPlayers = waitingPlayers
  }

  static fromJson(json: RotationJson): Rotation {
    return new Rotation(
      json.sessionId,
      json.order,
      json.games.map(Game.fromJson),
      json.waitingPlayers.map(PlayerBuilder.fromJson),
      json.id
    )
  }

  toJSON(): RotationJson {
    return {
      id: this.id,
      sessionId: this.sessionId,
      order: this.order,
      games: this.games.map(game => game.toJSON()),
      waitingPlayers: this.waitingPlayers.map(player => player.toJSON())
    }
  }
}
