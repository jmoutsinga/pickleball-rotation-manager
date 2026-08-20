// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CourtCard from './CourtCard.vue'

const GameCardStub = {
  name: 'GameCard',
  props: ['teamA', 'teamB'],
  emits: ['player-drag-start', 'player-drop', 'remove-player'],
  template: `
    <section class="game-card-stub">
      <button class="drag" @click="$emit('player-drag-start', 'player-1')">Drag</button>
      <button class="drop" @click="$emit('player-drop', 'team-b')">Drop</button>
      <button class="remove" @click="$emit('remove-player', 'player-1')">Remove</button>
    </section>
  `
}

const court = {
  id: 'court-1',
  number: 1,
  isUsable: true,
  teams: {
    A: { id: 'team-a', players: [] },
    B: { id: 'team-b', players: [] }
  }
}

describe('CourtCard', () => {
  it('renders the Court and supplies both Teams to its GameCard', () => {
    const wrapper = mount(CourtCard, {
      props: { court },
      global: { stubs: { GameCard: GameCardStub } }
    })
    const game = wrapper.getComponent(GameCardStub)

    expect(wrapper.get('h3').text()).toBe('Court 1')
    expect(game.props('teamA').id).toBe(court.teams.A.id)
    expect(game.props('teamB').id).toBe(court.teams.B.id)
  })

  it('forwards GameCard intentions unchanged', async () => {
    const wrapper = mount(CourtCard, {
      props: { court },
      global: { stubs: { GameCard: GameCardStub } }
    })

    await wrapper.get('.drag').trigger('click')
    await wrapper.get('.drop').trigger('click')
    await wrapper.get('.remove').trigger('click')

    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-drop')).toEqual([['team-b']])
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
  })

  it('marks an unused Court and does not render drag and drop targets', () => {
    const wrapper = mount(CourtCard, {
      props: {
        court: {
          id: 'court-4',
          number: 4,
          isUsable: false,
          teams: null
        }
      },
      global: { stubs: { GameCard: GameCardStub } }
    })

    expect(wrapper.classes()).toContain('court--unused')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.get('h3').text()).toBe('Court 4')
    expect(wrapper.get('.court__unused-label').text()).toBe('Inutilisé')
    expect(wrapper.findComponent(GameCardStub).exists()).toBe(false)
    expect(wrapper.find('.drop').exists()).toBe(false)
  })
})
