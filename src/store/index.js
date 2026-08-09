import { createStore } from 'vuex'
import storageService from '../services/storage'
import {
  Court,
  Game,
  Location,
  PlayerStatus,
  Rotation,
  Session,
  Team
} from '@/models'

function saveSessionGraph(state) {
  storageService.saveCourts(state.courts)
  storageService.saveLocations([state.location])
  storageService.saveSession(state.session)
  storageService.saveRotations([state.rotation])
  storageService.saveGames(state.rotation.games)
  storageService.saveTeams(state.teams)
}

export default createStore({
  state: {
    location: null,
    session: null,
    rotation: null,
    courts: [],
    teams: [],
    players: []
  },
  mutations: {
    SET_SESSION_GRAPH(state, { location, session, rotation, courts, teams, players }) {
      state.location = location
      state.session = session
      state.rotation = rotation
      state.courts = courts
      state.teams = teams
      state.players = players
    },
    SET_COURTS_GRAPH(state, { location, courts, rotation, teams }) {
      state.location = location
      state.courts = courts
      state.rotation = rotation
      state.teams = teams
    },
    ADD_PLAYER(state, player) {
      state.players.push(player)
      state.rotation.waitingPlayers.push(player)
    },
    UPDATE_PLAYER(state, updatedPlayer) {
      const index = state.players.findIndex(player => player.id === updatedPlayer.id)
      if (index === -1) return
      state.players[index] = updatedPlayer

      const waitingIndex = state.rotation.waitingPlayers.findIndex(player => player.id === updatedPlayer.id)
      if (waitingIndex !== -1) state.rotation.waitingPlayers[waitingIndex] = updatedPlayer

      state.teams.forEach(team => {
        if (team.player1?.id === updatedPlayer.id) team.player1 = updatedPlayer
        if (team.player2?.id === updatedPlayer.id) team.player2 = updatedPlayer
      })
    },
    REMOVE_PLAYER(state, playerId) {
      const player = state.players.find(candidate => candidate.id === playerId)
      if (!player) return
      state.teams.forEach(team => team.removePlayer(playerId))
      player.changeStatus(PlayerStatus.WAITING)
      if (!state.rotation.waitingPlayers.some(candidate => candidate.id === playerId)) {
        state.rotation.waitingPlayers.push(player)
      }
    },
    MOVE_PLAYER(state, { playerId, targetTeamId }) {
      const player = state.players.find(candidate => candidate.id === playerId)
      if (!player) return

      const targetTeam = targetTeamId
        ? state.teams.find(team => team.id === targetTeamId)
        : null
      if (targetTeamId && (!targetTeam || targetTeam.players.length >= 2)) return

      state.teams.forEach(team => team.removePlayer(playerId))
      state.rotation.waitingPlayers = state.rotation.waitingPlayers
        .filter(candidate => candidate.id !== playerId)

      if (targetTeam) {
        targetTeam.addPlayer(player)
        player.changeStatus(PlayerStatus.ACTIVE)
      } else {
        player.changeStatus(PlayerStatus.WAITING)
        state.rotation.waitingPlayers.push(player)
      }
    }
  },
  actions: {
    async ensureSession({ state, commit }) {
      if (state.session && state.rotation) return

      const players = storageService.getPlayers()
      const locations = storageService.getLocations()
      const sessions = storageService.getSessions()
      const rotations = storageService.getRotations()
      const storedCourts = storageService.getCourts()
      const storedTeams = storageService.getTeams()

      let location = locations.find(candidate => candidate.name === 'default')
      if (!location) location = new Location('default', '', Math.max(storedCourts.length, 1))

      let session = sessions.find(candidate =>
        candidate.locationId === location.id && candidate.status === 'STARTED'
      )
      if (!session) session = new Session(location.id, 1)

      let courts = storedCourts
        .filter(court => court.locationId === location.id)
        .map(court => court instanceof Court ? court : Court.fromJson(court))
      if (!courts.length) {
        courts = Array.from({ length: location.nbCourts }, (_, index) => new Court(location.id, index + 1))
      }

      let rotation = rotations.find(candidate => candidate.sessionId === session.id)
      let teams = storedTeams
      if (!rotation) {
        teams = courts.flatMap(() => [new Team(), new Team()])
        const games = courts.map((court, index) => new Game({
          courtId: court.id,
          teamAId: teams[index * 2].id,
          teamBId: teams[index * 2 + 1].id,
          scoreTeamA: null,
          scoreTeamB: null,
          winnerTeam: null,
          loserTeam: null
        }))
        players.forEach(player => player.changeStatus(PlayerStatus.WAITING))
        rotation = new Rotation(session.id, 1, games, [...players])
      } else {
        const rotationTeamIds = new Set(rotation.games.flatMap(game => [game.teamAId, game.teamBId]))
        teams = teams.filter(team => rotationTeamIds.has(team.id))
        const assignedPlayerIds = new Set(teams.flatMap(team => team.players.map(player => player.id)))
        rotation.waitingPlayers = players.filter(player => !assignedPlayerIds.has(player.id))
      }

      commit('SET_SESSION_GRAPH', { location, session, rotation, courts, teams, players })
      storageService.savePlayers(players)
      saveSessionGraph(state)
    },
    setCourts({ state, commit }, numCourts) {
      const location = new Location('default', state.location?.description ?? '', numCourts, state.location?.id)
      const courts = Array.from({ length: numCourts }, (_, index) => new Court(location.id, index + 1))
      const teams = courts.flatMap(() => [new Team(), new Team()])
      const games = courts.map((court, index) => new Game({
        courtId: court.id,
        teamAId: teams[index * 2].id,
        teamBId: teams[index * 2 + 1].id,
        scoreTeamA: null,
        scoreTeamB: null,
        winnerTeam: null,
        loserTeam: null
      }))
      const rotation = new Rotation(state.session.id, state.rotation.order, games, [...state.players], state.rotation.id)
      state.players.forEach(player => player.changeStatus(PlayerStatus.WAITING))
      commit('SET_COURTS_GRAPH', { location, courts, rotation, teams })
      storageService.savePlayers(state.players)
      saveSessionGraph(state)
    },
    addPlayer({ state, commit }, player) {
      storageService.savePlayer(player)
      commit('ADD_PLAYER', player)
      storageService.saveRotations([state.rotation])
    },
    updatePlayer({ state, commit }, player) {
      storageService.updatePlayer(player)
      commit('UPDATE_PLAYER', player)
      saveSessionGraph(state)
    },
    removePlayer({ state, commit }, playerId) {
      commit('REMOVE_PLAYER', playerId)
      storageService.removePlayer(playerId)
      saveSessionGraph(state)
    },
    movePlayer({ state, commit }, payload) {
      const targetTeam = payload.targetTeamId
        ? state.teams.find(team => team.id === payload.targetTeamId)
        : null
      const playerAlreadyInTarget = targetTeam?.players.some(player => player.id === payload.playerId)
      if (payload.targetTeamId && (!targetTeam || (targetTeam.players.length >= 2 && !playerAlreadyInTarget))) {
        return
      }
      commit('MOVE_PLAYER', payload)
      storageService.updatePlayerTeam(payload.playerId, payload.targetTeamId)
      saveSessionGraph(state)
    }
  },
  getters: {
    getCourts: state => {
      if (!state.rotation) return []
      return state.courts.map(court => {
        const game = state.rotation.games.find(candidate => candidate.courtId === court.id)
        return {
          id: court.id,
          number: court.number,
          teams: {
            A: state.teams.find(team => team.id === game?.teamAId),
            B: state.teams.find(team => team.id === game?.teamBId)
          }
        }
      })
    },
    getWaitingPlayers: state => state.rotation?.waitingPlayers ?? [],
    getTeamById: state => teamId => state.teams.find(team => team.id === teamId) ?? null
  }
})
