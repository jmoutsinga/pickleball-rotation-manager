import { Player, PlayerBuilder, PlayerStatus } from '@/models'
import localStorageGateway from './LocalStorageGateway'
import { STORAGE_KEYS } from './StorageKeys'

export class PlayerRepository {
  constructor(gateway = localStorageGateway) {
    this.gateway = gateway
  }

  saveAll(players) {
    this.gateway.write(STORAGE_KEYS.PLAYERS, players)
  }

  getAll() {
    return this.gateway.read(STORAGE_KEYS.PLAYERS, [])
      .map(PlayerBuilder.fromJson)
  }

  getWaiting() {
    return this.getAll().filter(player =>
      player.status === PlayerStatus.WAITING
    )
  }

  add(player) {
    this.assertPlayer(player)
    const players = this.getAll()
    this.assertUniqueName(player.name, players)
    players.push(player)
    this.saveAll(players)
  }

  update(updatedPlayer) {
    this.assertPlayer(updatedPlayer)
    const players = this.getAll()
    const index = players.findIndex(player => player.id === updatedPlayer.id)

    if (index !== -1) {
      this.assertUniqueName(updatedPlayer.name, players, updatedPlayer.id)
      players[index] = updatedPlayer
      this.saveAll(players)
    }
  }

  changeStatus(playerId, status) {
    const players = this.getAll()
    const player = players.find(candidate => candidate.id === playerId)

    if (!player) {
      throw new Error(`Player "${playerId}" does not exist`)
    }

    player.changeStatus(status)
    this.saveAll(players)
    return player
  }

  merge(updatedPlayers) {
    const updatedById = new Map(
      updatedPlayers.map(player => {
        this.assertPlayer(player)
        return [player.id, player]
      })
    )
    const players = this.getAll().map(player =>
      updatedById.get(player.id) ?? player
    )

    this.saveAll(players)
  }

  updateTeam(playerId, teamId) {
    const players = this.getAll()
    const player = players.find(candidate => candidate.id === playerId)
    if (player) {
      player.changeStatus(teamId ? PlayerStatus.PLAYING : PlayerStatus.WAITING)
      this.saveAll(players)
    }
  }

  release(playerId) {
    const players = this.getAll()
    const player = players.find(candidate => candidate.id === playerId)
    if (player) {
      player.changeStatus(PlayerStatus.AVAILABLE)
      this.saveAll(players)
    }
  }

  assertPlayer(player) {
    if (!(player instanceof Player)) {
      throw new TypeError('Players must be created with PlayerBuilder')
    }
  }

  assertUniqueName(name, players, ignoredPlayerId = null) {
    if (players.some(player =>
      player.id !== ignoredPlayerId && player.name === name
    )) {
      throw new Error(`A player named "${name}" already exists`)
    }
  }
}

export default new PlayerRepository()
