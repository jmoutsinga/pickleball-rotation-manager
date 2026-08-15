<template>
  <div class="app">
    <nav class="navbar">
      <router-link to="/">Home</router-link> |
      <router-link to="/manage">Manage Session</router-link> |
      <router-link to="/manage-players">Manage Players</router-link>
    </nav>
    <main class="app-content">
      <router-view/>
    </main>
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
html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;
}

.app {
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 20px;
}

.app-content {
  display: flex;
  flex: 1;
  flex-direction: column;
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

/* noinspection CssUnusedSymbol */
.navbar a.router-link-exact-active {
  color: #42b983;
}
</style>
