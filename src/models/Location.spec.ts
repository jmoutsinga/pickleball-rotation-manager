import { describe, expect, it } from 'vitest'
import { Location, LocationBuilder } from './Location'
import { LocationStatus } from './LocationStatus'

describe('LocationBuilder', () => {
  it('builds a Location and trims its textual fields', () => {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('  Central Park  ')
      .withDescription('  Outdoor courts  ')
      .withNbCourts(4)
      .build()

    expect(location.toJSON()).toEqual({
      id: 'location-1',
      name: 'Central Park',
      description: 'Outdoor courts',
      nbCourts: 4,
      status: LocationStatus.ACTIVE
    })
  })

  it('accepts a blank description and normalizes spaces to an empty string', () => {
    const location = new LocationBuilder()
      .withName('Central Park')
      .withDescription('   ')
      .withNbCourts(4)
      .build()

    expect(location.description).toBe('')
  })

  it.each(['', '   '])('rejects the empty name %j', name => {
    expect(() => new LocationBuilder()
      .withName(name)
      .withNbCourts(4)
      .build()
    ).toThrow('Location name is required')
  })

  it.each([0, 51, 1.5, Number.NaN])(
    'rejects the invalid number of courts %j',
    nbCourts => {
      expect(() => new LocationBuilder()
        .withName('Central Park')
        .withNbCourts(nbCourts)
        .build()
      ).toThrow('Location nbCourts must be an integer between 1 and 50')
    }
  )

  it.each([1, 50])('accepts the boundary number of courts %i', nbCourts => {
    const location = new LocationBuilder()
      .withName('Central Park')
      .withNbCourts(nbCourts)
      .build()

    expect(location.nbCourts).toBe(nbCourts)
  })

  it('restores legacy JSON without a status as an active Location', () => {
    const location = LocationBuilder.fromJson({
      id: 'location-1',
      name: 'Central Park',
      description: 'Outdoor courts',
      nbCourts: 4
    })

    expect(location).toBeInstanceOf(Location)
    expect(location.id).toBe('location-1')
    expect(location.status).toBe(LocationStatus.ACTIVE)
  })

  it('changes status and restores a deleted Location from JSON', () => {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('Central Park')
      .withNbCourts(4)
      .build()

    location.changeStatus(LocationStatus.DELETED)

    const restoredLocation = LocationBuilder.fromJson(location.toJSON())

    expect(location.status).toBe(LocationStatus.DELETED)
    expect(restoredLocation.status).toBe(LocationStatus.DELETED)
  })

  it('prevents direct construction', () => {
    expect(() => new (Location as any)(
      Symbol('invalid-token'),
      'location-1',
      'Central Park',
      '',
      4
    )).toThrow('A Location must be created with LocationBuilder')
  })
})
