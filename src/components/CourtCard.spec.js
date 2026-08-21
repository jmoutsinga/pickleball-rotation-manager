// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RotationStatus } from '@/models'
import CourtCard from './CourtCard.vue'

const GameCardStub = {
  name: 'GameCard',
  props: ['game', 'teamA', 'teamB', 'rotationStatus'],
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
    <section class="game-card-stub">
      <button class="drag" @click="$emit('player-drag-start', 'player-1')">Drag</button>
      <button class="drop" @click="$emit('player-drop', 'team-b')">Drop</button>
      <button class="swap" @click="$emit('player-swap', 'player-2')">Swap</button>
      <button class="remove" @click="$emit('remove-player', 'player-1')">Remove</button>
      <button class="score" @click="$emit('score-game', { gameId: 'game-1', scoreTeamA: 11, scoreTeamB: 7 })">Score</button>
      <button class="editing" @click="$emit('score-editing-change', { gameId: 'game-1', isEditing: true })">Edit</button>
      <button class="winner" @click="$emit('designate-winner', { gameId: 'game-1', winnerTeamId: 'team-a' })">Winner</button>
    </section>
  `
}

const court = {
  id: 'court-1',
  number: 1,
  isUsable: true,
  game: { id: 'game-1', number: 1 },
  teams: {
    A: { id: 'team-a', players: [] },
    B: { id: 'team-b', players: [] }
  }
}

describe('CourtCard', () => {
  it('renders the Court and supplies both Teams to its GameCard', () => {
    const wrapper = mount(CourtCard, {
      props: { court, rotationStatus: RotationStatus.SCORING },
      global: { stubs: { GameCard: GameCardStub } }
    })
    const game = wrapper.getComponent(GameCardStub)

    expect(wrapper.get('h3').text()).toBe('Court 1')
    expect(game.props('teamA').id).toBe(court.teams.A.id)
    expect(game.props('teamB').id).toBe(court.teams.B.id)
    expect(game.props('game')).toEqual(court.game)
    expect(game.props('rotationStatus')).toBe(RotationStatus.SCORING)
  })

  it('forwards GameCard intentions unchanged', async () => {
    const wrapper = mount(CourtCard, {
      props: { court, rotationStatus: RotationStatus.SCORING },
      global: { stubs: { GameCard: GameCardStub } }
    })

    await wrapper.get('.drag').trigger('click')
    await wrapper.get('.drop').trigger('click')
    await wrapper.get('.swap').trigger('click')
    await wrapper.get('.remove').trigger('click')
    await wrapper.get('.score').trigger('click')
    await wrapper.get('.editing').trigger('click')
    await wrapper.get('.winner').trigger('click')

    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-drop')).toEqual([['team-b']])
    expect(wrapper.emitted('player-swap')).toEqual([['player-2']])
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
    expect(wrapper.emitted('score-game')).toEqual([[
      { gameId: 'game-1', scoreTeamA: 11, scoreTeamB: 7 }
    ]])
    expect(wrapper.emitted('score-editing-change')).toEqual([[
      { gameId: 'game-1', isEditing: true }
    ]])
    expect(wrapper.emitted('designate-winner')).toEqual([[
      { gameId: 'game-1', winnerTeamId: 'team-a' }
    ]])
  })

  it('marks an unused Court and does not render drag and drop targets', () => {
    const wrapper = mount(CourtCard, {
      props: {
        court: {
          id: 'court-4',
          number: 4,
          isUsable: false,
          game: null,
          teams: null
        },
        rotationStatus: RotationStatus.SCORING
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
