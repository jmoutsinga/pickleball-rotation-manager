<template>
  <div class="home" @click="clearSelection">
    <button
      v-if="canInitializeSampleData"
      class="sample-data-initializer"
      type="button"
      @click.stop="handleSampleDataInitialization"
    >
      Initialize sample data
    </button>
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
        :open-session-count="openSessionsForLocation(location.id).length"
        :open-session-status="openSessionsForLocation(location.id)[0]?.status ?? null"
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
import {
  hasSampleDataBeenInitialized,
  initializeSampleData
} from '@/services/sampleData'
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
const canInitializeSampleData = ref(!hasSampleDataBeenInitialized())
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

function handleSampleDataInitialization(): void {
  const initialized = initializeSampleData()

  if (initialized) {
    locationStore.loadLocations()
  }

  canInitializeSampleData.value = false
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
  const openSessions = openSessionsForLocation(locationId)
  let session: Session

  if (openSessions.length === 0) {
    session = sessionStore.createSessionForLocation(locationId)
  } else if (openSessions.length === 1) {
    session = openSessions[0]
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

function openSessionsForLocation(locationId: string): Session[] {
  return sessionStore.openSessionsByLocationId(locationId) as Session[]
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

.sample-data-initializer {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #237a57;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #42b983, #2f9d6c);
  box-shadow: 0 5px 14px rgb(47 157 108 / 28%);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  transition: box-shadow 160ms ease, transform 160ms ease;
}

.sample-data-initializer:hover {
  box-shadow: 0 7px 18px rgb(47 157 108 / 38%);
  transform: translateY(-1px);
}

.sample-data-initializer:focus-visible {
  outline: 3px solid #2c3e50;
  outline-offset: 3px;
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
