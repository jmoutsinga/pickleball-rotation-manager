<template>
  <form class="session-form" @submit.prevent="emit('start')">
    <header class="session-form__header session-form__header--sticky">
      <h2>Session #{{ sessionOrder }}</h2>
      <button
        type="submit"
        class="session-form__start"
        :disabled="!canStart"
      >
        Start Session
      </button>
    </header>

    <div class="session-form__grid-scroll">
      <CardGrid class="session-form__grid">
        <SessionPlayerCard
          v-for="player in availablePlayers"
          :key="player.id"
          :player="player"
          :is-selected="selectedIds.has(player.id)"
          @toggle="togglePlayer"
        />
      </CardGrid>
      <p v-if="availablePlayers.length === 0" class="session-form__empty">
        No available players.
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Player } from '@/models'
import CardGrid from './CardGrid.vue'
import SessionPlayerCard from './SessionPlayerCard.vue'

defineOptions({ name: 'SessionForm' })

const props = withDefaults(defineProps<{
  sessionOrder: number
  availablePlayers: Array<Pick<Player, 'id' | 'name'>>
  selectedPlayerIds?: string[]
}>(), {
  selectedPlayerIds: () => []
})

const emit = defineEmits<{
  'selection-change': [playerIds: string[]]
  start: []
}>()

const selectedIds = ref(new Set(props.selectedPlayerIds))
const canStart = computed(() => selectedIds.value.size >= 4)

watch(
  () => props.selectedPlayerIds,
  playerIds => {
    selectedIds.value = new Set(playerIds)
  }
)

function togglePlayer(playerId: string): void {
  const nextSelection = new Set(selectedIds.value)

  if (nextSelection.has(playerId)) {
    nextSelection.delete(playerId)
  } else {
    nextSelection.add(playerId)
  }

  selectedIds.value = nextSelection
  emit('selection-change', [...nextSelection])
}
</script>

<style scoped>
.session-form {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  flex-direction: column;
}

.session-form__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  background: #fff;
}

.session-form__header--sticky {
  position: sticky;
  z-index: 2;
  top: 0;
}

.session-form__header h2 {
  margin: 0;
  text-align: left;
}

.session-form__start {
  padding: 8px 16px;
  border: 0;
  border-radius: 4px;
  background: #42b983;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.session-form__start:disabled {
  background: #b8c0c7;
  cursor: not-allowed;
}

.session-form__start:focus-visible {
  outline: 3px solid rgb(66 185 131 / 35%);
  outline-offset: 2px;
}

.session-form__grid-scroll {
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
  min-width: 0;
  padding: 0.5rem 0 1rem;
}

.session-form__grid {
  width: 100%;
  min-width: 0;
}

.session-form__empty {
  color: #66717c;
  text-align: left;
}
</style>
