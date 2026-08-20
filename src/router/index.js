import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ManageSession from '../views/ManageSession.vue'
import ManagePlayers from '../views/ManagePlayers.vue'
import NotFoundView from '../views/NotFoundView.vue'
import InternalErrorView from '../views/InternalErrorView.vue'
import {
  ErrorCode,
  isApplicationError
} from '@/errors/ApplicationError'
import { useSessionStore } from '@/stores/session'

export function internalErrorNavigation(error, fallbackCode) {
  const codeError = isApplicationError(error)
    ? error.code
    : fallbackCode
  const errorUuid = crypto.randomUUID()

  console.error('Internal application error', {
    codeError,
    errorUuid,
    error
  })

  return {
    name: 'internalError',
    query: { codeError, errorUuid }
  }
}

async function ensureSessionGuard() {
  const sessionStore = useSessionStore()
  try {
    await sessionStore.ensureSession()
  } catch (error) {
    return internalErrorNavigation(
      error,
      ErrorCode.SESSION_INITIALIZATION_FAILED
    )
  }
}

async function ensureIdentifiedSessionGuard(to) {
  const { locationId, sessionId } = to.params

  if (typeof locationId !== 'string' || typeof sessionId !== 'string') {
    return { name: 'notFound' }
  }

  const sessionStore = useSessionStore()
  try {
    await sessionStore.ensureSession({ locationId, sessionId })
  } catch (error) {
    if (isApplicationError(error) && error.httpStatus === 404) {
      return { name: 'notFound' }
    }

    return internalErrorNavigation(error, ErrorCode.SESSION_LOAD_FAILED)
  }
}

function queryString(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback
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
    component: ManagePlayers
  },
  {
    path: '/not-found',
    name: 'notFound',
    component: NotFoundView
  },
  {
    path: '/500',
    name: 'internalError',
    component: InternalErrorView,
    props: route => ({
      codeError: queryString(
        route.query.codeError,
        ErrorCode.UNEXPECTED_ERROR
      ),
      errorUuid: queryString(route.query.errorUuid, crypto.randomUUID())
    })
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFoundCatchAll',
    redirect: { name: 'notFound' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
