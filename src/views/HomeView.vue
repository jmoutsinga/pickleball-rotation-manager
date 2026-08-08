<template>
  <div class="home">
    <h1>Pickleball Training Session Manager</h1>
    <p>Welcome to the Pickleball Training Session Manager !</p>
    <p>This application helps you manage player rotations during a pickleball training session.</p>
    <router-link to="/manage" class="start-button">Start Managing Session</router-link>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.start-button {
  display: inline-block;
  background-color: #42b983;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 20px;
  transition: background-color 0.3s;
}

.start-button:hover {
  background-color: #3aa876;
}
</style>
