<template>
  <article
    class="court"
    :class="{ 'court--unused': !court.isUsable }"
    :aria-disabled="!court.isUsable"
  >
    <h3>Court {{ court.number }}</h3>
    <GameCard
      v-if="court.isUsable && court.teams"
      :team-a="court.teams.A"
      :team-b="court.teams.B"
      @player-drag-start="emit('player-drag-start', $event)"
      @player-drop="emit('player-drop', $event)"
      @remove-player="emit('remove-player', $event)"
    />
    <p v-else class="court__unused-label">Inutilisé</p>
  </article>
</template>

<script setup lang="ts">
import GameCard from './GameCard.vue'
import type { RotationCourtPresentation } from './rotationPresentation'

defineOptions({ name: 'CourtCard' })

defineProps<{
  court: RotationCourtPresentation
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': [targetTeamId: string]
  'remove-player': [playerId: string]
}>()
</script>

<style scoped>
.court {
  padding: 15px;
  border: 2px solid #42b983;
  border-radius: 8px;
  background-color: #f8f8f8;
}

.court h3 {
  margin-top: 0;
  color: #42b983;
}

.court--unused {
  border-color: #aeb4b9;
  background-color: #e1e4e7;
}

.court--unused h3 {
  color: #616970;
}

.court__unused-label {
  margin: 0;
  color: #616970;
  font-weight: 700;
}
</style>
