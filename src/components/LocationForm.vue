<template>
  <form
      :id="formId"
      class="location-form"
      @submit.prevent="submitForm"
  >
    <div class="form-field">
      <label :for="`${formId}-name`">
        Name
      </label>

      <input
          :id="`${formId}-name`"
          v-model.trim="draft.name"
          name="name"
          type="text"
          required
      >
    </div>

    <div class="form-field">
      <label :for="`${formId}-description`">
        Description
      </label>

      <textarea
          :id="`${formId}-description`"
          v-model.trim="draft.description"
          name="description"
          rows="4"
      />
    </div>

    <div class="form-field">
      <label :for="`${formId}-nb-courts`">
        Number of courts
      </label>

      <input
          :id="`${formId}-nb-courts`"
          v-model.number="draft.nbCourts"
          name="nbCourts"
          type="number"
          required
          min="1"
          max="50"
          step="1"
          :disabled="!canEditNbCourts"
          :aria-describedby="canEditNbCourts
            ? undefined
            : `${formId}-nb-courts-restriction`"
      >

      <p
          v-if="!canEditNbCourts"
          :id="`${formId}-nb-courts-restriction`"
          class="nb-courts-restriction"
      >
        The number of courts cannot be changed while this location has a
        started session.
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { Location } from '@/models'

type LocationFormModel = Pick<
  Location,
  'name' | 'description' | 'nbCourts'
>

interface LocationFormData {
  name: string
  description: string
  nbCourts: number
}

const props = withDefaults(defineProps<{
  formId: string
  location?: LocationFormModel
  canEditNbCourts?: boolean
}>(), {
  canEditNbCourts: true
})

const emit = defineEmits<{
  submit: [data: LocationFormData]
}>()

const draft = reactive({
  name: props.location?.name ?? '',
  description: props.location?.description ?? '',
  nbCourts: props.location?.nbCourts ?? 2
})

function submitForm(): void {
  emit('submit', {
    name: draft.name,
    description: draft.description,
    nbCourts: draft.nbCourts
  })
}
</script>

<style scoped>
.location-form {
  display: grid;
  gap: 1rem;
}

.form-field {
  display: grid;
  gap: 0.375rem;
}

.form-field label {
  font-weight: bold;
}

.form-field input,
.form-field textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 0.625rem;

  border: 1px solid #b2bec3;
  border-radius: 0.25rem;
  background-color: white;
  color: #2c3e50;
  font: inherit;
}

.form-field textarea {
  resize: vertical;
}

.form-field input:disabled {
  color: #636e72;
  background-color: #f1f2f6;
  cursor: not-allowed;
}

.nb-courts-restriction {
  margin: 0;
  color: #b45309;
  font-size: 0.875rem;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: #42b983;
  outline: 2px solid rgb(66 185 131 / 25%);
}
</style>
