// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import {
  LocationBuilder,
  PlayerBuilder,
  PlayerStatus,
  SessionStatus
} from '@/models'
import storageService from '@/services/storage'
import { useSessionStore } from './session'

describe('useSessionStore attendee preparation', () => {
  let pinia

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    disposePinia(pinia)
  })

  function persistLocation() {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('Central Club')
      .withNbCourts(2)
      .build()
    storageService.saveLocations([location])
    return location
  }

  function persistAvailablePlayers(count = 5) {
    const players = Array.from({ length: count }, (_, index) =>
      new PlayerBuilder()
        .withId(`player-${index + 1}`)
        .withName(`player-${index + 1}`)
        .build()
    )
    storageService.savePlayers(players)
    return players
  }

  it('creates one open session in CREATED status without a rotation', () => {
    const store = useSessionStore()

    const session = store.createSessionForLocation('location-1')

    expect(session.status).toBe(SessionStatus.CREATED)
    expect(session.startTime).toBeNull()
    expect(session.attendingPlayers).toEqual([])
    expect(store.openSessionsByLocationId('location-1')).toHaveLength(1)
    expect(storageService.getRotations()).toEqual([])
    expect(() => store.createSessionForLocation('location-1'))
      .toThrow('Location "location-1" already has an open session')
  })

  it('reuses the default CREATED session after a full store reload', async () => {
    const firstStore = useSessionStore()
    await firstStore.ensureSession()
    const locationId = firstStore.location.id
    const sessionId = firstStore.session.id

    disposePinia(pinia)
    pinia = createPinia()
    setActivePinia(pinia)
    const reloadedStore = useSessionStore()
    await reloadedStore.ensureSession()

    expect(reloadedStore.location.id).toBe(locationId)
    expect(reloadedStore.session.id).toBe(sessionId)
    expect(storageService.getSessions()).toHaveLength(1)
  })

  it('loads a CREATED session and its persisted selection without a graph', async () => {
    const location = persistLocation()
    const players = persistAvailablePlayers()
    const store = useSessionStore()
    const session = store.createSessionForLocation(location.id)
    session.updateAttendingPlayers(players.slice(0, 4))
    storageService.saveSession(session)

    await store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })

    expect(store.session.status).toBe(SessionStatus.CREATED)
    expect(store.session.attendingPlayers.map(player => player.id))
      .toEqual(players.slice(0, 4).map(player => player.id))
    expect(store.players.map(player => player.id))
      .toEqual(players.map(player => player.id))
    expect(store.rotation).toBeNull()
    expect(store.courts).toEqual([])
    expect(store.teams).toEqual([])
  })

  it('persists every attendee selection change while CREATED', async () => {
    const location = persistLocation()
    const players = persistAvailablePlayers()
    const store = useSessionStore()
    const session = store.createSessionForLocation(location.id)

    await store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })
    store.updateAttendingPlayers(players.slice(0, 4).map(player => player.id))
    store.updateAttendingPlayers(players.slice(1).map(player => player.id))

    const persistedSession = storageService.getSessions()
      .find(candidate => candidate.id === session.id)
    expect(persistedSession.attendingPlayers.map(player => player.id))
      .toEqual(players.slice(1).map(player => player.id))
  })

  it('starts with four persisted available attendees and creates the first graph', async () => {
    const location = persistLocation()
    const players = persistAvailablePlayers()
    const store = useSessionStore()
    const session = store.createSessionForLocation(location.id)
    const selectedPlayers = players.slice(0, 4)

    await store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })
    store.updateAttendingPlayers(selectedPlayers.map(player => player.id))
    const startTime = new Date('2026-08-16T10:00:00.000Z')
    store.startSession(startTime)

    expect(store.session.status).toBe(SessionStatus.STARTED)
    expect(store.session.startTime).toEqual(startTime)
    expect(store.rotation).not.toBeNull()
    expect(store.rotation.waitingPlayers.map(player => player.id))
      .toEqual(selectedPlayers.map(player => player.id))
    expect(store.players.map(player => player.id))
      .toEqual(selectedPlayers.map(player => player.id))
    expect(store.courts).toHaveLength(location.nbCourts)
    expect(store.teams).toHaveLength(location.nbCourts * 2)
  })

  it('refuses to start below four attendees or after an attendee stops being AVAILABLE', async () => {
    const location = persistLocation()
    const players = persistAvailablePlayers()
    const store = useSessionStore()
    const session = store.createSessionForLocation(location.id)

    await store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })
    store.updateAttendingPlayers(players.slice(0, 3).map(player => player.id))
    expect(() => store.startSession()).toThrow(
      'A session requires at least 4 attending players'
    )

    store.updateAttendingPlayers(players.slice(0, 4).map(player => player.id))
    players[3].changeStatus(PlayerStatus.WAITING)
    storageService.updatePlayer(players[3])

    expect(() => store.startSession()).toThrow(
      'Attending players must be available when the session starts'
    )
    expect(store.session.status).toBe(SessionStatus.CREATED)
    expect(store.rotation).toBeNull()
  })
})
