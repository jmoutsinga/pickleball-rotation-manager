<template>
  <section class="rotation-card">
    <header class="rotation-card__header rotation-card__header--sticky">
      <h3>Rotation N° {{ rotationOrder }}</h3>
      <button
        v-if="rotationStatus === RotationStatus.CREATED"
        type="button"
        class="rotation-card__action rotation-card__start"
        :disabled="!canStartRotation"
        @click="emit('start-rotation')"
      >
        Start Rotation
      </button>
      <button
        v-else-if="rotationStatus === RotationStatus.IN_PROGRESS"
        type="button"
        class="rotation-card__action rotation-card__stop"
        @click="emit('stop-rotation')"
      >
        Stop Rotation
      </button>
      <button
        v-else-if="rotationStatus === RotationStatus.SCORING"
        type="button"
        class="rotation-card__action rotation-card__next"
        :disabled="!canPlanNextRotation"
        @click="emit('next-rotation')"
      >
        Next Rotation
      </button>
    </header>

    <div class="courts-container">
      <div class="courts-grid">
        <CourtCard
          v-for="court in courts"
          :key="court.id"
          :court="court"
          @player-drag-start="draggedPlayerId = $event"
          @player-drop="handlePlayerDrop"
          @remove-player="emit('remove-player', $event)"
        />
      </div>

      <OffCourtPlayers
        :players="waitingPlayers"
        @player-drag-start="draggedPlayerId = $event"
        @player-drop="handlePlayerDrop"
        @remove-player="emit('remove-player', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RotationStatus, type Player } from '@/models'
import CourtCard from './CourtCard.vue'
import OffCourtPlayers from './OffCourtPlayers.vue'
import type { RotationCourtPresentation } from './rotationPresentation'

defineOptions({ name: 'RotationCard' })

defineProps<{
  rotationOrder: number
  rotationStatus: RotationStatus
  canStartRotation: boolean
  canPlanNextRotation: boolean
  courts: RotationCourtPresentation[]
  waitingPlayers: Player[]
}>()

const emit = defineEmits<{
  'move-player': [command: {
    playerId: string
    targetTeamId: string | null
  }]
  'remove-player': [playerId: string]
  'start-rotation': []
  'stop-rotation': []
  'next-rotation': []
}>()

const draggedPlayerId = ref<string | null>(null)

function handlePlayerDrop(targetTeamId: string | null): void {
  if (!draggedPlayerId.value) return

  emit('move-player', {
    playerId: draggedPlayerId.value,
    targetTeamId
  })
  draggedPlayerId.value = null
}
</script>

<style scoped>
.rotation-card__header {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: var(--rotation-sticky-header-height, 3.5rem);
  gap: 1rem;
  padding: 0.5rem 0;
  background: #fff;
}

.rotation-card__header--sticky {
  position: sticky;
  z-index: 2;
  top: var(--session-sticky-header-height, 4rem);
}

.rotation-card__header h3 {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.2;
  text-align: left;
}

.rotation-card__action {
  padding: 8px 16px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.rotation-card__start {
  background: #42b983;
}

.rotation-card__stop {
  background: #c0392b;
}

.rotation-card__next {
  background: #ff8c00;
}

.rotation-card__action:disabled {
  background: #b8c0c7;
  cursor: not-allowed;
}

.rotation-card__action:focus-visible {
  outline: 3px solid rgb(66 185 131 / 35%);
  outline-offset: 2px;
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
</style>
