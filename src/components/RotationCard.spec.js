// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { RotationStatus } from '@/models'
import RotationCard from './RotationCard.vue'

const CourtCardStub = {
  name: 'CourtCard',
  props: ['court', 'rotationStatus'],
  emits: [
    'player-drag-start',
    'player-drop',
    'player-swap',
    'remove-player',
    'score-game',
    'score-editing-change',
    'designate-winner'
  ],
  template: `
    <article class="court-card-stub">
      <div class="touch-court-player" data-touch-player-id="player-1">Player 1</div>
      <div class="touch-team-target" data-touch-team-id="team-a">Team A</div>
      <button class="court-drag" @click="$emit('player-drag-start', 'player-1')">Drag</button>
      <button class="court-drop" @click="$emit('player-drop', 'team-a')">Drop</button>
      <button class="court-swap" @click="$emit('player-swap', 'player-1')">Swap</button>
      <button class="court-remove" @click="$emit('remove-player', 'player-1')">Remove</button>
      <button class="court-score" @click="$emit('score-game', { gameId: 'game-1', scoreTeamA: 11, scoreTeamB: 7 })">Score</button>
      <button class="court-editing" @click="$emit('score-editing-change', { gameId: 'game-1', isEditing: true })">Edit</button>
      <button class="court-edited" @click="$emit('score-editing-change', { gameId: 'game-1', isEditing: false })">Edited</button>
      <button class="court-winner" @click="$emit('designate-winner', { gameId: 'game-1', winnerTeamId: 'team-a' })">Winner</button>
    </article>
  `
}

const OffCourtPlayersStub = {
  name: 'OffCourtPlayers',
  props: ['players'],
  emits: ['player-drag-start', 'player-drop', 'player-swap', 'remove-player'],
  template: `
    <aside class="off-court-players-stub">
      <div class="touch-waiting-player" data-touch-player-id="player-2">Player 2</div>
      <div class="touch-waiting-target" data-touch-waiting-target>Waiting</div>
      <button class="waiting-drag" @click="$emit('player-drag-start', 'player-2')">Drag</button>
      <button class="waiting-drop" @click="$emit('player-drop', null)">Drop</button>
      <button class="waiting-swap" @click="$emit('player-swap', 'player-2')">Swap</button>
      <button class="waiting-remove" @click="$emit('remove-player', 'player-2')">Remove</button>
    </aside>
  `
}

const courts = [{
  id: 'court-1',
  number: 1,
  isUsable: true,
  game: { id: 'game-1', number: 1 },
  teams: {
    A: { id: 'team-a', players: [] },
    B: { id: 'team-b', players: [] }
  }
}]
const waitingPlayers = [{ id: 'player-2', name: 'Bob' }]

function mountCard(overrides = {}) {
  return mount(RotationCard, {
    props: {
      rotationOrder: 1,
      rotationStatus: RotationStatus.CREATED,
      canStartRotation: false,
      canPlanNextRotation: false,
      courts: [],
      waitingPlayers: [],
      ...overrides
    },
    global: {
      stubs: {
        CourtCard: CourtCardStub,
        OffCourtPlayers: OffCourtPlayersStub
      }
    }
  })
}

function dispatchPointer(element, type, overrides = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const properties = {
    pointerType: 'touch',
    pointerId: 1,
    clientX: 10,
    clientY: 10,
    ...overrides
  }

  Object.entries(properties).forEach(([key, value]) => {
    Object.defineProperty(event, key, { value })
  })
  element.dispatchEvent(event)
  return event
}

describe('RotationCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders its sticky Rotation heading without duplicating Session identity', () => {
    const wrapper = mountCard({ rotationOrder: 3 })

    expect(wrapper.find('.session-identity').exists()).toBe(false)
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.get('h3').text()).toBe('Rotation N° 3')
    expect(wrapper.get('.rotation-card__header').classes())
      .toContain('rotation-card__header--sticky')
    expect(wrapper.get('.rotation-card__start').text()).toBe('Start Rotation')
    expect(wrapper.get('.rotation-card__start').attributes('disabled'))
      .toBeDefined()
    expect(wrapper.find('.rotation-card__stop').exists()).toBe(false)
  })

  it('emits the lifecycle command matching the Rotation status', async () => {
    const incompleteCreatedWrapper = mountCard()

    expect(incompleteCreatedWrapper.get('.rotation-card__start')
      .attributes('disabled')).toBeDefined()

    const createdWrapper = mountCard({ canStartRotation: true })

    await createdWrapper.get('.rotation-card__start').trigger('click')
    expect(createdWrapper.emitted('start-rotation')).toHaveLength(1)

    const inProgressWrapper = mountCard({
      rotationStatus: RotationStatus.IN_PROGRESS
    })
    expect(inProgressWrapper.find('.rotation-card__start').exists()).toBe(false)
    await inProgressWrapper.get('.rotation-card__stop').trigger('click')
    expect(inProgressWrapper.emitted('stop-rotation')).toHaveLength(1)

    const unresolvedScoringWrapper = mountCard({
      rotationStatus: RotationStatus.SCORING
    })
    expect(unresolvedScoringWrapper.find('.rotation-card__start').exists())
      .toBe(false)
    expect(unresolvedScoringWrapper.find('.rotation-card__stop').exists())
      .toBe(false)
    expect(unresolvedScoringWrapper.get('.rotation-card__next')
      .attributes('disabled')).toBeDefined()

    const resolvedScoringWrapper = mountCard({
      rotationStatus: RotationStatus.SCORING,
      canPlanNextRotation: true
    })
    await resolvedScoringWrapper.get('.rotation-card__next').trigger('click')
    expect(resolvedScoringWrapper.emitted('next-rotation')).toHaveLength(1)
  })

  it('renders Courts and off-court Players after setup', () => {
    const wrapper = mountCard({
      courts,
      waitingPlayers
    })

    expect(wrapper.getComponent(CourtCardStub).props('court').id)
      .toBe(courts[0].id)
    expect(wrapper.getComponent(CourtCardStub).props('rotationStatus'))
      .toBe(RotationStatus.CREATED)
    expect(wrapper.getComponent(OffCourtPlayersStub).props('players'))
      .toEqual(waitingPlayers)
    expect(wrapper.get('.courts-container').exists()).toBe(true)
  })

  it('turns drag and drop events into semantic move commands', async () => {
    const wrapper = mountCard({
      courts,
      waitingPlayers
    })

    await wrapper.get('.waiting-drag').trigger('click')
    await wrapper.get('.court-drop').trigger('click')
    await wrapper.get('.court-drag').trigger('click')
    await wrapper.get('.waiting-drop').trigger('click')

    expect(wrapper.emitted('move-player')).toEqual([
      [{ playerId: 'player-2', targetTeamId: 'team-a' }],
      [{ playerId: 'player-1', targetTeamId: null }]
    ])
  })

  it('turns a player-card drop into a semantic swap command', async () => {
    const wrapper = mountCard({ courts, waitingPlayers })

    await wrapper.get('.waiting-drag').trigger('click')
    await wrapper.get('.court-swap').trigger('click')
    await wrapper.get('.court-drag').trigger('click')
    await wrapper.get('.court-swap').trigger('click')

    expect(wrapper.emitted('swap-player')).toEqual([[
      { playerId: 'player-2', targetPlayerId: 'player-1' }
    ]])
    expect(wrapper.emitted('move-player')).toBeUndefined()
  })

  it('turns touch pointer gestures into the same semantic move commands', () => {
    const wrapper = mountCard({ courts, waitingPlayers })
    const teamTarget = wrapper.get('.touch-team-target').element
    const waitingTarget = wrapper.get('.touch-waiting-target').element
    const elementFromPoint = vi.spyOn(document, 'elementFromPoint')

    elementFromPoint.mockReturnValueOnce(teamTarget)
    dispatchPointer(wrapper.get('.touch-waiting-player').element, 'pointerdown')
    dispatchPointer(wrapper.element, 'pointerup')

    elementFromPoint.mockReturnValueOnce(waitingTarget)
    dispatchPointer(wrapper.get('.touch-court-player').element, 'pointerdown', {
      pointerId: 2
    })
    dispatchPointer(wrapper.element, 'pointerup', { pointerId: 2 })

    expect(wrapper.emitted('move-player')).toEqual([
      [{ playerId: 'player-2', targetTeamId: 'team-a' }],
      [{ playerId: 'player-1', targetTeamId: null }]
    ])
  })

  it('prioritizes a touched Player over its parent drop zone', () => {
    const wrapper = mountCard({ courts, waitingPlayers })
    const playerTarget = wrapper.get('.touch-court-player').element
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(playerTarget)

    dispatchPointer(wrapper.get('.touch-waiting-player').element, 'pointerdown')
    dispatchPointer(wrapper.element, 'pointerup')

    expect(wrapper.emitted('swap-player')).toEqual([[
      { playerId: 'player-2', targetPlayerId: 'player-1' }
    ]])
    expect(wrapper.emitted('move-player')).toBeUndefined()
  })

  it('ignores interactive controls and clears a cancelled touch gesture', () => {
    const wrapper = mountCard({ courts, waitingPlayers })
    const elementFromPoint = vi.spyOn(document, 'elementFromPoint')
      .mockReturnValue(wrapper.get('.touch-team-target').element)

    dispatchPointer(wrapper.get('.waiting-drag').element, 'pointerdown')
    dispatchPointer(wrapper.element, 'pointerup')
    dispatchPointer(wrapper.get('.touch-waiting-player').element, 'pointerdown', {
      pointerId: 2
    })
    dispatchPointer(wrapper.element, 'pointercancel', { pointerId: 2 })
    dispatchPointer(wrapper.element, 'pointerup', { pointerId: 2 })

    expect(elementFromPoint).not.toHaveBeenCalled()
    expect(wrapper.emitted('move-player')).toBeUndefined()
  })

  it('forwards removal intentions from Courts and waiting Players', async () => {
    const wrapper = mountCard({
      courts,
      waitingPlayers
    })

    await wrapper.get('.court-remove').trigger('click')
    await wrapper.get('.waiting-remove').trigger('click')

    expect(wrapper.emitted('remove-player'))
      .toEqual([['player-1'], ['player-2']])
  })

  it('forwards persisted Game commands and blocks Next during local editing', async () => {
    const wrapper = mountCard({
      courts,
      rotationStatus: RotationStatus.SCORING,
      canPlanNextRotation: true
    })

    await wrapper.get('.court-score').trigger('click')
    await wrapper.get('.court-winner').trigger('click')

    expect(wrapper.emitted('score-game')).toEqual([[
      { gameId: 'game-1', scoreTeamA: 11, scoreTeamB: 7 }
    ]])
    expect(wrapper.emitted('designate-winner')).toEqual([[
      { gameId: 'game-1', winnerTeamId: 'team-a' }
    ]])

    expect(wrapper.get('.rotation-card__next').attributes('disabled'))
      .toBeUndefined()
    await wrapper.get('.court-editing').trigger('click')
    expect(wrapper.get('.rotation-card__next').attributes('disabled'))
      .toBeDefined()
    expect(wrapper.emitted('score-editing-change')).toEqual([[
      { gameId: 'game-1', isEditing: true }
    ]])
    await wrapper.get('.court-edited').trigger('click')
    expect(wrapper.get('.rotation-card__next').attributes('disabled'))
      .toBeUndefined()
    expect(wrapper.emitted('score-editing-change')).toEqual([
      [{ gameId: 'game-1', isEditing: true }],
      [{ gameId: 'game-1', isEditing: false }]
    ])
  })
})
