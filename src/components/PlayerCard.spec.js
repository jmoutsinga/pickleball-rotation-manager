// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { PlayerBuilder, PlayerStatus } from '@/models'
import PlayerCard from './PlayerCard.vue'

enableAutoUnmount(afterEach)

const createPlayer = (status = PlayerStatus.AVAILABLE) =>
  new PlayerBuilder()
    .withId('player-1')
    .withName('alice')
    .withStatus(status)
    .build()

describe('PlayerCard', () => {
  it('renders an unselected player without commands', () => {
    const wrapper = mount(PlayerCard, {
      props: { player: createPlayer() }
    })

    expect(wrapper.get('article').attributes('id')).toBe('player-card-player-1')
    expect(wrapper.get('.player-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(wrapper.get('.player-card-select').text()).toBe('alice')
    expect(wrapper.get('.player-status').text()).toBe('AVAILABLE')
    expect(wrapper.find('.player-card-command-rail').exists()).toBe(false)
  })

  it('emits select from its native selection button', async () => {
    const wrapper = mount(PlayerCard, {
      props: { player: createPlayer() }
    })

    await wrapper.get('.player-card-select').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['player-1']])
  })

  it('renders Edit and Delete only for a selected non-deleted player', async () => {
    const wrapper = mount(PlayerCard, {
      props: { player: createPlayer(), isSelected: true }
    })
    const commands = wrapper.get('.player-card-command-rail')

    expect(commands.findAll('button')).toHaveLength(2)
    expect(wrapper.get('.player-card-edit').attributes('aria-label'))
      .toBe('Edit alice')
    expect(wrapper.get('.player-card-delete').attributes('aria-label'))
      .toBe('Delete alice')
    expect(wrapper.find('.player-card-restore').exists()).toBe(false)

    await wrapper.get('.player-card-edit').trigger('click')
    await wrapper.get('.player-card-delete').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([['player-1']])
    expect(wrapper.emitted('delete')).toEqual([['player-1']])
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('renders a grey deleted card without commands while unselected', () => {
    const wrapper = mount(PlayerCard, {
      props: { player: createPlayer(PlayerStatus.DELETED) }
    })

    expect(wrapper.get('article').classes()).toContain('player-card--deleted')
    expect(wrapper.find('.player-card-command-rail').exists()).toBe(false)
    expect(wrapper.find('.player-card-edit').exists()).toBe(false)
    expect(wrapper.find('.player-card-delete').exists()).toBe(false)
    expect(wrapper.find('.player-card-restore').exists()).toBe(false)
  })

  it('renders and emits Restore only for a selected deleted player', async () => {
    const wrapper = mount(PlayerCard, {
      props: {
        player: createPlayer(PlayerStatus.DELETED),
        isSelected: true
      }
    })
    const restoreButton = wrapper.get('.player-card-restore')
    const restoreIcon = restoreButton.get('svg')

    expect(restoreButton.attributes('aria-label')).toBe('Restore alice')
    expect(restoreIcon.classes()).toContain('player-card-restore-icon')
    expect(restoreIcon.attributes('aria-hidden')).toBe('true')
    expect(restoreIcon.attributes('focusable')).toBe('false')
    expect(wrapper.find('.player-card-edit').exists()).toBe(false)
    expect(wrapper.find('.player-card-delete').exists()).toBe(false)

    await restoreButton.trigger('click')

    expect(wrapper.emitted('restore')).toEqual([['player-1']])
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
