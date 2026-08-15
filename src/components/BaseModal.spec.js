// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import BaseModal from './BaseModal.vue'

enableAutoUnmount(afterEach)

describe('BaseModal', () => {
    it('does not render the dialog when it is closed', () => {
        const wrapper = mount(BaseModal, {
            props: {
                isOpen: false,
                title: 'Create Location'
            }
        })

        expect(wrapper.find('dialog').exists()).toBe(false)
    })

    it('renders its title and slots when it is open', () => {
        const wrapper = mount(BaseModal, {
            props: {
                isOpen: true,
                title: 'Create Location'
            },
            slots: {
                default: '<p data-test="content">Location form</p>',
                actions: '<button data-test="save">Save</button>'
            }
        })

        const dialog = wrapper.get('dialog')

        expect(dialog.attributes('open')).toBeDefined()
        expect(dialog.attributes('aria-modal')).toBe('true')
        expect(dialog.attributes('aria-label')).toBe('Create Location')
        expect(dialog.get('h2').text()).toBe('Create Location')
        expect(dialog.get('[data-test="content"]').text())
            .toBe('Location form')
        expect(dialog.get('[data-test="save"]').text())
            .toBe('Save')
    })

    it('emits close when the close button is clicked', async () => {
        const wrapper = mount(BaseModal, {
            props: {
                isOpen: true,
                title: 'Create Location'
            }
        })

        await wrapper
            .get('button[aria-label="Close"]')
            .trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })
})