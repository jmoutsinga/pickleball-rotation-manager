<template>
  <section class="game-card court-teams">
    <TeamCard
      :team="teamA"
      label="Team A"
      variant="a"
      @player-drag-start="emit('player-drag-start', $event)"
      @player-drop="emit('player-drop', teamA.id)"
      @remove-player="emit('remove-player', $event)"
    />

    <div class="team-divider">VS</div>

    <TeamCard
      :team="teamB"
      label="Team B"
      variant="b"
      @player-drag-start="emit('player-drag-start', $event)"
      @player-drop="emit('player-drop', teamB.id)"
      @remove-player="emit('remove-player', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import type { Team } from '@/models'
import TeamCard from './TeamCard.vue'

defineOptions({ name: 'GameCard' })

defineProps<{
  teamA: Team
  teamB: Team
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': [targetTeamId: string]
  'remove-player': [playerId: string]
}>()
</script>

<style scoped>
.court-teams {
  display: flex;
  gap: 20px;
  align-items: stretch;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
}

.team-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  color: #666;
  font-weight: bold;
}
</style>
