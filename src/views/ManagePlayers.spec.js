// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { Player, PlayerBuilder, PlayerStatus } from '@/models'
import { useSessionStore } from '@/stores/session'
import ManagePlayers from './ManagePlayers.vue'

enableAutoUnmount(afterEach)

const createPlayer = () => new PlayerBuilder()
  .withId('player-1')
  .withName('alice')
  .withStatus(PlayerStatus.WAITING)
  .build()

const mountManagePlayers = (players = []) => {
  const testingPinia = createTestingPinia({
    initialState: {
      session: { players }
    },
    createSpy: vi.fn
  })

  const wrapper = mount(ManagePlayers, {
    global: {
      plugins: [testingPinia]
    }
  })

  return {
    wrapper,
    store: useSessionStore(testingPinia)
  }
}

describe('ManagePlayers', () => {
  it('renders players supplied by Pinia', () => {
    const { wrapper } = mountManagePlayers([createPlayer()])

    const rows = wrapper.findAll('tbody tr')

    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('alice')
    expect(rows[0].get('.edit-button').text()).toBe('Edit')
    expect(rows[0].get('.delete-button').text()).toBe('Delete')
  })

  it('builds a player and delegates its creation to the store', async () => {
    const { wrapper, store } = mountManagePlayers()

    await wrapper.get('#player-name').setValue('  Alice  ')
    await wrapper.get('.save-button').trigger('click')

    expect(store.addPlayer).toHaveBeenCalledOnce()

    const createdPlayer = store.addPlayer.mock.calls[0][0]
    expect(createdPlayer).toBeInstanceOf(Player)
    expect(createdPlayer.name).toBe('alice')
    expect(createdPlayer.status).toBe(PlayerStatus.AVAILABLE)
    expect(wrapper.get('#player-name').element.value).toBe('')
  })
})
