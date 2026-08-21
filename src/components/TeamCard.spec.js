// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TeamCard from './TeamCard.vue'

const team = {
  id: 'team-a',
  players: [{ id: 'player-1', name: 'Alice' }]
}

describe('TeamCard', () => {
  it('renders its label, players and remaining capacity', () => {
    const wrapper = mount(TeamCard, {
      props: { team, label: 'Team A', variant: 'a' }
    })

    expect(wrapper.get('h5').text()).toBe('Team A')
    expect(wrapper.get('.team-player').text()).toContain('Alice')
    expect(wrapper.get('.team-player').attributes('data-touch-player-id'))
      .toBe('player-1')
    expect(wrapper.get('.team-players').attributes('data-touch-team-id'))
      .toBe('team-a')
    expect(wrapper.get('.player-slot').text()).toBe('Drag player here (1/2)')
    expect(wrapper.classes()).toContain('team-a')
  })

  it('renders and emits a numeric score while exposing result variants', async () => {
    const wrapper = mount(TeamCard, {
      props: {
        team,
        label: 'Team A',
        variant: 'a',
        showScore: true,
        score: 8,
        scoreDisabled: false,
        result: 'winner',
        winnerSelectable: true
      }
    })
    const score = wrapper.get('.team__score')
    const scoreControl = wrapper.get('fieldset.team__score-control')

    expect(score.attributes('type')).toBe('number')
    expect(score.element.value).toBe('8')
    expect(scoreControl.attributes('aria-label'))
      .toBe('Score controls Team A')
    expect(wrapper.classes()).toContain('team--winner')
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.get('.team__result-badge').text()).toBe('W')
    expect(wrapper.get('.team__result-badge').attributes('aria-label'))
      .toBe('Team A winner')

    await score.setValue('11')
    await wrapper.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('score-change')).toEqual([[11]])
    expect(wrapper.emitted('select-winner')).toHaveLength(1)
  })

  it('positions a W or L result marker according to the Team variant', () => {
    const winner = mount(TeamCard, {
      props: {
        team,
        label: 'Team A',
        variant: 'a',
        result: 'winner'
      }
    })
    const loser = mount(TeamCard, {
      props: {
        team: { ...team, id: 'team-b' },
        label: 'Team B',
        variant: 'b',
        result: 'loser'
      }
    })

    expect(winner.get('.team__result-badge').text()).toBe('W')
    expect(winner.get('.team__result-badge').classes())
      .toContain('team__result-badge--right')
    expect(loser.get('.team__result-badge').text()).toBe('L')
    expect(loser.get('.team__result-badge').classes())
      .toContain('team__result-badge--left')
  })

  it('increments and decrements scores within bounds', async () => {
    const wrapper = mount(TeamCard, {
      props: {
        team,
        label: 'Team A',
        variant: 'a',
        showScore: true,
        score: null,
        scoreDisabled: false
      }
    })
    const decrease = wrapper.get('[aria-label="Decrease score Team A"]')
    const increase = wrapper.get('[aria-label="Increase score Team A"]')

    expect(decrease.attributes('disabled')).toBeDefined()
    expect(increase.attributes('disabled')).toBeUndefined()

    await increase.trigger('click')
    expect(wrapper.emitted('score-change')).toEqual([[1]])

    await wrapper.setProps({ score: 1 })
    await decrease.trigger('click')
    expect(wrapper.emitted('score-change')).toEqual([[1], [0]])

    await wrapper.setProps({ score: 100 })
    expect(increase.attributes('disabled')).toBeDefined()

    await wrapper.setProps({ score: 8, scoreDisabled: true })
    expect(decrease.attributes('disabled')).toBeDefined()
    expect(increase.attributes('disabled')).toBeDefined()
  })

  it('highlights only a hovered Team selectable as winner', async () => {
    const wrapper = mount(TeamCard, {
      props: {
        team,
        label: 'Team A',
        variant: 'a',
        winnerSelectable: true
      }
    })

    await wrapper.trigger('mouseenter')
    expect(wrapper.classes()).toContain('team--winner-hovered')

    await wrapper.trigger('mouseleave')
    expect(wrapper.classes()).not.toContain('team--winner-hovered')

    await wrapper.setProps({ winnerSelectable: false })
    await wrapper.trigger('mouseenter')
    expect(wrapper.classes()).not.toContain('team--winner-hovered')
  })

  it('distinguishes a player swap from a Team drop', async () => {
    const wrapper = mount(TeamCard, {
      props: { team, label: 'Team A', variant: 'a' }
    })
    const dataTransfer = { effectAllowed: 'none' }

    await wrapper.get('.team-player').trigger('dragstart', { dataTransfer })
    await wrapper.get('.team-player').trigger('drop')
    await wrapper.get('.team-players').trigger('drop')
    await wrapper.get('.remove-btn').trigger('click')

    expect(dataTransfer.effectAllowed).toBe('move')
    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-swap')).toEqual([['player-1']])
    expect(wrapper.emitted('player-drop')).toHaveLength(1)
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
  })
})
