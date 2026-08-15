
<template>
  <button
      class="create-entity-card"
      type="button"
      @click.stop="emit('activate')"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">

defineProps<{
  label: string
}>()

const emit = defineEmits<{
  activate: []
}>()

</script>

<style scoped>
.create-entity-card {
  width: 100%;
  min-height: 12rem;
  padding: 1.5rem;
  border: 2px dashed #42b983;
  border-radius: 10px;
  background-color: transparent;
  color: #2c3e50;
  font: inherit;
  font-weight: bold;
  cursor: pointer;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;

  transition:
      background-color 0.2s,
      border-color 0.2s;
}

.create-entity-card::before {
  content: "+";
  color: #42b983;
  font-size: 2.5rem;
  line-height: 1;
}

.create-entity-card:hover {
  background-color: #f0faf6;
  border-color: #3aa876;
}

.create-entity-card:focus-visible {
  outline: 3px solid #2c3e50;
  outline-offset: 3px;
}
</style>
