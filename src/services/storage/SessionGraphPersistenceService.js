import { Court, validateSessionGraph } from '@/models'
import courtRepository from './CourtRepository'
import locationRepository from './LocationRepository'
import rotationGameNumberMigration from './RotationGameNumberMigration'
import rotationRepository from './RotationRepository'
import sessionPersistenceService from './SessionPersistenceService'
import teamRepository from './TeamRepository'

export class SessionGraphPersistenceService {
  constructor({
    courts = courtRepository,
    locations = locationRepository,
    rotationMigration = rotationGameNumberMigration,
    rotations = rotationRepository,
    sessions = sessionPersistenceService,
    teams = teamRepository
  } = {}) {
    this.courts = courts
    this.locations = locations
    this.rotationMigration = rotationMigration
    this.rotations = rotations
    this.sessions = sessions
    this.teams = teams
  }

  save({ location, session, rotation, courts, teams }) {
    const mergedLocations = this.mergeById(
      this.locations.getAll(),
      [location]
    )
    const { rotations: storedRotations } = this.rotationMigration.prepare()
    const previousRotation = storedRotations.find(
      candidate => candidate.id === rotation.id
    )
    const mergedRotations = this.mergeById(storedRotations, [rotation])
    const replacedTeamIds = new Set([
      ...(previousRotation?.games.flatMap(game => [
        game.teamAId,
        game.teamBId
      ]) ?? []),
      ...teams.map(team => team.id)
    ])
    const mergedTeams = [
      ...this.teams.getAll().filter(team => !replacedTeamIds.has(team.id)),
      ...teams
    ]
    const mergedCourts = this.mergeById(this.courts.getAll(), courts)

    validateSessionGraph({
      location,
      session,
      rotations: mergedRotations.filter(
        candidate => candidate.sessionId === session.id
      ),
      courts: mergedCourts.map(court =>
        court instanceof Court ? court : Court.fromJson(court)
      ),
      teams: mergedTeams
    })

    this.courts.saveAll(mergedCourts)
    this.locations.saveAll(mergedLocations)
    this.sessions.save(session)
    this.rotations.saveAll(mergedRotations)
    this.teams.saveAll(mergedTeams)
  }

  mergeById(storedEntities, updatedEntities) {
    const entitiesById = new Map(
      storedEntities.map(entity => [entity.id, entity])
    )
    updatedEntities.forEach(entity => entitiesById.set(entity.id, entity))
    return [...entitiesById.values()]
  }
}

export default new SessionGraphPersistenceService()
