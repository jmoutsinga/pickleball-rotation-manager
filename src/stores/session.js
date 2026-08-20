import { defineStore } from 'pinia'
import storageService from '../services/storage'
import gameScoreService from '../services/GameScoreService'
import {
    Court,
    Game,
    LocationBuilder,
    PlayerStatus,
    Rotation,
    RotationStatus,
    Session,
    SessionStatus,
    Team,
    validateSessionGraph
} from '@/models'

function activeCourtsFor(location, storedCourts) {
    const courtsByNumber = new Map(
        storedCourts
            .filter(court => court.locationId === location.id)
            .map(court => {
                const restoredCourt = court instanceof Court
                    ? court
                    : Court.fromJson(court)
                return [restoredCourt.number, restoredCourt]
            })
    )

    return Array.from(
        { length: location.nbCourts },
        (_, index) => {
            const number = index + 1
            return courtsByNumber.get(number) ??
                new Court(location.id, number)
        }
    )
}

export const useSessionStore = defineStore('session', {
    state: () => ({
        location: null,
        session: null,
        rotation: null,
        courts: [],
        teams: [],
        players: [],
        sessions: []
    }),

    getters: {
        getCourts: state => {
            if (!state.rotation) return []

            return state.courts.map(court => {
                const game = state.rotation.games.find(
                    candidate => candidate.courtId === court.id
                )

                return {
                    id: court.id,
                    number: court.number,
                    teams: {
                        A: state.teams.find(team => team.id === game?.teamAId),
                        B: state.teams.find(team => team.id === game?.teamBId)
                    }
                }
            })
        },

        getWaitingPlayers: state =>
            state.rotation?.waitingPlayers ?? [],

        getTeamById: state => teamId =>
            state.teams.find(team => team.id === teamId) ?? null,

        startedSessionsByLocationId: state => locationId =>
            state.sessions.filter(session =>
                session.locationId === locationId &&
                session.status === SessionStatus.STARTED
            ),

        openSessionsByLocationId: state => locationId =>
            state.sessions.filter(session =>
                session.locationId === locationId &&
                (
                    session.status === SessionStatus.CREATED ||
                    session.status === SessionStatus.STARTED
                )
            ),

        canEditCourtCountByLocationId: state => locationId =>
            !state.sessions.some(session =>
                session.locationId === locationId &&
                session.status === SessionStatus.STARTED
            )
    },

    actions: {
        loadSessions() {
            this.sessions = storageService.getSessions()
        },

        createSessionForLocation(locationId) {
            const sessions = storageService.getSessions()
            const locationSessions = sessions.filter(
                session => session.locationId === locationId
            )
            const hasOpenSession = locationSessions.some(
                session =>
                    session.status === SessionStatus.CREATED ||
                    session.status === SessionStatus.STARTED
            )

            if (hasOpenSession) {
                throw new Error(
                    `Location "${locationId}" already has an open session`
                )
            }

            const maxOrder = locationSessions.reduce(
                (maximum, session) => Math.max(maximum, session.order),
                0
            )
            const session = new Session(locationId, maxOrder + 1)

            storageService.saveSession(session)
            this.loadSessions()

            return session
        },

        async ensureSession(identifiers = null) {
            const hasIdentifiers = identifiers !== null

            if (
                this.session &&
                (
                    this.session?.status === SessionStatus.CREATED ||
                    this.rotation
                ) &&
                (
                    !hasIdentifiers ||
                    (
                        this.location?.id === identifiers.locationId &&
                        this.session.id === identifiers.sessionId
                    )
                )
            ) {
                return
            }

            const catalogPlayers = storageService.getPlayers()
            const locations = storageService.getLocations()
            const sessions = storageService.getSessions()
            const rotations = storageService.getRotations()
            const storedCourts = storageService.getCourts()
            const storedTeams = storageService.getTeams()

            let location
            let session

            if (hasIdentifiers) {
                const { locationId, sessionId } = identifiers

                location = locations.find(
                    candidate => candidate.id === locationId
                )

                if (!location) {
                    throw new Error(`Location "${locationId}" does not exist`)
                }

                session = sessions.find(
                    candidate => candidate.id === sessionId
                )

                if (!session) {
                    throw new Error(`Session "${sessionId}" does not exist`)
                }

                if (session.locationId !== location.id) {
                    throw new Error(
                        `Session "${sessionId}" does not belong to location "${locationId}"`
                    )
                }
            } else {
                location = locations.find(
                    candidate => candidate.name === 'default'
                )

                if (!location) {
                    location = new LocationBuilder()
                        .withName('default')
                        .withDescription('')
                        .withNbCourts(Math.max(storedCourts.length, 1))
                        .build()
                    storageService.saveLocation(location)
                }

                session = sessions.find(candidate =>
                    candidate.locationId === location.id &&
                    (
                        candidate.status === SessionStatus.CREATED ||
                        candidate.status === SessionStatus.STARTED
                    )
                )

                if (!session) {
                    session = this.createSessionForLocation(location.id)
                }
            }

            if (session.status === SessionStatus.CREATED) {
                const availablePlayers = catalogPlayers.filter(
                    player => player.status === PlayerStatus.AVAILABLE
                )
                const availablePlayersById = new Map(
                    availablePlayers.map(player => [player.id, player])
                )
                const availableAttendees = session.attendingPlayers
                    .map(player => availablePlayersById.get(player.id))
                    .filter(player => player !== undefined)

                if (
                    availableAttendees.length !==
                    session.attendingPlayers.length
                ) {
                    session.updateAttendingPlayers(availableAttendees)
                    storageService.saveSession(session)
                }

                this.location = location
                this.session = session
                this.rotation = null
                this.courts = []
                this.teams = []
                this.players = availablePlayers
                this.sessions = storageService.getSessions()
                return
            }

            const catalogPlayersById = new Map(
                catalogPlayers.map(player => [player.id, player])
            )
            const players = session.attendingPlayers.map(
                player => catalogPlayersById.get(player.id) ?? player
            )

            const allCourts = storedCourts.map(court =>
                court instanceof Court ? court : Court.fromJson(court)
            )
            const courts = activeCourtsFor(location, allCourts)

            const sessionRotations = rotations.filter(
                candidate => candidate.sessionId === session.id
            )

            if (sessionRotations.length) {
                validateSessionGraph({
                    location,
                    session,
                    rotations: sessionRotations,
                    courts: allCourts,
                    teams: storedTeams
                })
            }

            let rotation = sessionRotations.reduce(
                (current, candidate) =>
                    !current || candidate.order > current.order
                        ? candidate
                        : current,
                null
            )

            let teams = storedTeams

            if (!rotation) {
                teams = courts.flatMap(() => [new Team(), new Team()])

                const firstGameNumber =
                    session.getNextGameNumber(rotations)

                const games = courts.map((court, index) => new Game({
                    number: firstGameNumber + index,
                    courtId: court.id,
                    teamAId: teams[index * 2].id,
                    teamBId: teams[index * 2 + 1].id,
                    scoreTeamA: null,
                    scoreTeamB: null,
                    winnerTeam: null,
                    loserTeam: null
                }))

                players.forEach(player =>
                    player.changeStatus(PlayerStatus.AVAILABLE)
                )

                rotation = new Rotation(
                    session.id,
                    session.getNextRotationOrder(rotations),
                    games,
                    [...players]
                )
            } else {
                const rotationTeamIds = new Set(
                    rotation.games.flatMap(game => [
                        game.teamAId,
                        game.teamBId
                    ])
                )

                teams = teams.filter(team =>
                    rotationTeamIds.has(team.id)
                )

                const assignedPlayerIds = new Set(
                    teams.flatMap(team =>
                        team.players.map(player => player.id)
                    )
                )

                rotation.waitingPlayers = players.filter(
                    player => !assignedPlayerIds.has(player.id)
                )

                if (rotation.status === RotationStatus.CREATED) {
                    players.forEach(player =>
                        player.changeStatus(PlayerStatus.AVAILABLE)
                    )
                }
            }

            this.location = location
            this.session = session
            this.rotation = rotation
            this.courts = courts
            this.teams = teams
            this.players = players
            this.sessions = storageService.getSessions()

            storageService.updatePlayers(players)
            storageService.saveSessionGraph(this)
        },

        updateAttendingPlayers(playerIds) {
            if (!this.session) {
                throw new Error('No session is loaded')
            }

            const uniquePlayerIds = [...new Set(playerIds)]
            if (uniquePlayerIds.length !== playerIds.length) {
                throw new Error('Attending players must be unique')
            }

            const availablePlayersById = new Map(
                storageService.getPlayers()
                    .filter(player =>
                        player.status === PlayerStatus.AVAILABLE
                    )
                    .map(player => [player.id, player])
            )
            const attendingPlayers = uniquePlayerIds.map(playerId => {
                const player = availablePlayersById.get(playerId)

                if (!player) {
                    throw new Error(
                        `Player "${playerId}" is not available`
                    )
                }

                return player
            })

            this.session.updateAttendingPlayers(attendingPlayers)
            storageService.saveSession(this.session)
            this.sessions = storageService.getSessions()
        },

        startSession(at = new Date()) {
            if (!this.session || !this.location) {
                throw new Error('No session is loaded')
            }

            if (this.session.attendingPlayers.length < 4) {
                throw new Error(
                    'A session requires at least 4 attending players'
                )
            }

            const catalogPlayersById = new Map(
                storageService.getPlayers().map(player => [player.id, player])
            )
            const attendingPlayers = this.session.attendingPlayers.map(
                player => catalogPlayersById.get(player.id)
            )

            if (attendingPlayers.some(player =>
                !player || player.status !== PlayerStatus.AVAILABLE
            )) {
                throw new Error(
                    'Attending players must be available when the session starts'
                )
            }

            this.session.updateAttendingPlayers(attendingPlayers)
            this.session.start(at)

            const courts = activeCourtsFor(
                this.location,
                storageService.getCourts()
            )

            const teams = courts.flatMap(() => [new Team(), new Team()])
            const storedRotations = storageService.getRotations()
            const firstGameNumber =
                this.session.getNextGameNumber(storedRotations)
            const games = courts.map((court, index) => new Game({
                number: firstGameNumber + index,
                courtId: court.id,
                teamAId: teams[index * 2].id,
                teamBId: teams[index * 2 + 1].id,
                scoreTeamA: null,
                scoreTeamB: null,
                winnerTeam: null,
                loserTeam: null
            }))
            const rotation = new Rotation(
                this.session.id,
                this.session.getNextRotationOrder(storedRotations),
                games,
                [...attendingPlayers]
            )

            this.courts = courts
            this.teams = teams
            this.players = attendingPlayers
            this.rotation = rotation

            storageService.updatePlayers(attendingPlayers)
            storageService.saveSessionGraph(this)
            this.sessions = storageService.getSessions()
        },

        startRotation(at = new Date()) {
            if (!this.rotation) {
                throw new Error('No rotation is loaded')
            }

            this.rotation.start(at)
            storageService.saveSessionGraph(this)
        },

        startRotationScoring() {
            if (!this.rotation) {
                throw new Error('No rotation is loaded')
            }

            this.rotation.startScoring()
            storageService.saveSessionGraph(this)
        },

        updateGameScore({ gameId, scoreTeamA, scoreTeamB }) {
            if (!this.rotation) {
                throw new Error('No rotation is loaded')
            }

            const game = gameScoreService.updateScore({
                rotation: this.rotation,
                gameId,
                scoreTeamA,
                scoreTeamB
            })
            storageService.saveSessionGraph(this)
            return game
        },

        designateGameWinner({ gameId, winnerTeamId }) {
            if (!this.rotation) {
                throw new Error('No rotation is loaded')
            }

            const game = gameScoreService.designateWinner({
                rotation: this.rotation,
                gameId,
                winnerTeamId
            })
            storageService.saveSessionGraph(this)
            return game
        },

        finishRotation(at = new Date()) {
            if (!this.rotation) {
                throw new Error('No rotation is loaded')
            }

            this.rotation.finish(at)
            storageService.saveSessionGraph(this)
        },

        setCourts(numCourts) {
            if (this.rotation?.status !== RotationStatus.CREATED) return

            const locationBuilder = new LocationBuilder()
                .withName(this.location?.name ?? 'default')
                .withDescription(this.location?.description ?? '')
                .withNbCourts(numCourts)

            if (this.location?.id) {
                locationBuilder.withId(this.location.id)
            }

            const location = locationBuilder.build()

            const courts = activeCourtsFor(
                location,
                storageService.getCourts()
            )

            const teams = courts.flatMap(() => [
                new Team(),
                new Team()
            ])

            const historicalRotations = storageService.getRotations()
                .filter(rotation => rotation.id !== this.rotation.id)
            const firstGameNumber =
                this.session.getNextGameNumber(historicalRotations)

            const games = courts.map((court, index) => new Game({
                number: firstGameNumber + index,
                courtId: court.id,
                teamAId: teams[index * 2].id,
                teamBId: teams[index * 2 + 1].id,
                scoreTeamA: null,
                scoreTeamB: null,
                winnerTeam: null,
                loserTeam: null
            }))

            const rotation = new Rotation(
                this.session.id,
                this.rotation.order,
                games,
                [...this.players],
                this.rotation.id
            )

            this.players.forEach(player =>
                player.changeStatus(PlayerStatus.AVAILABLE)
            )

            this.location = location
            this.courts = courts
            this.rotation = rotation
            this.teams = teams

            storageService.updatePlayers(this.players)
            storageService.saveSessionGraph(this)
        },

        addPlayer(player) {
            if (this.rotation?.status !== RotationStatus.CREATED) return
            if (!this.session?.attendingPlayers.some(
                attendee => attendee.id === player.id
            )) return
            if (this.players.some(candidate => candidate.id === player.id)) {
                return
            }

            storageService.savePlayer(player)

            this.players.push(player)
            this.rotation.waitingPlayers.push(player)

            storageService.saveRotations([this.rotation])
        },

        updatePlayer(updatedPlayer) {
            storageService.updatePlayer(updatedPlayer)

            const index = this.players.findIndex(
                player => player.id === updatedPlayer.id
            )

            if (index !== -1) {
                this.players[index] = updatedPlayer
            }

            const waitingIndex =
                this.rotation.waitingPlayers.findIndex(
                    player => player.id === updatedPlayer.id
                )

            if (waitingIndex !== -1) {
                this.rotation.waitingPlayers[waitingIndex] = updatedPlayer
            }

            this.teams.forEach(team => {
                if (team.player1?.id === updatedPlayer.id) {
                    team.player1 = updatedPlayer
                }

                if (team.player2?.id === updatedPlayer.id) {
                    team.player2 = updatedPlayer
                }
            })

            storageService.saveSessionGraph(this)
        },

        removePlayer(playerId) {
            if (this.rotation?.status !== RotationStatus.CREATED) return

            const player = this.players.find(
                candidate => candidate.id === playerId
            )

            if (!player) return

            this.teams.forEach(team => team.removePlayer(playerId))
            player.changeStatus(PlayerStatus.AVAILABLE)

            const alreadyWaiting =
                this.rotation.waitingPlayers.some(
                    candidate => candidate.id === playerId
                )

            if (!alreadyWaiting) {
                this.rotation.waitingPlayers.push(player)
            }

            storageService.removePlayer(playerId)
            storageService.saveSessionGraph(this)
        },

        movePlayer({ playerId, targetTeamId }) {
            if (this.rotation?.status !== RotationStatus.CREATED) return

            const player = this.players.find(
                candidate => candidate.id === playerId
            )

            if (!player) return

            const targetTeam = targetTeamId
                ? this.teams.find(team => team.id === targetTeamId)
                : null

            const playerAlreadyInTarget =
                targetTeam?.players.some(
                    candidate => candidate.id === playerId
                )

            if (
                targetTeamId &&
                (
                    !targetTeam ||
                    (
                        targetTeam.players.length >= 2 &&
                        !playerAlreadyInTarget
                    )
                )
            ) {
                return
            }

            this.teams.forEach(team => team.removePlayer(playerId))

            this.rotation.waitingPlayers =
                this.rotation.waitingPlayers.filter(
                    candidate => candidate.id !== playerId
                )

            if (targetTeam) {
                targetTeam.addPlayer(player)
            } else {
                this.rotation.waitingPlayers.push(player)
            }

            storageService.saveSessionGraph(this)
        }
    }
})
