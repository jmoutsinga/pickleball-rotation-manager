import { describe, expect, it } from 'vitest'
import { Player, PlayerBuilder } from './Player'
import { PlayerStatus } from './PlayerStatus'

describe('Player', () => {
  it('normalizes a valid name and uses the default status', () => {
    const player = new PlayerBuilder()
      .withId('player-1')
      .withName('  Élise-Martin  ')
      .build()

    expect(player.name).toBe('élise-martin')
    expect(player.status).toBe(PlayerStatus.AVAILABLE)
  })

  it.each(['', 'john doe', 'john--doe', '-john', 'john-'])(
    'rejects the invalid name %j',
    name => {
      expect(() => new PlayerBuilder().withName(name).build())
        .toThrow('Player name must contain words separated by hyphens only')
    }
  )

  it('changes status and restores a Player instance from JSON', () => {
    const player = new PlayerBuilder()
      .withId('player-1')
      .withName('alice')
      .build()

    player.changeStatus(PlayerStatus.WAITING)
    const restoredPlayer = PlayerBuilder.fromJson(player.toJSON())

    expect(restoredPlayer).toBeInstanceOf(Player)
    expect(restoredPlayer.toJSON()).toEqual({
      id: 'player-1',
      name: 'alice',
      status: PlayerStatus.WAITING
    })
  })
})
