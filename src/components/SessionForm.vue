<template>
  <section class="session-form">
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
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Player } from '@/models'
import CardGrid from './CardGrid.vue'
import SessionPlayerCard from './SessionPlayerCard.vue'

defineOptions({ name: 'SessionForm' })

const props = withDefaults(defineProps<{
  availablePlayers: Array<Pick<Player, 'id' | 'name'>>
  selectedPlayerIds?: string[]
}>(), {
  selectedPlayerIds: () => []
})

const emit = defineEmits<{
  'selection-change': [playerIds: string[]]
}>()

const selectedIds = ref(new Set(props.selectedPlayerIds))

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
