<template>
  <div
    class="manage-players"
    @click="clearSelection"
  >
    <h1>Manage Players</h1>

    <div class="player-filters">
      <div class="player-search-field">
        <label for="player-search">Search Players</label>
        <input
          id="player-search"
          v-model="searchQuery"
          type="search"
          placeholder="Search by name"
        >
      </div>

      <label class="deleted-player-toggle" for="show-deleted-players">
        <input
          id="show-deleted-players"
          v-model="showDeletedPlayers"
          class="deleted-player-toggle__control"
          type="checkbox"
          role="switch"
          :aria-checked="showDeletedPlayers"
        >
        <span>Show Deleted Players</span>
      </label>
    </div>

    <p
      v-if="playerActionError"
      class="page-error"
      role="alert"
    >
      {{ playerActionError }}
    </p>

    <CardGrid>
      <CreateEntityCard
        label="Create Player"
        @activate="openCreatePlayerModal"
      />

      <PlayerCard
        v-for="player in visiblePlayers"
        :key="player.id"
        :player="player"
        :is-selected="selectedPlayerId === player.id"
        @select="selectPlayer"
        @edit="openEditPlayerModal"
        @delete="openDeletePlayerModal"
        @restore="restorePlayer"
      />
    </CardGrid>

    <BaseModal
      :is-open="isPlayerModalOpen"
      :title="playerModalTitle"
      @close="closePlayerModal"
    >
      <PlayerForm
        :key="playerFormKey"
        :form-id="PLAYER_FORM_ID"
        :player="editingPlayer ?? undefined"
        @submit="savePlayer"
      />

      <p
        v-if="playerFormError"
        class="modal-error"
        role="alert"
      >
        {{ playerFormError }}
      </p>

      <template #actions>
        <button
          class="modal-action"
          :class="isEditingPlayer
            ? 'edit-player-cancel'
            : 'create-player-cancel'"
          type="button"
          @click="closePlayerModal"
        >
          Cancel
        </button>

        <button
          class="modal-action modal-action--primary"
          :class="isEditingPlayer
            ? 'edit-player-submit'
            : 'create-player-submit'"
          type="submit"
          :form="PLAYER_FORM_ID"
        >
          {{ playerSubmitLabel }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :is-open="deletingPlayer !== null"
      title="Delete Player"
      @close="closeDeletePlayerModal"
    >
      <p class="delete-player-message">
        Are you sure you want to delete
        <strong>{{ deletingPlayer?.name }}</strong>?
      </p>

      <p
        v-if="deletePlayerError"
        class="modal-error"
        role="alert"
      >
        {{ deletePlayerError }}
      </p>

      <template #actions>
        <button
          class="modal-action delete-player-cancel"
          type="button"
          @click="closeDeletePlayerModal"
        >
          Cancel
        </button>

        <button
          class="modal-action modal-action--danger delete-player-confirm"
          type="button"
          @click="confirmDeletePlayer"
        >
          Delete
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import type { Player } from '@/models'
import { PlayerStatus } from '@/models'
import BaseModal from '@/components/BaseModal.vue'
import CardGrid from '@/components/CardGrid.vue'
import CreateEntityCard from '@/components/CreateEntityCard.vue'
import PlayerCard from '@/components/PlayerCard.vue'
import PlayerForm from '@/components/PlayerForm.vue'
import { usePlayerStore } from '@/stores/player'

interface PlayerFormData {
  name: string
}

type PlayerTarget = Pick<Player, 'id' | 'name' | 'status'>

const PLAYER_FORM_ID = 'player-form'

const playerStore = usePlayerStore()
const selectedPlayerId = ref<string | null>(null)
const searchQuery = ref('')
const showDeletedPlayers = ref(false)
const isPlayerModalOpen = ref(false)
const editingPlayer = shallowRef<PlayerTarget | null>(null)
const deletingPlayer = shallowRef<PlayerTarget | null>(null)
const playerFormError = ref('')
const deletePlayerError = ref('')
const playerActionError = ref('')

const isEditingPlayer = computed(() => editingPlayer.value !== null)
const playerModalTitle = computed(() =>
  isEditingPlayer.value ? 'Edit Player' : 'Create Player'
)
const playerSubmitLabel = computed(() =>
  isEditingPlayer.value ? 'Save' : 'Create'
)
const playerFormKey = computed(() =>
  editingPlayer.value?.id ?? 'create-player'
)
const visiblePlayers = computed(() => {
  const query = normalizeSearchValue(searchQuery.value.trim())

  return playerStore.players.filter(player => {
    const matchesDeletedFilter = showDeletedPlayers.value ||
      player.status !== PlayerStatus.DELETED
    const matchesSearch = normalizeSearchValue(player.name).includes(query)

    return matchesDeletedFilter && matchesSearch
  })
})

watch(visiblePlayers, players => {
  if (
    selectedPlayerId.value !== null &&
    !players.some(player => player.id === selectedPlayerId.value)
  ) {
    selectedPlayerId.value = null
  }
})

onMounted(() => {
  playerStore.loadPlayers()
})

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
}

function selectPlayer(playerId: string): void {
  selectedPlayerId.value = playerId
}

function clearSelection(): void {
  selectedPlayerId.value = null
}

function openCreatePlayerModal(): void {
  editingPlayer.value = null
  playerFormError.value = ''
  isPlayerModalOpen.value = true
}

function openEditPlayerModal(playerId: string): void {
  const player = playerStore.players.find(
    candidate => candidate.id === playerId
  )

  if (!player || player.status === PlayerStatus.DELETED) return

  editingPlayer.value = player
  playerFormError.value = ''
  isPlayerModalOpen.value = true
}

function closePlayerModal(): void {
  isPlayerModalOpen.value = false
  editingPlayer.value = null
  playerFormError.value = ''
}

function savePlayer(formData: PlayerFormData): void {
  playerFormError.value = ''

  try {
    if (editingPlayer.value) {
      playerStore.updatePlayer({
        id: editingPlayer.value.id,
        ...formData
      })
    } else {
      const createdPlayer = playerStore.createPlayer(formData)

      searchQuery.value = ''
      selectedPlayerId.value = createdPlayer.id
    }

    closePlayerModal()
  } catch (error) {
    playerFormError.value = getErrorMessage(error)
  }
}

function openDeletePlayerModal(playerId: string): void {
  const player = playerStore.players.find(
    candidate => candidate.id === playerId
  )

  if (!player || player.status === PlayerStatus.DELETED) return

  deletingPlayer.value = player
  deletePlayerError.value = ''
}

function closeDeletePlayerModal(): void {
  deletingPlayer.value = null
  deletePlayerError.value = ''
}

function confirmDeletePlayer(): void {
  const playerId = deletingPlayer.value?.id

  if (!playerId) return

  deletePlayerError.value = ''

  try {
    playerStore.deletePlayer(playerId)

    if (!showDeletedPlayers.value) {
      selectedPlayerId.value = null
    }

    closeDeletePlayerModal()
  } catch (error) {
    deletePlayerError.value = getErrorMessage(error)
  }
}

function restorePlayer(playerId: string): void {
  playerActionError.value = ''

  try {
    playerStore.restorePlayer(playerId)
    selectedPlayerId.value = playerId
  } catch (error) {
    playerActionError.value = getErrorMessage(error)
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected player error'
}
</script>

<style scoped>
.manage-players {
  flex: 1;
  box-sizing: border-box;
  padding: 20px;
}

.player-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  align-items: end;
  justify-content: center;
  margin: 1.5rem auto;
}

.player-search-field {
  display: grid;
  gap: 0.375rem;
  width: min(100%, 22rem);
  text-align: left;
}

.player-search-field label {
  font-weight: bold;
}

.player-search-field input {
  padding: 0.625rem;
  border: 1px solid #b2bec3;
  border-radius: 0.25rem;
  font: inherit;
}

.player-search-field input:focus,
.deleted-player-toggle__control:focus-visible {
  outline: 3px solid #42b983;
  outline-offset: 2px;
}

.deleted-player-toggle {
  display: inline-flex;
  gap: 0.625rem;
  align-items: center;
  min-height: 2.75rem;
  font-weight: bold;
  cursor: pointer;
}

.deleted-player-toggle__control {
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 2.75rem;
  height: 1.5rem;
  margin: 0;
  appearance: none;
  border: 1px solid #89949f;
  border-radius: 999px;
  background-color: #c7ced4;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease,
    box-shadow 160ms ease;
}

.deleted-player-toggle__control::before {
  position: absolute;
  top: 50%;
  left: 0.125rem;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 1px 3px rgb(44 62 80 / 30%);
  content: '';
  transform: translate(0, -50%);
  transition: transform 160ms ease;
}

.deleted-player-toggle__control:checked {
  border-color: #2f9d6c;
  background-color: #42b983;
}

.deleted-player-toggle__control:checked::before {
  transform: translate(1.25rem, -50%);
}

.deleted-player-toggle:hover .deleted-player-toggle__control {
  border-color: #2f9d6c;
}

.modal-action {
  padding: 0.625rem 1rem;
  border: 1px solid #42b983;
  border-radius: 0.25rem;
  color: #2c3e50;
  background-color: white;
  font: inherit;
  cursor: pointer;
}

.modal-action--primary {
  color: white;
  background-color: #42b983;
}

.modal-action--danger {
  border-color: #f44336;
  color: white;
  background-color: #f44336;
}

.modal-action:focus-visible {
  outline: 3px solid #2c3e50;
  outline-offset: 3px;
}

.modal-error,
.page-error {
  color: #b42318;
  font-weight: bold;
}
</style>
