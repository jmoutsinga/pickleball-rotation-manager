// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { Player, PlayerBuilder, Team } from '@/models'
import { TeamRepository } from './TeamRepository'

function player(id, name) {
  return new PlayerBuilder()
    .withId(id)
    .withName(name)
    .build()
}

describe('TeamRepository', () => {
  const repository = new TeamRepository()

  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and rehydrates Teams and their Players', () => {
    const team = new Team(
      player('player-1', 'Alice'),
      player('player-2', 'Bob'),
      'team-1'
    )

    repository.saveAll([team])

    const [restoredTeam] = repository.getAll()
    expect(restoredTeam).toBeInstanceOf(Team)
    expect(restoredTeam.player1).toBeInstanceOf(Player)
    expect(restoredTeam.player2).toBeInstanceOf(Player)
    expect(restoredTeam.toJSON()).toEqual(team.toJSON())
  })

  it('returns an empty collection when no Team is persisted', () => {
    expect(repository.getAll()).toEqual([])
  })
})
