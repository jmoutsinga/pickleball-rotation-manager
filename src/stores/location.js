import { defineStore } from 'pinia'
import storageService from '@/services/storage'
import { LocationBuilder, SessionStatus } from '@/models'

export const useLocationStore = defineStore('location', {
    state: () => ({
        locations: /** @type {import('@/models').Location[]} */ ([])
    }),

    actions: {
        loadLocations() {
            this.locations = storageService.getActiveLocations()
        },

        createLocation({ name, description, nbCourts }) {
            const location = new LocationBuilder()
                .withName(name)
                .withDescription(description)
                .withNbCourts(nbCourts)
                .build()

            storageService.saveLocation(location)
            this.loadLocations()

            return location
        },

        updateLocation({ id, name, description, nbCourts }) {
            const updatedLocation = new LocationBuilder()
                .withId(id)
                .withName(name)
                .withDescription(description)
                .withNbCourts(nbCourts)
                .build()

            const persistedLocation = storageService.getLocations().find(
                location => location.id === id
            )

            if (!persistedLocation) {
                throw new Error(`Location "${id}" does not exist`)
            }

            const courtCountChanged =
                persistedLocation.nbCourts !== updatedLocation.nbCourts
            const hasStartedSession = storageService.getSessions().some(
                session =>
                    session.locationId === id &&
                    session.status === SessionStatus.STARTED
            )

            if (courtCountChanged && hasStartedSession) {
                throw new Error(
                    'Cannot change the number of courts while a session is started'
                )
            }

            storageService.updateLocation(updatedLocation)
            this.loadLocations()
        },

        deleteLocation(locationId) {
            storageService.deleteLocation(locationId)
            this.loadLocations()
        }
    }
})
