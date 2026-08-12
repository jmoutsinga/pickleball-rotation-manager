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
  }
]

describe('Application routes', () => {
  routes.forEach(({ path, heading }) => {
    it(`loads and reloads ${path}`, () => {
      const httpErrors = []

      cy.intercept('**', request => {
        request.on('response', response => {
          if (response.statusCode >= 400) {
            httpErrors.push(`${response.statusCode} ${request.url}`)
          }
        })
      })

      cy.visit(path)
      cy.contains('h1, h2', heading).should('be.visible')

      cy.reload()
      cy.contains('h1, h2', heading).should('be.visible')

      cy.then(() => {
        expect(httpErrors, 'HTTP errors').to.deep.equal([])
      })
    })
  })
})
