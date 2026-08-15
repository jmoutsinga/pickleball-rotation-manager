// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import CardGrid from './CardGrid.vue'

enableAutoUnmount(afterEach)

describe('CardGrid', () => {
    it('renders the items provided through its default slot in order', () => {
        const componentWrapper = mount(CardGrid, {
            slots: {
                default: `
          <article data-test="card">Create Location</article>
          <article data-test="card">Central Park</article>
        `
            }
        })

        expect(componentWrapper.classes()).toContain('card-grid')

        const cards = componentWrapper.findAll('[data-test="card"]')

        expect(cards).toHaveLength(2)
        expect(cards.map(card => card.text())).toEqual([
            'Create Location',
            'Central Park'
        ])
    })
})