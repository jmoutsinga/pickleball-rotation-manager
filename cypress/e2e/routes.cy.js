/* global cy, describe, expect, it */

const routes = [
  {
    path: '/',
    heading: 'Pickleball Training Session Manager'
  },
  {
    path: '/manage',
    heading: 'Training Session Manager'
  },
  {
    path: '/manage-players',
    heading: 'Manage Players'
  },
  {
    path: '/manage/location-1/session-1',
    heading: 'Training Session Manager',
    onBeforeLoad: window => {
      window.localStorage.setItem('pickleball_locations', JSON.stringify([
        {
          id: 'location-1',
          name: 'Central Club',
          description: '',
          nbCourts: 4,
          status: 'ACTIVE'
        }
      ]))
      window.localStorage.setItem('pickleball_sessions', JSON.stringify([
        {
          id: 'session-1',
          locationId: 'location-1',
          order: 1,
          startTime: new Date().toISOString(),
          endTime: null,
          status: 'STARTED',
          playerWaitingTimes: {}
        }
      ]))
    }
  }
]

describe('Application routes', () => {
  routes.forEach(({ path, heading, onBeforeLoad }) => {
    it(`loads and reloads ${path}`, () => {
      const httpErrors = []

      cy.intercept('**', request => {
        request.on('response', response => {
          if (response.statusCode >= 400) {
            httpErrors.push(`${response.statusCode} ${request.url}`)
          }
        })
      })

      cy.visit(path, { onBeforeLoad })
      cy.contains('h1, h2', heading).should('be.visible')

      cy.reload()
      cy.contains('h1, h2', heading).should('be.visible')

      cy.then(() => {
        expect(httpErrors, 'HTTP errors').to.deep.equal([])
      })
    })
  })

  it('redirects to Home when parameters are invalid for an identified route', () => {
    cy.visit('/manage/unknown-location/unknown-session', {
      failOnStatusCode: false
    })

    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.contains('h1', 'Pickleball Training Session Manager').should('be.visible')
  })

  it('clears the selected location from the bottom of the viewport', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: '',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-command-rail')
      .should('not.exist')
    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('#location-card-location-1 .location-card-command-rail')
      .should('be.visible')
    cy.get('.location-card-session-action').should('be.visible')

    cy.window().then(({ innerHeight }) => {
      cy.get('.home').then(home => {
        const { bottom } = home[0].getBoundingClientRect()

        expect(bottom, 'HomeView bottom edge').to.be.closeTo(innerHeight, 1)
      })
    })

    cy.get('.home').click('bottom')
    cy.get('.location-card-session-action').should('not.exist')
  })

  it('renders Home cards 350 pixels wide', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: '',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
      }
    })

    cy.get('.card-grid').children().should(cards => {
      expect(cards).to.have.length(2)

      Array.from(cards).forEach(card => {
        expect(card.getBoundingClientRect().width, 'card width')
          .to.be.closeTo(350, 1)
      })
    })
  })

  it('centers the Location commands on the top edge above the title', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-command-rail')
      .should('not.exist')
    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('#location-card-location-1 .location-card-command-rail')
      .should('be.visible')
    cy.get('#location-card-location-1').then(card => {
      const cardBounds = card[0].getBoundingClientRect()

      cy.wrap(card).find('.location-card-command-rail').then(rail => {
        const railBounds = rail[0].getBoundingClientRect()

        expect(
          railBounds.left + railBounds.width / 2,
          'command rail horizontal center'
        ).to.be.closeTo(cardBounds.left + cardBounds.width / 2, 1)
        expect(railBounds.top - cardBounds.top, 'top inset')
          .to.be.closeTo(3, 1)
      })

      cy.wrap(card).find('.location-card-edit').then(editButton => {
        const editBounds = editButton[0].getBoundingClientRect()

        cy.wrap(card).find('.location-card-delete').then(deleteButton => {
          const deleteBounds = deleteButton[0].getBoundingClientRect()

          expect(editBounds.left, 'Edit before Delete')
            .to.be.lessThan(deleteBounds.left)
          expect(editBounds.top, 'commands aligned horizontally')
            .to.be.closeTo(deleteBounds.top, 1)
          expect(editBounds.top - cardBounds.top, 'Edit top inset')
            .to.be.closeTo(3, 1)
          expect(deleteBounds.top - cardBounds.top, 'Delete top inset')
            .to.be.closeTo(3, 1)

          cy.wrap(card).find('h2').then(title => {
            const titleBounds = title[0].getBoundingClientRect()

            expect(titleBounds.top, 'title below command rail')
              .to.be.greaterThan(deleteBounds.bottom)
          })
        })

        cy.wrap(card).find('.location-card-session-action').then(action => {
          const actionBounds = action[0].getBoundingClientRect()

          expect(action.text().trim(), 'short Start label').to.equal('Start')
          expect(getComputedStyle(action[0]).color, 'Start color')
            .to.equal('rgb(66, 185, 131)')

          cy.wrap(action).find('.location-card-session-icon').then(icon => {
            const iconBounds = icon[0].getBoundingClientRect()

            expect(iconBounds.width, 'Session icon width').to.be.closeTo(52, 1)
            expect(
              iconBounds.width / editBounds.width,
              'Session/Edit size ratio'
            ).to.be.closeTo(1.3, 0.01)
            expect(iconBounds.top - cardBounds.top, 'Session top inset')
              .to.be.closeTo(4, 1)
            expect(cardBounds.right - iconBounds.right, 'Session right inset')
              .to.be.closeTo(4, 1)
          })

          cy.wrap(card).find('.location-card-select').then(titleButton => {
            const titleBounds = titleButton[0].getBoundingClientRect()

            expect(
              titleBounds.left + titleBounds.width / 2,
              'Location title horizontal center'
            ).to.be.closeTo(cardBounds.left + cardBounds.width / 2, 1)
            expect(titleBounds.top, 'title below Session action')
              .to.be.greaterThan(actionBounds.bottom)
            expect(getComputedStyle(card[0]).textAlign, 'card text alignment')
              .to.equal('center')
          })
        })
      })
    })
  })

  it('confirms and persists the logical deletion of a Location', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('#location-card-location-1 .location-card-delete').click()
    cy.get('dialog[aria-label="Delete Location"]')
      .should('contain.text', 'Central Club')
    cy.get('.delete-location-confirm').click()

    cy.get('#location-card-location-1').should('not.exist')
    cy.window().then(window => {
      const locations = JSON.parse(
        window.localStorage.getItem('pickleball_locations')
      )

      expect(locations).to.have.length(1)
      expect(locations[0]).to.include({
        id: 'location-1',
        status: 'DELETED'
      })
    })
  })

  it('locks the court count while a Location session is started', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
        window.localStorage.setItem('pickleball_sessions', JSON.stringify([
          {
            id: 'session-1',
            locationId: 'location-1',
            order: 1,
            startTime: new Date().toISOString(),
            endTime: null,
            status: 'STARTED',
            playerWaitingTimes: {}
          }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('.location-card-session-action')
      .should('contain.text', 'Continue')
      .and('have.css', 'color', 'rgb(255, 170, 31)')
      .find('.location-card-session-icon--fast-forward')
      .should('be.visible')
    cy.get('#location-card-location-1 .location-card-edit').click()

    cy.get('#location-form-nb-courts').should('be.disabled')
    cy.get('#location-form-name').should('not.be.disabled')
    cy.get('.nb-courts-restriction')
      .should('contain.text', 'started session')
  })

  it('keeps the Location selected while using Create and Edit modals', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('.create-entity-card').click()
    cy.get('#location-form-name').click()
    cy.get('#location-card-location-1')
      .should('have.class', 'location-card--selected')
      .find('.location-card-select')
      .should('have.attr', 'aria-pressed', 'true')

    cy.get('dialog[aria-label="Create Location"] .modal__close').click()
    cy.get('#location-card-location-1 .location-card-edit').click()
    cy.get('#location-form-description').click()
    cy.get('#location-card-location-1')
      .should('have.class', 'location-card--selected')
      .find('.location-card-session-action')
      .should('be.visible')
  })

  it('selects the newly created Location instead of the previous one', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 4,
            status: 'ACTIVE'
          }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('.create-entity-card').click()
    cy.get('#location-form-name').type('Westside Club')
    cy.get('#location-form-description').type('Outdoor courts')
    cy.get('#location-form-nb-courts').clear().type('2')
    cy.get('.create-location-submit').click()

    cy.get('#location-card-location-1')
      .should('not.have.class', 'location-card--selected')
      .find('.location-card-select')
      .should('have.attr', 'aria-pressed', 'false')

    cy.contains('.location-card', 'Westside Club')
      .should('have.class', 'location-card--selected')
      .within(() => {
        cy.get('.location-card-select')
          .should('have.attr', 'aria-pressed', 'true')
        cy.get('.location-card-command-rail').should('be.visible')
        cy.get('.location-card-session-action').should('be.visible')
      })
  })
})
