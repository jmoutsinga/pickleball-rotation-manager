<template>
  <button
    type="button"
    class="session-player-card"
    :class="{ 'session-player-card--selected': isSelected }"
    :aria-label="`${isSelected ? 'Deselect' : 'Select'} ${player.name}`"
    :aria-pressed="isSelected"
    @click="emit('toggle', player.id)"
  >
    <svg
      v-if="isSelected"
      class="session-player-card__check"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="14" />
      <path
        class="session-player-card__check-mark"
        d="M8.5 16.5 13.2 21 24 9.5"
      />
    </svg>
    <span class="session-player-card__name">{{ player.name }}</span>
  </button>
</template>

<script setup lang="ts">
import type { Player } from '@/models'

defineOptions({ name: 'SessionPlayerCard' })

withDefaults(defineProps<{
  player: Pick<Player, 'id' | 'name'>
  isSelected?: boolean
}>(), {
  isSelected: false
})

const emit = defineEmits<{
  toggle: [playerId: string]
}>()
</script>

<style scoped>
.session-player-card {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border: 1px solid #d7dde3;
  border-radius: 10px;
  background: #fff;
  color: #2c3e50;
  cursor: pointer;
  font: inherit;
  transition: background-color 160ms ease, border-color 160ms ease,
    box-shadow 160ms ease;
}

.session-player-card:hover {
  border-color: #42b983;
  box-shadow: 0 4px 12px rgb(44 62 80 / 12%);
}

.session-player-card:focus-visible {
  outline: 3px solid rgb(66 185 131 / 35%);
  outline-offset: 2px;
}

.session-player-card--selected {
  border-color: #42b983;
  background: #e5f7ee;
}

.session-player-card__name {
  font-size: 1.05rem;
  font-weight: 700;
  text-align: center;
}

.session-player-card__check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
}

.session-player-card__check circle {
  fill: #fff;
  stroke: #42b983;
  stroke-width: 2;
}

.session-player-card__check-mark {
  fill: none;
  stroke: #2f9d6c;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.5;
}
</style>
