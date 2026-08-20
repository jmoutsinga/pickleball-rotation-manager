<template>
  <section class="internal-error" aria-labelledby="internal-error-title">
    <h1 id="internal-error-title">500 - Internal Server Error</h1>
    <p class="internal-error__message">{{ errorMessage }}</p>

    <div class="internal-error__actions">
      <button
        type="button"
        class="internal-error__copy"
        aria-label="Copier le message d'erreur"
        @click="copyErrorMessage"
      >
        <svg
          class="internal-error__copy-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" />
        </svg>
        Copier le message
      </button>

      <RouterLink class="internal-error__home-link" :to="{ name: 'home' }">
        Back to Home
      </RouterLink>
    </div>

    <output
      v-if="messageCopied"
      class="internal-error__notification"
    >
      message copié
    </output>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  codeError: string
  errorUuid: string
}>()

const errorMessage = computed(() =>
  'erreur interne, merci de contacter l\'administrateur en indiquant ' +
  `ce code erreur : ${props.codeError} - ${props.errorUuid}`
)
const messageCopied = ref(false)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

async function copyErrorMessage(): Promise<void> {
  await writeToClipboard(errorMessage.value)
  messageCopied.value = true

  if (notificationTimer) clearTimeout(notificationTimer)
  notificationTimer = setTimeout(() => {
    messageCopied.value = false
    notificationTimer = null
  }, 2500)
}

async function writeToClipboard(message: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(message)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = message
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()

  if (!copied) throw new Error('Unable to copy the internal error message')
}

onBeforeUnmount(() => {
  if (notificationTimer) clearTimeout(notificationTimer)
})
</script>

<style scoped>
.internal-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 2rem;
  text-align: center;
}

.internal-error h1 {
  margin-bottom: 0.5rem;
}

.internal-error__message {
  max-width: 48rem;
  margin-top: 0;
}

.internal-error__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1rem;
}

.internal-error__copy,
.internal-error__home-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 0;
  border-radius: 0.5rem;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
}

.internal-error__copy {
  background: #4a5568;
}

.internal-error__home-link {
  background: #2f855a;
}

.internal-error__copy:focus-visible,
.internal-error__home-link:focus-visible {
  outline: 3px solid #2c3e50;
  outline-offset: 3px;
}

.internal-error__copy-icon {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.internal-error__notification {
  position: fixed;
  z-index: 10;
  right: 1.5rem;
  bottom: 1.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #2d3748;
  color: #fff;
  box-shadow: 0 0.5rem 1.25rem rgb(0 0 0 / 20%);
}

</style>
