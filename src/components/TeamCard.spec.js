// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TeamCard from './TeamCard.vue'

const team = {
  id: 'team-a',
  players: [{ id: 'player-1', name: 'Alice' }]
}

describe('TeamCard', () => {
  it('renders its label, players and remaining capacity', () => {
    const wrapper = mount(TeamCard, {
      props: { team, label: 'Team A', variant: 'a' }
    })

    expect(wrapper.get('h4').text()).toBe('Team A')
    expect(wrapper.get('.team-player').text()).toContain('Alice')
    expect(wrapper.get('.player-slot').text()).toBe('Drag player here (1/2)')
    expect(wrapper.classes()).toContain('team-a')
  })

  it('emits drag, drop and removal intentions', async () => {
    const wrapper = mount(TeamCard, {
      props: { team, label: 'Team A', variant: 'a' }
    })
    const dataTransfer = { effectAllowed: 'none' }

    await wrapper.get('.team-player').trigger('dragstart', { dataTransfer })
    await wrapper.get('.team-players').trigger('drop')
    await wrapper.get('.remove-btn').trigger('click')

    expect(dataTransfer.effectAllowed).toBe('move')
    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-drop')).toHaveLength(1)
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
  })
})
