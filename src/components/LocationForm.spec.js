// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import LocationForm from './LocationForm.vue'
import { LocationBuilder } from '@/models'

enableAutoUnmount(afterEach)

describe('LocationForm', () => {
    it('renders an empty creation draft with its field constraints', () => {
        const wrapper = mount(LocationForm, {
            props: {
                formId: 'location-form'
            }
        })

        const form = wrapper.get('form')
        const nameInput = wrapper.get('#location-form-name')
        const descriptionInput = wrapper.get('#location-form-description')
        const nbCourtsInput = wrapper.get('#location-form-nb-courts')

        expect(form.attributes('id')).toBe('location-form')

        expect(wrapper.get('label[for="location-form-name"]').text())
            .toBe('Name')
        expect(nameInput.attributes('name')).toBe('name')
        expect(nameInput.attributes('required')).toBeDefined()
        expect(nameInput.element.value).toBe('')

        expect(
            wrapper.get('label[for="location-form-description"]').text()
        ).toBe('Description')
        expect(descriptionInput.attributes('name')).toBe('description')
        expect(descriptionInput.element.value).toBe('')

        expect(
            wrapper.get('label[for="location-form-nb-courts"]').text()
        ).toBe('Number of courts')
        expect(nbCourtsInput.attributes('name')).toBe('nbCourts')
        expect(nbCourtsInput.attributes('type')).toBe('number')
        expect(nbCourtsInput.attributes('required')).toBeDefined()
        expect(nbCourtsInput.attributes('min')).toBe('1')
        expect(nbCourtsInput.attributes('max')).toBe('50')
        expect(nbCourtsInput.attributes('step')).toBe('1')
        expect(nbCourtsInput.element.value).toBe('2')
        expect(nbCourtsInput.attributes('disabled')).toBeUndefined()
        expect(wrapper.find('.nb-courts-restriction').exists()).toBe(false)
    })

    it('initializes an edition draft without mutating the location', async () => {
        const location = new LocationBuilder()
            .withId('location-id')
            .withName('Central Club')
            .withDescription('Indoor courts')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationForm, {
            props: {
                formId: 'location-form',
                location
            }
        })

        const nameInput = wrapper.get('#location-form-name')

        expect(nameInput.element.value).toBe('Central Club')
        expect(
            wrapper.get('#location-form-description').element.value
        ).toBe('Indoor courts')
        expect(
            wrapper.get('#location-form-nb-courts').element.value
        ).toBe('4')

        await nameInput.setValue('Updated Club')

        expect(location.name).toBe('Central Club')
    })

    it('emits normalized draft data when submitted', async () => {

        const onSubmit = vi.fn().mockName('submit')

        const wrapper = mount(LocationForm, {
            props: {
                formId: 'location-form',
                onSubmit
            }
        })

        await wrapper
            .get('#location-form-name')
            .setValue('  Central Club  ')
        await wrapper
            .get('#location-form-description')
            .setValue('  Indoor courts  ')
        await wrapper
            .get('#location-form-nb-courts')
            .setValue('4')

        await wrapper.get('form').trigger('submit')

        expect(onSubmit).toHaveBeenCalledOnce()
        expect(onSubmit).toHaveBeenCalledWith({
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 4
        })
    })

    it('disables only the court count and explains an active-session restriction', () => {
        const location = new LocationBuilder()
            .withName('Central Club')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationForm, {
            props: {
                formId: 'location-form',
                location,
                canEditNbCourts: false
            }
        })

        const courtCountInput = wrapper.get('#location-form-nb-courts')
        const restriction = wrapper.get('.nb-courts-restriction')

        expect(courtCountInput.attributes('disabled')).toBeDefined()
        expect(courtCountInput.attributes('aria-describedby'))
            .toBe('location-form-nb-courts-restriction')
        expect(restriction.attributes('id'))
            .toBe('location-form-nb-courts-restriction')
        expect(restriction.text()).toContain('started session')
        expect(wrapper.get('#location-form-name').attributes('disabled'))
            .toBeUndefined()
        expect(
            wrapper.get('#location-form-description').attributes('disabled')
        ).toBeUndefined()
    })
})
