// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import {
  LocationBuilder,
  PlayerBuilder,
  Rotation,
  RotationStatus,
  Session,
  SessionStatus
} from '@/models'
import { useSessionStore } from '@/stores/session'
import ManageSession from './ManageSession.vue'

const SessionFormStub = {
  name: 'SessionForm',
  props: ['availablePlayers', 'selectedPlayerIds'],
  emits: ['selection-change'],
  template: `
    <section class="session-form-stub">
      <button class="change" @click="$emit('selection-change', ['player-2'])">Change</button>
    </section>
  `
}

const RotationCardStub = {
  name: 'RotationCard',
  props: [
    'courts',
    'waitingPlayers',
    'rotationOrder',
    'rotationStatus',
    'canStartRotation',
    'canPlanNextRotation'
  ],
  emits: [
    'move-player',
    'remove-player',
    'start-rotation',
    'stop-rotation',
    'next-rotation'
  ],
  template: `
    <section class="rotation-card-stub">
      <button class="move-player" @click="$emit('move-player', { playerId: 'player-1', targetTeamId: 'team-a' })">Move</button>
      <button class="remove-player" @click="$emit('remove-player', 'player-1')">Remove</button>
      <button class="start-rotation" @click="$emit('start-rotation')">Start Rotation</button>
      <button class="stop-rotation" @click="$emit('stop-rotation')">Stop Rotation</button>
      <button class="next-rotation" @click="$emit('next-rotation')">Next Rotation</button>
    </section>
  `
}

function mountView(session, players, rotation = null) {
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
        rotation,
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
      stubs: {
        SessionForm: SessionFormStub,
        RotationCard: RotationCardStub
      }
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

    expect(form.props('availablePlayers')).toEqual(players)
    expect(form.props('selectedPlayerIds'))
      .toEqual(players.slice(0, 2).map(player => player.id))
    expect(wrapper.find('.court-setup').exists()).toBe(false)
    expect(wrapper.find('.courts-container').exists()).toBe(false)
    expect(wrapper.get('.session-identity').text())
      .toBe('Central Club # Session 3')
    expect(wrapper.get('.manage-session__header').classes())
      .toContain('manage-session__header--sticky')
    expect(wrapper.get('.manage-session__start').attributes('disabled'))
      .toBeDefined()
    expect(wrapper.findAll('h2')).toHaveLength(1)
  })

  it('persists selection events and starts through the session store', async () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder()
        .withId(`player-${index + 1}`)
        .withName(`player-${index + 1}`)
        .build()
    )
    const session = new Session('location-1', 1)
    session.updateAttendingPlayers(players)
    const { wrapper, store } = mountView(session, players)

    await wrapper.get('.change').trigger('click')
    await wrapper.get('.manage-session__start').trigger('click')

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
    const rotation = new Rotation(
      startedSession.id,
      2,
      [],
      players,
      'rotation-2',
      RotationStatus.CREATED
    )
    const { wrapper, store } = mountView(startedSession, players, rotation)
    const rotationCard = wrapper.getComponent(RotationCardStub)

    expect(wrapper.findComponent(SessionFormStub).exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Training Session Manager')
    expect(wrapper.get('.session-identity').text())
      .toBe('Central Club # Session 1')
    expect(wrapper.find('.manage-session__start').exists()).toBe(false)
    expect(wrapper.findAll('h2')).toHaveLength(1)
    expect(rotationCard.props('rotationOrder')).toBe(2)
    expect(rotationCard.props('rotationStatus')).toBe(RotationStatus.CREATED)
    expect(rotationCard.props('canStartRotation')).toBe(false)
    expect(rotationCard.props('canPlanNextRotation')).toBe(false)

    await wrapper.get('.move-player').trigger('click')
    await wrapper.get('.remove-player').trigger('click')
    await wrapper.get('.start-rotation').trigger('click')
    await wrapper.get('.stop-rotation').trigger('click')
    await wrapper.get('.next-rotation').trigger('click')

    expect(store.movePlayer).toHaveBeenCalledWith({
      playerId: 'player-1',
      targetTeamId: 'team-a'
    })
    expect(store.removePlayer).toHaveBeenCalledWith('player-1')
    expect(store.startRotation).toHaveBeenCalledOnce()
    expect(store.startRotationScoring).toHaveBeenCalledOnce()
    expect(store.planNextRotation).toHaveBeenCalledOnce()
  })
})
