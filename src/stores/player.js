import { defineStore } from 'pinia'
import { PlayerBuilder, PlayerStatus, SessionStatus } from '@/models'
import storageService from '@/services/storage'

function isLinkedToStartedSession(playerId) {
  const startedSessions = storageService.getSessions()
    .filter(session => session.status === SessionStatus.STARTED)

  if (startedSessions.some(session =>
    session.attendingPlayers.some(player => player.id === playerId)
  )) {
    return true
  }

  const startedSessionIds = new Set(
    startedSessions.map(session => session.id)
  )
  const startedRotations = storageService.getRotations().filter(
    rotation => startedSessionIds.has(rotation.sessionId)
  )

  if (startedRotations.some(rotation =>
    rotation.waitingPlayers.some(player => player.id === playerId)
  )) {
    return true
  }

  const teamIds = new Set(
    startedRotations.flatMap(rotation =>
      rotation.games.flatMap(game => [game.teamAId, game.teamBId])
    )
  )

  return storageService.getTeams().some(team =>
    teamIds.has(team.id) &&
    team.players.some(player => player.id === playerId)
  )
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    players: /** @type {import('@/models').Player[]} */ ([])
  }),

  actions: {
    loadPlayers() {
      this.players = storageService.getPlayers()
    },

    createPlayer({ name }) {
      const player = new PlayerBuilder()
        .withName(name)
        .build()

      storageService.savePlayer(player)
      this.loadPlayers()

      return player
    },

    updatePlayer({ id, name }) {
      const persistedPlayer = storageService.getPlayers().find(
        player => player.id === id
      )

      if (!persistedPlayer) {
        throw new Error(`Player "${id}" does not exist`)
      }

      const updatedPlayer = new PlayerBuilder()
        .withId(id)
        .withName(name)
        .withStatus(persistedPlayer.status)
        .build()

      storageService.updatePlayer(updatedPlayer)
      this.loadPlayers()

      return updatedPlayer
    },

    deletePlayer(playerId) {
      const playerExists = storageService.getPlayers().some(
        player => player.id === playerId
      )

      if (!playerExists) {
        throw new Error(`Player "${playerId}" does not exist`)
      }

      if (isLinkedToStartedSession(playerId)) {
        throw new Error(
          `Player "${playerId}" cannot be deleted while linked to a started session`
        )
      }

      const deletedPlayer = storageService.changePlayerStatus(
        playerId,
        PlayerStatus.DELETED
      )
      this.loadPlayers()

      return deletedPlayer
    },

    restorePlayer(playerId) {
      const restoredPlayer = storageService.changePlayerStatus(
        playerId,
        PlayerStatus.AVAILABLE
      )
      this.loadPlayers()

      return restoredPlayer
    }
  }
})
