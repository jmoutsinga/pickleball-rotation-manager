// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount, RouterLinkStub } from '@vue/test-utils'
import InternalErrorView from './InternalErrorView.vue'

enableAutoUnmount(afterEach)

describe('InternalErrorView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function mountView() {
    return mount(InternalErrorView, {
      props: {
        codeError: 'SESSION_GRAPH_INVALID',
        errorUuid: '8f7f3978-14f7-43a2-a1b5-2d958889c191'
      },
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    })
  }

  it('shows the correlated error and links back to Home', () => {
    const wrapper = mountView()

    expect(wrapper.get('h1').text()).toBe('500 - Internal Server Error')
    expect(wrapper.get('.internal-error__message').text()).toBe(
      'erreur interne, merci de contacter l\'administrateur en indiquant ' +
      'ce code erreur : SESSION_GRAPH_INVALID - ' +
      '8f7f3978-14f7-43a2-a1b5-2d958889c191'
    )
    expect(wrapper.get('.internal-error__copy-icon').attributes('aria-hidden'))
      .toBe('true')

    const homeLink = wrapper.getComponent(RouterLinkStub)
    expect(homeLink.text()).toBe('Back to Home')
    expect(homeLink.props('to')).toEqual({ name: 'home' })
  })

  it('copies the complete message and shows an ephemeral notification', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    })
    const wrapper = mountView()

    await wrapper.get('.internal-error__copy').trigger('click')
    await Promise.resolve()

    expect(writeText).toHaveBeenCalledWith(
      wrapper.get('.internal-error__message').text()
    )
    expect(wrapper.get('output').text()).toBe('message copié')

    await vi.advanceTimersByTimeAsync(2500)
    expect(wrapper.find('output').exists()).toBe(false)
  })
})
