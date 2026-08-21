import {
  Court,
  Game,
  Rotation,
  SessionStatus,
  Team,
  validateSessionGraph
} from '@/models'
import { ApplicationError, ErrorCode } from '@/errors/ApplicationError'
import courtRepository from './CourtRepository'
import rotationGameNumberMigration from './RotationGameNumberMigration'
import rotationRepository from './RotationRepository'
import teamRepository from './TeamRepository'

export class SessionUsableCourtMigration {
  constructor({
    courts = courtRepository,
    rotationMigration = rotationGameNumberMigration,
    rotations = rotationRepository,
    teams = teamRepository
  } = {}) {
    this.courts = courts
    this.rotationMigration = rotationMigration
    this.rotations = rotations
    this.teams = teams
  }

  migrate({ location, session }) {
    try {
      return this.prepareAndPersist({ location, session })
    } catch (error) {
      if (error instanceof ApplicationError) throw error

      throw new ApplicationError(
        ErrorCode.SESSION_GRAPH_MIGRATION_FAILED,
        `Unable to migrate Session "${session.id}" graph`,
        { cause: error }
      )
    }
  }

  prepareAndPersist({ location, session }) {
    const preparedRotations = this.rotationMigration.prepare()
    const storedCourts = this.courts.getAll()
    const storedTeams = this.teams.getAll()

    if (session.status !== SessionStatus.STARTED) {
      return {
        migrated: false,
        rotations: preparedRotations.rotations,
        courts: storedCourts,
        teams: storedTeams
      }
    }

    const courtPreparation = this.ensureLocationCourts(
      location,
      storedCourts
    )
    const normalized = this.normalizeSessionRotations({
      location,
      session,
      rotations: preparedRotations.rotations,
      courts: courtPreparation.courts,
      teams: storedTeams
    })
    const migrated = preparedRotations.migrated ||
      courtPreparation.migrated ||
      normalized.migrated

    if (!migrated) {
      return {
        migrated: false,
        rotations: normalized.rotations,
        courts: courtPreparation.courts,
        teams: normalized.teams
      }
    }

    validateSessionGraph({
      location,
      session,
      rotations: normalized.rotations.filter(
        rotation => rotation.sessionId === session.id
      ),
      courts: courtPreparation.courts,
      teams: normalized.teams
    })

    this.courts.saveAll(courtPreparation.courts)
    this.rotations.saveAll(normalized.rotations)
    this.teams.saveAll(normalized.teams)

    return {
      migrated: true,
      rotations: normalized.rotations,
      courts: courtPreparation.courts,
      teams: normalized.teams
    }
  }

  ensureLocationCourts(location, storedCourts) {
    const courtsByNumber = new Map(
      storedCourts
        .filter(court => court.locationId === location.id)
        .map(court => [court.number, court])
    )
    const createdCourts = []

    for (let number = 1; number <= location.nbCourts; number += 1) {
      if (!courtsByNumber.has(number)) {
        createdCourts.push(new Court(location.id, number))
      }
    }

    return {
      migrated: createdCourts.length > 0,
      courts: [...storedCourts, ...createdCourts]
    }
  }

  normalizeSessionRotations({
    location,
    session,
    rotations,
    courts,
    teams
  }) {
    const locationCourts = courts
      .filter(court => court.locationId === location.id)
      .sort((left, right) => left.number - right.number)
    const usableCourts = locationCourts.slice(
      0,
      session.getUsableCourtCount(location.nbCourts)
    )
    const courtNumbersById = new Map(
      locationCourts.map(court => [court.id, court.number])
    )
    const teamsById = new Map(teams.map(team => [team.id, team]))
    const attendeeById = new Map(
      session.attendingPlayers.map(player => [player.id, player])
    )
    const newTeams = []
    const removedTeamIds = new Set()
    const normalizedByRotationId = new Map()
    let nextGameNumber = 1
    let migrated = false

    const sessionRotations = rotations
      .filter(rotation => rotation.sessionId === session.id)
      .sort((left, right) => left.order - right.order)

    sessionRotations.forEach(rotation => {
      const orderedGames = [...rotation.games].sort(
        (left, right) =>
          (courtNumbersById.get(left.courtId) ?? Number.MAX_SAFE_INTEGER) -
            (courtNumbersById.get(right.courtId) ?? Number.MAX_SAFE_INTEGER) ||
          left.number - right.number
      )
      const selectedGameIds = new Set()
      const selectedGames = usableCourts.map(court => {
        let game = orderedGames.find(candidate =>
          !selectedGameIds.has(candidate.id) &&
          candidate.courtId === court.id
        )

        game ??= orderedGames.find(candidate =>
          !selectedGameIds.has(candidate.id)
        )

        if (!game) {
          const teamA = new Team()
          const teamB = new Team()
          newTeams.push(teamA, teamB)
          game = new Game({
            number: nextGameNumber,
            courtId: court.id,
            teamAId: teamA.id,
            teamBId: teamB.id,
            scoreTeamA: null,
            scoreTeamB: null,
            winnerTeam: null,
            loserTeam: null
          })
          migrated = true
        } else {
          selectedGameIds.add(game.id)
        }

        const requiresRewrite = game.number !== nextGameNumber ||
          game.courtId !== court.id

        if (requiresRewrite) migrated = true

        const normalizedGame = requiresRewrite
          ? Game.fromJson({
              ...game.toJSON(),
              number: nextGameNumber,
              courtId: court.id
            })
          : game

        nextGameNumber += 1
        return normalizedGame
      })

      orderedGames
        .filter(game => !selectedGameIds.has(game.id))
        .forEach(game => {
          removedTeamIds.add(game.teamAId)
          removedTeamIds.add(game.teamBId)
          migrated = true
        })

      const assignedPlayerIds = new Set(
        selectedGames.flatMap(game =>
          [game.teamAId, game.teamBId].flatMap(teamId =>
            (teamsById.get(teamId) ??
              newTeams.find(team => team.id === teamId))?.players
              .map(player => player.id) ?? []
          )
        )
      )
      const waitingPlayers = []
      const waitingPlayerIds = new Set()
      const appendWaitingPlayer = player => {
        const attendee = attendeeById.get(player.id)
        if (
          attendee &&
          !assignedPlayerIds.has(attendee.id) &&
          !waitingPlayerIds.has(attendee.id)
        ) {
          waitingPlayers.push(attendee)
          waitingPlayerIds.add(attendee.id)
        }
      }

      rotation.waitingPlayers.forEach(appendWaitingPlayer)
      orderedGames
        .filter(game => !selectedGameIds.has(game.id))
        .flatMap(game => [game.teamAId, game.teamBId])
        .flatMap(teamId => teamsById.get(teamId)?.players ?? [])
        .forEach(appendWaitingPlayer)
      session.attendingPlayers.forEach(appendWaitingPlayer)

      const waitingChanged = waitingPlayers.map(player => player.id).join() !==
        rotation.waitingPlayers.map(player => player.id).join()
      const gamesChanged = selectedGames.length !== rotation.games.length ||
        selectedGames.some((game, index) => game !== rotation.games[index])

      if (waitingChanged || gamesChanged) migrated = true

      normalizedByRotationId.set(
        rotation.id,
        waitingChanged || gamesChanged
          ? new Rotation(
              rotation.sessionId,
              rotation.order,
              selectedGames,
              waitingPlayers,
              rotation.id,
              rotation.status,
              rotation.startTime,
              rotation.endTime
            )
          : rotation
      )
    })

    const normalizedRotations = rotations.map(rotation =>
      normalizedByRotationId.get(rotation.id) ?? rotation
    )
    const referencedTeamIds = new Set(
      normalizedRotations.flatMap(rotation =>
        rotation.games.flatMap(game => [game.teamAId, game.teamBId])
      )
    )
    const normalizedTeams = [
      ...teams.filter(team =>
        !removedTeamIds.has(team.id) || referencedTeamIds.has(team.id)
      ),
      ...newTeams
    ]

    if (normalizedTeams.length !== teams.length) migrated = true

    return {
      migrated,
      rotations: normalizedRotations,
      teams: normalizedTeams
    }
  }
}

export default new SessionUsableCourtMigration()
