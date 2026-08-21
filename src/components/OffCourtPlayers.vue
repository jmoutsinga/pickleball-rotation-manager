<template>
  <aside class="waiting-section">
    <h3>Waiting Players</h3>
    <div
      class="waiting-players"
      data-touch-waiting-target
      @dragover.prevent
      @drop.prevent="emit('player-drop', null)"
    >
      <div
        v-for="player in players"
        :key="player.id"
        class="player-card waiting"
        :data-touch-player-id="player.id"
        draggable="true"
        @dragstart="startDrag($event, player.id)"
        @dragover.prevent
        @drop.stop.prevent="emit('player-swap', player.id)"
      >
        {{ player.name }}
        <button
          type="button"
          class="remove-btn"
          :aria-label="`Remove ${player.name} from waiting Players`"
          @click.stop="emit('remove-player', player.id)"
        >
          ×
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Player } from '@/models'

defineOptions({ name: 'OffCourtPlayers' })

defineProps<{
  players: Player[]
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': [targetTeamId: null]
  'player-swap': [targetPlayerId: string]
  'remove-player': [playerId: string]
}>()

function startDrag(event: DragEvent, playerId: string): void {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }

  emit('player-drag-start', playerId)
}
</script>

<style scoped>
.waiting-section {
  width: 250px;
  padding: 15px;
  border: 2px solid #666;
  border-radius: 8px;
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

.player-card {
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  touch-action: none;
  user-select: none;
}

.player-card:hover {
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.remove-btn {
  padding: 0 5px;
  border: 0;
  background: none;
  color: #f44;
  cursor: pointer;
  font-size: 18px;
}

.remove-btn:hover {
  color: #c00;
}
</style>
