// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { PlayerBuilder, PlayerStatus } from '@/models'
import { usePlayerStore } from '@/stores/player'
import ManagePlayers from './ManagePlayers.vue'

enableAutoUnmount(afterEach)

const createPlayer = (
  id,
  name,
  status = PlayerStatus.AVAILABLE
) => new PlayerBuilder()
  .withId(id)
  .withName(name)
  .withStatus(status)
  .build()

const mountManagePlayers = players => {
  const testingPinia = createTestingPinia({
    initialState: {
      player: { players }
    },
    createSpy: vi.fn
  })
  const wrapper = mount(ManagePlayers, {
    global: { plugins: [testingPinia] }
  })

  return {
    wrapper,
    playerStore: usePlayerStore(testingPinia)
  }
}

describe('ManagePlayers', () => {
  it('loads players and renders Create first with active cards by default', () => {
    const activePlayer = createPlayer('player-1', 'alice')
    const deletedPlayer = createPlayer(
      'player-2',
      'bob',
      PlayerStatus.DELETED
    )
    const { wrapper, playerStore } = mountManagePlayers([
      activePlayer,
      deletedPlayer
    ])

    expect(playerStore.loadPlayers).toHaveBeenCalledOnce()
    expect(wrapper.get('h1').text()).toBe('Manage Players')
    expect(wrapper.get('#player-search').exists()).toBe(true)
    expect(wrapper.get('#show-deleted-players').element.checked).toBe(false)

    const gridItems = wrapper.get('.card-grid').element.children

    expect(gridItems).toHaveLength(2)
    expect(gridItems[0].classList.contains('create-entity-card')).toBe(true)
    expect(gridItems[0].textContent).toContain('Create Player')
    expect(gridItems[1].id).toBe('player-card-player-1')
    expect(wrapper.find('#player-card-player-2').exists()).toBe(false)
  })

  it('filters dynamically by a contiguous case-and-accent-insensitive substring', async () => {
    const { wrapper } = mountManagePlayers([
      createPlayer('player-1', 'élise'),
      createPlayer('player-2', 'alice'),
      createPlayer('player-3', 'bob')
    ])
    const search = wrapper.get('#player-search')

    await search.setValue('LIS')

    expect(wrapper.find('#player-card-player-1').exists()).toBe(true)
    expect(wrapper.find('#player-card-player-2').exists()).toBe(false)
    expect(wrapper.find('#player-card-player-3').exists()).toBe(false)

    await search.setValue('elise')

    expect(wrapper.find('#player-card-player-1').exists()).toBe(true)

    await search.setValue('ace')

    expect(wrapper.findAll('.player-card')).toHaveLength(0)

    await search.setValue('')

    expect(wrapper.findAll('.player-card')).toHaveLength(3)
  })

  it('shows deleted players only while the toggle is enabled', async () => {
    const { wrapper } = mountManagePlayers([
      createPlayer('player-1', 'alice'),
      createPlayer('player-2', 'bob', PlayerStatus.DELETED)
    ])
    const toggle = wrapper.get('#show-deleted-players')

    await toggle.setValue(true)

    expect(wrapper.find('#player-card-player-2').exists()).toBe(true)
    expect(wrapper.get('#player-card-player-2').classes())
      .toContain('player-card--deleted')

    await toggle.setValue(false)

    expect(wrapper.find('#player-card-player-2').exists()).toBe(false)
  })

  it('keeps a native accessible checkbox as the styled switch control', () => {
    const { wrapper } = mountManagePlayers([])
    const label = wrapper.get('.deleted-player-toggle')
    const toggle = wrapper.get('#show-deleted-players')

    expect(label.attributes('for')).toBe('show-deleted-players')
    expect(toggle.attributes('type')).toBe('checkbox')
    expect(toggle.attributes('role')).toBe('switch')
    expect(toggle.classes()).toContain('deleted-player-toggle__control')
  })

  it('selects one player and clears a selection hidden by the search', async () => {
    const { wrapper } = mountManagePlayers([
      createPlayer('player-1', 'alice'),
      createPlayer('player-2', 'bob')
    ])
    const firstCard = wrapper.get('#player-card-player-1')
    const secondCard = wrapper.get('#player-card-player-2')

    await firstCard.get('.player-card-select').trigger('click')
    await secondCard.get('.player-card-select').trigger('click')

    expect(firstCard.classes()).not.toContain('player-card--selected')
    expect(secondCard.classes()).toContain('player-card--selected')

    await wrapper.get('#player-search').setValue('alice')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('#player-card-player-1').classes())
      .not.toContain('player-card--selected')
  })

  it('opens and cancels the creation modal', async () => {
    const { wrapper, playerStore } = mountManagePlayers([])

    await wrapper.get('.create-entity-card').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label'))
      .toBe('Create Player')
    expect(wrapper.get('#player-form-name').element.value).toBe('')

    await wrapper.get('.create-player-cancel').trigger('click')

    expect(playerStore.createPlayer).not.toHaveBeenCalled()
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('creates and selects the new player after a successful submit', async () => {
    const existingPlayer = createPlayer('player-1', 'alice')
    const createdPlayer = createPlayer('player-2', 'bob')
    const { wrapper, playerStore } = mountManagePlayers([existingPlayer])

    playerStore.createPlayer.mockImplementation(() => {
      playerStore.players.push(createdPlayer)
      return createdPlayer
    })

    await wrapper.get('#player-card-player-1 .player-card-select')
      .trigger('click')
    await wrapper.get('.create-entity-card').trigger('click')
    await wrapper.get('#player-form-name').setValue('Bob')
    await wrapper.get('#player-form').trigger('submit')

    expect(playerStore.createPlayer).toHaveBeenCalledWith({ name: 'Bob' })
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(wrapper.get('#player-card-player-1').classes())
      .not.toContain('player-card--selected')
    expect(wrapper.get('#player-card-player-2').classes())
      .toContain('player-card--selected')
  })

  it('edits the selected player in the shared modal', async () => {
    const player = createPlayer('player-1', 'alice', PlayerStatus.WAITING)
    const updatedPlayer = createPlayer(
      'player-1',
      'alicia',
      PlayerStatus.WAITING
    )
    const { wrapper, playerStore } = mountManagePlayers([player])

    playerStore.updatePlayer.mockImplementation(() => {
      playerStore.players[0] = updatedPlayer
      return updatedPlayer
    })

    await wrapper.get('.player-card-select').trigger('click')
    await wrapper.get('.player-card-edit').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label')).toBe('Edit Player')
    expect(wrapper.get('#player-form-name').element.value).toBe('alice')

    await wrapper.get('#player-form-name').setValue('Alicia')
    await wrapper.get('#player-form').trigger('submit')

    expect(playerStore.updatePlayer).toHaveBeenCalledWith({
      id: 'player-1',
      name: 'Alicia'
    })
    expect(wrapper.get('#player-card-player-1').classes())
      .toContain('player-card--selected')
    expect(wrapper.get('#player-card-player-1').text()).toContain('alicia')
  })

  it('confirms logical deletion and hides the player by default', async () => {
    const player = createPlayer('player-1', 'alice')
    const deletedPlayer = createPlayer(
      'player-1',
      'alice',
      PlayerStatus.DELETED
    )
    const { wrapper, playerStore } = mountManagePlayers([player])

    playerStore.deletePlayer.mockImplementation(() => {
      playerStore.players[0] = deletedPlayer
      return deletedPlayer
    })

    await wrapper.get('.player-card-select').trigger('click')
    await wrapper.get('.player-card-delete').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label')).toBe('Delete Player')
    expect(wrapper.get('.delete-player-message').text()).toContain('alice')

    await wrapper.get('.delete-player-confirm').trigger('click')

    expect(playerStore.deletePlayer).toHaveBeenCalledWith('player-1')
    expect(wrapper.find('#player-card-player-1').exists()).toBe(false)
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('keeps a failed deletion confirmation open with its business error', async () => {
    const player = createPlayer('player-1', 'alice')
    const { wrapper, playerStore } = mountManagePlayers([player])
    playerStore.deletePlayer.mockImplementation(() => {
      throw new Error(
        'Player "player-1" cannot be deleted while linked to a started session'
      )
    })

    await wrapper.get('.player-card-select').trigger('click')
    await wrapper.get('.player-card-delete').trigger('click')
    await wrapper.get('.delete-player-confirm').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label')).toBe('Delete Player')
    expect(wrapper.get('.modal-error').text())
      .toContain('cannot be deleted while linked to a started session')
  })

  it('keeps a shown deleted player selected and restores it as AVAILABLE', async () => {
    const player = createPlayer('player-1', 'alice')
    const deletedPlayer = createPlayer(
      'player-1',
      'alice',
      PlayerStatus.DELETED
    )
    const restoredPlayer = createPlayer('player-1', 'alice')
    const { wrapper, playerStore } = mountManagePlayers([player])

    playerStore.deletePlayer.mockImplementation(() => {
      playerStore.players[0] = deletedPlayer
      return deletedPlayer
    })
    playerStore.restorePlayer.mockImplementation(() => {
      playerStore.players[0] = restoredPlayer
      return restoredPlayer
    })

    await wrapper.get('#show-deleted-players').setValue(true)
    await wrapper.get('.player-card-select').trigger('click')
    await wrapper.get('.player-card-delete').trigger('click')
    await wrapper.get('.delete-player-confirm').trigger('click')

    const deletedCard = wrapper.get('#player-card-player-1')

    expect(deletedCard.classes()).toContain('player-card--selected')
    expect(deletedCard.find('.player-card-restore').exists()).toBe(true)

    await deletedCard.get('.player-card-restore').trigger('click')

    expect(playerStore.restorePlayer).toHaveBeenCalledWith('player-1')
    expect(wrapper.get('#player-card-player-1').classes())
      .toContain('player-card--selected')
    expect(wrapper.get('#player-card-player-1').classes())
      .not.toContain('player-card--deleted')
  })
})
