<template>
  <section
    class="rotation-card"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
  >
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
        :disabled="!canPlanNextRotation || editingGameIds.size > 0"
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
          :rotation-status="rotationStatus"
          @player-drag-start="draggedPlayerId = $event"
          @player-drop="handlePlayerDrop"
          @player-swap="handlePlayerSwap"
          @remove-player="emit('remove-player', $event)"
          @score-game="emit('score-game', $event)"
          @score-editing-change="handleScoreEditingChange"
          @designate-winner="emit('designate-winner', $event)"
        />
      </div>

      <OffCourtPlayers
        :players="waitingPlayers"
        @player-drag-start="draggedPlayerId = $event"
        @player-drop="handlePlayerDrop"
        @player-swap="handlePlayerSwap"
        @remove-player="emit('remove-player', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RotationStatus, type Player } from '@/models'
import CourtCard from './CourtCard.vue'
import OffCourtPlayers from './OffCourtPlayers.vue'
import type {
  DesignateWinnerCommand,
  RotationCourtPresentation,
  ScoreEditingCommand,
  ScoreGameCommand,
  SwapPlayerCommand
} from './rotationPresentation'

defineOptions({ name: 'RotationCard' })

const props = defineProps<{
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
  'swap-player': [command: SwapPlayerCommand]
  'remove-player': [playerId: string]
  'start-rotation': []
  'stop-rotation': []
  'next-rotation': []
  'score-game': [command: ScoreGameCommand]
  'score-editing-change': [command: ScoreEditingCommand]
  'designate-winner': [command: DesignateWinnerCommand]
}>()

const draggedPlayerId = ref<string | null>(null)
const activeTouchPointerId = ref<number | null>(null)
const editingGameIds = ref(new Set<string>())

watch(() => props.rotationOrder, () => {
  editingGameIds.value = new Set()
})

function handlePlayerDrop(targetTeamId: string | null): void {
  if (!draggedPlayerId.value) return

  emit('move-player', {
    playerId: draggedPlayerId.value,
    targetTeamId
  })
  draggedPlayerId.value = null
}

function handlePlayerSwap(targetPlayerId: string): void {
  if (!draggedPlayerId.value) return

  if (draggedPlayerId.value !== targetPlayerId) {
    emit('swap-player', {
      playerId: draggedPlayerId.value,
      targetPlayerId
    })
  }
  draggedPlayerId.value = null
}

function handlePointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return

  const eventTarget = event.target
  if (!(eventTarget instanceof Element)) return
  if (eventTarget.closest('button, input, select, textarea, a')) return

  const playerCard = eventTarget.closest<HTMLElement>('[data-touch-player-id]')
  const playerId = playerCard?.dataset.touchPlayerId
  if (!playerId) return

  draggedPlayerId.value = playerId
  activeTouchPointerId.value = event.pointerId
  event.preventDefault()
  tryCapturePointer(event.currentTarget as HTMLElement, event.pointerId)
}

function handlePointerMove(event: PointerEvent): void {
  if (event.pointerId !== activeTouchPointerId.value) return

  event.preventDefault()
}

function handlePointerUp(event: PointerEvent): void {
  if (event.pointerId !== activeTouchPointerId.value) return

  event.preventDefault()
  const dropElement = document.elementFromPoint(event.clientX, event.clientY)
  const playerTarget = dropElement
    ?.closest<HTMLElement>('[data-touch-player-id]')
  const teamTarget = dropElement?.closest<HTMLElement>('[data-touch-team-id]')
  const waitingTarget = dropElement?.closest<HTMLElement>('[data-touch-waiting-target]')

  if (playerTarget?.dataset.touchPlayerId) {
    handlePlayerSwap(playerTarget.dataset.touchPlayerId)
  } else if (teamTarget?.dataset.touchTeamId) {
    handlePlayerDrop(teamTarget.dataset.touchTeamId)
  } else if (waitingTarget) {
    handlePlayerDrop(null)
  }

  resetTouchDrag(event)
}

function handlePointerCancel(event: PointerEvent): void {
  if (event.pointerId !== activeTouchPointerId.value) return

  resetTouchDrag(event)
}

function resetTouchDrag(event: PointerEvent): void {
  const rotationCard = event.currentTarget as HTMLElement
  if (rotationCard.hasPointerCapture?.(event.pointerId)) {
    rotationCard.releasePointerCapture(event.pointerId)
  }

  activeTouchPointerId.value = null
  draggedPlayerId.value = null
}

function tryCapturePointer(element: HTMLElement, pointerId: number): void {
  try {
    element.setPointerCapture?.(pointerId)
  } catch {
    // Some embedded browsers expose Pointer Events without pointer capture.
  }
}

function handleScoreEditingChange(command: ScoreEditingCommand): void {
  const nextEditingGameIds = new Set(editingGameIds.value)
  if (command.isEditing) nextEditingGameIds.add(command.gameId)
  else nextEditingGameIds.delete(command.gameId)
  editingGameIds.value = nextEditingGameIds
  emit('score-editing-change', command)
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
