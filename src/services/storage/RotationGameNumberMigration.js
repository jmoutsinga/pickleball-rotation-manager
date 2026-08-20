import courtRepository from './CourtRepository'
import rotationRepository from './RotationRepository'

export class RotationGameNumberMigration {
  constructor({
    courts = courtRepository,
    rotations = rotationRepository
  } = {}) {
    this.courts = courts
    this.rotations = rotations
  }

  migrate() {
    const preparedMigration = this.prepare()

    if (preparedMigration.migrated) {
      this.rotations.saveAll(preparedMigration.rotationJsons)
    }

    return preparedMigration.rotations
  }

  prepare() {
    const rotationJsons = this.rotations.getRaw()
    const courtNumbersById = new Map(
      this.courts.getAll().map(court => [court.id, court.number])
    )
    const rotationsBySession = new Map()
    let migrated = false

    rotationJsons.forEach((rotation, index) => {
      const sessionRotations = rotationsBySession.get(rotation.sessionId) || []
      sessionRotations.push({ rotation, index })
      rotationsBySession.set(rotation.sessionId, sessionRotations)
    })

    rotationsBySession.forEach(sessionRotations => {
      const orderedRotations = [...sessionRotations].sort(
        (left, right) =>
          left.rotation.order - right.rotation.order ||
          left.index - right.index
      )
      const reservedNumbers = new Set(
        orderedRotations.flatMap(({ rotation }) =>
          (rotation.games || [])
            .map(game => game.number)
            .filter(number => number !== undefined && number !== null)
        )
      )
      let nextNumber = 1

      orderedRotations.forEach(({ rotation }) => {
        const orderedGames = (rotation.games || [])
          .map((game, index) => ({ game, index }))
          .sort((left, right) =>
            (courtNumbersById.get(left.game.courtId) ?? left.index) -
            (courtNumbersById.get(right.game.courtId) ?? right.index) ||
            left.index - right.index
          )

        orderedGames.forEach(({ game }) => {
          if (game.number === undefined || game.number === null) {
            while (reservedNumbers.has(nextNumber)) nextNumber += 1
            game.number = nextNumber
            reservedNumbers.add(nextNumber)
            migrated = true
          }
          nextNumber = Math.max(nextNumber, game.number + 1)
        })
      })
    })

    return {
      migrated,
      rotationJsons,
      rotations: this.rotations.hydrate(rotationJsons)
    }
  }
}

export default new RotationGameNumberMigration()
