// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import {
    Location,
    LocationBuilder,
    LocationStatus,
    Session,
    SessionStatus
} from '@/models'
import storageService from '@/services/storage'
import { useLocationStore } from './location'

describe('useLocationStore', () => {
    let pinia

    beforeEach(() => {
        localStorage.clear()
        pinia = createPinia()
        setActivePinia(pinia)
    })

    afterEach(() => {
        disposePinia(pinia)
    })

    it('loads persisted locations', () => {
        const location = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withDescription('Outdoor pickleball courts')
            .withNbCourts(4)
            .build()

        storageService.saveLocations([location])

        const store = useLocationStore()
        store.loadLocations()

        expect(store.locations).toHaveLength(1)
        expect(store.locations[0]).toBeInstanceOf(Location)
        expect(store.locations[0].toJSON()).toEqual(location.toJSON())
    })

    it('creates and persists a location', () => {
        const store = useLocationStore()

        const createdLocation = store.createLocation({
            name: 'Westside Club',
            description: 'Indoor courts',
            nbCourts: 3
        })

        expect(store.locations).toHaveLength(1)
        expect(store.locations[0]).toBeInstanceOf(Location)
        expect(store.locations[0]).toMatchObject({
            name: 'Westside Club',
            description: 'Indoor courts',
            nbCourts: 3
        })
        expect(createdLocation).toBeInstanceOf(Location)
        expect(createdLocation.toJSON()).toEqual(store.locations[0].toJSON())

        const persistedLocations = storageService.getLocations()

        expect(persistedLocations).toHaveLength(1)
        expect(persistedLocations[0].toJSON())
            .toEqual(store.locations[0].toJSON())
    })

    it('preserves persisted locations when the state was not loaded', () => {
        const existingLocation = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withDescription('Outdoor courts')
            .withNbCourts(4)
            .build()

        storageService.saveLocations([existingLocation])

        const store = useLocationStore()

        expect(store.locations).toHaveLength(0)

        store.createLocation({
            name: 'Westside Club',
            description: 'Indoor courts',
            nbCourts: 3
        })

        expect(store.locations).toHaveLength(2)
        expect(store.locations.map(location => location.id))
            .toContain('location-1')
        expect(storageService.getLocations()).toHaveLength(2)
    })

    it('updates and persists a location while preserving its id', () => {
        const locationToUpdate = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withDescription('Outdoor courts')
            .withNbCourts(4)
            .build()

        const untouchedLocation = new LocationBuilder()
            .withId('location-2')
            .withName('Westside Club')
            .withDescription('Indoor courts')
            .withNbCourts(3)
            .build()

        storageService.saveLocations([
            locationToUpdate,
            untouchedLocation
        ])

        const store = useLocationStore()
        store.loadLocations()

        store.updateLocation({
            id: 'location-1',
            name: 'Central Park Updated',
            description: 'Renovated outdoor courts',
            nbCourts: 6
        })

        expect(store.locations).toHaveLength(2)

        expect(store.locations.find(location => location.id === 'location-1'))
            .toMatchObject({
                id: 'location-1',
                name: 'Central Park Updated',
                description: 'Renovated outdoor courts',
                nbCourts: 6
            })

        expect(store.locations.find(location => location.id === 'location-2')
            ?.toJSON()
        ).toEqual(untouchedLocation.toJSON())

        expect(
            storageService.getLocations().map(location => location.toJSON())
        ).toEqual(
            store.locations.map(location => location.toJSON())
        )
    })

    it('rejects an update for an unknown location without changing data', () => {
        const existingLocation = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withDescription('Outdoor courts')
            .withNbCourts(4)
            .build()

        storageService.saveLocations([existingLocation])

        const store = useLocationStore()
        store.loadLocations()

        const stateBeforeUpdate = store.locations.map(
            location => location.toJSON()
        )

        const storageBeforeUpdate = storageService.getLocations().map(
            location => location.toJSON()
        )

        expect(() => store.updateLocation({
            id: 'unknown-location',
            name: 'Unknown Club',
            description: '',
            nbCourts: 2
        })).toThrow(
            'Location "unknown-location" does not exist'
        )

        expect(
            store.locations.map(location => location.toJSON())
        ).toEqual(stateBeforeUpdate)

        expect(
            storageService.getLocations().map(location => location.toJSON())
        ).toEqual(storageBeforeUpdate)
    })

    it('rejects a court-count change while any session is started', () => {
        const location = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withNbCourts(4)
            .build()
        const startedSession = new Session(location.id, 1)
        const laterFinishedSession = new Session(
            location.id,
            2,
            new Date(),
            new Date(),
            SessionStatus.FINISHED
        )

        storageService.saveLocations([location])
        storageService.saveSessions([
            startedSession,
            laterFinishedSession
        ])

        const store = useLocationStore()
        store.loadLocations()

        expect(() => store.updateLocation({
            id: location.id,
            name: 'Updated name',
            description: 'Updated description',
            nbCourts: 6
        })).toThrow(
            'Cannot change the number of courts while a session is started'
        )

        expect(storageService.getLocations()[0].toJSON())
            .toEqual(location.toJSON())
    })

    it('updates other fields with an unchanged court count while started', () => {
        const location = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withNbCourts(4)
            .build()

        storageService.saveLocations([location])
        storageService.saveSessions([new Session(location.id, 1)])

        const store = useLocationStore()
        store.loadLocations()

        store.updateLocation({
            id: location.id,
            name: 'Updated name',
            description: 'Updated description',
            nbCourts: 4
        })

        expect(storageService.getLocations()[0]).toMatchObject({
            name: 'Updated name',
            description: 'Updated description',
            nbCourts: 4
        })
    })

    it('allows a court-count change when all sessions are finished', () => {
        const location = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withNbCourts(4)
            .build()
        const finishedSession = new Session(
            location.id,
            1,
            new Date(),
            new Date(),
            SessionStatus.FINISHED
        )

        storageService.saveLocations([location])
        storageService.saveSessions([finishedSession])

        const store = useLocationStore()
        store.loadLocations()

        store.updateLocation({
            id: location.id,
            name: location.name,
            description: location.description,
            nbCourts: 6
        })

        expect(storageService.getLocations()[0].nbCourts).toBe(6)
    })

    it('logically deletes a location while preserving its history', () => {
        const locationToDelete = new LocationBuilder()
            .withId('location-1')
            .withName('Central Park')
            .withDescription('Outdoor courts')
            .withNbCourts(4)
            .build()

        const activeLocation = new LocationBuilder()
            .withId('location-2')
            .withName('Westside Club')
            .withDescription('Indoor courts')
            .withNbCourts(3)
            .build()

        storageService.saveLocations([
            locationToDelete,
            activeLocation
        ])

        const store = useLocationStore()
        store.loadLocations()

        store.deleteLocation('location-1')

        expect(store.locations.map(location => location.id))
            .toEqual(['location-2'])

        expect(
            storageService.getActiveLocations().map(location => location.id)
        ).toEqual(['location-2'])

        expect(
            storageService.getLocations().map(location => location.id)
        ).toEqual(['location-1', 'location-2'])

        expect(
            storageService.getLocations().map(location => location.status)
        ).toEqual([LocationStatus.DELETED, LocationStatus.ACTIVE])
    })
})
