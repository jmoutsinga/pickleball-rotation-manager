import { Game, GameJson } from './Game'
import { Player, PlayerBuilder, PlayerJson } from './Player'
import { RotationStatus } from './RotationStatus'

export interface RotationJson {
  id: string
  sessionId: string
  order: number
  games: GameJson[]
  waitingPlayers: PlayerJson[]
  status?: RotationStatus
  startTime?: string | null
  endTime?: string | null
}

export class Rotation {
  readonly id: string
  readonly sessionId: string
  readonly order: number
  readonly games: Game[]
  waitingPlayers: Player[]
  private _status: RotationStatus
  private _startTime: Date | null
  private _endTime: Date | null

  constructor(
    sessionId: string,
    order: number,
    games: Game[],
    waitingPlayers: Player[],
    id: string = crypto.randomUUID(),
    status: RotationStatus = RotationStatus.CREATED,
    startTime: Date | null = null,
    endTime: Date | null = null
  ) {
    if (!sessionId) throw new Error('Rotation sessionId is required')
    if (!Number.isInteger(order) || order < 1) throw new Error('Rotation order must be a positive integer')
    Rotation.validateTime(startTime, 'startTime')
    Rotation.validateTime(endTime, 'endTime')
    Rotation.validateChronology(startTime, endTime)
    this.id = id
    this.sessionId = sessionId
    this.order = order
    this.games = games
    this.waitingPlayers = waitingPlayers
    this._status = status
    this._startTime = Rotation.copyTime(startTime)
    this._endTime = Rotation.copyTime(endTime)
  }

  get status(): RotationStatus {
    return this._status
  }

  get startTime(): Date | null {
    return Rotation.copyTime(this._startTime)
  }

  get endTime(): Date | null {
    return Rotation.copyTime(this._endTime)
  }

  start(at = new Date()): void {
    Rotation.validateTime(at, 'startTime')
    this.transitionFrom(RotationStatus.CREATED, RotationStatus.IN_PROGRESS)
    this._startTime = Rotation.copyTime(at)
  }

  startScoring(): void {
    this.transitionFrom(RotationStatus.IN_PROGRESS, RotationStatus.SCORING)
  }

  finish(at = new Date()): void {
    Rotation.validateTime(at, 'endTime')
    Rotation.validateChronology(this._startTime, at)
    this.assertTransitionFrom(RotationStatus.SCORING, RotationStatus.FINISHED)

    const unresolvedGameIds = this.games
      .filter(game => !game.isResolved)
      .map(game => game.id)
    if (unresolvedGameIds.length > 0) {
      throw new Error(
        `Cannot finish Rotation with unresolved Games: ${unresolvedGameIds.join(', ')}`
      )
    }

    this._status = RotationStatus.FINISHED
    this._endTime = Rotation.copyTime(at)
  }

  private transitionFrom(currentStatus: RotationStatus, nextStatus: RotationStatus): void {
    this.assertTransitionFrom(currentStatus, nextStatus)
    this._status = nextStatus
  }

  private assertTransitionFrom(currentStatus: RotationStatus, nextStatus: RotationStatus): void {
    if (this._status !== currentStatus) {
      throw new Error(`Cannot transition Rotation from ${this._status} to ${nextStatus}`)
    }
  }

  static fromJson(json: RotationJson): Rotation {
    return new Rotation(
      json.sessionId,
      json.order,
      json.games.map((game, index) => Game.fromJson(game, index + 1)),
      json.waitingPlayers.map(PlayerBuilder.fromJson),
      json.id,
      json.status ?? RotationStatus.CREATED,
      json.startTime ? new Date(json.startTime) : null,
      json.endTime ? new Date(json.endTime) : null
    )
  }

  toJSON(): RotationJson {
    return {
      id: this.id,
      sessionId: this.sessionId,
      order: this.order,
      games: this.games.map(game => game.toJSON()),
      waitingPlayers: this.waitingPlayers.map(player => player.toJSON()),
      status: this._status,
      startTime: this._startTime?.toISOString() ?? null,
      endTime: this._endTime?.toISOString() ?? null
    }
  }

  private static copyTime(time: Date | null): Date | null {
    return time ? new Date(time.getTime()) : null
  }

  private static validateTime(time: Date | null, fieldName: string): void {
    if (time && Number.isNaN(time.getTime())) {
      throw new Error(`Rotation ${fieldName} must be a valid date`)
    }
  }

  private static validateChronology(
    startTime: Date | null,
    endTime: Date | null
  ): void {
    if (startTime && endTime && endTime.getTime() < startTime.getTime()) {
      throw new Error('Rotation endTime cannot be before startTime')
    }
  }
}
