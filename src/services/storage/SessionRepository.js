import { Session } from '@/models'
import localStorageGateway from './LocalStorageGateway'
import { STORAGE_KEYS } from './StorageKeys'

export class SessionRepository {
  constructor(gateway = localStorageGateway) {
    this.gateway = gateway
  }

  saveAll(sessions) {
    this.gateway.write(STORAGE_KEYS.SESSIONS, sessions)
  }

  getRaw() {
    return this.gateway.read(STORAGE_KEYS.SESSIONS, [])
  }

  hydrateOne(sessionJson) {
    return Session.fromJson(sessionJson)
  }

  hydrate(sessionJsons) {
    return sessionJsons.map(sessionJson => this.hydrateOne(sessionJson))
  }

  getAll() {
    return this.hydrate(this.getRaw())
  }
}

export default new SessionRepository()
