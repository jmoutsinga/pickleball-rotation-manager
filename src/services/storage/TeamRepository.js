import { Team } from '@/models'
import localStorageGateway from './LocalStorageGateway'
import { STORAGE_KEYS } from './StorageKeys'

export class TeamRepository {
  constructor(gateway = localStorageGateway) {
    this.gateway = gateway
  }

  saveAll(teams) {
    this.gateway.write(STORAGE_KEYS.TEAMS, teams)
  }

  getAll() {
    return this.gateway.read(STORAGE_KEYS.TEAMS, [])
      .map(Team.fromJson)
  }
}

export default new TeamRepository()
