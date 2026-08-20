// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import {
  LocationBuilder,
  PlayerBuilder,
  Session,
  SessionStatus
} from '@/models'
import { useSessionStore } from '@/stores/session'
import ManageSession from './ManageSession.vue'

const SessionFormStub = {
  name: 'SessionForm',
  props: ['locationName', 'sessionOrder', 'availablePlayers', 'selectedPlayerIds'],
  emits: ['selection-change', 'start'],
  template: `
    <section class="session-form-stub">
      <button class="change" @click="$emit('selection-change', ['player-2'])">Change</button>
      <button class="start" @click="$emit('start')">Start</button>
    </section>
  `
}

function mountView(session, players) {
  const location = new LocationBuilder()
    .withId('location-1')
    .withName('Central Club')
    .withNbCourts(2)
    .build()
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: true,
    initialState: {
      session: {
        location,
        session,
        rotation: null,
        courts: [],
        teams: [],
        players,
        sessions: [session]
      }
    }
  })
  const wrapper = mount(ManageSession, {
    global: {
      plugins: [pinia],
      stubs: { SessionForm: SessionFormStub }
    }
  })

  return { wrapper, store: useSessionStore() }
}

describe('ManageSession attendee preparation', () => {
  it('shows only SessionForm while the session is CREATED', () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder()
        .withId(`player-${index + 1}`)
        .withName(`player-${index + 1}`)
        .build()
    )
    const session = new Session('location-1', 3)
    session.updateAttendingPlayers(players.slice(0, 2))
    const { wrapper } = mountView(session, players)
    const form = wrapper.getComponent(SessionFormStub)

    expect(form.props('locationName')).toBe('Central Club')
    expect(form.props('sessionOrder')).toBe(3)
    expect(form.props('availablePlayers')).toEqual(players)
    expect(form.props('selectedPlayerIds'))
      .toEqual(players.slice(0, 2).map(player => player.id))
    expect(wrapper.find('.court-setup').exists()).toBe(false)
    expect(wrapper.find('.courts-container').exists()).toBe(false)
  })

  it('persists selection events and starts through the session store', async () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder()
        .withId(`player-${index + 1}`)
        .withName(`player-${index + 1}`)
        .build()
    )
    const { wrapper, store } = mountView(
      new Session('location-1', 1),
      players
    )

    await wrapper.get('.change').trigger('click')
    await wrapper.get('.start').trigger('click')

    expect(store.updateAttendingPlayers).toHaveBeenCalledWith(['player-2'])
    expect(store.startSession).toHaveBeenCalledOnce()
  })

  it('hides SessionForm and participant creation once the session is STARTED', async () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder()
        .withId(`player-${index + 1}`)
        .withName(`player-${index + 1}`)
        .build()
    )
    const startedSession = new Session(
      'location-1',
      1,
      new Date(),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1',
      players
    )
    const { wrapper } = mountView(startedSession, players)
    wrapper.vm.courtsInitialized = true
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(SessionFormStub).exists()).toBe(false)
    expect(wrapper.get('.session-identity').text()).toBe('Central Club # Session 1')
    expect(wrapper.get('h1').text()).toBe('Training Session Manager')
    expect(wrapper.find('.court-setup').exists()).toBe(false)
    expect(wrapper.find('.add-player-form').exists()).toBe(false)
  })
})
