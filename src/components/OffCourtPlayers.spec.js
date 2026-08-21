// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OffCourtPlayers from './OffCourtPlayers.vue'

const players = [
  { id: 'player-1', name: 'Alice' },
  { id: 'player-2', name: 'Bob' }
]

describe('OffCourtPlayers', () => {
  it('renders all waiting Players', () => {
    const wrapper = mount(OffCourtPlayers, { props: { players } })

    expect(wrapper.get('h3').text()).toBe('Waiting Players')
    expect(wrapper.findAll('.player-card')).toHaveLength(2)
    expect(wrapper.findAll('.player-card')[0]
      .attributes('data-touch-player-id')).toBe('player-1')
    expect(wrapper.get('.waiting-players')
      .attributes('data-touch-waiting-target')).toBe('')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })

  it('distinguishes a player swap from an off-court drop', async () => {
    const wrapper = mount(OffCourtPlayers, { props: { players } })
    const dataTransfer = { effectAllowed: 'none' }

    await wrapper.findAll('.player-card')[0]
      .trigger('dragstart', { dataTransfer })
    await wrapper.findAll('.player-card')[1].trigger('drop')
    await wrapper.get('.waiting-players').trigger('drop')
    await wrapper.findAll('.remove-btn')[0].trigger('click')

    expect(dataTransfer.effectAllowed).toBe('move')
    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-swap')).toEqual([['player-2']])
    expect(wrapper.emitted('player-drop')).toEqual([[null]])
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
  })
})
