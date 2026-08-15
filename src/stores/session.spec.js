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
import { useSessionStore } from './session'

describe('useSessionStore', () => {
  let pinia

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    disposePinia(pinia)
  })

  it('initializes and persists a minimal session graph', async () => {
    const store = useSessionStore()

    await store.ensureSession()

    expect(store.location.name).toBe('default')
    expect(store.session.locationId).toBe(store.location.id)
    expect(store.courts).toHaveLength(1)
    expect(store.teams).toHaveLength(2)
    expect(store.rotation.games).toHaveLength(1)
    expect(store.getCourts[0].teams.A.id).toBe(store.teams[0].id)
    expect(store.getCourts[0].teams.B.id).toBe(store.teams[1].id)
    expect(JSON.parse(localStorage.getItem('pickleball_sessions')))
      .toHaveLength(1)
  })

  it('loads sessions and finds the started sessions for one location', () => {
    const startedSession = new Session('location-1', 1)
    const finishedSession = new Session(
      'location-1',
      2,
      new Date(),
      new Date(),
      SessionStatus.FINISHED
    )
    const otherLocationSession = new Session('location-2', 1)
    const finishedOnlySession = new Session(
      'location-3',
      1,
      new Date(),
      new Date(),
      SessionStatus.FINISHED
    )

    localStorage.setItem('pickleball_sessions', JSON.stringify([
      startedSession,
      finishedSession,
      otherLocationSession,
      finishedOnlySession
    ]))

    const store = useSessionStore()

    store.loadSessions()

    expect(store.startedSessionsByLocationId('location-1'))
      .toEqual([startedSession])
    expect(store.startedSessionsByLocationId('unknown-location'))
      .toEqual([])
    expect(store.canEditCourtCountByLocationId('location-1')).toBe(false)
    expect(store.canEditCourtCountByLocationId('location-2')).toBe(false)
    expect(store.canEditCourtCountByLocationId('location-3')).toBe(true)
    expect(store.canEditCourtCountByLocationId('unknown-location')).toBe(true)
  })

  it('creates and persists the first started session for a location', () => {
    const store = useSessionStore()

    const createdSession = store.createSessionForLocation('location-1')

    expect(createdSession.locationId).toBe('location-1')
    expect(createdSession.order).toBe(1)
    expect(createdSession.status).toBe(SessionStatus.STARTED)
    expect(store.sessions.map(session => session.id))
      .toEqual([createdSession.id])
    expect(JSON.parse(localStorage.getItem('pickleball_sessions')))
      .toContainEqual(createdSession.toJSON())
  })

  it('increments the maximum session order for the selected location', () => {
    const storedSessions = [
      new Session(
        'location-1',
        1,
        new Date(),
        new Date(),
        SessionStatus.FINISHED
      ),
      new Session(
        'location-1',
        2,
        new Date(),
        new Date(),
        SessionStatus.FINISHED
      ),
      new Session(
        'location-1',
        3,
        new Date(),
        new Date(),
        SessionStatus.FINISHED
      ),
      new Session(
        'location-2',
        9,
        new Date(),
        new Date(),
        SessionStatus.FINISHED
      )
    ]
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify(storedSessions)
    )
    const store = useSessionStore()

    const createdSession = store.createSessionForLocation('location-1')

    expect(createdSession.order).toBe(4)
    expect(store.sessions
      .filter(session => session.locationId === 'location-1')
      .map(session => session.order)
    ).toEqual([1, 2, 3, 4])
  })

  it('uses the centralized order when ensureSession creates a session', async () => {
    const location = new LocationBuilder()
      .withId('location-default')
      .withName('default')
      .withNbCourts(1)
      .build()
    const finishedSessions = [
      new Session(
        location.id,
        1,
        new Date(),
        new Date(),
        SessionStatus.FINISHED
      ),
      new Session(
        location.id,
        2,
        new Date(),
        new Date(),
        SessionStatus.FINISHED
      )
    ]
    localStorage.setItem(
      'pickleball_locations',
      JSON.stringify([location])
    )
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify(finishedSessions)
    )
    const store = useSessionStore()

    await store.ensureSession()

    expect(store.session.order).toBe(3)
    expect(JSON.parse(localStorage.getItem('pickleball_sessions'))
      .filter(session => session.locationId === location.id)
      .map(session => session.order)
    ).toEqual([1, 2, 3])
  })

  it('loads the session graph identified by the route parameters', async () => {
    const defaultLocation = new LocationBuilder()
      .withId('location-default')
      .withName('default')
      .withNbCourts(1)
      .build()
    const selectedLocation = new LocationBuilder()
      .withId('location-selected')
      .withName('Central Club')
      .withNbCourts(2)
      .build()
    const defaultSession = new Session(defaultLocation.id, 1)
    const selectedSession = new Session(selectedLocation.id, 1)
    const defaultCourt = new Court(defaultLocation.id, 1)
    const defaultTeams = [new Team(), new Team()]
    const defaultGame = new Game({
      courtId: defaultCourt.id,
      teamAId: defaultTeams[0].id,
      teamBId: defaultTeams[1].id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    })
    const defaultRotation = new Rotation(
      defaultSession.id,
      1,
      [defaultGame],
      []
    )
    localStorage.setItem(
      'pickleball_locations',
      JSON.stringify([defaultLocation, selectedLocation])
    )
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([defaultSession, selectedSession])
    )
    localStorage.setItem(
      'pickleball_courts',
      JSON.stringify([defaultCourt])
    )
    localStorage.setItem(
      'pickleball_rotations',
      JSON.stringify([defaultRotation])
    )
    localStorage.setItem(
      'pickleball_games',
      JSON.stringify([defaultGame])
    )
    localStorage.setItem(
      'pickleball_teams',
      JSON.stringify(defaultTeams)
    )
    const store = useSessionStore()

    await store.ensureSession({
      locationId: selectedLocation.id,
      sessionId: selectedSession.id
    })

    expect(store.location.id).toBe(selectedLocation.id)
    expect(store.session.id).toBe(selectedSession.id)
    expect(store.courts).toHaveLength(selectedLocation.nbCourts)
    expect(store.courts.every(court =>
      court.locationId === selectedLocation.id
    )).toBe(true)
    expect(JSON.parse(localStorage.getItem('pickleball_locations'))
      .map(location => location.id)
    ).toEqual([defaultLocation.id, selectedLocation.id])
    expect(JSON.parse(localStorage.getItem('pickleball_sessions'))
      .map(session => session.id)
    ).toEqual([defaultSession.id, selectedSession.id])
    expect(JSON.parse(localStorage.getItem('pickleball_courts'))
      .map(court => court.id)
    ).toContain(defaultCourt.id)
    expect(JSON.parse(localStorage.getItem('pickleball_rotations'))
      .map(rotation => rotation.id)
    ).toContain(defaultRotation.id)
    expect(JSON.parse(localStorage.getItem('pickleball_games'))
      .map(game => game.id)
    ).toContain(defaultGame.id)
    expect(JSON.parse(localStorage.getItem('pickleball_teams'))
      .map(team => team.id)
    ).toEqual(expect.arrayContaining(defaultTeams.map(team => team.id)))
  })

  it('refuses a session that does not belong to the identified location', async () => {
    const firstLocation = new LocationBuilder()
      .withId('location-1')
      .withName('Central Club')
      .withNbCourts(2)
      .build()
    const secondLocation = new LocationBuilder()
      .withId('location-2')
      .withName('Westside Club')
      .withNbCourts(2)
      .build()
    const session = new Session(firstLocation.id, 1)
    localStorage.setItem(
      'pickleball_locations',
      JSON.stringify([firstLocation, secondLocation])
    )
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([session])
    )
    const store = useSessionStore()

    await expect(store.ensureSession({
      locationId: secondLocation.id,
      sessionId: session.id
    })).rejects.toThrow(
      `Session "${session.id}" does not belong to location "${secondLocation.id}"`
    )
  })

  it('refuses to create a second started session for one location', () => {
    const startedSession = new Session('location-1', 1)
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([startedSession])
    )
    const store = useSessionStore()

    expect(() => store.createSessionForLocation('location-1'))
      .toThrow('Location "location-1" already has a started session')
    expect(JSON.parse(localStorage.getItem('pickleball_sessions')))
      .toEqual([startedSession.toJSON()])
  })

  it('adds a player to reactive state, waiting players and storage', async () => {
    const store = useSessionStore()
    await store.ensureSession()
    const player = new PlayerBuilder()
      .withId('player-1')
      .withName('alice')
      .build()

    store.addPlayer(player)

    expect(store.players.map(candidate => candidate.id)).toContain('player-1')
    expect(store.getWaitingPlayers.map(candidate => candidate.id))
      .toContain('player-1')
    expect(JSON.parse(localStorage.getItem('pickleball_players')))
      .toContainEqual(player.toJSON())
  })

  it('moves a player between a team and the waiting list', async () => {
    const store = useSessionStore()
    await store.ensureSession()
    const player = new PlayerBuilder()
      .withId('player-1')
      .withName('alice')
      .build()
    store.addPlayer(player)
    const targetTeam = store.teams[0]

    store.movePlayer({
      playerId: player.id,
      targetTeamId: targetTeam.id
    })

    expect(targetTeam.players.map(candidate => candidate.id))
      .toContain(player.id)
    expect(store.getWaitingPlayers.map(candidate => candidate.id))
      .not.toContain(player.id)
    expect(player.status).toBe(PlayerStatus.ACTIVE)

    store.movePlayer({
      playerId: player.id,
      targetTeamId: null
    })

    expect(targetTeam.players.map(candidate => candidate.id))
      .not.toContain(player.id)
    expect(store.getWaitingPlayers.map(candidate => candidate.id))
      .toContain(player.id)
    expect(player.status).toBe(PlayerStatus.WAITING)
    expect(JSON.parse(localStorage.getItem('pickleball_players'))[0].status)
      .toBe(PlayerStatus.WAITING)
  })
})
