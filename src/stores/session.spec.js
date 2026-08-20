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
  RotationStatus,
  Session,
  SessionStatus,
  Team
} from '@/models'
import storageService from '@/services/storage'
import { useSessionStore } from './session'

async function startPreparedSession(store, count = 4) {
  await store.ensureSession()
  const players = Array.from({ length: count }, (_, index) =>
    new PlayerBuilder()
      .withId(`player-${index + 1}`)
      .withName(`player-${index + 1}`)
      .build()
  )
  storageService.savePlayers(players)
  store.players = players
  store.updateAttendingPlayers(players.map(player => player.id))
  store.startSession(new Date('2026-08-16T10:00:00.000Z'))
  return players
}

function advanceRotationTo(store, status) {
  if (status === RotationStatus.CREATED) return
  startReadyRotation(store, new Date('2026-08-16T10:05:00.000Z'))
  if (status === RotationStatus.IN_PROGRESS) return
  store.startRotationScoring()
  if (status === RotationStatus.SCORING) return
  resolveRotationScores(store)
  store.finishRotation(new Date('2026-08-16T10:20:00.000Z'))
  if (status !== RotationStatus.FINISHED) {
    throw new Error(`Unsupported RotationStatus: ${status}`)
  }
}

function fillCurrentRotationTeams(store) {
  store.rotation.games.forEach(game => {
    [game.teamAId, game.teamBId].forEach(teamId => {
      const team = store.getTeamById(teamId)
      while (team.players.length < 2) {
        const [nextPlayer] = store.rotation.waitingPlayers
        if (!nextPlayer) {
          throw new Error('Not enough waiting Players to complete the Rotation')
        }
        store.movePlayer({ playerId: nextPlayer.id, targetTeamId: teamId })
      }
    })
  })
}

function startReadyRotation(store, at = new Date()) {
  fillCurrentRotationTeams(store)
  store.startRotation(at)
}

function resolveRotationScores(store) {
  store.rotation.games.forEach(game => {
    store.updateGameScore({
      gameId: game.id,
      scoreTeamA: 11,
      scoreTeamB: 7
    })
  })
}

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

  it('initializes and persists a minimal session preparation', async () => {
    const store = useSessionStore()

    await store.ensureSession()

    expect(store.location.name).toBe('default')
    expect(store.session.locationId).toBe(store.location.id)
    expect(store.session.status).toBe(SessionStatus.CREATED)
    expect(store.courts).toEqual([])
    expect(store.teams).toEqual([])
    expect(store.rotation).toBeNull()
    expect(JSON.parse(localStorage.getItem('pickleball_sessions')))
      .toHaveLength(1)
  })

  it('loads sessions and finds the started sessions for one location', () => {
    const startedSession = new Session(
      'location-1',
      1,
      new Date(),
      null,
      SessionStatus.STARTED
    )
    const finishedSession = new Session(
      'location-1',
      2,
      new Date(),
      new Date(),
      SessionStatus.FINISHED
    )
    const otherLocationSession = new Session(
      'location-2',
      1,
      new Date(),
      null,
      SessionStatus.STARTED
    )
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

  it('creates and persists the first created session for a location', () => {
    const store = useSessionStore()

    const createdSession = store.createSessionForLocation('location-1')

    expect(createdSession.locationId).toBe('location-1')
    expect(createdSession.order).toBe(1)
    expect(createdSession.status).toBe(SessionStatus.CREATED)
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
    const defaultSession = new Session(
      defaultLocation.id,
      1,
      new Date(),
      null,
      SessionStatus.STARTED
    )
    const selectedSession = new Session(
      selectedLocation.id,
      1,
      new Date(),
      null,
      SessionStatus.STARTED
    )
    const defaultCourt = new Court(defaultLocation.id, 1)
    const defaultTeams = [new Team(), new Team()]
    const defaultGame = new Game({
      number: 1,
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

  it('refuses an identified location that does not exist', async () => {
    const session = new Session('unknown-location', 1)
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([session])
    )
    const store = useSessionStore()

    await expect(store.ensureSession({
      locationId: 'unknown-location',
      sessionId: session.id
    })).rejects.toThrow(
      'Location "unknown-location" does not exist'
    )
  })

  it('refuses an identified session that does not exist', async () => {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('Central Club')
      .withNbCourts(2)
      .build()
    localStorage.setItem(
      'pickleball_locations',
      JSON.stringify([location])
    )
    const store = useSessionStore()

    await expect(store.ensureSession({
      locationId: location.id,
      sessionId: 'unknown-session'
    })).rejects.toThrow(
      'Session "unknown-session" does not exist'
    )
  })

  it('refuses to load an identified finished session', async () => {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('Central Club')
      .withNbCourts(2)
      .build()
    const session = new Session(
      location.id,
      1,
      new Date('2026-08-20T10:00:00.000Z'),
      new Date('2026-08-20T11:00:00.000Z'),
      SessionStatus.FINISHED,
      new Map(),
      'session-1'
    )
    localStorage.setItem(
      'pickleball_locations',
      JSON.stringify([location])
    )
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([session])
    )
    const store = useSessionStore()

    await expect(store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })).rejects.toThrow(
      `Session "${session.id}" is finished`
    )
  })

  it('refuses to create a second open session for one location', () => {
    const startedSession = new Session('location-1', 1)
    localStorage.setItem(
      'pickleball_sessions',
      JSON.stringify([startedSession])
    )
    const store = useSessionStore()

    expect(() => store.createSessionForLocation('location-1'))
      .toThrow('Location "location-1" already has an open session')
    expect(JSON.parse(localStorage.getItem('pickleball_sessions')))
      .toEqual([startedSession.toJSON()])
  })

  it('does not add a player outside the fixed attendee list', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)
    const player = new PlayerBuilder()
      .withId('outside-player')
      .withName('outsider')
      .build()

    store.addPlayer(player)

    expect(store.players.map(candidate => candidate.id))
      .not.toContain(player.id)
    expect(store.getWaitingPlayers.map(candidate => candidate.id))
      .not.toContain(player.id)
    expect(storageService.getPlayers().map(candidate => candidate.id))
      .not.toContain(player.id)
  })

  it('moves a player before start without changing its AVAILABLE status', async () => {
    const store = useSessionStore()
    const [player] = await startPreparedSession(store)
    const targetTeam = store.teams[0]

    store.movePlayer({
      playerId: player.id,
      targetTeamId: targetTeam.id
    })

    expect(targetTeam.players.map(candidate => candidate.id))
      .toContain(player.id)
    expect(store.getWaitingPlayers.map(candidate => candidate.id))
      .not.toContain(player.id)
    expect(player.status).toBe(PlayerStatus.AVAILABLE)

    store.movePlayer({
      playerId: player.id,
      targetTeamId: null
    })

    expect(targetTeam.players.map(candidate => candidate.id))
      .not.toContain(player.id)
    expect(store.getWaitingPlayers.map(candidate => candidate.id))
      .toContain(player.id)
    expect(player.status).toBe(PlayerStatus.AVAILABLE)
    expect(JSON.parse(localStorage.getItem('pickleball_players'))[0].status)
      .toBe(PlayerStatus.AVAILABLE)
  })

  it('keeps a removed team player AVAILABLE before start', async () => {
    const store = useSessionStore()
    const [player] = await startPreparedSession(store)
    const targetTeam = store.teams[0]
    store.movePlayer({
      playerId: player.id,
      targetTeamId: targetTeam.id
    })

    store.removePlayer(player.id)

    expect(targetTeam.players).toHaveLength(0)
    expect(store.rotation.waitingPlayers.map(candidate => candidate.id))
      .toContain(player.id)
    expect(player.status).toBe(PlayerStatus.AVAILABLE)
    expect(JSON.parse(localStorage.getItem('pickleball_players'))[0].status)
      .toBe(PlayerStatus.AVAILABLE)
  })

  it('orchestrates and persists the Rotation lifecycle', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)
    const startTime = new Date('2026-08-16T10:05:00.000Z')
    const endTime = new Date('2026-08-16T10:20:00.000Z')

    startReadyRotation(store, startTime)

    expect(store.rotation.status).toBe(RotationStatus.IN_PROGRESS)
    expect(store.rotation.startTime).toEqual(startTime)
    expect(storageService.getRotations()[0].status)
      .toBe(RotationStatus.IN_PROGRESS)

    store.startRotationScoring()

    expect(store.rotation.status).toBe(RotationStatus.SCORING)
    expect(storageService.getRotations()[0].status)
      .toBe(RotationStatus.SCORING)

    resolveRotationScores(store)
    store.finishRotation(endTime)

    const [persistedRotation] = storageService.getRotations()
    expect(store.rotation.status).toBe(RotationStatus.FINISHED)
    expect(store.rotation.endTime).toEqual(endTime)
    expect(persistedRotation.status).toBe(RotationStatus.FINISHED)
    expect(persistedRotation.startTime).toEqual(startTime)
    expect(persistedRotation.endTime).toEqual(endTime)
  })

  it('requires two Players in each Team before starting a Rotation', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)

    expect(store.canStartRotation).toBe(false)
    expect(() => store.startRotation())
      .toThrow('Every Game requires exactly 2 Players in each Team')
    expect(store.rotation.status).toBe(RotationStatus.CREATED)
    expect(storageService.getRotations()[0].status)
      .toBe(RotationStatus.CREATED)

    fillCurrentRotationTeams(store)
    expect(store.canStartRotation).toBe(true)

    const team = store.teams[1]
    const removedPlayer = team.players[1]
    store.removePlayer(removedPlayer.id)
    expect(store.canStartRotation).toBe(false)

    store.movePlayer({
      playerId: removedPlayer.id,
      targetTeamId: team.id
    })
    expect(store.canStartRotation).toBe(true)

    store.startRotation(new Date('2026-08-16T10:05:00.000Z'))
    expect(store.rotation.status).toBe(RotationStatus.IN_PROGRESS)
  })

  it('refuses to plan the next Rotation while a Game is unresolved', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)
    startReadyRotation(store, new Date('2026-08-16T10:05:00.000Z'))
    store.startRotationScoring()

    expect(() => store.planNextRotation(
      new Date('2026-08-16T10:20:00.000Z')
    )).toThrow('Cannot finish Rotation with unresolved Games')
    expect(store.rotation.status).toBe(RotationStatus.SCORING)
    expect(storageService.getRotations()).toHaveLength(1)
    expect(storageService.getRotations()[0].status)
      .toBe(RotationStatus.SCORING)
  })

  it('finishes the resolved Rotation and persists an empty next plan', async () => {
    const store = useSessionStore()
    const players = await startPreparedSession(store)
    const locationId = store.location.id
    const sessionId = store.session.id
    const currentRotationId = store.rotation.id
    const endTime = new Date('2026-08-16T10:20:00.000Z')
    startReadyRotation(store, new Date('2026-08-16T10:05:00.000Z'))
    store.startRotationScoring()
    resolveRotationScores(store)

    const nextRotation = store.planNextRotation(endTime)
    const persistedRotations = storageService.getRotations()
    const persistedCurrent = persistedRotations.find(
      rotation => rotation.id === currentRotationId
    )

    expect(persistedCurrent.status).toBe(RotationStatus.FINISHED)
    expect(persistedCurrent.endTime).toEqual(endTime)
    expect(nextRotation.order).toBe(2)
    expect(nextRotation.status).toBe(RotationStatus.CREATED)
    expect(nextRotation.games).toEqual([])
    expect(nextRotation.waitingPlayers.map(player => player.id))
      .toEqual(players.map(player => player.id))
    expect(store.teams).toEqual([])
    expect(persistedRotations).toHaveLength(2)

    disposePinia(pinia)
    pinia = createPinia()
    setActivePinia(pinia)
    const restoredStore = useSessionStore()
    await restoredStore.ensureSession({ locationId, sessionId })

    expect(restoredStore.rotation.order).toBe(2)
    expect(restoredStore.rotation.games).toEqual([])
    expect(restoredStore.rotation.waitingPlayers.map(player => player.id))
      .toEqual(players.map(player => player.id))
  })

  it('orchestrates and persists tied Game scoring', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)
    startReadyRotation(store, new Date('2026-08-16T10:05:00.000Z'))
    store.startRotationScoring()
    const [game] = store.rotation.games

    store.updateGameScore({
      gameId: game.id,
      scoreTeamA: 9,
      scoreTeamB: 9
    })

    expect(game.isResolved).toBe(false)
    expect(storageService.getRotations()[0].games[0].isResolved).toBe(false)

    store.designateGameWinner({
      gameId: game.id,
      winnerTeamId: game.teamBId
    })

    const [persistedGame] = storageService.getRotations()[0].games
    expect(game.winnerTeam).toBe(game.teamBId)
    expect(game.loserTeam).toBe(game.teamAId)
    expect(persistedGame.winnerTeam).toBe(game.teamBId)
    expect(persistedGame.loserTeam).toBe(game.teamAId)
  })

  it('numbers Games sequentially in Court order', async () => {
    const store = useSessionStore()
    await startPreparedSession(store, 12)

    store.setCourts(3)

    expect(store.rotation.order).toBe(1)
    expect(store.rotation.games.map(game => game.number))
      .toEqual([1, 2, 3])
    expect(storageService.getRotations()[0].games.map(game => game.number))
      .toEqual([1, 2, 3])
  })

  it('restores the highest-order Rotation and preserves its history', async () => {
    const store = useSessionStore()
    const players = await startPreparedSession(store)
    startReadyRotation(store, new Date('2026-08-16T10:05:00.000Z'))
    store.startRotationScoring()
    resolveRotationScores(store)
    store.finishRotation(new Date('2026-08-16T10:20:00.000Z'))
    const teams = [new Team(), new Team()]
    const game = new Game({
      number: 2,
      courtId: store.courts[0].id,
      teamAId: teams[0].id,
      teamBId: teams[1].id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    }, 'game-2')
    const nextRotation = new Rotation(
      store.session.id,
      2,
      [game],
      [...players],
      'rotation-2'
    )
    storageService.saveSessionGraph({
      location: store.location,
      session: store.session,
      rotation: nextRotation,
      courts: store.courts,
      teams
    })

    pinia = createPinia()
    setActivePinia(pinia)
    const restoredStore = useSessionStore()
    await restoredStore.ensureSession({
      locationId: store.location.id,
      sessionId: store.session.id
    })

    expect(restoredStore.rotation.id).toBe('rotation-2')
    expect(restoredStore.rotation.order).toBe(2)
    expect(storageService.getRotations().map(rotation => rotation.order))
      .toEqual([1, 2])
  })

  it('rejects a persisted graph that migration cannot repair', async () => {
    const location = new LocationBuilder()
      .withId('location-1')
      .withName('Central Club')
      .withNbCourts(1)
      .build()
    const attendees = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder()
        .withId(`attendee-${index + 1}`)
        .withName(`attendee-${index + 1}`)
        .build()
    )
    const session = new Session(
      location.id,
      1,
      new Date('2026-08-16T10:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1',
      attendees
    )
    const teams = [
      new Team(null, null, 'team-a'),
      new Team(null, null, 'team-b')
    ]
    const game = new Game({
      number: 1,
      courtId: 'court-1',
      teamAId: 'unknown-team',
      teamBId: teams[1].id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    }, 'game-1')
    const rotation = new Rotation(
      session.id,
      1,
      [game],
      [],
      'rotation-1'
    )
    localStorage.setItem('pickleball_locations', JSON.stringify([location]))
    localStorage.setItem('pickleball_sessions', JSON.stringify([session]))
    localStorage.setItem('pickleball_courts', JSON.stringify([
      new Court(location.id, 1, 'court-1')
    ]))
    localStorage.setItem('pickleball_rotations', JSON.stringify([rotation]))
    localStorage.setItem('pickleball_teams', JSON.stringify(teams))
    const store = useSessionStore()

    await expect(store.ensureSession({
      locationId: location.id,
      sessionId: session.id
    })).rejects.toThrow(
      'Unable to migrate Session "session-1" graph'
    )
    expect(store.rotation).toBeNull()
  })

  it('preserves Court identities when the active count shrinks and grows', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)

    store.setCourts(3)
    const courtIds = store.courts.map(court => court.id)
    store.setCourts(1)

    expect(store.courts.map(court => court.id)).toEqual([courtIds[0]])
    expect(storageService.getCourts().map(court => court.id))
      .toEqual(courtIds)

    store.setCourts(3)

    expect(store.courts.map(court => court.id)).toEqual(courtIds)
  })

  it('requires a loaded Rotation for lifecycle commands', () => {
    const store = useSessionStore()

    expect(() => store.startRotation())
      .toThrow('No rotation is loaded')
    expect(() => store.startRotationScoring())
      .toThrow('No rotation is loaded')
    expect(() => store.finishRotation())
      .toThrow('No rotation is loaded')
    expect(() => store.planNextRotation())
      .toThrow('No rotation is loaded')
  })

  it('excludes deleted players when preparing a rotation', async () => {
    const availablePlayer = new PlayerBuilder()
      .withId('player-1')
      .withName('alice')
      .build()
    const deletedPlayer = new PlayerBuilder()
      .withId('player-2')
      .withName('bob')
      .withStatus(PlayerStatus.DELETED)
      .build()
    localStorage.setItem(
      'pickleball_players',
      JSON.stringify([availablePlayer, deletedPlayer])
    )
    const store = useSessionStore()

    await store.ensureSession()

    expect(store.players.map(player => player.id)).toEqual(['player-1'])
    expect(store.rotation).toBeNull()
    expect(store.players[0].status).toBe(PlayerStatus.AVAILABLE)
    expect(JSON.parse(localStorage.getItem('pickleball_players')))
      .toContainEqual(deletedPlayer.toJSON())
  })

  it.each([
    RotationStatus.IN_PROGRESS,
    RotationStatus.SCORING,
    RotationStatus.FINISHED
  ])('refuses player movement while the rotation is %s', async status => {
    const store = useSessionStore()
    const [player] = await startPreparedSession(store)
    const targetTeam = store.teams[0]
    advanceRotationTo(store, status)
    const teamPlayerIds = targetTeam.players.map(candidate => candidate.id)
    const waitingPlayerIds = store.rotation.waitingPlayers.map(
      candidate => candidate.id
    )

    store.movePlayer({
      playerId: player.id,
      targetTeamId: targetTeam.id
    })

    expect(targetTeam.players.map(candidate => candidate.id))
      .toEqual(teamPlayerIds)
    expect(store.rotation.waitingPlayers.map(candidate => candidate.id))
      .toEqual(waitingPlayerIds)
  })

  it('refuses to add a player after the rotation has started', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)
    startReadyRotation(store)
    const player = new PlayerBuilder()
      .withId('outside-player')
      .withName('outsider')
      .build()
    const playerIds = store.players.map(candidate => candidate.id)
    const waitingPlayerIds = store.rotation.waitingPlayers.map(
      candidate => candidate.id
    )

    store.addPlayer(player)

    expect(store.players.map(candidate => candidate.id)).toEqual(playerIds)
    expect(store.rotation.waitingPlayers.map(candidate => candidate.id))
      .toEqual(waitingPlayerIds)
    expect(storageService.getPlayers().map(candidate => candidate.id))
      .not.toContain(player.id)
  })

  it('refuses to remove a team player after the rotation has started', async () => {
    const store = useSessionStore()
    const [player] = await startPreparedSession(store)
    const targetTeam = store.teams[0]
    store.movePlayer({
      playerId: player.id,
      targetTeamId: targetTeam.id
    })
    startReadyRotation(store)
    const waitingPlayerIds = store.rotation.waitingPlayers.map(
      candidate => candidate.id
    )

    store.removePlayer(player.id)

    expect(targetTeam.players.map(candidate => candidate.id))
      .toContain(player.id)
    expect(store.rotation.waitingPlayers.map(candidate => candidate.id))
      .toEqual(waitingPlayerIds)
  })

  it('refuses to reconfigure courts after the rotation has started', async () => {
    const store = useSessionStore()
    await startPreparedSession(store)
    const initialCourtIds = store.courts.map(court => court.id)
    startReadyRotation(store)

    store.setCourts(2)

    expect(store.courts.map(court => court.id)).toEqual(initialCourtIds)
    expect(store.courts).toHaveLength(1)
  })
})
