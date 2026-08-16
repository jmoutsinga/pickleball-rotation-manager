<template>
  <form
    :id="formId"
    class="player-form"
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
        autocomplete="name"
        :aria-describedby="`${formId}-name-hint`"
      >

      <p
        :id="`${formId}-name-hint`"
        class="field-hint"
      >
        Use letters or numbers, with single hyphens between words.
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { Player } from '@/models'

type PlayerFormModel = Pick<Player, 'name'>

interface PlayerFormData {
  name: string
}

const props = defineProps<{
  formId: string
  player?: PlayerFormModel
}>()

const emit = defineEmits<{
  submit: [data: PlayerFormData]
}>()

const draft = reactive({
  name: props.player?.name ?? ''
})

function submitForm(): void {
  emit('submit', { name: draft.name })
}
</script>

<style scoped>
.player-form,
.form-field {
  display: grid;
  gap: 0.375rem;
}

.form-field label {
  font-weight: bold;
}

.form-field input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #b2bec3;
  border-radius: 0.25rem;
  background-color: white;
  color: #2c3e50;
  font: inherit;
}

.form-field input:focus {
  border-color: #42b983;
  outline: 2px solid rgb(66 185 131 / 25%);
}

.field-hint {
  margin: 0;
  color: #636e72;
  font-size: 0.875rem;
}
</style>
