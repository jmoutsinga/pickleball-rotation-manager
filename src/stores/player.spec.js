// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import {
  Game,
  Player,
  PlayerBuilder,
  PlayerStatus,
  Rotation,
  Session,
  SessionStatus,
  Team
} from '@/models'
import storageService from '@/services/storage'
import { usePlayerStore } from './player'

const createPlayer = (id, name, status = PlayerStatus.AVAILABLE) =>
  new PlayerBuilder()
    .withId(id)
    .withName(name)
    .withStatus(status)
    .build()

describe('usePlayerStore', () => {
  let pinia

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    disposePinia(pinia)
  })

  it('loads every persisted player including deleted players', () => {
    const activePlayer = createPlayer('player-1', 'alice')
    const deletedPlayer = createPlayer(
      'player-2',
      'bob',
      PlayerStatus.DELETED
    )
    storageService.savePlayers([activePlayer, deletedPlayer])
    const store = usePlayerStore()

    store.loadPlayers()

    expect(store.players).toHaveLength(2)
    expect(store.players.every(player => player instanceof Player)).toBe(true)
    expect(store.players.map(player => player.status)).toEqual([
      PlayerStatus.AVAILABLE,
      PlayerStatus.DELETED
    ])
  })

  it('creates, persists and returns an AVAILABLE player', () => {
    const store = usePlayerStore()

    const createdPlayer = store.createPlayer({ name: '  Alice  ' })

    expect(createdPlayer).toBeInstanceOf(Player)
    expect(createdPlayer.name).toBe('alice')
    expect(createdPlayer.status).toBe(PlayerStatus.AVAILABLE)
    expect(store.players.map(player => player.id)).toEqual([createdPlayer.id])
    expect(storageService.getPlayers().map(player => player.toJSON()))
      .toEqual([createdPlayer.toJSON()])
  })

  it('preserves persisted players when creating from stale state', () => {
    const persistedPlayer = createPlayer('player-1', 'alice')
    storageService.savePlayers([persistedPlayer])
    const store = usePlayerStore()

    store.createPlayer({ name: 'bob' })

    expect(store.players.map(player => player.name)).toEqual(['alice', 'bob'])
    expect(storageService.getPlayers()).toHaveLength(2)
  })

  it('keeps names unique when the existing player is deleted', () => {
    const deletedPlayer = createPlayer(
      'player-1',
      'alice',
      PlayerStatus.DELETED
    )
    storageService.savePlayers([deletedPlayer])
    const store = usePlayerStore()

    expect(() => store.createPlayer({ name: 'Alice' }))
      .toThrow('A player named "alice" already exists')
    expect(storageService.getPlayers()).toHaveLength(1)
  })

  it('updates only the name while preserving id and status', () => {
    const waitingPlayer = createPlayer(
      'player-1',
      'alice',
      PlayerStatus.WAITING
    )
    storageService.savePlayers([waitingPlayer])
    const store = usePlayerStore()

    const updatedPlayer = store.updatePlayer({
      id: waitingPlayer.id,
      name: '  Alicia  '
    })

    expect(updatedPlayer).toMatchObject({
      id: waitingPlayer.id,
      name: 'alicia',
      status: PlayerStatus.WAITING
    })
    expect(store.players[0].toJSON()).toEqual(updatedPlayer.toJSON())
    expect(storageService.getPlayers()[0].toJSON())
      .toEqual(updatedPlayer.toJSON())
  })

  it('refuses to update an unknown player without mutating storage', () => {
    const player = createPlayer('player-1', 'alice')
    storageService.savePlayers([player])
    const store = usePlayerStore()

    expect(() => store.updatePlayer({ id: 'unknown-player', name: 'bob' }))
      .toThrow('Player "unknown-player" does not exist')
    expect(storageService.getPlayers()[0].toJSON()).toEqual(player.toJSON())
  })

  it('refuses a duplicate name when updating a player', () => {
    const firstPlayer = createPlayer('player-1', 'alice')
    const deletedPlayer = createPlayer(
      'player-2',
      'bob',
      PlayerStatus.DELETED
    )
    storageService.savePlayers([firstPlayer, deletedPlayer])
    const store = usePlayerStore()

    expect(() => store.updatePlayer({
      id: firstPlayer.id,
      name: 'Bob'
    })).toThrow('A player named "bob" already exists')
    expect(storageService.getPlayers().map(player => player.toJSON()))
      .toEqual([firstPlayer.toJSON(), deletedPlayer.toJSON()])
  })

  it('logically deletes a player not linked to a started session', () => {
    const player = createPlayer('player-1', 'alice', PlayerStatus.WAITING)
    const finishedSession = new Session(
      'location-1',
      1,
      new Date(),
      new Date(),
      SessionStatus.FINISHED,
      new Map(),
      'session-1'
    )
    const historicalRotation = new Rotation(
      finishedSession.id,
      1,
      [],
      [player],
      'rotation-1'
    )
    storageService.savePlayers([player])
    storageService.saveSessions([finishedSession])
    storageService.saveRotations([historicalRotation])
    const store = usePlayerStore()

    const deletedPlayer = store.deletePlayer(player.id)

    expect(deletedPlayer.status).toBe(PlayerStatus.DELETED)
    expect(store.players[0].status).toBe(PlayerStatus.DELETED)
    expect(storageService.getPlayers()[0].status)
      .toBe(PlayerStatus.DELETED)
    expect(storageService.getRotations()[0].waitingPlayers[0].status)
      .toBe(PlayerStatus.WAITING)
  })

  it('refuses to delete a waiting player from a started session', () => {
    const player = createPlayer('player-1', 'alice')
    const startedSession = new Session(
      'location-1',
      1,
      new Date(),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1'
    )
    const rotation = new Rotation(
      startedSession.id,
      1,
      [],
      [player],
      'rotation-1'
    )
    storageService.savePlayers([player])
    storageService.saveSessions([startedSession])
    storageService.saveRotations([rotation])
    const store = usePlayerStore()

    expect(() => store.deletePlayer(player.id)).toThrow(
      'Player "player-1" cannot be deleted while linked to a started session'
    )
    expect(storageService.getPlayers()[0].status)
      .toBe(PlayerStatus.AVAILABLE)
  })

  it('refuses to delete an attendee from a started session without inspecting rotations', () => {
    const player = createPlayer('player-1', 'alice')
    const startedSession = new Session(
      'location-1',
      1,
      new Date(),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1',
      [player]
    )
    storageService.savePlayers([player])
    storageService.saveSessions([startedSession])
    const store = usePlayerStore()

    expect(() => store.deletePlayer(player.id)).toThrow(
      'Player "player-1" cannot be deleted while linked to a started session'
    )
    expect(storageService.getPlayers()[0].status)
      .toBe(PlayerStatus.AVAILABLE)
  })

  it('refuses to delete a playing team member from a started session', () => {
    const player = createPlayer('player-1', 'alice')
    const startedSession = new Session(
      'location-1',
      1,
      new Date(),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1'
    )
    const teamA = new Team(player, null, 'team-a')
    const teamB = new Team(null, null, 'team-b')
    const game = new Game({
      courtId: 'court-1',
      teamAId: teamA.id,
      teamBId: teamB.id,
      scoreTeamA: null,
      scoreTeamB: null,
      winnerTeam: null,
      loserTeam: null
    }, 'game-1')
    const rotation = new Rotation(
      startedSession.id,
      1,
      [game],
      [],
      'rotation-1'
    )
    storageService.savePlayers([player])
    storageService.saveSessions([startedSession])
    storageService.saveRotations([rotation])
    storageService.saveTeams([teamA, teamB])
    const store = usePlayerStore()

    expect(() => store.deletePlayer(player.id)).toThrow(
      'Player "player-1" cannot be deleted while linked to a started session'
    )
    expect(storageService.getPlayers()[0].status)
      .toBe(PlayerStatus.AVAILABLE)
  })

  it('restores a deleted player as AVAILABLE', () => {
    const player = createPlayer(
      'player-1',
      'alice',
      PlayerStatus.DELETED
    )
    storageService.savePlayers([player])
    const store = usePlayerStore()

    const restoredPlayer = store.restorePlayer(player.id)

    expect(restoredPlayer.status).toBe(PlayerStatus.AVAILABLE)
    expect(store.players[0].status).toBe(PlayerStatus.AVAILABLE)
    expect(storageService.getPlayers()[0].status)
      .toBe(PlayerStatus.AVAILABLE)
  })

  it.each([
    ['deletePlayer'],
    ['restorePlayer']
  ])('refuses to %s for an unknown player', action => {
    const store = usePlayerStore()

    expect(() => store[action]('unknown-player'))
      .toThrow('Player "unknown-player" does not exist')
  })
})
