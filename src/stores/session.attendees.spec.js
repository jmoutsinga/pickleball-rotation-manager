// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import {
  Court,
  Game,
  LocationBuilder,
  PlayerBuilder,
  PlayerStatus,
  Rotation,
  Session,
  SessionStatus,
  Team
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

  function persistLocation(nbCourts = 2) {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('Central Club')
      .withNbCourts(nbCourts)
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
    expect(store.rotation.games).toHaveLength(1)
    expect(store.teams).toHaveLength(2)
    expect(store.getCourts.map(court => ({
      number: court.number,
      isUsable: court.isUsable
    }))).toEqual([
      { number: 1, isUsable: true },
      { number: 2, isUsable: false }
    ])

    store.movePlayer({
      playerId: selectedPlayers[0].id,
      targetTeamId: 'unused-court-team'
    })
    expect(store.rotation.waitingPlayers.map(player => player.id))
      .toEqual(selectedPlayers.map(player => player.id))

    disposePinia(pinia)
    pinia = createPinia()
    setActivePinia(pinia)
    const restoredStore = useSessionStore()
    await restoredStore.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })

    expect(restoredStore.courts).toHaveLength(location.nbCourts)
    expect(restoredStore.rotation.games).toHaveLength(1)
    expect(restoredStore.getCourts.map(court => court.isUsable))
      .toEqual([true, false])
  })

  it('migrates a stored Session created before the usable-Court rule', async () => {
    const location = persistLocation(2)
    const players = persistAvailablePlayers(4)
    const session = new Session(
      location.id,
      1,
      new Date('2026-08-20T08:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map(),
      'legacy-session',
      players
    )
    const courts = [
      new Court(location.id, 1, 'court-1'),
      new Court(location.id, 2, 'court-2')
    ]
    const teams = [
      new Team(players[0], null, 'team-1-a'),
      new Team(players[1], null, 'team-1-b'),
      new Team(players[2], null, 'team-2-a'),
      new Team(players[3], null, 'team-2-b')
    ]
    const games = courts.map((court, index) => new Game({
      number: index + 1,
      courtId: court.id,
      teamAId: teams[index * 2].id,
      teamBId: teams[index * 2 + 1].id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    }, `game-${index + 1}`))
    const rotation = new Rotation(
      session.id,
      1,
      games,
      [],
      'legacy-rotation'
    )
    storageService.saveSessions([session])
    storageService.saveCourts(courts)
    storageService.saveTeams(teams)
    storageService.saveRotations([rotation])
    const store = useSessionStore()

    await store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })

    expect(store.rotation.games.map(game => game.courtId))
      .toEqual(['court-1'])
    expect(store.rotation.waitingPlayers.map(player => player.id))
      .toEqual(['player-3', 'player-4'])
    expect(store.getCourts.map(court => court.isUsable))
      .toEqual([true, false])
    expect(storageService.getRotations()[0].games).toHaveLength(1)
    expect(storageService.getTeams().map(team => team.id))
      .toEqual(['team-1-a', 'team-1-b'])
  })

  it.each([
    [7, 1],
    [8, 2],
    [11, 2],
    [12, 3]
  ])(
    'creates %i-player rotations on the first %i usable Court(s)',
    async (playerCount, expectedCourtCount) => {
      const location = persistLocation(4)
      const players = persistAvailablePlayers(playerCount)
      const store = useSessionStore()
      const session = store.createSessionForLocation(location.id)

      await store.ensureSession({
        locationId: location.id,
        sessionId: session.id
      })
      store.updateAttendingPlayers(players.map(player => player.id))
      store.startSession()

      const gameCourtNumbers = store.rotation.games.map(game =>
        store.courts.find(court => court.id === game.courtId).number
      )
      expect(gameCourtNumbers).toEqual(
        Array.from({ length: expectedCourtCount }, (_, index) => index + 1)
      )
      expect(store.teams).toHaveLength(expectedCourtCount * 2)
      expect(store.getCourts.filter(court => court.isUsable))
        .toHaveLength(expectedCourtCount)
      expect(store.getCourts.filter(court => !court.isUsable))
        .toHaveLength(location.nbCourts - expectedCourtCount)
    }
  )

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
