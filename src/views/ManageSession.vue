<template>
  <div class="manage-session">
    <h1>Training Session Manager</h1>

    <SessionForm
      v-if="isPreparingSession"
      :location-name="location.name"
      :session-order="session.order"
      :available-players="players"
      :selected-player-ids="selectedAttendingPlayerIds"
      @selection-change="updateAttendingPlayers"
      @start="handleStartSession"
    />

    <template v-else>
      <h2 v-if="location && session" class="session-identity">
        {{ location.name }} # Session {{ session.order }}
      </h2>

    <!-- Court Setup -->
    <div class="court-setup" v-if="!courtsInitialized">
      <h3>Setup Courts</h3>
      <div class="setup-form">
        <label for="num-courts">Number of courts:</label>
        <input
            id="num-courts"
            v-model.number="numCourts"
            type="number"
            min="1"
            max="10"
            placeholder="Number of courts (max 10)"
        >
        <button @click="initializeCourts" :disabled="!numCourts || numCourts < 1">Set Courts</button>
      </div>
    </div>

    <div v-else>
      <div class="courts-container">
        <!-- Courts Grid -->
        <div class="courts-grid">
          <div v-for="court in courts" :key="court.id" class="court">
            <h3>Court {{ court.number }}</h3>
            <div class="court-teams">
              <!-- Team A -->
              <div class="team team-a">
                <h4>Team A</h4>
                <div 
                  class="team-players"
                  @dragover.prevent
                  @drop="onDrop($event, court.teams.A.id)"
                >
                  <div 
                    v-for="player in court.teams.A.players" 
                    :key="player.id"
                    class="player-card team-player"
                    draggable="true"
                    @dragstart="onDragStart($event, player.id, 'team')"
                  >
                    {{ player.name }}
                    <button @click="removePlayer(player.id)" class="remove-btn">×</button>
                  </div>
                  <div v-if="court.teams.A.players.length < 2" class="player-slot">
                    Drag player here ({{ court.teams.A.players.length }}/2)
                  </div>
                </div>
              </div>

              <div class="team-divider">VS</div>

              <!-- Team B -->
              <div class="team team-b">
                <h4>Team B</h4>
                <div 
                  class="team-players"
                  @dragover.prevent
                  @drop="onDrop($event, court.teams.B.id)"
                >
                  <div 
                    v-for="player in court.teams.B.players" 
                    :key="player.id"
                    class="player-card team-player"
                    draggable="true"
                    @dragstart="onDragStart($event, player.id, 'team')"
                  >
                    {{ player.name }}
                    <button @click="removePlayer(player.id)" class="remove-btn">×</button>
                  </div>
                  <div v-if="court.teams.B.players.length < 2" class="player-slot">
                    Drag player here ({{ court.teams.B.players.length }}/2)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Waiting Players -->
        <div class="waiting-section">
          <h3>Waiting Players</h3>
          <div 
            class="waiting-players"
            @dragover.prevent
            @drop="onDrop($event, null)"
          >
            <div 
              v-for="player in waitingPlayers" 
              :key="player.id"
              class="player-card waiting"
              draggable="true"
              @dragstart="onDragStart($event, player.id, 'waiting')"
            >
              {{ player.name }}
              <button @click="removePlayer(player.id)" class="remove-btn">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { SessionStatus } from '@/models'
import SessionForm from '@/components/SessionForm.vue'
import { useSessionStore } from '@/stores/session'

export default {
  name: 'ManageSession',
  components: { SessionForm },
  data() {
    return {
      numCourts: 1,
      courtsInitialized: false,
      draggedPlayerId: null,
      dragSource: null
    }
  },
  computed: {
    ...mapState(useSessionStore, {
      courts: 'getCourts',
      waitingPlayers: 'getWaitingPlayers',
      location: 'location',
      session: 'session',
      players: 'players'
    }),
    isPreparingSession() {
      return this.session?.status === SessionStatus.CREATED
    },
    selectedAttendingPlayerIds() {
      return this.session?.attendingPlayers.map(player => player.id) ?? []
    }
  },
  methods: {
    ...mapActions(useSessionStore, [
      'setCourts',
      'removePlayer',
      'movePlayer',
      'updateAttendingPlayers',
      'startSession'
    ]),
    handleStartSession() {
      this.startSession()
      this.courtsInitialized = this.courts.length > 0
      this.numCourts = this.courts.length || this.numCourts
    },
    async initializeCourts() {
      if (this.numCourts > 0) {
        await this.setCourts(this.numCourts)
        this.courtsInitialized = true
      }
    },
    onDragStart(event, playerId, source) {
      this.draggedPlayerId = playerId
      this.dragSource = source
      event.dataTransfer.effectAllowed = 'move'
    },
    onDrop(event, targetTeamId) {
      event.preventDefault()
      if (this.draggedPlayerId && this.dragSource) {
        this.movePlayer({
          playerId: this.draggedPlayerId,
          sourceList: this.dragSource,
          targetTeamId
        })
      }
      this.draggedPlayerId = null
      this.dragSource = null
    }
  },
  created() {
    // If there are courts in the database, set courtsInitialized to true
    if (this.courts.length > 0) {
      this.courtsInitialized = true
      this.numCourts = this.courts.length
    }
  }
}
</script>

<style scoped>
.manage-session {
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.session-identity {
  margin-top: 0;
}

.court-setup {
  margin-bottom: 30px;
}

.setup-form {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.setup-form input {
  padding: 8px;
  width: 150px;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.courts-container {
  display: flex;
  gap: 20px;
}

.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  flex: 1;
}

.court {
  border: 2px solid #42b983;
  border-radius: 8px;
  padding: 15px;
  background-color: #f8f8f8;
}

.court h3 {
  margin-top: 0;
  color: #42b983;
}

.court-teams {
  display: flex;
  gap: 20px;
  align-items: stretch;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
}

.team {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.team h4 {
  margin: 0 0 10px 0;
  color: #42b983;
}

.team-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-weight: bold;
  color: #666;
}

.team-players {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.team-player {
  background-color: #e1f5eb;
  border: 1px solid #42b983;
}

.player-card {
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
}

.player-slot {
  padding: 10px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  color: #666;
  text-align: center;
}

.team-a .team-player {
  background-color: #e1f5eb;
  border-color: #42b983;
}

.team-b .team-player {
  background-color: #f5e1eb;
  border-color: #b94283;
}

.waiting-section {
  width: 250px;
  border: 2px solid #666;
  border-radius: 8px;
  padding: 15px;
}

.waiting-players {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

.remove-btn:hover {
  color: #cc0000;
}

.player-card:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
