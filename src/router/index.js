import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ManageSession from '../views/ManageSession.vue'
import ManagePlayers from '../views/ManagePlayers.vue'
import { useSessionStore } from '@/stores/session'

async function ensureSessionGuard() {
  const sessionStore = useSessionStore()
  await sessionStore.ensureSession()
}


const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/manage',
    name: 'manage',
    component: ManageSession,
    beforeEnter: ensureSessionGuard
  },
  {
    path: '/manage-players',
    name: 'managePlayers',
    component: ManagePlayers,
    beforeEnter: ensureSessionGuard
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
