import { SessionStatus } from './SessionStatus'

export interface SessionJson {
  id: string
  locationId: string
  order: number
  startTime: string
  endTime: string | null
  status: SessionStatus
  playerWaitingTimes: Record<string, number>
}

export class Session {
  readonly id: string
  readonly locationId: string
  readonly order: number
  readonly startTime: Date
  endTime: Date | null
  status: SessionStatus
  readonly playerWaitingTimes: Map<string, number>

  constructor(
    locationId: string,
    order: number,
    startTime = new Date(),
    endTime: Date | null = null,
    status = SessionStatus.STARTED,
    playerWaitingTimes = new Map<string, number>(),
    id: string = crypto.randomUUID()
  ) {
    if (!locationId) throw new Error('Session locationId is required')
    if (!Number.isInteger(order) || order < 1) throw new Error('Session order must be a positive integer')
    this.id = id
    this.locationId = locationId
    this.order = order
    this.startTime = startTime
    this.endTime = endTime
    this.status = status
    this.playerWaitingTimes = playerWaitingTimes
  }

  finish(at = new Date()): void {
    this.status = SessionStatus.FINISHED
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
      json.id
    )
  }

  toJSON(): SessionJson {
    return {
      id: this.id,
      locationId: this.locationId,
      order: this.order,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime?.toISOString() ?? null,
      status: this.status,
      playerWaitingTimes: Object.fromEntries(this.playerWaitingTimes)
    }
  }
}
