import { describe, expect, it } from 'vitest'
import { PlayerBuilder } from './Player'
import { Team } from './Team'

const createPlayer = (id: string, name: string) =>
  new PlayerBuilder().withId(id).withName(name).build()

describe('Team', () => {
  it('accepts at most two different players', () => {
    const alice = createPlayer('player-1', 'alice')
    const bob = createPlayer('player-2', 'bob')
    const carol = createPlayer('player-3', 'carol')
    const team = new Team()

    expect(team.addPlayer(alice)).toBe(true)
    expect(team.addPlayer(alice)).toBe(true)
    expect(team.addPlayer(bob)).toBe(true)
    expect(team.addPlayer(carol)).toBe(false)
    expect(team.players).toEqual([alice, bob])
  })

  it('uses a stable key regardless of player order', () => {
    const alice = createPlayer('player-1', 'alice')
    const bob = createPlayer('player-2', 'bob')

    expect(new Team(alice, bob).key).toBe('alice-bob')
    expect(new Team(bob, alice).key).toBe('alice-bob')
  })

  it('removes a player and restores its graph from JSON', () => {
    const team = new Team(
      createPlayer('player-1', 'alice'),
      createPlayer('player-2', 'bob'),
      'team-1'
    )

    const restoredTeam = Team.fromJson(team.toJSON())
    restoredTeam.removePlayer('player-1')

    expect(restoredTeam).toBeInstanceOf(Team)
    expect(restoredTeam.id).toBe('team-1')
    expect(restoredTeam.players.map(player => player.id)).toEqual(['player-2'])
  })

  it('replaces its lineup while preserving explicit player slots', () => {
    const alice = createPlayer('player-1', 'alice')
    const bob = createPlayer('player-2', 'bob')
    const team = new Team()

    team.replaceLineup(bob, alice)

    expect(team.player1).toBe(bob)
    expect(team.player2).toBe(alice)
    expect(() => team.replaceLineup(alice, alice))
      .toThrow('A team requires two different players')
    expect(team.player1).toBe(bob)
    expect(team.player2).toBe(alice)
  })
})
