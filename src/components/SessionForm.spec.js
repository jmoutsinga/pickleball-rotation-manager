// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { PlayerBuilder } from '@/models'
import SessionForm from './SessionForm.vue'

const players = Array.from({ length: 5 }, (_, index) =>
  new PlayerBuilder()
    .withId(`player-${index + 1}`)
    .withName(`player-${index + 1}`)
    .build()
)

describe('SessionForm', () => {
  it('renders all available players and the restored selection', () => {
    const wrapper = mount(SessionForm, {
      props: {
        availablePlayers: players,
        selectedPlayerIds: players.slice(0, 2).map(player => player.id)
      }
    })

    expect(wrapper.findAllComponents({ name: 'SessionPlayerCard' }))
      .toHaveLength(5)
    expect(wrapper.findAll('.session-player-card--selected')).toHaveLength(2)
    expect(wrapper.get('.session-form__grid-scroll').exists()).toBe(true)
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
  })

  it('identifies the shared CardGrid as its responsive player grid', () => {
    const wrapper = mount(SessionForm, {
      props: {
        availablePlayers: players
      }
    })
    const grid = wrapper.get('.card-grid')

    expect(grid.classes()).toContain('session-form__grid')
    expect(grid.findAllComponents({ name: 'SessionPlayerCard' }))
      .toHaveLength(players.length)
  })

  it('emits and displays each selection change', async () => {
    const wrapper = mount(SessionForm, {
      props: {
        availablePlayers: players,
        selectedPlayerIds: []
      }
    })

    await wrapper.findAllComponents({ name: 'SessionPlayerCard' })[0]
      .get('button')
      .trigger('click')

    expect(wrapper.emitted('selection-change'))
      .toEqual([[[players[0].id]]])
    expect(wrapper.findAll('.session-player-card--selected')).toHaveLength(1)
  })

})
