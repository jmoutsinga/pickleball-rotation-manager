// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { PlayerBuilder } from '@/models'
import SessionPlayerCard from './SessionPlayerCard.vue'

describe('SessionPlayerCard', () => {
  const player = new PlayerBuilder()
    .withId('player-1')
    .withName('alice')
    .build()

  it('renders an accessible unselected player card', () => {
    const wrapper = mount(SessionPlayerCard, {
      props: { player }
    })

    const button = wrapper.get('button')
    expect(button.text()).toContain('alice')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(wrapper.classes()).not.toContain('session-player-card--selected')
    expect(wrapper.find('.session-player-card__check').exists()).toBe(false)
  })

  it('emits the player identifier when toggled', async () => {
    const wrapper = mount(SessionPlayerCard, {
      props: { player }
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([[player.id]])
  })

  it('shows the checked icon and selected styling', () => {
    const wrapper = mount(SessionPlayerCard, {
      props: { player, isSelected: true }
    })

    expect(wrapper.classes()).toContain('session-player-card--selected')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.session-player-card__check').attributes('aria-hidden'))
      .toBe('true')
    expect(wrapper.get('.session-player-card__check-mark').attributes('d'))
      .toBeTruthy()
  })
})
