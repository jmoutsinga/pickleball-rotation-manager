// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { LocationBuilder, LocationStatus } from '@/models'
import { LocationRepository } from './LocationRepository'

function location(id, name, status = LocationStatus.ACTIVE) {
  return new LocationBuilder()
    .withId(id)
    .withName(name)
    .withDescription(`${name} description`)
    .withNbCourts(2)
    .withStatus(status)
    .build()
}

describe('LocationRepository', () => {
  const repository = new LocationRepository()

  beforeEach(() => {
    localStorage.clear()
  })

  it('rehydrates Locations and persists a new Location', () => {
    repository.saveAll([location('location-1', 'Geneva')])

    repository.add(location('location-2', 'Lancy'))

    expect(repository.getAll().map(candidate => candidate.name))
      .toEqual(['Geneva', 'Lancy'])
  })

  it('updates one Location and rejects an unknown identifier', () => {
    repository.add(location('location-1', 'Geneva'))
    const updated = new LocationBuilder()
      .withId('location-1')
      .withName('Geneva updated')
      .withDescription('updated')
      .withNbCourts(4)
      .build()

    repository.update(updated)

    expect(repository.getAll()[0].toJSON()).toEqual(updated.toJSON())
    expect(() => repository.update(location('unknown-location', 'Unknown')))
      .toThrow('Location "unknown-location" does not exist')
  })

  it('logically deletes a Location while preserving it in history', () => {
    repository.saveAll([
      location('location-1', 'Geneva'),
      location('location-2', 'Lancy')
    ])

    repository.delete('location-1')

    expect(repository.getActive().map(candidate => candidate.id))
      .toEqual(['location-2'])
    expect(repository.getAll().map(candidate => candidate.status))
      .toEqual([LocationStatus.DELETED, LocationStatus.ACTIVE])
  })
})
