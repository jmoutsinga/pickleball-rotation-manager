// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, RouterLinkStub } from '@vue/test-utils'
import NotFoundView from './NotFoundView.vue'

enableAutoUnmount(afterEach)

describe('NotFoundView', () => {
  it('explains the missing page and links back to Home', () => {
    const wrapper = mount(NotFoundView, {
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    expect(wrapper.get('h1').text()).toBe('404 - Page Not Found')
    expect(wrapper.get('p').text()).toContain('does not exist')

    const homeLink = wrapper.getComponent(RouterLinkStub)

    expect(homeLink.text()).toBe('Back to Home')
    expect(homeLink.props('to')).toEqual({ name: 'home' })
  })
})
