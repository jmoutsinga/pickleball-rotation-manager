<template>
  <article
    :id="`player-card-${player.id}`"
    class="player-card"
    :class="{
      'player-card--selected': isSelected,
      'player-card--deleted': isDeleted
    }"
    @click.stop
  >
    <h2>
      <button
        type="button"
        class="player-card-select"
        :aria-pressed="isSelected"
        @click="emit('select', player.id)"
      >
        {{ player.name }}
      </button>
    </h2>

    <p class="player-status">
      {{ player.status }}
    </p>

    <div
      v-if="isSelected"
      class="player-card-command-rail"
    >
      <template v-if="!isDeleted">
        <button
          type="button"
          class="player-card-command player-card-edit"
          :aria-label="`Edit ${player.name}`"
          @click="emit('edit', player.id)"
        >
          <svg
            class="player-card-action-icon player-card-action-icon--edit"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m5.5 18.5 1.1-4.4 8.8-8.8a2.2 2.2 0 0 1 3.1 3.1l-8.8 8.8-4.2 1.3Z" />
            <path d="m14.2 6.5 3.3 3.3M6.6 14.1l3.1 3.1" />
          </svg>
        </button>

        <button
          type="button"
          class="player-card-command player-card-delete"
          :aria-label="`Delete ${player.name}`"
          @click="emit('delete', player.id)"
        >
          <svg
            class="player-card-action-icon player-card-action-icon--delete"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m8.2 8.8.8 10h6l.8-10" />
            <path d="m7 7.4 10-1.7M10.1 6.8l-.3-1.7 4-.7.4 1.7" />
            <path d="m11 10.5.3 5.8M14 10l-.3 5.8" />
          </svg>
        </button>
      </template>

      <button
        v-else
        type="button"
        class="player-card-command player-card-restore"
        :aria-label="`Restore ${player.name}`"
        @click="emit('restore', player.id)"
      >
        <svg
          class="player-card-restore-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path class="restore-arc restore-arc--thin" d="M5.2 13.2A7.2 7.2 0 0 1 8.5 6" />
          <path class="restore-arc restore-arc--medium" d="M8.5 6A7.2 7.2 0 0 1 17 6.8" />
          <path class="restore-arc restore-arc--thick" d="M17 6.8a7.2 7.2 0 0 1 1.8 5.2" />
          <path class="restore-arrow" d="m15.8 10.1 3.1 2.2 1.7-3.4" />
          <circle class="restore-person" cx="12" cy="11" r="1.8" />
          <path class="restore-person" d="M8.8 17.1c.4-2 1.5-3 3.2-3s2.8 1 3.2 3" />
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '@/models'
import { PlayerStatus } from '@/models'

type PlayerCardModel = Pick<Player, 'id' | 'name' | 'status'>

const props = withDefaults(defineProps<{
  player: PlayerCardModel
  isSelected?: boolean
}>(), {
  isSelected: false
})

const emit = defineEmits<{
  select: [playerId: string]
  edit: [playerId: string]
  delete: [playerId: string]
  restore: [playerId: string]
}>()

const isDeleted = computed(() =>
  props.player.status === PlayerStatus.DELETED
)
</script>

<style scoped>
.player-card {
  position: relative;
  box-sizing: border-box;
  min-height: 12rem;
  padding: 4rem 1.25rem 1.25rem;
  border: 1px solid #b2bec3;
  border-radius: 10px;
  background-color: transparent;
  text-align: center;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.player-card:hover {
  background-color: #f5f5f5;
}

.player-card--deleted,
.player-card--deleted:hover {
  background-color: #e5e7eb;
  color: #4b5563;
}

.player-card--selected {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px #2196f3;
}

.player-card > h2 {
  margin-top: 0;
}

.player-card-select {
  padding: 0;
  border: 0;
  color: inherit;
  background: none;
  font: inherit;
  cursor: pointer;
}

.player-card-select::after {
  position: absolute;
  inset: 0;
  content: '';
}

.player-card-select:focus-visible::after {
  outline: 3px solid #2196f3;
  outline-offset: 3px;
}

.player-status {
  margin-bottom: 0;
  font-size: 0.8rem;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.player-card-command-rail {
  position: absolute;
  top: 3px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 0.625rem;
  transform: translateX(-50%);
}

.player-card-command {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  place-items: center;
  border: 1px solid #d6e0e5;
  border-radius: 50%;
  color: #34495e;
  background-color: #fff;
  box-shadow: 0 0.2rem 0.65rem rgb(44 62 80 / 12%);
  cursor: pointer;
}

.player-card-edit:hover {
  border-color: #64a8e8;
  color: #1769aa;
  background-color: #eef6ff;
}

.player-card-delete:hover {
  border-color: #e2877f;
  color: #b9342b;
  background-color: #fff1f0;
}

.player-card-restore:hover {
  border-color: #42b983;
  color: #247a58;
  background-color: #effaf5;
}

.player-card-command:focus-visible {
  outline: 3px solid #2196f3;
  outline-offset: 2px;
}

.player-card-action-icon,
.player-card-restore-icon {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.player-card-action-icon {
  stroke-width: 1.8;
}

.restore-arc--thin {
  stroke-width: 1.1;
}

.restore-arc--medium {
  stroke-width: 1.7;
}

.restore-arc--thick,
.restore-arrow {
  stroke-width: 2.3;
}

.restore-person {
  stroke-width: 1.5;
}
</style>
