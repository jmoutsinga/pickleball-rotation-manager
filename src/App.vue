<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/">Home</router-link> |
      <router-link to="/manage">Manage Session</router-link> |
      <router-link to="/manage-players">Manage Players</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'pickleball-rotation-manager',
  created () {
    document.title = "Session rotation manager";
  }
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.navbar {
  padding: 30px;
}

.navbar a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  margin: 0 10px;
}

.navbar a.router-link-exact-active {
  color: #42b983;
}
</style>
