import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ManageSession from '../views/ManageSession.vue'
import ManagePlayers from '../views/ManagePlayers.vue'
import { useSessionStore } from '@/stores/session'

async function ensureSessionGuard() {
  const sessionStore = useSessionStore()
  try {
    await sessionStore.ensureSession()
  } catch (error) {
    console.error('Session guard error:', error)
    return { name: 'home' }
  }
}

async function ensureIdentifiedSessionGuard(to) {
  const { locationId, sessionId } = to.params

  if (typeof locationId !== 'string' || typeof sessionId !== 'string') {
    return { name: 'home' }
  }

  const sessionStore = useSessionStore()
  try {
    await sessionStore.ensureSession({ locationId, sessionId })
  } catch (error) {
    console.error('Identified session guard error:', error)
    return { name: 'home' }
  }
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
    path: '/manage/:locationId/:sessionId',
    name: 'manageSession',
    component: ManageSession,
    beforeEnter: ensureIdentifiedSessionGuard
  },
  {
    path: '/manage-players',
    name: 'managePlayers',
    component: ManagePlayers,
    beforeEnter: ensureSessionGuard
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
