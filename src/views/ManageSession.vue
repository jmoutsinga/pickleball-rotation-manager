<template>
  <div class="manage-session">
    <h1>Training Session Manager</h1>

    <header
      v-if="location && session"
      class="manage-session__header manage-session__header--sticky"
    >
      <h2 class="session-identity">
        {{ location.name }} # Session {{ session.order }}
      </h2>
      <button
        v-if="isPreparingSession"
        type="button"
        class="manage-session__start"
        :disabled="!canStartSession"
        @click="handleStartSession"
      >
        Start Session
      </button>
    </header>

    <SessionForm
      v-if="isPreparingSession"
      :available-players="players"
      :selected-player-ids="selectedAttendingPlayerIds"
      @selection-change="updateAttendingPlayers"
    />

    <RotationCard
      v-else-if="location && session && rotation"
      :rotation-order="rotation.order"
      :rotation-status="rotation.status"
      :can-start-rotation="canStartRotation"
      :can-plan-next-rotation="canPlanNextRotation"
      :courts="courts"
      :waiting-players="waitingPlayers"
      @move-player="movePlayer"
      @remove-player="removePlayer"
      @start-rotation="startRotation"
      @stop-rotation="startRotationScoring"
      @next-rotation="planNextRotation"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { SessionStatus } from '@/models'
import RotationCard from '@/components/RotationCard.vue'
import SessionForm from '@/components/SessionForm.vue'
import { useSessionStore } from '@/stores/session'

export default {
  name: 'ManageSession',
  components: { RotationCard, SessionForm },
  computed: {
    ...mapState(useSessionStore, {
      courts: 'getCourts',
      waitingPlayers: 'getWaitingPlayers',
      location: 'location',
      session: 'session',
      rotation: 'rotation',
      canStartRotation: 'canStartRotation',
      players: 'players'
    }),
    isPreparingSession() {
      return this.session?.status === SessionStatus.CREATED
    },
    selectedAttendingPlayerIds() {
      return this.session?.attendingPlayers.map(player => player.id) ?? []
    },
    canStartSession() {
      return this.selectedAttendingPlayerIds.length >= 4
    },
    canPlanNextRotation() {
      return Boolean(
        this.rotation?.games.length &&
        this.rotation.games.every(game => game.isResolved)
      )
    }
  },
  methods: {
    ...mapActions(useSessionStore, [
      'removePlayer',
      'movePlayer',
      'updateAttendingPlayers',
      'startSession',
      'startRotation',
      'startRotationScoring',
      'planNextRotation'
    ]),
    handleStartSession() {
      this.startSession()
    }
  }
}
</script>

<style scoped>
.manage-session {
  --session-sticky-header-height: 4rem;
  --rotation-sticky-header-height: 3.5rem;

  flex: 1;
  box-sizing: border-box;
  width: 100%;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.manage-session__header {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: var(--session-sticky-header-height);
  gap: 1rem;
  padding: 0.75rem 0;
  background: #fff;
}

.manage-session__header--sticky {
  position: sticky;
  z-index: 3;
  top: 0;
}

.manage-session > h1,
.manage-session__header h2 {
  font-size: 2rem;
}

.manage-session__header h2 {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.manage-session__start {
  padding: 8px 16px;
  border: 0;
  border-radius: 4px;
  background: #42b983;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.manage-session__start:disabled {
  background: #b8c0c7;
  cursor: not-allowed;
}

.manage-session__start:focus-visible {
  outline: 3px solid rgb(66 185 131 / 35%);
  outline-offset: 2px;
}

</style>
