import {
  Location,
  LocationBuilder,
  LocationStatus
} from '@/models'
import localStorageGateway from './LocalStorageGateway'
import { STORAGE_KEYS } from './StorageKeys'

export class LocationRepository {
  constructor(gateway = localStorageGateway) {
    this.gateway = gateway
  }

  saveAll(locations) {
    this.gateway.write(STORAGE_KEYS.LOCATIONS, locations)
  }

  getAll() {
    return this.gateway.read(STORAGE_KEYS.LOCATIONS, [])
      .map(LocationBuilder.fromJson)
  }

  getActive() {
    return this.getAll().filter(location =>
      location.status === LocationStatus.ACTIVE
    )
  }

  add(location) {
    this.assertLocation(location)
    const locations = this.getAll()
    locations.push(location)
    this.saveAll(locations)
  }

  update(updatedLocation) {
    this.assertLocation(updatedLocation)
    const locations = this.getAll()
    const index = locations.findIndex(location =>
      location.id === updatedLocation.id
    )

    if (index === -1) {
      throw new Error(`Location "${updatedLocation.id}" does not exist`)
    }

    locations[index] = updatedLocation
    this.saveAll(locations)
  }

  delete(locationId) {
    const locations = this.getAll()
    const location = locations.find(candidate => candidate.id === locationId)

    if (!location) {
      throw new Error(`Location "${locationId}" does not exist`)
    }

    location.changeStatus(LocationStatus.DELETED)
    this.saveAll(locations)
  }

  assertLocation(location) {
    if (!(location instanceof Location)) {
      throw new TypeError('Locations must be created with LocationBuilder')
    }
  }
}

export default new LocationRepository()
