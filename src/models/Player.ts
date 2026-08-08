import { PlayerStatus } from './PlayerStatus'

const PLAYER_CONSTRUCTION_TOKEN = Symbol('PlayerConstructionToken')
const PLAYER_NAME_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u

export interface PlayerJson {
  id: string
  name: string
  status: PlayerStatus
}

export class Player {
  readonly id: string
  readonly name: string
  private _status: PlayerStatus

  constructor(token: symbol, id: string, name: string, status: PlayerStatus) {
    if (token !== PLAYER_CONSTRUCTION_TOKEN) {
      throw new Error('A Player must be created with PlayerBuilder')
    }
    this.id = id
    this.name = name
    this._status = status
  }

  get status(): PlayerStatus {
    return this._status
  }

  changeStatus(status: PlayerStatus): void {
    this._status = status
  }

  toJSON(): PlayerJson {
    return { id: this.id, name: this.name, status: this.status }
  }
}

export class PlayerBuilder {
  private id?: string
  private name?: string
  private status: PlayerStatus = PlayerStatus.AVAILABLE

  withId(id: string): PlayerBuilder {
    this.id = id
    return this
  }

  withName(name: string): PlayerBuilder {
    this.name = name
    return this
  }

  withStatus(status: PlayerStatus): PlayerBuilder {
    this.status = status
    return this
  }

  build(): Player {
    const normalizedName = PlayerBuilder.normalizeName(this.name ?? '')
    if (!PLAYER_NAME_PATTERN.test(normalizedName)) {
      throw new Error('Player name must contain words separated by hyphens only')
    }
    return new Player(
      PLAYER_CONSTRUCTION_TOKEN,
      this.id ?? crypto.randomUUID(),
      normalizedName,
      this.status
    )
  }

  static fromJson(json: PlayerJson): Player {
    return new PlayerBuilder()
      .withId(json.id)
      .withName(json.name)
      .withStatus(json.status)
      .build()
  }

  private static normalizeName(name: string): string {
    return name.trim().toLowerCase()
  }
}
