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
  it('renders the sticky heading, all available players and restored selection', () => {
    const wrapper = mount(SessionForm, {
      props: {
        sessionOrder: 3,
        availablePlayers: players,
        selectedPlayerIds: players.slice(0, 2).map(player => player.id)
      }
    })

    expect(wrapper.get('h2').text()).toBe('Session #3')
    expect(wrapper.findAllComponents({ name: 'SessionPlayerCard' }))
      .toHaveLength(5)
    expect(wrapper.findAll('.session-player-card--selected')).toHaveLength(2)
    expect(wrapper.get('.session-form__header').classes())
      .toContain('session-form__header--sticky')
    expect(wrapper.get('.session-form__grid-scroll').exists()).toBe(true)
  })

  it('identifies the shared CardGrid as its responsive player grid', () => {
    const wrapper = mount(SessionForm, {
      props: {
        sessionOrder: 1,
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
        sessionOrder: 1,
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

  it('requires four selected players before emitting start', async () => {
    const wrapper = mount(SessionForm, {
      props: {
        sessionOrder: 1,
        availablePlayers: players,
        selectedPlayerIds: players.slice(0, 3).map(player => player.id)
      }
    })
    const startButton = wrapper.get('.session-form__start')

    expect(startButton.attributes('disabled')).toBeDefined()
    await wrapper.setProps({
      selectedPlayerIds: players.slice(0, 4).map(player => player.id)
    })
    expect(startButton.attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('start')).toHaveLength(1)
  })
})
