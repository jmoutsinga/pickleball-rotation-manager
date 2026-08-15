import { LocationStatus } from './LocationStatus'

export interface LocationJson {
  id: string
  name: string
  description: string
  nbCourts: number
  status?: LocationStatus
}

const LOCATION_CONSTRUCTION_TOKEN = Symbol('LocationConstructionToken')

export class Location {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly nbCourts: number
  private _status: LocationStatus

  constructor(
    token: symbol,
    id: string,
    name: string,
    description: string,
    nbCourts: number,
    status: LocationStatus
  ) {
    if (token !== LOCATION_CONSTRUCTION_TOKEN) {
      throw new Error('A Location must be created with LocationBuilder')
    }

    this.id = id
    this.name = name
    this.description = description
    this.nbCourts = nbCourts
    this._status = status
  }

  get status(): LocationStatus {
    return this._status
  }

  changeStatus(status: LocationStatus): void {
    this._status = status
  }

  toJSON(): LocationJson {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      nbCourts: this.nbCourts,
      status: this.status
    }
  }
}

export class LocationBuilder {
  private id?: string
  private name?: string
  private description: string = ''
  private nbCourts?: number
  private status: LocationStatus = LocationStatus.ACTIVE

  withId(id: string): LocationBuilder {
    this.id = id
    return this
  }

  withName(name: string): LocationBuilder {
    this.name = name
    return this
  }

  withDescription(description: string): LocationBuilder {
    this.description = description
    return this
  }

  withNbCourts(nbCourts: number): LocationBuilder {
    this.nbCourts = nbCourts
    return this
  }

  withStatus(status: LocationStatus): LocationBuilder {
    this.status = status
    return this
  }

  build(): Location {
    const normalizedName = (this.name ?? '').trim()
    const normalizedDescription = this.description.trim()
    const nbCourts = this.nbCourts

    if (!normalizedName) {
      throw new Error('Location name is required')
    }

    if (
      typeof nbCourts !== 'number' ||
      !Number.isInteger(nbCourts) ||
      nbCourts < 1 ||
      nbCourts > 50
    ) {
      throw new Error('Location nbCourts must be an integer between 1 and 50')
    }

    return new Location(
      LOCATION_CONSTRUCTION_TOKEN,
      this.id ?? crypto.randomUUID(),
      normalizedName,
      normalizedDescription,
      nbCourts,
      this.status
    )
  }

  static fromJson(json: LocationJson): Location {
    return new LocationBuilder()
      .withId(json.id)
      .withName(json.name)
      .withDescription(json.description)
      .withNbCourts(json.nbCourts)
      .withStatus(json.status ?? LocationStatus.ACTIVE)
      .build()
  }
}
