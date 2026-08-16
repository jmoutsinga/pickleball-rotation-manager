import { Player, PlayerBuilder, type PlayerJson } from './Player'
import { PlayerStatus } from './PlayerStatus'
import { SessionStatus } from './SessionStatus'

export interface SessionJson {
  id: string
  locationId: string
  order: number
  startTime: string | null
  endTime: string | null
  status?: SessionStatus
  playerWaitingTimes: Record<string, number>
  attendingPlayers?: PlayerJson[]
}

export class Session {
  readonly id: string
  readonly locationId: string
  readonly order: number
  startTime: Date | null
  endTime: Date | null
  readonly playerWaitingTimes: Map<string, number>
  private _status: SessionStatus
  private _attendingPlayers: Player[]

  constructor(
    locationId: string,
    order: number,
    startTime: Date | null = null,
    endTime: Date | null = null,
    status = SessionStatus.CREATED,
    playerWaitingTimes = new Map<string, number>(),
    id: string = crypto.randomUUID(),
    attendingPlayers: Player[] = []
  ) {
    if (!locationId) throw new Error('Session locationId is required')
    if (!Number.isInteger(order) || order < 1) throw new Error('Session order must be a positive integer')
    this.id = id
    this.locationId = locationId
    this.order = order
    this.startTime = startTime
    this.endTime = endTime
    this._status = status
    this.playerWaitingTimes = playerWaitingTimes
    this._attendingPlayers = Session.uniquePlayers(attendingPlayers)
  }

  get status(): SessionStatus {
    return this._status
  }

  get attendingPlayers(): readonly Player[] {
    return [...this._attendingPlayers]
  }

  updateAttendingPlayers(players: Player[]): void {
    if (this.status !== SessionStatus.CREATED) {
      throw new Error(
        'Attending players can only be changed while the session is created'
      )
    }

    if (players.some(player => player.status !== PlayerStatus.AVAILABLE)) {
      throw new Error('Only available players can attend a created session')
    }

    this._attendingPlayers = Session.uniquePlayers(players)
  }

  start(at = new Date()): void {
    if (this.status !== SessionStatus.CREATED) {
      throw new Error('Only a created session can be started')
    }

    if (this._attendingPlayers.length < 4) {
      throw new Error('A session requires at least 4 attending players')
    }

    if (this._attendingPlayers.some(
      player => player.status !== PlayerStatus.AVAILABLE
    )) {
      throw new Error(
        'Attending players must be available when the session starts'
      )
    }

    this.startTime = at
    this._status = SessionStatus.STARTED
  }

  finish(at = new Date()): void {
    if (this.status !== SessionStatus.STARTED) {
      throw new Error('Only a started session can be finished')
    }

    this._status = SessionStatus.FINISHED
    this.endTime = at
  }

  static fromJson(json: SessionJson): Session {
    return new Session(
      json.locationId,
      json.order,
      json.startTime ? new Date(json.startTime) : new Date(),
      json.endTime ? new Date(json.endTime) : null,
      json.status || SessionStatus.STARTED,
      new Map(Object.entries(json.playerWaitingTimes || {})),
      json.id,
      (json.attendingPlayers || []).map(PlayerBuilder.fromJson)
    )
  }

  toJSON(): SessionJson {
    return {
      id: this.id,
      locationId: this.locationId,
      order: this.order,
      startTime: this.startTime?.toISOString() ?? null,
      endTime: this.endTime?.toISOString() ?? null,
      status: this.status,
      playerWaitingTimes: Object.fromEntries(this.playerWaitingTimes),
      attendingPlayers: this._attendingPlayers.map(player => player.toJSON())
    }
  }

  private static uniquePlayers(players: Player[]): Player[] {
    const uniquePlayers = new Map(players.map(player => [player.id, player]))

    if (uniquePlayers.size !== players.length) {
      throw new Error('Attending players must be unique')
    }

    return [...players]
  }
}
