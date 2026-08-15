// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { LocationBuilder, Session, SessionStatus } from '@/models'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import HomeView from './HomeView.vue'

enableAutoUnmount(afterEach)

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

const createLocation = (
  id,
  name,
  nbCourts,
  description = ''
) => new LocationBuilder()
  .withId(id)
  .withName(name)
  .withDescription(description)
  .withNbCourts(nbCourts)
  .build()

const mountHome = (locations, sessions = []) => {
  const testingPinia = createTestingPinia({
    initialState: {
      location: { locations },
      session: { sessions }
    },
    createSpy: vi.fn
  })

  const wrapper = mount(HomeView, {
    global: {
      plugins: [testingPinia]
    }
  })

  return {
    wrapper,
    locationStore: useLocationStore(testingPinia),
    sessionStore: useSessionStore(testingPinia)
  }
}

describe('HomeView', () => {
  beforeEach(() => {
    routerPush.mockReset()
  })

  it('renders the creation card before the locations supplied by Pinia', () => {
    const firstLocation = createLocation('location-1', 'Central Club', 4)
    const secondLocation = createLocation('location-2', 'Westside Club', 2)

    const { wrapper, locationStore, sessionStore } = mountHome([
      firstLocation,
      secondLocation
    ])

    expect(wrapper.get('h1').text())
      .toBe('Pickleball Training Session Manager')
    expect(wrapper.text())
      .toContain('This application helps you manage player rotations')

    expect(locationStore.loadLocations).toHaveBeenCalledOnce()
    expect(sessionStore.loadSessions).toHaveBeenCalledOnce()

    const gridItems = wrapper.get('.card-grid').element.children

    expect(gridItems).toHaveLength(3)
    expect(gridItems[0].classList.contains('create-entity-card')).toBe(true)
    expect(gridItems[0].textContent).toContain('Create Location')
    expect(gridItems[1].id).toBe('location-card-location-1')
    expect(gridItems[2].id).toBe('location-card-location-2')
  })

  it('opens the location creation modal and closes it from its close button', async () => {
    const { wrapper } = mountHome([])

    expect(wrapper.find('dialog').exists()).toBe(false)

    await wrapper.get('.create-entity-card').trigger('click')

    const dialog = wrapper.get('dialog')

    expect(dialog.attributes('aria-label')).toBe('Create Location')
    expect(wrapper.get('#location-form').exists()).toBe(true)
    expect(wrapper.get('.create-location-submit').attributes('form'))
      .toBe('location-form')

    await dialog.get('button[aria-label="Close"]').trigger('click')

    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('cancels location creation without calling the store', async () => {
    const { wrapper, locationStore } = mountHome([])

    await wrapper.get('.create-entity-card').trigger('click')
    await wrapper.get('.create-location-cancel').trigger('click')

    expect(locationStore.createLocation).not.toHaveBeenCalled()
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('creates a location from the modal form and closes it after success', async () => {
    const { wrapper, locationStore } = mountHome([])
    const createdLocation = createLocation(
      'location-1',
      'Central Club',
      4,
      'Indoor courts'
    )

    locationStore.createLocation.mockReturnValue(createdLocation)

    await wrapper.get('.create-entity-card').trigger('click')
    await wrapper.get('#location-form-name').setValue('Central Club')
    await wrapper
      .get('#location-form-description')
      .setValue('Indoor courts')
    await wrapper.get('#location-form-nb-courts').setValue('4')
    await wrapper.get('#location-form').trigger('submit')

    expect(locationStore.createLocation).toHaveBeenCalledOnce()
    expect(locationStore.createLocation).toHaveBeenCalledWith({
      name: 'Central Club',
      description: 'Indoor courts',
      nbCourts: 4
    })
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('selects the created location instead of the previously selected one', async () => {
    const existingLocation = createLocation(
      'location-1',
      'Central Club',
      4
    )
    const createdLocation = createLocation(
      'location-2',
      'Westside Club',
      2
    )
    const { wrapper, locationStore } = mountHome([existingLocation])

    locationStore.createLocation.mockImplementation(() => {
      locationStore.locations.push(createdLocation)
      return createdLocation
    })

    const existingCard = wrapper.get('#location-card-location-1')

    await existingCard.get('.location-card-select').trigger('click')
    await wrapper.get('.create-entity-card').trigger('click')
    await wrapper.get('#location-form-name').setValue('Westside Club')
    await wrapper.get('#location-form').trigger('submit')

    const createdCard = wrapper.get('#location-card-location-2')

    expect(existingCard.get('.location-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(existingCard.classes()).not.toContain('location-card--selected')
    expect(createdCard.get('.location-card-select').attributes('aria-pressed'))
      .toBe('true')
    expect(createdCard.classes()).toContain('location-card--selected')
    expect(createdCard.find('.location-card-command-rail').exists()).toBe(true)
    expect(createdCard.find('.location-card-session-action').exists()).toBe(true)
  })

  it('keeps the selected location while opening and using Create Location', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const { wrapper } = mountHome([location])
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await wrapper.get('.create-entity-card').trigger('click')
    await wrapper.get('#location-form-name').trigger('click')

    expect(card.get('.location-card-select').attributes('aria-pressed'))
      .toBe('true')
    expect(card.classes()).toContain('location-card--selected')
    expect(card.find('.location-card-command-rail').exists()).toBe(true)
  })

  it('opens the edition modal for the requested location with a prefilled draft', async () => {
    const firstLocation = createLocation(
      'location-1',
      'Central Club',
      4,
      'Indoor courts'
    )
    const secondLocation = createLocation(
      'location-2',
      'Westside Club',
      2,
      'Outdoor courts'
    )
    const { wrapper } = mountHome([firstLocation, secondLocation])

    const card = wrapper.findAll('.location-card')[1]

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label'))
      .toBe('Edit Location')
    expect(wrapper.get('#location-form-name').element.value)
      .toBe('Westside Club')
    expect(wrapper.get('#location-form-description').element.value)
      .toBe('Outdoor courts')
    expect(wrapper.get('#location-form-nb-courts').element.value)
      .toBe('2')
    expect(wrapper.get('.edit-location-submit').text()).toBe('Save')
    expect(wrapper.get('.edit-location-submit').attributes('form'))
      .toBe('location-form')
  })

  it('keeps the location selected while using its edition form', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const { wrapper } = mountHome([location])
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')
    await wrapper.get('#location-form-description').trigger('click')

    expect(card.get('.location-card-select').attributes('aria-pressed'))
      .toBe('true')
    expect(card.classes()).toContain('location-card--selected')
    expect(card.find('.location-card-session-action').exists()).toBe(true)
  })

  it.each([
    ['close button', 'button[aria-label="Close"]'],
    ['Cancel action', '.edit-location-cancel']
  ])('closes edition from the %s and clears its target', async (_, selector) => {
    const location = createLocation(
      'location-1',
      'Central Club',
      4,
      'Indoor courts'
    )
    const { wrapper, locationStore } = mountHome([location])

    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')
    await wrapper.get(selector).trigger('click')

    expect(locationStore.updateLocation).not.toHaveBeenCalled()
    expect(wrapper.find('dialog').exists()).toBe(false)

    await wrapper.get('.create-entity-card').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label'))
      .toBe('Create Location')
    expect(wrapper.get('#location-form-name').element.value).toBe('')
  })

  it('updates the requested location and closes the modal after success', async () => {
    const location = createLocation(
      'location-1',
      'Central Club',
      4,
      'Indoor courts'
    )
    const { wrapper, locationStore } = mountHome([location])

    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')
    await wrapper.get('#location-form-name').setValue('Updated Club')
    await wrapper
      .get('#location-form-description')
      .setValue('Updated courts')
    await wrapper.get('#location-form-nb-courts').setValue('6')
    await wrapper.get('#location-form').trigger('submit')

    expect(locationStore.updateLocation).toHaveBeenCalledOnce()
    expect(locationStore.updateLocation).toHaveBeenCalledWith({
      id: location.id,
      name: 'Updated Club',
      description: 'Updated courts',
      nbCourts: 6
    })
    expect(locationStore.createLocation).not.toHaveBeenCalled()
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('disables the court count while the location has a started session', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const startedSession = new Session(location.id, 1)
    const { wrapper } = mountHome([location], [startedSession])
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')

    expect(wrapper.get('#location-form-nb-courts').attributes('disabled'))
      .toBeDefined()
    expect(wrapper.get('.nb-courts-restriction').text())
      .toContain('started session')
    expect(wrapper.get('#location-form-name').attributes('disabled'))
      .toBeUndefined()
  })

  it('allows the court count when every location session is finished', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const finishedSession = new Session(
      location.id,
      1,
      new Date(),
      new Date(),
      SessionStatus.FINISHED
    )
    const { wrapper } = mountHome([location], [finishedSession])
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')

    expect(wrapper.get('#location-form-nb-courts').attributes('disabled'))
      .toBeUndefined()
    expect(wrapper.find('.nb-courts-restriction').exists()).toBe(false)
  })

  it('keeps the edition modal open when the store rejects the update', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const { wrapper, locationStore } = mountHome([location])
    const card = wrapper.get('.location-card')
    const error = new Error(
      'Cannot change the number of courts while a session is started'
    )

    locationStore.updateLocation.mockImplementationOnce(() => {
      throw error
    })

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-edit').trigger('click')

    await expect(wrapper.get('#location-form').trigger('submit'))
      .rejects.toThrow(error)
    expect(wrapper.get('dialog').attributes('aria-label'))
      .toBe('Edit Location')
  })

  it('opens a deletion confirmation for the requested location', async () => {
    const firstLocation = createLocation('location-1', 'Central Club', 4)
    const secondLocation = createLocation('location-2', 'Westside Club', 2)
    const { wrapper, locationStore } = mountHome([
      firstLocation,
      secondLocation
    ])
    const secondCard = wrapper.findAll('.location-card')[1]

    await secondCard.get('.location-card-select').trigger('click')
    await secondCard.get('.location-card-delete').trigger('click')

    expect(wrapper.get('dialog').attributes('aria-label'))
      .toBe('Delete Location')
    expect(wrapper.get('.delete-location-message').text())
      .toContain('Westside Club')
    expect(locationStore.deleteLocation).not.toHaveBeenCalled()
  })

  it.each([
    ['close button', 'button[aria-label="Close"]'],
    ['Cancel action', '.delete-location-cancel']
  ])('cancels deletion from the %s without calling the store', async (
    _,
    selector
  ) => {
    const location = createLocation('location-1', 'Central Club', 4)
    const { wrapper, locationStore } = mountHome([location])
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-delete').trigger('click')
    await wrapper.get(selector).trigger('click')

    expect(locationStore.deleteLocation).not.toHaveBeenCalled()
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('confirms logical deletion and clears the selected location', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const { wrapper, locationStore } = mountHome([location])
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-delete').trigger('click')
    await wrapper.get('.delete-location-confirm').trigger('click')

    expect(locationStore.deleteLocation).toHaveBeenCalledOnce()
    expect(locationStore.deleteLocation).toHaveBeenCalledWith(location.id)
    expect(card.get('.location-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('shows the session action only on the selected location', async () => {
    const firstLocation = createLocation('location-1', 'Central Club', 4)
    const secondLocation = createLocation('location-2', 'Westside Club', 2)

    const { wrapper } = mountHome([firstLocation, secondLocation])
    const cards = wrapper.findAll('.location-card')

    expect(wrapper.findAll('.location-card-session-action')).toHaveLength(0)

    await cards[1].get('.location-card-select').trigger('click')

    expect(cards[0].get('.location-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(cards[1].get('.location-card-select').attributes('aria-pressed'))
      .toBe('true')
    expect(cards[0].classes()).not.toContain('location-card--selected')
    expect(cards[1].classes()).toContain('location-card--selected')
    expect(cards[0].find('.location-card-session-action').exists()).toBe(false)
    expect(cards[1].find('.location-card-session-action').exists()).toBe(true)

    await cards[0].get('.location-card-select').trigger('click')

    expect(cards[0].get('.location-card-select').attributes('aria-pressed'))
      .toBe('true')
    expect(cards[1].get('.location-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(cards[0].find('.location-card-session-action').exists()).toBe(true)
    expect(cards[1].find('.location-card-session-action').exists()).toBe(false)

    await wrapper.get('h1').trigger('click')

    expect(cards[0].get('.location-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(cards[1].get('.location-card-select').attributes('aria-pressed'))
      .toBe('false')
    expect(cards[0].classes()).not.toContain('location-card--selected')
    expect(cards[1].classes()).not.toContain('location-card--selected')
    expect(wrapper.findAll('.location-card-session-action')).toHaveLength(0)
  })

  it('labels the action from the started-session cardinality', async () => {
    const firstLocation = createLocation('location-1', 'Central Club', 4)
    const secondLocation = createLocation('location-2', 'Westside Club', 2)
    const startedSession = new Session(secondLocation.id, 1)

    const { wrapper } = mountHome(
      [firstLocation, secondLocation],
      [startedSession]
    )
    const cards = wrapper.findAll('.location-card')

    await cards[0].get('.location-card-select').trigger('click')

    const startAction = cards[0].get('.location-card-session-action')

    expect(startAction.text()).toBe('Start')
    expect(startAction.attributes('aria-label'))
      .toBe('Start New Session for Central Club')

    await cards[1].get('.location-card-select').trigger('click')

    const continueAction = cards[1].get('.location-card-session-action')

    expect(continueAction.text()).toBe('Continue')
    expect(continueAction.attributes('aria-label'))
      .toBe('Manage Current Session for Westside Club')
  })

  it('shows an error instead of an action for multiple started sessions', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const sessions = [
      new Session(location.id, 1),
      new Session(location.id, 2)
    ]

    const { wrapper } = mountHome([location], sessions)
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')

    expect(card.find('.location-card-session-action').exists()).toBe(false)
    expect(card.get('[role="alert"]').text())
      .toContain('Multiple started sessions')
  })

  it('creates a session from the action of a location without a started session', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const { wrapper, sessionStore } = mountHome([location])
    const card = wrapper.get('.location-card')
    const createdSession = new Session(location.id, 1)

    sessionStore.createSessionForLocation.mockReturnValue(createdSession)

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-session-action').trigger('click')

    expect(sessionStore.createSessionForLocation)
      .toHaveBeenCalledOnce()
    expect(sessionStore.createSessionForLocation)
      .toHaveBeenCalledWith(location.id)
    expect(routerPush).toHaveBeenCalledOnce()
    expect(routerPush).toHaveBeenCalledWith({
      name: 'manageSession',
      params: {
        locationId: location.id,
        sessionId: createdSession.id
      }
    })
  })

  it('navigates to the unique started session without creating one', async () => {
    const location = createLocation('location-1', 'Central Club', 4)
    const startedSession = new Session(location.id, 3)
    const { wrapper, sessionStore } = mountHome(
      [location],
      [startedSession]
    )
    const card = wrapper.get('.location-card')

    await card.get('.location-card-select').trigger('click')
    await card.get('.location-card-session-action').trigger('click')

    expect(sessionStore.createSessionForLocation).not.toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledOnce()
    expect(routerPush).toHaveBeenCalledWith({
      name: 'manageSession',
      params: {
        locationId: location.id,
        sessionId: startedSession.id
      }
    })
  })
})
