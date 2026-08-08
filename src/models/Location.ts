export interface LocationJson {
  id: string
  name: string
  description: string
  nbCourts: number
}

export class Location {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly nbCourts: number

  constructor(name: string, description: string, nbCourts: number, id: string = crypto.randomUUID()) {
    if (!name.trim()) throw new Error('Location name is required')
    if (!Number.isInteger(nbCourts) || nbCourts < 1) {
      throw new Error('Location nbCourts must be a positive integer')
    }
    this.id = id
    this.name = name.trim()
    this.description = description.trim()
    this.nbCourts = nbCourts
  }

  static fromJson(json: LocationJson): Location {
    return new Location(json.name, json.description, json.nbCourts, json.id)
  }

  toJSON(): LocationJson {
    return { id: this.id, name: this.name, description: this.description, nbCourts: this.nbCourts }
  }
}
