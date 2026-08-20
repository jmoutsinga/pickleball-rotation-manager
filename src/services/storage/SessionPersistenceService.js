import { SessionStatus } from '@/models'
import sessionAttendeeMigration from './SessionAttendeeMigration'
import sessionRepository from './SessionRepository'

export class SessionPersistenceService {
  constructor({
    attendeeMigration = sessionAttendeeMigration,
    sessions = sessionRepository
  } = {}) {
    this.attendeeMigration = attendeeMigration
    this.sessions = sessions
  }

  saveAll(sessions) {
    this.sessions.saveAll(sessions)
  }

  getAll() {
    return this.attendeeMigration.migrate()
  }

  save(session) {
    const sessions = this.getAll()
    const alreadyStarted = sessions.some(existing =>
      existing.locationId === session.locationId &&
      existing.status === SessionStatus.STARTED &&
      existing.id !== session.id
    )

    if (session.status === SessionStatus.STARTED && alreadyStarted) {
      throw new Error('This location already has a started session')
    }

    const index = sessions.findIndex(existing => existing.id === session.id)
    if (index === -1) sessions.push(session)
    else sessions[index] = session
    this.saveAll(sessions)
  }
}

export default new SessionPersistenceService()
