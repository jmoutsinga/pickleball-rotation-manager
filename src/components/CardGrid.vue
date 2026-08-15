<template>
  <div class="card-grid">
    <slot />
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(min(100%, 350px), 350px)
  );
  gap: 1rem;
  align-items: stretch;
  justify-content: center;
}
</style>
