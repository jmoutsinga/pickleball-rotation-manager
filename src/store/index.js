import { createStore } from 'vuex'
import storageService from '../services/storage'

export default createStore({
  state: {
    courts: [],
    players: [],
    waitingPlayers: []
  },
  mutations: {
    SET_COURTS(state, courts) {
      state.courts = courts
    },
    SET_PLAYERS(state, players) {
      state.players = players
      state.waitingPlayers = players.filter(p => p.status === 'waiting')
    },
    ADD_PLAYER(state, player) {
      if (!player.teamMates) player.teamMates = {}
      state.players.push(player)
      state.waitingPlayers.push(player)
    },
    UPDATE_PLAYER(state, updatedPlayer) {
      const index = state.players.findIndex(p => p.id === updatedPlayer.id);
      if (index !== -1) {
        state.players[index] = updatedPlayer;
        // Update waitingPlayers as well
        const waitingIndex = state.waitingPlayers.findIndex(p => p.id === updatedPlayer.id);
        if (waitingIndex !== -1) {
          state.waitingPlayers[waitingIndex] = updatedPlayer;
        }
      }
    },
    REMOVE_PLAYER(state, playerId) {
      const player = state.players.find(p => p.id === playerId)
      if (!player) return

      // Remove from any team
      state.courts.forEach(court => {
        Object.values(court.teams).forEach(team => {
          team.players = team.players.filter(p => p.id !== playerId)
        })
      })

      // Move to waiting list
      player.status = 'waiting'
      if (!state.waitingPlayers.some(p => p.id === playerId)) {
        state.waitingPlayers.push(player)
      }

      // Update storage
      storageService.removePlayer(playerId)
    },
    MOVE_PLAYER(state, { playerId, sourceList, targetTeamId }) {
      const player = state.players.find(p => p.id === playerId)
      
      // Remove from waiting list if coming from there
      if (sourceList === 'waiting') {
        state.waitingPlayers = state.waitingPlayers.filter(p => p.id !== playerId)
      }
      
      // Remove from any existing team
      state.courts.forEach(court => {
        Object.values(court.teams).forEach(team => {
          team.players = team.players.filter(p => p.id !== playerId)
        })
      })

      // Add to target team if specified
      if (targetTeamId) {
        for (const court of state.courts) {
          const team = Object.values(court.teams).find(t => t.id === targetTeamId)
          if (team && team.players.length < 2) {
            team.players.push({
              ...player,
              status: 'active'
            })
            // Update storage
            storageService.updatePlayerTeam(playerId, targetTeamId)
            return
          }
        }
      }
      
      // If no valid team found or team is full, add to waiting
      if (!targetTeamId || !state.courts.some(court => 
        Object.values(court.teams).some(team => 
          team.id === targetTeamId && team.players.includes(player)
        ))) {
        state.waitingPlayers.push({
          ...player,
          status: 'waiting'
        })
        // Update storage
        storageService.updatePlayerTeam(playerId, null)
      }
    }
  },
  actions: {
    async initializeFromStorage({ commit }) {
      const courts = storageService.getCourts()
      const players = storageService.getPlayers()
      commit('SET_COURTS', courts)
      commit('SET_PLAYERS', players)
    },
    setCourts({ commit }, numCourts) {
      const courts = Array.from({ length: numCourts }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        teams: {
          A: { id: `${i + 1}-A`, players: [] },
          B: { id: `${i + 1}-B`, players: [] }
        }
      }))
      storageService.saveCourts(courts)
      commit('SET_COURTS', courts)
    },
    addPlayer({ commit }, player) {
      if (!player.teamMates) player.teamMates = {}
      storageService.savePlayer(player)
      commit('ADD_PLAYER', player)
    },
    updatePlayer({ commit }, player) {
      storageService.updatePlayer(player)
      commit('UPDATE_PLAYER', player)
    },
    removePlayer({ commit }, playerId) {
      commit('REMOVE_PLAYER', playerId)
    },
    movePlayer({ commit }, payload) {
      commit('MOVE_PLAYER', payload)
    }
  },
  getters: {
    getCourts: state => state.courts,
    getWaitingPlayers: state => state.waitingPlayers,
    getTeamById: state => teamId => {
      for (const court of state.courts) {
        const team = Object.values(court.teams).find(t => t.id === teamId)
        if (team) return team
      }
      return null
    }
  }
})
