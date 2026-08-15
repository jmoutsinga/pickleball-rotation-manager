<template>
  <article
    class="location-card"
    :class="{ 'location-card--selected': isSelected }"
    :id="`location-card-${location.id}`"
    @click.stop
  >
    <h2>
      <button
        type="button"
        class="location-card-select"
        :aria-pressed="isSelected"
        @click="selectLocation"
      >
        {{ location.name }}
      </button>
    </h2>
    <p class="location-court-count">
      {{ courtLabel }}
    </p>
    <p class="location-description">
      {{ location.description }}
    </p>
    <div
      v-if="isSelected"
      class="location-card-command-rail"
    >
      <button
        type="button"
        class="location-card-command location-card-edit"
        :aria-label="`Edit ${location.name}`"
        @click="editLocation"
      >
        <svg
          class="location-card-action-icon location-card-action-icon--edit"
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
        class="location-card-command location-card-delete"
        :aria-label="`Delete ${location.name}`"
        @click="deleteLocation"
      >
        <svg
          class="location-card-action-icon location-card-action-icon--delete"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m8.2 8.8.8 10h6l.8-10" />
          <path d="m7 7.4 10-1.7M10.1 6.8l-.3-1.7 4-.7.4 1.7" />
          <path d="m11 10.5.3 5.8M14 10l-.3 5.8" />
        </svg>
      </button>
    </div>
    <div class="location-card-actions">
      <button
        v-if="isSelected && sessionActionLabel"
        type="button"
        class="location-card-session-action"
        :class="sessionActionClass"
        :aria-label="`${sessionActionLabel} for ${location.name}`"
        @click="manageSession"
      >
        <svg
          v-if="startedSessionCount === 0"
          class="location-card-session-icon location-card-session-icon--play"
          viewBox="0 0 40 40"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            class="location-card-session-icon-background"
            cx="20"
            cy="20"
            r="20"
          />
          <path
            class="location-card-session-icon-glyph"
            d="m15.5 11.5 15 8.5-15 8.5Z"
          />
        </svg>
        <svg
          v-else
          class="location-card-session-icon location-card-session-icon--fast-forward"
          viewBox="0 0 40 40"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            class="location-card-session-icon-background"
            cx="20"
            cy="20"
            r="20"
          />
          <path
            class="location-card-session-icon-glyph"
            d="m8.5 11.5 12 8.5-12 8.5ZM18 11.5 30 20l-12 8.5Z"
          />
        </svg>
        <span class="location-card-session-label">
          {{ sessionActionShortLabel }}
        </span>
      </button>
      <p
        v-else-if="isSelected"
        class="location-card-session-error"
        role="alert"
      >
        Multiple started sessions found. Session management is unavailable.
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Location } from '@/models'

type LocationCardModel = Pick<
  Location,
  'id' | 'name' | 'description' | 'nbCourts'
>

const props = withDefaults(defineProps<{
  location: LocationCardModel
  isSelected?: boolean
  startedSessionCount?: number
}>(), {
  isSelected: false,
  startedSessionCount: 0
})

const emit = defineEmits<{
  select: [locationId: string]
  edit: [locationId: string]
  delete: [locationId: string]
  session: [locationId: string]
}>()

const courtLabel = computed(() => {
  const nbCourts = props.location.nbCourts
  const courtTerm = nbCourts === 1 ? 'court' : 'courts'

  return `${nbCourts} ${courtTerm}`
})

const sessionActionLabel = computed(() => {
  if (props.startedSessionCount === 0) {
    return 'Start New Session'
  }

  if (props.startedSessionCount === 1) {
    return 'Manage Current Session'
  }

  return null
})

const sessionActionClass = computed(() =>
  props.startedSessionCount === 0
    ? 'location-card-session-action--start'
    : 'location-card-session-action--manage'
)

const sessionActionShortLabel = computed(() =>
  props.startedSessionCount === 0 ? 'Start' : 'Continue'
)

function selectLocation(): void {
  emit('select', props.location.id)
}

function editLocation(): void {
  emit('edit', props.location.id)
}

function deleteLocation(): void {
  emit('delete', props.location.id)
}

function manageSession(): void {
  emit('session', props.location.id)
}
</script>

<style scoped>
.location-card {
  position: relative;
  box-sizing: border-box;
  min-height: 12rem;
  padding: 5.25rem 1.25rem 1.25rem;
  border: 1px solid #b2bec3;
  border-radius: 10px;
  background-color: transparent;
  text-align: center;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.location-card:hover {
  background-color: #f5f5f5;
}

.location-card--selected {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px #2196F3;
}

.location-card > h2 {
  margin-top: 0;
}

.location-card-select {
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  background: none;
  cursor: pointer;
}

.location-card-select::after {
  position: absolute;
  inset: 0;
  content: '';
}

.location-card-select:focus-visible {
  outline: #2196F3;
}

.location-card-select:focus-visible::after {
  outline: 2px double red;
  outline-offset: 3px;
}

.location-card-command-rail {
  position: absolute;
  top: 3px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 0.625rem;
  transform: translateX(-50%);
}

.location-card-command {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  place-items: center;
  border: 1px solid #d6e0e5;
  border-radius: 50%;
  color: #34495e;
  background-color: #ffffff;
  box-shadow: 0 0.2rem 0.65rem rgb(44 62 80 / 12%);
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.location-card-command:hover {
  transform: translateY(-1px);
}

.location-card-edit:hover {
  border-color: #64a8e8;
  color: #1769aa;
  background-color: #eef6ff;
  box-shadow: 0 0.25rem 0.75rem rgb(23 105 170 / 18%);
}

.location-card-delete:hover {
  border-color: #e2877f;
  color: #b9342b;
  background-color: #fff1f0;
  box-shadow: 0 0.25rem 0.75rem rgb(185 52 43 / 18%);
}

.location-card-command:focus-visible {
  outline: 3px solid #2196F3;
  outline-offset: 2px;
}

.location-card-action-icon {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.location-card-session-action {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  align-items: center;
  width: 52px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.location-card-session-action--start {
  color: #42b983;
}

.location-card-session-action--manage {
  color: #FFAA1F;
}

.location-card-session-action:focus-visible {
  outline: 0;
}

.location-card-session-icon {
  display: block;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  transition:
    filter 0.18s ease,
    transform 0.18s ease;
}

.location-card-session-icon-background {
  fill: currentColor;
}

.location-card-session-action--start .location-card-session-icon-glyph {
  fill: white;
}

.location-card-session-action--manage .location-card-session-icon-glyph {
  fill: #2c3e50;
}

.location-card-session-label {
  color: currentColor;
  font-size: 0.7rem;
  line-height: 1;
}

.location-card-session-action:hover .location-card-session-icon {
  filter: brightness(0.96);
  transform: translateY(-1px);
}

.location-card-session-action:focus-visible .location-card-session-icon {
  outline: 3px solid #2c3e50;
  outline-offset: -3px;
}

.location-description {
  min-height: 1.5em;
}

.location-card-session-error {
  color: #c0392b;
}

</style>
