import { PlayerStatus, SessionStatus } from '@/models'
import playerRepository from './PlayerRepository'
import rotationGameNumberMigration from './RotationGameNumberMigration'
import sessionRepository from './SessionRepository'
import teamRepository from './TeamRepository'

export class SessionAttendeeMigration {
  constructor({
    players = playerRepository,
    rotations = rotationGameNumberMigration,
    sessions = sessionRepository,
    teams = teamRepository
  } = {}) {
    this.players = players
    this.rotations = rotations
    this.sessions = sessions
    this.teams = teams
  }

  migrate() {
    const sessionJsons = this.sessions.getRaw()
    const requiresMigration = sessionJsons.some(
      session => !Array.isArray(session.attendingPlayers)
    )

    if (!requiresMigration) {
      return this.sessions.hydrate(sessionJsons)
    }

    const players = this.players.getAll()
    const playersById = new Map(players.map(player => [player.id, player]))
    const rotations = this.rotations.migrate()
    const teamsById = new Map(
      this.teams.getAll().map(team => [team.id, team])
    )
    const sessions = sessionJsons.map(sessionJson => {
      if (Array.isArray(sessionJson.attendingPlayers)) {
        return this.sessions.hydrateOne(sessionJson)
      }

      const sessionRotations = rotations.filter(
        rotation => rotation.sessionId === sessionJson.id
      )
      let attendingPlayers = []

      if (sessionRotations.length > 0) {
        attendingPlayers = this.collectGraphPlayers(
          sessionRotations,
          playersById,
          teamsById
        )
      } else if (sessionJson.status !== SessionStatus.CREATED) {
        attendingPlayers = players.filter(
          player => player.status !== PlayerStatus.DELETED
        )
      }

      return this.sessions.hydrateOne({
        ...sessionJson,
        attendingPlayers: attendingPlayers.map(player => player.toJSON())
      })
    })

    this.sessions.saveAll(sessions)
    return sessions
  }

  collectGraphPlayers(sessionRotations, playersById, teamsById) {
    const attendeesById = new Map()

    sessionRotations.forEach(rotation => {
      rotation.waitingPlayers.forEach(player => {
        attendeesById.set(player.id, playersById.get(player.id) ?? player)
      })

      rotation.games.forEach(game => {
        [game.teamAId, game.teamBId].forEach(teamId => {
          teamsById.get(teamId)?.players.forEach(player => {
            attendeesById.set(player.id, playersById.get(player.id) ?? player)
          })
        })
      })
    })

    return [...attendeesById.values()]
  }
}

export default new SessionAttendeeMigration()
