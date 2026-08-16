/* global cy, describe, expect, it */

const routes = [
  {
    path: '/',
    heading: 'Pickleball Training Session Manager'
  },
  {
    path: '/manage',
    heading: 'Session #1'
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

  it('initializes and persists sample data only once from Home', () => {
    const expectedLocations = [
      { name: 'Le Grand Saconnex', nbCourts: 4 },
      { name: 'Genève', nbCourts: 2 },
      { name: 'Lancy', nbCourts: 6 },
      { name: 'Carouge', nbCourts: 2 },
      { name: 'Bellevue', nbCourts: 8 }
    ]

    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.clear()
      }
    })

    cy.get('.home').then(home => {
      expect(home[0].firstElementChild).to.have.class(
        'sample-data-initializer'
      )
    })
    cy.get('.sample-data-initializer')
      .should('be.visible')
      .invoke('text')
      .then(text => expect(text.trim()).to.equal('Initialize sample data'))
    cy.get('.sample-data-initializer')
      .click()

    cy.get('.sample-data-initializer').should('not.exist')
    cy.get('.location-card').should('have.length', 5)
    expectedLocations.forEach(({ name, nbCourts }) => {
      cy.contains('.location-card', name)
        .should('contain.text', `${nbCourts} courts`)
    })

    cy.window().then(window => {
      const locations = JSON.parse(
        window.localStorage.getItem('pickleball_locations')
      )
      const players = JSON.parse(
        window.localStorage.getItem('pickleball_players')
      )

      expect(
        window.localStorage.getItem('pickleball_sample_data_initialized')
      ).to.equal('true')
      expect(locations.map(({ name, nbCourts, status }) => ({
        name,
        nbCourts,
        status
      }))).to.deep.equal(expectedLocations.map(location => ({
        ...location,
        status: 'ACTIVE'
      })))
      expect(players).to.have.length(50)
      expect(new Set(players.map(player => player.name)).size).to.equal(50)
      expect(players.every(player => player.status === 'AVAILABLE')).to.be.true
    })

    cy.reload()
    cy.get('.sample-data-initializer').should('not.exist')
    cy.get('.location-card').should('have.length', 5)

    cy.visit('/manage-players')
    cy.get('.player-card').should('have.length', 50)
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

  it('loads and filters Players without initializing a Session', () => {
    cy.visit('/manage-players', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_players', JSON.stringify([
          { id: 'player-1', name: 'élise', status: 'AVAILABLE' },
          { id: 'player-2', name: 'alice', status: 'AVAILABLE' },
          { id: 'player-3', name: 'bob', status: 'DELETED' }
        ]))
      }
    })

    cy.get('.card-grid').children().should('have.length', 3)
    cy.get('.card-grid').children().first()
      .should('have.class', 'create-entity-card')
      .and('contain.text', 'Create Player')
    cy.get('#player-card-player-3').should('not.exist')

    cy.get('#player-search').type('ELISE')
    cy.get('#player-card-player-1').should('be.visible')
    cy.get('#player-card-player-2').should('not.exist')

    cy.get('#player-search').clear()
    let uncheckedThumbTransform

    cy.get('#show-deleted-players').should(toggle => {
      const style = getComputedStyle(toggle[0])

      expect(toggle[0].checked).to.be.false
      expect(toggle[0].getAttribute('role')).to.equal('switch')
      expect(style.backgroundColor).to.equal('rgb(199, 206, 212)')
      expect(style.borderRadius).to.equal('999px')
      uncheckedThumbTransform = getComputedStyle(
        toggle[0],
        '::before'
      ).transform
    }).check().should(toggle => {
      const style = getComputedStyle(toggle[0])
      const checkedThumbTransform = getComputedStyle(
        toggle[0],
        '::before'
      ).transform

      expect(toggle[0].checked).to.be.true
      expect(style.backgroundColor).to.equal('rgb(66, 185, 131)')
      expect(checkedThumbTransform).not.to.equal(uncheckedThumbTransform)
    })
    cy.get('#player-card-player-3')
      .should('be.visible')
      .and('have.class', 'player-card--deleted')

    cy.window().then(window => {
      expect(window.localStorage.getItem('pickleball_sessions')).to.be.null
    })
  })

  it('creates, edits, logically deletes and restores a Player', () => {
    cy.visit('/manage-players')

    cy.get('.create-entity-card').click()
    cy.get('#player-form-name').type('Alice')
    cy.get('.create-player-submit').click()

    cy.contains('.player-card', 'alice')
      .as('playerCard')
      .should('have.class', 'player-card--selected')
    cy.get('@playerCard').find('.player-card-edit').click()
    cy.get('#player-form-name').clear().type('Alicia')
    cy.get('.edit-player-submit').click()

    cy.contains('.player-card', 'alicia')
      .as('updatedPlayerCard')
      .should('have.class', 'player-card--selected')
    cy.get('@updatedPlayerCard').find('.player-card-delete').click()
    cy.get('.delete-player-confirm').click()
    cy.get('.player-card').should('not.exist')

    cy.get('#show-deleted-players').check()
    cy.contains('.player-card', 'alicia')
      .as('deletedPlayerCard')
      .should('have.class', 'player-card--deleted')
      .find('.player-card-select')
      .click()

    cy.get('@deletedPlayerCard').then(card => {
      const cardBounds = card[0].getBoundingClientRect()

      cy.wrap(card).find('.player-card-restore').then(restore => {
        const restoreBounds = restore[0].getBoundingClientRect()

        expect(restoreBounds.top - cardBounds.top, 'restore top inset')
          .to.be.closeTo(3, 1)
        expect(
          restoreBounds.left + restoreBounds.width / 2,
          'restore horizontal center'
        ).to.be.closeTo(cardBounds.left + cardBounds.width / 2, 1)
      })
    })

    cy.get('@deletedPlayerCard').find('.player-card-restore').click()
    cy.get('@deletedPlayerCard')
      .should('have.class', 'player-card--selected')
      .and('not.have.class', 'player-card--deleted')

    cy.window().then(window => {
      const players = JSON.parse(
        window.localStorage.getItem('pickleball_players')
      )

      expect(players).to.have.length(1)
      expect(players[0]).to.include({
        name: 'alicia',
        status: 'AVAILABLE'
      })
    })
  })

  it('blocks deletion of a Player linked to a started Session', () => {
    cy.visit('/manage-players', {
      onBeforeLoad: window => {
        const player = {
          id: 'player-1',
          name: 'alice',
          status: 'AVAILABLE'
        }
        window.localStorage.setItem(
          'pickleball_players',
          JSON.stringify([player])
        )
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
        window.localStorage.setItem('pickleball_rotations', JSON.stringify([
          {
            id: 'rotation-1',
            sessionId: 'session-1',
            order: 1,
            games: [],
            waitingPlayers: [player],
            status: 'CREATED'
          }
        ]))
      }
    })

    cy.get('.player-card-select').click()
    cy.get('.player-card-delete').click()
    cy.get('.delete-player-confirm').click()

    cy.get('dialog[aria-label="Delete Player"]').should('be.visible')
    cy.get('.modal-error')
      .should('contain.text', 'cannot be deleted while linked')
    cy.get('#player-card-player-1').should('be.visible')
  })

  it('persists attendee selection and starts a Session with at least four Players', () => {
    cy.visit('/', {
      onBeforeLoad: window => {
        window.localStorage.setItem('pickleball_locations', JSON.stringify([
          {
            id: 'location-1',
            name: 'Central Club',
            description: 'Indoor courts',
            nbCourts: 2,
            status: 'ACTIVE'
          }
        ]))
        const availablePlayers = Array.from({ length: 20 }, (_, index) => ({
          id: `player-${index + 1}`,
          name: `player-${index + 1}`,
          status: 'AVAILABLE'
        }))

        window.localStorage.setItem('pickleball_players', JSON.stringify([
          ...availablePlayers,
          { id: 'player-21', name: 'waiting-player', status: 'WAITING' },
          { id: 'player-22', name: 'deleted-player', status: 'DELETED' }
        ]))
      }
    })

    cy.get('#location-card-location-1 .location-card-select').click()
    cy.get('.location-card-session-action').click()

    cy.url().should('match', /\/manage\/location-1\/[0-9a-f-]+$/)
    cy.contains('h2', 'Session #1').should('be.visible')
    cy.get('.session-player-card').should('have.length', 20)
    cy.get('.court-setup').should('not.exist')
    cy.get('.courts-container').should('not.exist')
    cy.get('.session-form__start').should('be.disabled')
    cy.get('.session-form__header').should(header => {
      expect(getComputedStyle(header[0]).position).to.equal('sticky')
    })
    cy.get('.session-form').should(form => {
      const style = getComputedStyle(form[0])

      expect(style.maxHeight).to.equal('none')
      expect(style.overflowY).to.equal('visible')
    })
    cy.get('.session-form__grid-scroll').should(grid => {
      const style = getComputedStyle(grid[0])

      expect(style.overflowY).to.equal('visible')
      expect(style.overflowX).to.equal('visible')
      expect(grid[0].scrollHeight).to.equal(grid[0].clientHeight)
    })
    cy.get('.session-player-card').then(cards => {
      const firstCard = cards[0].getBoundingClientRect()
      const secondCard = cards[1].getBoundingClientRect()

      expect(secondCard.top, 'wide viewport uses multiple columns')
        .to.be.closeTo(firstCard.top, 1)
      expect(firstCard.width, 'shared CardGrid card width')
        .to.be.closeTo(350, 1)
    })

    cy.viewport(375, 800)
    cy.get('.session-form__grid').then(grid => {
      const gridBounds = grid[0].getBoundingClientRect()

      cy.get('.session-player-card').then(cards => {
        const firstCard = cards[0].getBoundingClientRect()
        const secondCard = cards[1].getBoundingClientRect()

        expect(secondCard.top, 'narrow viewport uses one column')
          .to.be.greaterThan(firstCard.bottom)
        expect(firstCard.left, 'card remains inside grid')
          .to.be.at.least(gridBounds.left)
        expect(firstCard.right, 'card remains inside grid')
          .to.be.at.most(gridBounds.right + 1)
      })
    })
    cy.document().then(document => {
      expect(
        document.documentElement.scrollHeight,
        'the document owns the vertical scroll'
      ).to.be.greaterThan(document.documentElement.clientHeight)
    })
    cy.scrollTo('bottom')
    cy.get('.session-form__header').should(header => {
      expect(
        header[0].getBoundingClientRect().top,
        'sticky header remains visible during page scroll'
      ).to.be.closeTo(0, 1)
    })
    cy.scrollTo('top')
    cy.viewport(1000, 660)

    cy.get('.session-player-card').eq(0).click()
    cy.get('.session-player-card').eq(0)
      .should('have.class', 'session-player-card--selected')
      .and('have.css', 'background-color', 'rgb(229, 247, 238)')
      .find('.session-player-card__check')
      .should('be.visible')
      .find('circle')
      .should('have.attr', 'r', '14')

    cy.get('.session-player-card').eq(0).then(card => {
      const cardBounds = card[0].getBoundingClientRect()

      cy.wrap(card).find('.session-player-card__name').then(name => {
        const nameBounds = name[0].getBoundingClientRect()

        expect(
          nameBounds.left + nameBounds.width / 2,
          'player name horizontal center'
        ).to.be.closeTo(cardBounds.left + cardBounds.width / 2, 1)
        expect(
          nameBounds.top + nameBounds.height / 2,
          'player name vertical center'
        ).to.be.closeTo(cardBounds.top + cardBounds.height / 2, 1)
      })
    })

    cy.get('.session-player-card').eq(1).click()
    cy.get('.session-player-card').eq(2).click()
    cy.get('.session-form__start').should('be.disabled')
    cy.get('.session-player-card').eq(3).click()
    cy.get('.session-form__start').should('not.be.disabled')

    cy.reload()

    cy.get('.session-player-card--selected').should('have.length', 4)
    cy.get('.session-form__start').should('not.be.disabled')
    cy.get('.session-player-card').eq(0).click()
    cy.get('.session-player-card--selected').should('have.length', 3)
    cy.get('.session-form__start').should('be.disabled')
    cy.get('.session-player-card').eq(0).click()
    cy.get('.session-form__start').click()

    cy.get('.session-form').should('not.exist')
    cy.contains('h2', 'Training Session Manager').should('be.visible')
    cy.get('.courts-container').should('be.visible')
    cy.window().then(window => {
      const [session] = JSON.parse(
        window.localStorage.getItem('pickleball_sessions')
      )
      const [rotation] = JSON.parse(
        window.localStorage.getItem('pickleball_rotations')
      )

      expect(session.status).to.equal('STARTED')
      expect(session.startTime).to.be.a('string')
      expect(session.attendingPlayers.map(player => player.id))
        .to.deep.equal(['player-2', 'player-3', 'player-4', 'player-1'])
      expect(rotation.waitingPlayers.map(player => player.id))
        .to.deep.equal(['player-2', 'player-3', 'player-4', 'player-1'])
      expect(rotation.waitingPlayers.map(player => player.id))
        .not.to.include('player-5')
    })
  })
})
