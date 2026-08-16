// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { LocationBuilder, SessionStatus } from '@/models'
import LocationCard from './LocationCard.vue'

enableAutoUnmount(afterEach)

describe('LocationCard', () => {
    it('renders the location information', () => {
        const locationId = crypto.randomUUID()
        const location = new LocationBuilder()
            .withId(locationId)
            .withName('Central Club')
            .withDescription('Indoor courts')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location
            }
        })

        const card = wrapper.get('article')
        const selectButton = wrapper.get('.location-card-select')

        expect(card.attributes('id')).toBe(`location-card-${locationId}`)
        expect(card.classes()).not.toContain('location-card--selected')
        expect(selectButton.element.tagName).toBe('BUTTON')
        expect(selectButton.attributes('type')).toBe('button')
        expect(selectButton.attributes('aria-pressed')).toBe('false')
        expect(selectButton.text()).toBe('Central Club')
        expect(wrapper.get('h2').text()).toBe('Central Club')
        expect(wrapper.get('.location-description').text())
            .toBe('Indoor courts')
        expect(wrapper.get('.location-court-count').text())
            .toBe('4 courts')
        expect(wrapper.find('.location-card-session-action').exists())
            .toBe(false)
        expect(wrapper.find('.location-card-command-rail').exists())
            .toBe(false)
    })

    it.each([
        [1, '1 court'],
        [6, '6 courts']
    ])('renders nbCourts=%i as "%s"', (nbCourts, expectedLabel) => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(nbCourts)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location
            }
        })

        expect(wrapper.get('.location-court-count').text())
            .toBe(expectedLabel)
    })

    it('updates the court count label when the location prop changes', async () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location
            }
        })

        expect(wrapper.get('.location-court-count').text())
            .toBe('4 courts')


        const updatedLocation = new LocationBuilder()
            .withId(location.id)
            .withName(location.name)
            .withNbCourts(1)
            .build()

        await wrapper.setProps({
            location: updatedLocation
        })

        expect(wrapper.get('.location-court-count').text())
            .toBe('1 court')

    })

    it('emits select with the location id when the selection button is clicked', async () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location
            }
        })

        await wrapper.get('.location-card-select').trigger('click')

        expect(wrapper.emitted('select')).toEqual([[location.id]])
    })

    it('emits edit without selecting the location when the edit button is clicked', async () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location,
                isSelected: true
            }
        })

        const editButton = wrapper.get('.location-card-edit')

        expect(editButton.element.tagName).toBe('BUTTON')
        expect(editButton.attributes('type')).toBe('button')
        expect(editButton.attributes('aria-label')).toBe('Edit Test Location')

        const editIcon = editButton.get('svg')

        expect(editButton.text()).toBe('')
        expect(editIcon.classes()).toContain('location-card-action-icon--edit')
        expect(editIcon.attributes('aria-hidden')).toBe('true')
        expect(editIcon.attributes('focusable')).toBe('false')

        await editButton.trigger('click')

        expect(wrapper.emitted('edit')).toEqual([[location.id]])
        expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('emits delete without selecting or editing the location when the delete button is clicked', async () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location,
                isSelected: true
            }
        })

        const deleteButton = wrapper.get('.location-card-delete')

        expect(deleteButton.element.tagName).toBe('BUTTON')
        expect(deleteButton.attributes('type')).toBe('button')
        expect(deleteButton.attributes('aria-label')).toBe('Delete Test Location')

        const deleteIcon = deleteButton.get('svg')

        expect(deleteButton.text()).toBe('')
        expect(deleteIcon.classes())
            .toContain('location-card-action-icon--delete')
        expect(deleteIcon.attributes('aria-hidden')).toBe('true')
        expect(deleteIcon.attributes('focusable')).toBe('false')

        await deleteButton.trigger('click')

        expect(wrapper.emitted('delete')).toEqual([[location.id]])
        expect(wrapper.emitted('select')).toBeUndefined()
        expect(wrapper.emitted('edit')).toBeUndefined()
    })

    it('renders the ordered commands only while selected', async () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location
            }
        })

        expect(wrapper.find('.location-card-command-rail').exists())
            .toBe(false)

        await wrapper.setProps({ isSelected: true })

        const commandButtons = wrapper
            .get('.location-card-command-rail')
            .findAll('button')

        expect(commandButtons).toHaveLength(2)
        expect(commandButtons[0].classes()).toContain('location-card-edit')
        expect(commandButtons[1].classes()).toContain('location-card-delete')

        await wrapper.setProps({ isSelected: false })

        expect(wrapper.find('.location-card-command-rail').exists())
            .toBe(false)
    })

    it('renders and emits the session action only when selected', async () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location,
                isSelected: true
            }
        })

        expect(wrapper.get('.location-card-select').attributes('aria-pressed'))
            .toBe('true')
        expect(wrapper.get('article').classes())
            .toContain('location-card--selected')

        const sessionAction = wrapper.get('.location-card-session-action')
        const sessionIcon = sessionAction.get('svg')

        expect(sessionAction.element.tagName).toBe('BUTTON')
        expect(sessionAction.attributes('type')).toBe('button')
        expect(sessionAction.attributes('aria-label'))
            .toBe('Start New Session for Test Location')
        expect(sessionAction.text()).toBe('Start')
        expect(sessionAction.classes())
            .toContain('location-card-session-action--start')
        expect(sessionAction.classes())
            .not.toContain('location-card-session-action--manage')
        expect(sessionIcon.classes())
            .toContain('location-card-session-icon--play')
        expect(sessionIcon.attributes('aria-hidden')).toBe('true')
        expect(sessionIcon.attributes('focusable')).toBe('false')
        expect(sessionAction.get('.location-card-session-label').text())
            .toBe('Start')

        await sessionAction.trigger('click')

        expect(wrapper.emitted('session')).toEqual([[location.id]])
        expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('renders the current-session action for one started session', () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location,
                isSelected: true,
                openSessionCount: 1,
                openSessionStatus: SessionStatus.STARTED
            }
        })

        const sessionAction = wrapper.get('.location-card-session-action')
        const sessionIcon = sessionAction.get('svg')

        expect(sessionAction.attributes('aria-label'))
            .toBe('Manage Current Session for Test Location')
        expect(sessionAction.text()).toBe('Continue')
        expect(sessionAction.classes())
            .toContain('location-card-session-action--manage')
        expect(sessionAction.classes())
            .not.toContain('location-card-session-action--start')
        expect(sessionIcon.classes())
            .toContain('location-card-session-icon--fast-forward')
        expect(sessionIcon.attributes('aria-hidden')).toBe('true')
        expect(sessionIcon.attributes('focusable')).toBe('false')
        expect(sessionAction.get('.location-card-session-label').text())
            .toBe('Continue')
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('blocks the session action when multiple sessions are open', () => {
        const location = new LocationBuilder()
            .withName('Test Location')
            .withNbCourts(4)
            .build()

        const wrapper = mount(LocationCard, {
            props: {
                location,
                isSelected: true,
                openSessionCount: 2,
                openSessionStatus: SessionStatus.CREATED
            }
        })

        expect(wrapper.find('.location-card-session-action').exists())
            .toBe(false)
        expect(wrapper.get('[role="alert"]').text())
            .toContain('Multiple open sessions')
    })

})
