// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import {
  Game,
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
    'swap-player',
    'remove-player',
    'start-rotation',
    'stop-rotation',
    'next-rotation',
    'score-game',
    'score-editing-change',
    'designate-winner'
  ],
  template: `
    <section class="rotation-card-stub">
      <button class="move-player" @click="$emit('move-player', { playerId: 'player-1', targetTeamId: 'team-a' })">Move</button>
      <button class="swap-player" @click="$emit('swap-player', { playerId: 'player-1', targetPlayerId: 'player-2' })">Swap</button>
      <button class="remove-player" @click="$emit('remove-player', 'player-1')">Remove</button>
      <button class="start-rotation" @click="$emit('start-rotation')">Start Rotation</button>
      <button class="stop-rotation" @click="$emit('stop-rotation')">Stop Rotation</button>
      <button class="next-rotation" @click="$emit('next-rotation')">Next Rotation</button>
      <button class="score-game" @click="$emit('score-game', { gameId: 'game-1', scoreTeamA: 11, scoreTeamB: 7 })">Score Game</button>
      <button class="score-editing" @click="$emit('score-editing-change', { gameId: 'game-1', isEditing: true })">Edit Score</button>
      <button class="score-edited" @click="$emit('score-editing-change', { gameId: 'game-1', isEditing: false })">Close Score</button>
      <button class="designate-winner" @click="$emit('designate-winner', { gameId: 'game-1', winnerTeamId: 'team-a' })">Designate Winner</button>
    </section>
  `
}

function mountView(session, players, rotation = null) {
  const routerPush = vi.fn()
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
      },
      mocks: {
        $router: { push: routerPush }
      }
    }
  })

  return { wrapper, store: useSessionStore(), routerPush }
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
    expect(wrapper.find('.manage-session__end').exists()).toBe(false)
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
    expect(wrapper.find('.manage-session__end').exists()).toBe(true)
    expect(wrapper.get('.manage-session__header').element.children[1]
      .classList).toContain('manage-session__end')
    expect(wrapper.findAll('h2')).toHaveLength(1)
    expect(rotationCard.props('rotationOrder')).toBe(2)
    expect(rotationCard.props('rotationStatus')).toBe(RotationStatus.CREATED)
    expect(rotationCard.props('canStartRotation')).toBe(false)
    expect(rotationCard.props('canPlanNextRotation')).toBe(false)

    await wrapper.get('.move-player').trigger('click')
    await wrapper.get('.swap-player').trigger('click')
    await wrapper.get('.remove-player').trigger('click')
    await wrapper.get('.start-rotation').trigger('click')
    await wrapper.get('.stop-rotation').trigger('click')
    await wrapper.get('.next-rotation').trigger('click')
    await wrapper.get('.score-game').trigger('click')
    await wrapper.get('.designate-winner').trigger('click')

    expect(store.movePlayer).toHaveBeenCalledWith({
      playerId: 'player-1',
      targetTeamId: 'team-a'
    })
    expect(store.swapPlayers).toHaveBeenCalledWith({
      playerId: 'player-1',
      targetPlayerId: 'player-2'
    })
    expect(store.removePlayer).toHaveBeenCalledWith('player-1')
    expect(store.startRotation).toHaveBeenCalledOnce()
    expect(store.startRotationScoring).toHaveBeenCalledOnce()
    expect(store.planNextRotation).toHaveBeenCalledOnce()
    expect(store.updateGameScore).toHaveBeenCalledWith({
      gameId: 'game-1',
      scoreTeamA: 11,
      scoreTeamB: 7
    })
    expect(store.designateGameWinner).toHaveBeenCalledWith({
      gameId: 'game-1',
      winnerTeamId: 'team-a'
    })
  })

  it('shows, gates and redirects the End Session command', async () => {
    const players = Array.from({ length: 4 }, (_, index) =>
      new PlayerBuilder()
        .withId(`player-${index + 1}`)
        .withName(`player-${index + 1}`)
        .build()
    )
    const session = new Session(
      'location-1',
      1,
      new Date('2026-08-16T10:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1',
      players
    )
    const createdRotation = new Rotation(
      session.id,
      2,
      [],
      players,
      'rotation-2',
      RotationStatus.CREATED
    )
    const created = mountView(session, players, createdRotation)

    expect(created.wrapper.get('.manage-session__end').attributes('disabled'))
      .toBeUndefined()
    await created.wrapper.get('.manage-session__end').trigger('click')
    expect(created.store.endSession).toHaveBeenCalledOnce()
    expect(created.routerPush).toHaveBeenCalledWith({ name: 'home' })
    created.wrapper.unmount()

    const inProgressRotation = new Rotation(
      session.id,
      2,
      [],
      players,
      'rotation-2',
      RotationStatus.IN_PROGRESS,
      new Date('2026-08-16T10:05:00.000Z')
    )
    const inProgress = mountView(session, players, inProgressRotation)
    expect(inProgress.wrapper.get('.manage-session__end')
      .attributes('disabled')).toBeDefined()
    inProgress.wrapper.unmount()

    const resolvedGame = Game.fromJson({
      id: 'game-1',
      number: 1,
      courtId: 'court-1',
      teamAId: 'team-a',
      teamBId: 'team-b',
      scoreTeamA: 11,
      scoreTeamB: 7,
      winnerTeam: 'team-a',
      loserTeam: 'team-b'
    })
    const scoringRotation = new Rotation(
      session.id,
      2,
      [resolvedGame],
      players,
      'rotation-2',
      RotationStatus.SCORING,
      new Date('2026-08-16T10:05:00.000Z')
    )
    const scoring = mountView(session, players, scoringRotation)

    expect(scoring.wrapper.get('.manage-session__end')
      .attributes('disabled')).toBeUndefined()
    await scoring.wrapper.get('.score-editing').trigger('click')
    expect(scoring.wrapper.get('.manage-session__end')
      .attributes('disabled')).toBeDefined()
    await scoring.wrapper.get('.score-edited').trigger('click')
    expect(scoring.wrapper.get('.manage-session__end')
      .attributes('disabled')).toBeUndefined()
  })
})
