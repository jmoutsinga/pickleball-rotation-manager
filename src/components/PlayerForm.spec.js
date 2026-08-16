// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import PlayerForm from './PlayerForm.vue'

enableAutoUnmount(afterEach)

describe('PlayerForm', () => {
  it('renders an empty required name field for creation', () => {
    const wrapper = mount(PlayerForm, {
      props: { formId: 'player-form' }
    })

    expect(wrapper.get('form').attributes('id')).toBe('player-form')
    expect(wrapper.get('#player-form-name').element.value).toBe('')
    expect(wrapper.get('#player-form-name').attributes('required'))
      .toBeDefined()
  })

  it('copies the edited player name into a local draft', async () => {
    const player = { name: 'alice' }
    const wrapper = mount(PlayerForm, {
      props: { formId: 'player-form', player }
    })

    await wrapper.get('#player-form-name').setValue('alicia')

    expect(player.name).toBe('alice')
    expect(wrapper.get('#player-form-name').element.value).toBe('alicia')
  })

  it('emits trimmed form data on submit', async () => {
    const wrapper = mount(PlayerForm, {
      props: { formId: 'player-form' }
    })

    await wrapper.get('#player-form-name').setValue('  Alice  ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[
      { name: 'Alice' }
    ]])
  })
})
