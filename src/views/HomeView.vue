<template>
  <div class="home" @click="clearSelection">
    <h1>Pickleball Training Session Manager</h1>
    <p>Welcome to the Pickleball Training Session Manager !</p>
    <p>This application helps you manage player rotations during a pickleball training session.</p>
    <CardGrid>
      <CreateEntityCard
        label="Create Location"
        @activate="openCreateLocationModal"
      />
      <LocationCard
        v-for="location in locationStore.locations"
        :key="location.id"
        :location="location"
        :is-selected="selectedLocationId === location.id"
        :started-session-count="sessionStore.startedSessionsByLocationId(location.id).length"
        @select="selectLocation"
        @edit="openEditLocationModal"
        @delete="openDeleteLocationModal"
        @session="handleSessionAction"
      />
    </CardGrid>

    <BaseModal
      :is-open="isLocationModalOpen"
      :title="locationModalTitle"
      @close="closeLocationModal"
    >
      <LocationForm
        :key="locationFormKey"
        :form-id="LOCATION_FORM_ID"
        :location="editingLocation ?? undefined"
        :can-edit-nb-courts="canEditLocationCourtCount"
        @submit="saveLocation"
      />

      <template #actions>
        <button
          class="modal-action"
          :class="isEditingLocation
            ? 'edit-location-cancel'
            : 'create-location-cancel'"
          type="button"
          @click="closeLocationModal"
        >
          Cancel
        </button>

        <button
          class="modal-action modal-action--primary"
          :class="isEditingLocation
            ? 'edit-location-submit'
            : 'create-location-submit'"
          type="submit"
          :form="LOCATION_FORM_ID"
        >
          {{ locationSubmitLabel }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :is-open="deletingLocation !== null"
      title="Delete Location"
      @close="closeDeleteLocationModal"
    >
      <p class="delete-location-message">
        Are you sure you want to delete
        <strong>{{ deletingLocation?.name }}</strong>?
      </p>

      <template #actions>
        <button
          class="modal-action delete-location-cancel"
          type="button"
          @click="closeDeleteLocationModal"
        >
          Cancel
        </button>

        <button
          class="modal-action modal-action--danger delete-location-confirm"
          type="button"
          @click="confirmDeleteLocation"
        >
          Delete
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import type { Location, Session } from '@/models'
import BaseModal from '@/components/BaseModal.vue'
import CardGrid from '@/components/CardGrid.vue'
import CreateEntityCard from '@/components/CreateEntityCard.vue'
import LocationCard from '@/components/LocationCard.vue'
import LocationForm from '@/components/LocationForm.vue'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'

interface LocationFormData {
  name: string
  description: string
  nbCourts: number
}

type EditableLocation = Pick<
  Location,
  'id' | 'name' | 'description' | 'nbCourts'
>

type DeleteLocationTarget = Pick<Location, 'id' | 'name'>

const LOCATION_FORM_ID = 'location-form'

const locationStore = useLocationStore()
const sessionStore = useSessionStore()
const router = useRouter()
const selectedLocationId = ref<string | null>(null)
const isLocationModalOpen = ref(false)
const editingLocation = shallowRef<EditableLocation | null>(null)
const deletingLocation = shallowRef<DeleteLocationTarget | null>(null)

const isEditingLocation = computed(() => editingLocation.value !== null)
const locationModalTitle = computed(() =>
  isEditingLocation.value ? 'Edit Location' : 'Create Location'
)
const locationSubmitLabel = computed(() =>
  isEditingLocation.value ? 'Save' : 'Create'
)
const locationFormKey = computed(() =>
  editingLocation.value?.id ?? 'create-location'
)
const canEditLocationCourtCount = computed(() =>
  editingLocation.value === null ||
  sessionStore.canEditCourtCountByLocationId(editingLocation.value.id)
)

onMounted(() => {
  locationStore.loadLocations()
  sessionStore.loadSessions()
})

function selectLocation(locationId: string): void {
  selectedLocationId.value = locationId
}

function openCreateLocationModal(): void {
  editingLocation.value = null
  isLocationModalOpen.value = true
}

function openEditLocationModal(locationId: string): void {
  const location = locationStore.locations.find(
    candidate => candidate.id === locationId
  )

  if (!location) {
    return
  }

  editingLocation.value = location
  isLocationModalOpen.value = true
}

function closeLocationModal(): void {
  isLocationModalOpen.value = false
  editingLocation.value = null
}

function openDeleteLocationModal(locationId: string): void {
  const location = locationStore.locations.find(
    candidate => candidate.id === locationId
  )

  if (!location) {
    return
  }

  deletingLocation.value = location
}

function closeDeleteLocationModal(): void {
  deletingLocation.value = null
}

function confirmDeleteLocation(): void {
  const locationId = deletingLocation.value?.id

  if (!locationId) {
    return
  }

  locationStore.deleteLocation(locationId)

  if (selectedLocationId.value === locationId) {
    selectedLocationId.value = null
  }

  closeDeleteLocationModal()
}

function saveLocation(formData: LocationFormData): void {
  if (editingLocation.value) {
    locationStore.updateLocation({
      id: editingLocation.value.id,
      ...formData
    })
  } else {
    const createdLocation = locationStore.createLocation(formData)

    selectedLocationId.value = createdLocation.id
  }

  closeLocationModal()
}

function handleSessionAction(locationId: string): void {
  const startedSessions: Session[] =
    sessionStore.startedSessionsByLocationId(locationId)
  let session: Session

  if (startedSessions.length === 0) {
    session = sessionStore.createSessionForLocation(locationId)
  } else if (startedSessions.length === 1) {
    session = startedSessions[0]
  } else {
    return
  }

  void router.push({
    name: 'manageSession',
    params: {
      locationId,
      sessionId: session.id
    }
  })
}

function clearSelection(): void {
  selectedLocationId.value = null
}
</script>

<style scoped>
.home {
  flex: 1;
  box-sizing: border-box;
  padding: 20px;
}

.modal-action {
  padding: 0.625rem 1rem;
  border: 1px solid #42b983;
  border-radius: 0.25rem;
  background-color: white;
  color: #2c3e50;
  font: inherit;
  cursor: pointer;
}

.modal-action--primary {
  background-color: #42b983;
  color: white;
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
</style>
