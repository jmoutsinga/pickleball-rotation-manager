import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ManageSession from '../views/ManageSession.vue'
import ManagePlayers from '../views/ManagePlayers.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/manage',
    name: 'manage',
    component: ManageSession
  },
  {
    path: '/manage-players',
    name: 'managePlayers',
    component: ManagePlayers
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
