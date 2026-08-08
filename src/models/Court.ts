export interface CourtJson {
  id: string
  locationId: string
  number: number
}

export class Court {
  readonly id: string
  readonly locationId: string
  readonly number: number

  constructor(locationId: string, number: number, id: string = crypto.randomUUID()) {
    if (!locationId) throw new Error('Court locationId is required')
    if (!Number.isInteger(number) || number < 1) throw new Error('Court number must be a positive integer')
    this.id = id
    this.locationId = locationId
    this.number = number
  }

  static fromJson(json: CourtJson): Court {
    return new Court(json.locationId, json.number, json.id)
  }

  toJSON(): CourtJson {
    return { id: this.id, locationId: this.locationId, number: this.number }
  }
}
