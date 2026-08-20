// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { Rotation } from '@/models'
import { RotationRepository } from './RotationRepository'

describe('RotationRepository', () => {
  const repository = new RotationRepository()

  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and rehydrates Rotations', () => {
    const rotation = new Rotation(
      'session-1',
      1,
      [],
      [],
      'rotation-1'
    )

    repository.saveAll([rotation])

    const [restoredRotation] = repository.getAll()
    expect(restoredRotation).toBeInstanceOf(Rotation)
    expect(restoredRotation.toJSON()).toEqual(rotation.toJSON())
  })

  it('exposes a detached raw collection for contextual migrations', () => {
    repository.saveAll([
      new Rotation('session-1', 1, [], [], 'rotation-1')
    ])

    const rawRotations = repository.getRaw()
    rawRotations[0].order = 99

    expect(repository.getRaw()[0].order).toBe(1)
  })
})
