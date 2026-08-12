import { defineStore } from 'pinia'
import storageService from '../services/storage'
import {
    Court,
    Game,
    Location,
    PlayerStatus,
    Rotation,
    Session,
    Team
} from '@/models'

export const useSessionStore = defineStore('session', {
    state: () => ({
        location: null,
        session: null,
        rotation: null,
        courts: [],
        teams: [],
        players: []
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
            state.teams.find(team => team.id === teamId) ?? null
    },

    actions: {
        async ensureSession() {
            if (this.session && this.rotation) return

            const players = storageService.getPlayers()
            const locations = storageService.getLocations()
            const sessions = storageService.getSessions()
            const rotations = storageService.getRotations()
            const storedCourts = storageService.getCourts()
            const storedTeams = storageService.getTeams()

            let location = locations.find(
                candidate => candidate.name === 'default'
            )

            if (!location) {
                location = new Location(
                    'default',
                    '',
                    Math.max(storedCourts.length, 1)
                )
            }

            let session = sessions.find(candidate =>
                candidate.locationId === location.id &&
                candidate.status === 'STARTED'
            )

            if (!session) {
                session = new Session(location.id, 1)
            }

            let courts = storedCourts
                .filter(court => court.locationId === location.id)
                .map(court =>
                    court instanceof Court ? court : Court.fromJson(court)
                )

            if (!courts.length) {
                courts = Array.from(
                    { length: location.nbCourts },
                    (_, index) => new Court(location.id, index + 1)
                )
            }

            let rotation = rotations.find(
                candidate => candidate.sessionId === session.id
            )

            let teams = storedTeams

            if (!rotation) {
                teams = courts.flatMap(() => [new Team(), new Team()])

                const games = courts.map((court, index) => new Game({
                    courtId: court.id,
                    teamAId: teams[index * 2].id,
                    teamBId: teams[index * 2 + 1].id,
                    scoreTeamA: null,
                    scoreTeamB: null,
                    winnerTeam: null,
                    loserTeam: null
                }))

                players.forEach(player =>
                    player.changeStatus(PlayerStatus.WAITING)
                )

                rotation = new Rotation(
                    session.id,
                    1,
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
            }

            this.location = location
            this.session = session
            this.rotation = rotation
            this.courts = courts
            this.teams = teams
            this.players = players

            storageService.savePlayers(players)
            storageService.saveSessionGraph(this)
        },

        setCourts(numCourts) {
            const location = new Location(
                'default',
                this.location?.description ?? '',
                numCourts,
                this.location?.id
            )

            const courts = Array.from(
                { length: numCourts },
                (_, index) => new Court(location.id, index + 1)
            )

            const teams = courts.flatMap(() => [
                new Team(),
                new Team()
            ])

            const games = courts.map((court, index) => new Game({
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
                player.changeStatus(PlayerStatus.WAITING)
            )

            this.location = location
            this.courts = courts
            this.rotation = rotation
            this.teams = teams

            storageService.savePlayers(this.players)
            storageService.saveSessionGraph(this)
        },

        addPlayer(player) {
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
            const player = this.players.find(
                candidate => candidate.id === playerId
            )

            if (!player) return

            this.teams.forEach(team => team.removePlayer(playerId))
            player.changeStatus(PlayerStatus.WAITING)

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
                player.changeStatus(PlayerStatus.ACTIVE)
            } else {
                player.changeStatus(PlayerStatus.WAITING)
                this.rotation.waitingPlayers.push(player)
            }

            storageService.updatePlayerTeam(playerId, targetTeamId)
            storageService.saveSessionGraph(this)
        }
    }
})