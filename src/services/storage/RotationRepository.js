import { Rotation } from '@/models'
import localStorageGateway from './LocalStorageGateway'
import { STORAGE_KEYS } from './StorageKeys'

export class RotationRepository {
  constructor(gateway = localStorageGateway) {
    this.gateway = gateway
  }

  saveAll(rotations) {
    this.gateway.write(STORAGE_KEYS.ROTATIONS, rotations)
  }

  getRaw() {
    return this.gateway.read(STORAGE_KEYS.ROTATIONS, [])
  }

  hydrate(rotationJsons) {
    return rotationJsons.map(Rotation.fromJson)
  }

  getAll() {
    return this.hydrate(this.getRaw())
  }
}

export default new RotationRepository()
