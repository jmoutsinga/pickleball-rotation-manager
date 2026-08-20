import { Court } from '@/models'
import localStorageGateway from './LocalStorageGateway'
import { STORAGE_KEYS } from './StorageKeys'

export class CourtRepository {
  constructor(gateway = localStorageGateway) {
    this.gateway = gateway
  }

  saveAll(courts) {
    this.gateway.write(STORAGE_KEYS.COURTS, courts)
  }

  getAll() {
    return this.gateway.read(STORAGE_KEYS.COURTS, [])
      .map(Court.fromJson)
  }
}

export default new CourtRepository()
