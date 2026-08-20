<template>
  <section class="team" :class="`team-${variant}`">
    <h4>{{ label }}</h4>
    <div
      class="team-players"
      @dragover.prevent
      @drop.prevent="emit('player-drop')"
    >
      <div
        v-for="player in team.players"
        :key="player.id"
        class="player-card team-player"
        draggable="true"
        @dragstart="startDrag($event, player.id)"
      >
        {{ player.name }}
        <button
          type="button"
          class="remove-btn"
          :aria-label="`Remove ${player.name} from ${label}`"
          @click="emit('remove-player', player.id)"
        >
          ×
        </button>
      </div>
      <div v-if="team.players.length < 2" class="player-slot">
        Drag player here ({{ team.players.length }}/2)
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Team } from '@/models'

defineOptions({ name: 'TeamCard' })

defineProps<{
  team: Team
  label: string
  variant: 'a' | 'b'
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': []
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
.team {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.team h4 {
  margin: 0 0 10px;
  color: #42b983;
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

.player-card {
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
}

.player-card:hover {
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.team-player {
  background-color: #e1f5eb;
  border: 1px solid #42b983;
}

.team-b .team-player {
  background-color: #f5e1eb;
  border-color: #b94283;
}

.player-slot {
  padding: 10px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  color: #666;
  text-align: center;
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
