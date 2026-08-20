// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GameCard from './GameCard.vue'

const TeamCardStub = {
  name: 'TeamCard',
  props: ['team', 'label', 'variant'],
  emits: ['player-drag-start', 'player-drop', 'remove-player'],
  template: `
    <section class="team-card-stub">
      <button class="drag" @click="$emit('player-drag-start', 'player-1')">Drag</button>
      <button class="drop" @click="$emit('player-drop')">Drop</button>
      <button class="remove" @click="$emit('remove-player', 'player-1')">Remove</button>
    </section>
  `
}

const teamA = { id: 'team-a', players: [] }
const teamB = { id: 'team-b', players: [] }

describe('GameCard', () => {
  it('composes Team A versus Team B', () => {
    const wrapper = mount(GameCard, {
      props: { teamA, teamB },
      global: { stubs: { TeamCard: TeamCardStub } }
    })
    const teams = wrapper.findAllComponents(TeamCardStub)

    expect(teams).toHaveLength(2)
    expect(teams[0].props()).toMatchObject({
      team: teamA,
      label: 'Team A',
      variant: 'a'
    })
    expect(teams[1].props()).toMatchObject({
      team: teamB,
      label: 'Team B',
      variant: 'b'
    })
    expect(wrapper.get('.team-divider').text()).toBe('VS')
  })

  it('adds the target Team to drop events and forwards other intentions', async () => {
    const wrapper = mount(GameCard, {
      props: { teamA, teamB },
      global: { stubs: { TeamCard: TeamCardStub } }
    })
    const teams = wrapper.findAll('.team-card-stub')

    await teams[0].get('.drag').trigger('click')
    await teams[1].get('.drop').trigger('click')
    await teams[0].get('.remove').trigger('click')

    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-drop')).toEqual([['team-b']])
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
  })
})
