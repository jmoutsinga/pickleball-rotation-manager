import type { Court } from './Court'
import type { Location } from './Location'
import type { Rotation } from './Rotation'
import type { Session } from './Session'
import { SessionStatus } from './SessionStatus'
import type { Team } from './Team'

export interface SessionGraph {
  location: Location
  session: Session
  rotations: readonly Rotation[]
  courts: readonly Court[]
  teams: readonly Team[]
}

export function validateSessionGraph(graph: SessionGraph): void {
  const { location, session, rotations, courts, teams } = graph

  if (session.locationId !== location.id) {
    throw new Error(
      `Session "${session.id}" does not belong to Location "${location.id}"`
    )
  }

  assertUniqueIds(rotations, 'Rotation')
  assertUniqueIds(courts, 'Court')
  assertUniqueIds(teams, 'Team')
  assertUniqueCourtNumbers(courts, location.id)

  const sessionRotations = rotations.filter(rotation => {
    if (rotation.sessionId !== session.id) {
      throw new Error(
        `Rotation "${rotation.id}" does not belong to Session "${session.id}"`
      )
    }
    return true
  })

  assertSequence(
    sessionRotations.map(rotation => rotation.order),
    'Rotation orders',
    session.id
  )

  const courtsById = new Map(courts.map(court => [court.id, court]))
  const teamsById = new Map(teams.map(team => [team.id, team]))
  const attendeeIds = new Set(
    session.attendingPlayers.map(player => player.id)
  )
  const gameIds = new Set<string>()
  const gameNumbers: number[] = []
  const referencedTeamIds = new Set<string>()
  const usableCourtCount = session.getUsableCourtCount(location.nbCourts)
  const usableCourtIds = new Set(
    courts
      .filter(court => court.locationId === location.id)
      .sort((left, right) => left.number - right.number)
      .slice(0, usableCourtCount)
      .map(court => court.id)
  )

  sessionRotations.forEach(rotation => {
    if (
      session.status === SessionStatus.STARTED &&
      rotation.games.length !== usableCourtCount
    ) {
      throw new Error(
        `Started Session "${session.id}" requires ${usableCourtCount} Games in each Rotation`
      )
    }

    const rotationCourtIds = new Set<string>()
    const assignedPlayerIds = new Set<string>()

    rotation.games.forEach(game => {
      if (gameIds.has(game.id)) {
        throw new Error(`Game id "${game.id}" must be unique`)
      }
      gameIds.add(game.id)
      gameNumbers.push(game.number)

      const court = courtsById.get(game.courtId)
      if (!court) {
        throw new Error(
          `Game "${game.id}" references unknown Court "${game.courtId}"`
        )
      }
      if (court.locationId !== location.id) {
        throw new Error(
          `Court "${court.id}" does not belong to Location "${location.id}"`
        )
      }
      if (!usableCourtIds.has(court.id)) {
        throw new Error(
          `Game "${game.id}" references unusable Court ${court.number} in Session "${session.id}"`
        )
      }
      if (rotationCourtIds.has(court.id)) {
        throw new Error(
          `Court "${court.id}" has more than one Game in Rotation "${rotation.id}"`
        )
      }
      rotationCourtIds.add(court.id)

      if (game.teamAId === game.teamBId) {
        throw new Error(`Game "${game.id}" requires two different Teams`)
      }

      const gameTeamIds = [game.teamAId, game.teamBId]
      gameTeamIds.forEach(teamId => {
        const team = teamsById.get(teamId)
        if (!team) {
          throw new Error(
            `Game "${game.id}" references unknown Team "${teamId}"`
          )
        }
        if (referencedTeamIds.has(teamId)) {
          throw new Error(`Team "${teamId}" is referenced by more than one Game`)
        }
        referencedTeamIds.add(teamId)

        team.players.forEach(player =>
          assignPlayer(player.id, rotation.id, attendeeIds, assignedPlayerIds)
        )
      })
    })

    rotation.waitingPlayers.forEach(player =>
      assignPlayer(player.id, rotation.id, attendeeIds, assignedPlayerIds)
    )

    attendeeIds.forEach(playerId => {
      if (!assignedPlayerIds.has(playerId)) {
        throw new Error(
          `Player "${playerId}" is not assigned in Rotation "${rotation.id}"`
        )
      }
    })
  })

  assertSequence(gameNumbers, 'Game numbers', session.id)
}

export function isRotationLineupComplete(
  rotation: Rotation,
  teams: readonly Team[]
): boolean {
  if (rotation.games.length === 0) return false

  const teamsById = new Map(teams.map(team => [team.id, team]))
  return rotation.games.every(game =>
    teamsById.get(game.teamAId)?.players.length === 2 &&
    teamsById.get(game.teamBId)?.players.length === 2
  )
}

function assignPlayer(
  playerId: string,
  rotationId: string,
  attendeeIds: ReadonlySet<string>,
  assignedPlayerIds: Set<string>
): void {
  if (!attendeeIds.has(playerId)) {
    throw new Error(
      `Player "${playerId}" in Rotation "${rotationId}" does not attend the Session`
    )
  }
  if (assignedPlayerIds.has(playerId)) {
    throw new Error(
      `Player "${playerId}" is assigned more than once in Rotation "${rotationId}"`
    )
  }
  assignedPlayerIds.add(playerId)
}

function assertUniqueIds(
  entities: readonly { id: string }[],
  entityName: string
): void {
  const ids = new Set<string>()
  entities.forEach(entity => {
    if (ids.has(entity.id)) {
      throw new Error(`${entityName} id "${entity.id}" must be unique`)
    }
    ids.add(entity.id)
  })
}

function assertUniqueCourtNumbers(
  courts: readonly Court[],
  locationId: string
): void {
  const numbers = new Set<number>()
  courts
    .filter(court => court.locationId === locationId)
    .forEach(court => {
      if (numbers.has(court.number)) {
        throw new Error(
          `Court number ${court.number} must be unique in Location "${locationId}"`
        )
      }
      numbers.add(court.number)
    })
}

function assertSequence(
  values: readonly number[],
  label: string,
  sessionId: string
): void {
  const sortedValues = [...values].sort((left, right) => left - right)
  const isSequential = sortedValues.every(
    (value, index) => value === index + 1
  )

  if (!isSequential) {
    throw new Error(
      `${label} must form the sequence 1..${values.length} in Session "${sessionId}"`
    )
  }
}
