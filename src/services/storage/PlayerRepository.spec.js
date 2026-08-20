// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { Player, PlayerBuilder, PlayerStatus } from '@/models'
import { PlayerRepository } from './PlayerRepository'

function player(id, name, status = PlayerStatus.AVAILABLE) {
  return new PlayerBuilder()
    .withId(id)
    .withName(name)
    .withStatus(status)
    .build()
}

describe('PlayerRepository', () => {
  const repository = new PlayerRepository()

  beforeEach(() => {
    localStorage.clear()
  })

  it('rehydrates Players and persists a new unique Player', () => {
    repository.saveAll([player('player-1', 'Alice')])

    repository.add(player('player-2', 'Bob'))

    const players = repository.getAll()
    expect(players).toHaveLength(2)
    expect(players[0]).toBeInstanceOf(Player)
    expect(players.map(candidate => candidate.name)).toEqual(['alice', 'bob'])
  })

  it('preserves the global unique-name rule', () => {
    repository.add(player('player-1', 'Alice'))

    expect(() => repository.add(player('player-2', 'Alice')))
      .toThrow('A player named "alice" already exists')
    expect(repository.getAll()).toHaveLength(1)
  })

  it('merges updates without removing Players absent from the command', () => {
    repository.saveAll([
      player('player-1', 'Alice'),
      player('player-2', 'Bob')
    ])

    repository.merge([player('player-1', 'Alice', PlayerStatus.WAITING)])

    expect(repository.getAll().map(candidate => candidate.toJSON()))
      .toEqual([
        player('player-1', 'Alice', PlayerStatus.WAITING).toJSON(),
        player('player-2', 'Bob').toJSON()
      ])
  })

  it('changes status and rejects an unknown Player', () => {
    repository.add(player('player-1', 'Alice'))

    const changedPlayer = repository.changeStatus(
      'player-1',
      PlayerStatus.DELETED
    )

    expect(changedPlayer.status).toBe(PlayerStatus.DELETED)
    expect(repository.getAll()[0].status).toBe(PlayerStatus.DELETED)
    expect(() => repository.changeStatus('unknown-player', PlayerStatus.DELETED))
      .toThrow('Player "unknown-player" does not exist')
  })
})
