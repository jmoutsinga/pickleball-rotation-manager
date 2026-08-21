// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Game, RotationStatus } from '@/models'
import GameCard from './GameCard.vue'

const TeamCardStub = {
  name: 'TeamCard',
  props: [
    'team',
    'label',
    'variant',
    'showScore',
    'score',
    'scoreDisabled',
    'result',
    'winnerSelectable'
  ],
  emits: [
    'player-drag-start',
    'player-drop',
    'player-swap',
    'remove-player',
    'score-change',
    'select-winner'
  ],
  template: `
    <section class="team-card-stub">
      <button class="drag" @click="$emit('player-drag-start', 'player-1')">Drag</button>
      <button class="drop" @click="$emit('player-drop')">Drop</button>
      <button class="swap" @click="$emit('player-swap', 'player-2')">Swap</button>
      <button class="remove" @click="$emit('remove-player', 'player-1')">Remove</button>
    </section>
  `
}

const teamA = { id: 'team-a', players: [] }
const teamB = { id: 'team-b', players: [] }

function createGame(overrides = {}) {
  return Game.fromJson({
    id: 'game-1',
    number: 4,
    courtId: 'court-1',
    teamAId: teamA.id,
    teamBId: teamB.id,
    scoreTeamA: null,
    scoreTeamB: null,
    winnerTeam: null,
    loserTeam: null,
    ...overrides
  })
}

function mountCard(overrides = {}, options = {}) {
  return mount(GameCard, {
    props: {
      game: createGame(),
      teamA,
      teamB,
      rotationStatus: RotationStatus.CREATED,
      ...overrides
    },
    ...options
  })
}

describe('GameCard', () => {
  it('composes Team A versus Team B', () => {
    const wrapper = mountCard({}, {
      global: { stubs: { TeamCard: TeamCardStub } }
    })
    const teams = wrapper.findAllComponents(TeamCardStub)

    expect(teams).toHaveLength(2)
    expect(teams[0].props()).toMatchObject({
      team: teamA,
      label: 'Team A',
      variant: 'a'
    })
    expect(teams[1].props()).toMatchObject({
      team: teamB,
      label: 'Team B',
      variant: 'b'
    })
    expect(wrapper.get('h4').text()).toBe('Game N°4')
    expect(wrapper.get('.team-divider').text()).toBe('VS')
    expect(wrapper.find('.game-card__score-action').exists()).toBe(false)
  })

  it('adds the target Team to drop events and forwards other intentions', async () => {
    const wrapper = mountCard({}, {
      global: { stubs: { TeamCard: TeamCardStub } }
    })
    const teams = wrapper.findAll('.team-card-stub')

    await teams[0].get('.drag').trigger('click')
    await teams[1].get('.drop').trigger('click')
    await teams[1].get('.swap').trigger('click')
    await teams[0].get('.remove').trigger('click')

    expect(wrapper.emitted('player-drag-start')).toEqual([['player-1']])
    expect(wrapper.emitted('player-drop')).toEqual([['team-b']])
    expect(wrapper.emitted('player-swap')).toEqual([['player-2']])
    expect(wrapper.emitted('remove-player')).toEqual([['player-1']])
  })

  it('submits, displays and reopens a non-tied score', async () => {
    const wrapper = mountCard({
      rotationStatus: RotationStatus.SCORING
    })
    const inputs = wrapper.findAll('.team__score')

    expect(wrapper.classes()).toContain('game-card--editing')
    expect(wrapper.get('.game-card__score-action').attributes('disabled'))
      .toBeDefined()

    await inputs[0].setValue('11')
    await inputs[1].setValue('7')
    await wrapper.get('.game-card__score-action').trigger('click')

    expect(wrapper.emitted('score-game')).toEqual([[
      {
        gameId: 'game-1',
        scoreTeamA: 11,
        scoreTeamB: 7
      }
    ]])

    const resolvedGame = createGame({ scoreTeamA: 11, scoreTeamB: 7 })
    await wrapper.setProps({ game: resolvedGame })

    expect(wrapper.classes()).not.toContain('game-card--editing')
    expect(wrapper.classes()).toContain('game-card--resolved')
    expect(wrapper.get('.game-card__check').attributes('aria-label'))
      .toBe('Game validated')
    expect(wrapper.findAll('.team__score').every(input =>
      input.attributes('disabled') !== undefined
    )).toBe(true)
    expect(wrapper.findAllComponents({ name: 'TeamCard' })[0].props('result'))
      .toBe('winner')
    expect(wrapper.findAllComponents({ name: 'TeamCard' })[1].props('result'))
      .toBe('loser')
    expect(wrapper.find('.team-a .team__result-badge').text()).toBe('W')
    expect(wrapper.find('.team-b .team__result-badge').text()).toBe('L')

    await wrapper.get('.game-card__score-action--ko').trigger('click')
    expect(wrapper.emitted('score-editing-change')[1]).toEqual([{
      gameId: 'game-1',
      isEditing: true
    }])
    expect(wrapper.classes()).toContain('game-card--editing')
    expect(wrapper.classes()).not.toContain('game-card--resolved')
    expect(wrapper.find('.game-card__check').exists()).toBe(false)
    expect(wrapper.findAll('.team__score').every(input =>
      input.attributes('disabled') === undefined
    )).toBe(true)
    expect(wrapper.findAll('.team__score').map(input => input.element.value))
      .toEqual(['11', '7'])
    expect(wrapper.findAllComponents({ name: 'TeamCard' })[0].props('result'))
      .toBeNull()
    expect(wrapper.findAllComponents({ name: 'TeamCard' })[1].props('result'))
      .toBeNull()
    expect(wrapper.find('.team__result-badge').exists()).toBe(false)

    await wrapper.get('.game-card__score-action--ok').trigger('click')
    expect(wrapper.emitted('score-game')[1]).toEqual([{
      gameId: 'game-1',
      scoreTeamA: 11,
      scoreTeamB: 7
    }])
    expect(wrapper.emitted('score-editing-change')[2]).toEqual([{
      gameId: 'game-1',
      isEditing: false
    }])
  })

  it('opens every unscored Game when a reused card enters scoring', async () => {
    const wrapper = mountCard({
      game: createGame({ scoreTeamA: 11, scoreTeamB: 7 }),
      rotationStatus: RotationStatus.SCORING
    })

    expect(wrapper.findAll('.team__score').every(input =>
      input.attributes('disabled') !== undefined
    )).toBe(true)

    await wrapper.setProps({
      game: createGame({ id: 'game-2', number: 5 }),
      rotationStatus: RotationStatus.CREATED
    })
    await wrapper.setProps({ rotationStatus: RotationStatus.IN_PROGRESS })
    await wrapper.setProps({ rotationStatus: RotationStatus.SCORING })

    expect(wrapper.classes()).toContain('game-card--editing')
    expect(wrapper.findAll('.team__score').every(input =>
      input.attributes('disabled') === undefined
    )).toBe(true)
    expect(wrapper.get('.game-card__score-action').classes())
      .toContain('game-card__score-action--ok')
  })

  it('asks for a winner and emits its Team for tied scores', async () => {
    const tiedGame = createGame({ scoreTeamA: 9, scoreTeamB: 9 })
    const wrapper = mountCard({
      game: tiedGame,
      rotationStatus: RotationStatus.SCORING
    })
    const teams = wrapper.findAllComponents({ name: 'TeamCard' })

    expect(wrapper.get('.game-card__winner-question').text()).toBe('WINNER ?')
    expect(wrapper.find('.game-card__check').exists()).toBe(false)
    expect(teams[0].props('winnerSelectable')).toBe(true)
    expect(teams[1].props('winnerSelectable')).toBe(true)

    await teams[1].trigger('click')

    expect(wrapper.emitted('designate-winner')).toEqual([[
      { gameId: 'game-1', winnerTeamId: 'team-b' }
    ]])
  })

  it('asks for a new winner after reopening and resubmitting a tied score', async () => {
    const resolvedTie = createGame({
      scoreTeamA: 9,
      scoreTeamB: 9,
      winnerTeam: 'team-b',
      loserTeam: 'team-a'
    })
    const wrapper = mountCard({
      game: resolvedTie,
      rotationStatus: RotationStatus.SCORING
    })

    await wrapper.get('.game-card__score-action--ko').trigger('click')
    expect(wrapper.find('.game-card__winner-question').exists()).toBe(false)

    await wrapper.get('.game-card__score-action--ok').trigger('click')
    expect(wrapper.emitted('score-game')).toEqual([[
      { gameId: 'game-1', scoreTeamA: 9, scoreTeamB: 9 }
    ]])

    await wrapper.setProps({
      game: createGame({ scoreTeamA: 9, scoreTeamB: 9 })
    })

    expect(wrapper.get('.game-card__winner-question').text()).toBe('WINNER ?')
    expect(wrapper.find('.game-card__check').exists()).toBe(false)
    expect(wrapper.findAllComponents({ name: 'TeamCard' })
      .every(team => team.props('winnerSelectable'))).toBe(true)
  })
})
