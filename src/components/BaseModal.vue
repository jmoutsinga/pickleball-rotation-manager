<template>
  <div
      v-if="isOpen"
      class="modal-backdrop"
      @click.stop
  >
    <dialog
        open
        class="modal"
        aria-modal="true"
        :aria-label="title"
    >
      <header class="modal__header">
        <h2>{{ title }}</h2>

        <button
            class="modal__close"
            type="button"
            aria-label="Close"
            @click="emit('close')"
        >
          ×
        </button>
      </header>

      <div class="modal__content">
        <slot />
      </div>

      <footer
          v-if="$slots.actions"
          class="modal__actions"
      >
        <slot name="actions" />
      </footer>
    </dialog>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 1rem;
  background-color: rgb(0 0 0 / 50%);

  display: grid;
  place-items: center;
}

.modal {
  box-sizing: border-box;
  width: min(100%, 36rem);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;

  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1rem 2rem rgb(0 0 0 / 25%);
  color: #2c3e50;
  text-align: left;
}

.modal__header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dfe6e9;
}

.modal__header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.modal__close {
  border: 0;
  background: transparent;
  color: #2c3e50;
  font: inherit;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
}

.modal__close:focus-visible {
  outline: 3px solid #42b983;
  outline-offset: 3px;
}

.modal__content {
  padding: 1.5rem;
}

.modal__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dfe6e9;
}
</style>
