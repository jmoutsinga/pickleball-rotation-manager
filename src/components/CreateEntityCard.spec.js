// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import CreateEntityCard from './CreateEntityCard.vue'

enableAutoUnmount(afterEach)

describe('CreateEntityCard', () => {
    it('renders its label and emits activate when clicked', async () => {
        const wrapper = mount(CreateEntityCard, {
            props: {
                label: 'Create Location'
            }
        })

        const activationButton = wrapper.get('button')

        expect(activationButton.text()).toBe('Create Location')
        expect(activationButton.attributes('type')).toBe('button')

        await activationButton.trigger('click')

        expect(wrapper.emitted('activate')).toHaveLength(1)
    })
})