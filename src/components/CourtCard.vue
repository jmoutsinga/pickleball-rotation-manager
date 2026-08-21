<template>
  <article
    class="court"
    :class="{ 'court--unused': !court.isUsable }"
    :aria-disabled="!court.isUsable"
  >
    <h3>Court {{ court.number }}</h3>
    <GameCard
      v-if="court.isUsable && court.game && court.teams"
      :game="court.game"
      :team-a="court.teams.A"
      :team-b="court.teams.B"
      :rotation-status="rotationStatus"
      @player-drag-start="emit('player-drag-start', $event)"
      @player-drop="emit('player-drop', $event)"
      @player-swap="emit('player-swap', $event)"
      @remove-player="emit('remove-player', $event)"
      @score-game="emit('score-game', $event)"
      @score-editing-change="emit('score-editing-change', $event)"
      @designate-winner="emit('designate-winner', $event)"
    />
    <p v-else class="court__unused-label">Inutilisé</p>
  </article>
</template>

<script setup lang="ts">
import GameCard from './GameCard.vue'
import type { RotationStatus } from '@/models'
import type {
  DesignateWinnerCommand,
  RotationCourtPresentation,
  ScoreEditingCommand,
  ScoreGameCommand
} from './rotationPresentation'

defineOptions({ name: 'CourtCard' })

defineProps<{
  court: RotationCourtPresentation
  rotationStatus: RotationStatus
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': [targetTeamId: string]
  'player-swap': [targetPlayerId: string]
  'remove-player': [playerId: string]
  'score-game': [command: ScoreGameCommand]
  'score-editing-change': [command: ScoreEditingCommand]
  'designate-winner': [command: DesignateWinnerCommand]
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
