// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RotationStatus } from '@/models'
import RotationCard from './RotationCard.vue'

const CourtCardStub = {
  name: 'CourtCard',
  props: ['court'],
  emits: ['player-drag-start', 'player-drop', 'remove-player'],
  template: `
    <article class="court-card-stub">
      <button class="court-drag" @click="$emit('player-drag-start', 'player-1')">Drag</button>
      <button class="court-drop" @click="$emit('player-drop', 'team-a')">Drop</button>
      <button class="court-remove" @click="$emit('remove-player', 'player-1')">Remove</button>
    </article>
  `
}

const OffCourtPlayersStub = {
  name: 'OffCourtPlayers',
  props: ['players'],
  emits: ['player-drag-start', 'player-drop', 'remove-player'],
  template: `
    <aside class="off-court-players-stub">
      <button class="waiting-drag" @click="$emit('player-drag-start', 'player-2')">Drag</button>
      <button class="waiting-drop" @click="$emit('player-drop', null)">Drop</button>
      <button class="waiting-remove" @click="$emit('remove-player', 'player-2')">Remove</button>
    </aside>
  `
}

const courts = [{
  id: 'court-1',
  number: 1,
  isUsable: true,
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

describe('RotationCard', () => {
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
})
