<template>
  <section class="not-found" aria-labelledby="not-found-title">
    <h1 id="not-found-title">404 - Page Not Found</h1>
    <p>The page you requested does not exist.</p>
    <RouterLink class="not-found-home-link" :to="{ name: 'home' }">
      Back to Home
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 2rem;
}

.not-found h1 {
  margin-bottom: 0.5rem;
}

.not-found p {
  margin-top: 0;
}

.not-found-home-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  background: #2f855a;
  color: #ffffff;
  font-weight: bold;
  text-decoration: none;
}

.not-found-home-link:focus-visible {
  outline: 3px solid #2c3e50;
  outline-offset: 3px;
}
</style>
