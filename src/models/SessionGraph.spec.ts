import { describe, expect, it } from 'vitest'
import { Court } from './Court'
import { Game } from './Game'
import { LocationBuilder } from './Location'
import { PlayerBuilder } from './Player'
import { Rotation } from './Rotation'
import { RotationStatus } from './RotationStatus'
import { Session } from './Session'
import { SessionStatus } from './SessionStatus'
import { Team } from './Team'
import {
  isRotationLineupComplete,
  validateSessionGraph
} from './SessionGraph'

function createGraph() {
  const location = new LocationBuilder()
    .withId('location-1')
    .withName('Central Club')
    .withNbCourts(2)
    .build()
  const players = Array.from({ length: 8 }, (_, index) =>
    new PlayerBuilder()
      .withId(`player-${index + 1}`)
      .withName(`player-${index + 1}`)
      .build()
  )
  const session = new Session(
    location.id,
    1,
    new Date('2026-08-20T08:00:00.000Z'),
    null,
    SessionStatus.STARTED,
    new Map(),
    'session-1',
    players
  )
  const courts = [
    new Court(location.id, 1, 'court-1'),
    new Court(location.id, 2, 'court-2')
  ]
  const teams = [
    new Team(players[0], null, 'team-1'),
    new Team(players[1], null, 'team-2'),
    new Team(players[2], null, 'team-3'),
    new Team(players[3], null, 'team-4')
  ]
  const games = courts.map((court, index) => new Game({
    number: index + 1,
    courtId: court.id,
    teamAId: teams[index * 2].id,
    teamBId: teams[index * 2 + 1].id,
    scoreTeamA: null,
    scoreTeamB: null,
    winnerTeam: null,
    loserTeam: null
  }, `game-${index + 1}`))
  const rotations = [
    new Rotation(session.id, 1, games, players.slice(4), 'rotation-1')
  ]

  return { location, session, rotations, courts, teams }
}

describe('validateSessionGraph', () => {
  it('requires exactly two Players in both Teams of every Game', () => {
    const graph = createGraph()

    expect(isRotationLineupComplete(
      graph.rotations[0],
      graph.teams
    )).toBe(false)

    graph.teams.forEach((team, index) => {
      team.addPlayer(graph.session.attendingPlayers[index + 4])
    })
    expect(isRotationLineupComplete(
      graph.rotations[0],
      graph.teams
    )).toBe(true)

    graph.teams[0].removePlayer(graph.session.attendingPlayers[4].id)
    expect(isRotationLineupComplete(
      graph.rotations[0],
      graph.teams
    )).toBe(false)
  })

  it('does not consider a Rotation without Games ready to start', () => {
    const graph = createGraph()
    const emptyRotation = new Rotation(
      graph.session.id,
      2,
      [],
      [...graph.session.attendingPlayers],
      'rotation-2'
    )

    expect(isRotationLineupComplete(emptyRotation, graph.teams)).toBe(false)
  })

  it('accepts a complete graph whose attendees are assigned exactly once', () => {
    expect(() => validateSessionGraph(createGraph())).not.toThrow()
  })

  it('rejects duplicate Game numbers in one Session', () => {
    const graph = createGraph()
    const firstGame = graph.rotations[0].games[0]
    const secondGame = graph.rotations[0].games[1]
    graph.rotations[0] = new Rotation(
      graph.session.id,
      1,
      [firstGame, Game.fromJson({ ...secondGame.toJSON(), number: 1 })],
      [...graph.rotations[0].waitingPlayers],
      'rotation-1'
    )

    expect(() => validateSessionGraph(graph))
      .toThrow('Game numbers must form the sequence 1..2 in Session "session-1"')
  })

  it('rejects a Game that references an unknown Court', () => {
    const graph = createGraph()
    const game = graph.rotations[0].games[0]
    graph.rotations[0].games[0] = Game.fromJson({
      ...game.toJSON(),
      courtId: 'unknown-court'
    })

    expect(() => validateSessionGraph(graph))
      .toThrow('Game "game-1" references unknown Court "unknown-court"')
  })

  it('rejects a Player assigned more than once in a Rotation', () => {
    const graph = createGraph()
    graph.rotations[0].waitingPlayers.push(
      graph.session.attendingPlayers[0]
    )

    expect(() => validateSessionGraph(graph))
      .toThrow('Player "player-1" is assigned more than once in Rotation "rotation-1"')
  })

  it('rejects duplicate Rotation orders in one Session', () => {
    const graph = createGraph()
    graph.rotations.push(new Rotation(
      graph.session.id,
      1,
      [],
      [...graph.session.attendingPlayers],
      'rotation-2'
    ))

    expect(() => validateSessionGraph(graph))
      .toThrow('Rotation orders must form the sequence 1..2 in Session "session-1"')
  })

  it('requires one Game per active Court in a started Session', () => {
    const graph = createGraph()
    graph.rotations[0] = new Rotation(
      graph.session.id,
      1,
      [graph.rotations[0].games[0]],
      [
        graph.session.attendingPlayers[2],
        graph.session.attendingPlayers[3],
        ...graph.session.attendingPlayers.slice(4)
      ],
      'rotation-1'
    )

    expect(() => validateSessionGraph(graph))
      .toThrow('Started Session "session-1" requires 2 Games in each Rotation')
  })

  it('accepts an empty CREATED placeholder after a completed Rotation', () => {
    const graph = createGraph()
    graph.rotations.push(new Rotation(
      graph.session.id,
      2,
      [],
      [...graph.session.attendingPlayers],
      'rotation-2',
      RotationStatus.CREATED
    ))

    expect(() => validateSessionGraph(graph)).not.toThrow()
  })

  it('requires every attendee to wait in an empty next Rotation placeholder', () => {
    const graph = createGraph()
    graph.rotations.push(new Rotation(
      graph.session.id,
      2,
      [],
      graph.session.attendingPlayers.slice(1),
      'rotation-2',
      RotationStatus.CREATED
    ))

    expect(() => validateSessionGraph(graph))
      .toThrow('Player "player-1" is not assigned in Rotation "rotation-2"')
  })

  it('accepts only the first Court when four Players attend a two-Court Location', () => {
    const graph = createGraph()
    const attendees = graph.session.attendingPlayers.slice(0, 4)
    graph.session = new Session(
      graph.location.id,
      1,
      new Date('2026-08-20T08:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1',
      [...attendees]
    )
    graph.rotations[0] = new Rotation(
      graph.session.id,
      1,
      [graph.rotations[0].games[0]],
      [...attendees.slice(2)],
      'rotation-1'
    )
    graph.teams = graph.teams.slice(0, 2)

    expect(() => validateSessionGraph(graph)).not.toThrow()
  })

  it('requires Games to use Courts from number 1 upward', () => {
    const graph = createGraph()
    const attendees = graph.session.attendingPlayers.slice(0, 4)
    graph.session = new Session(
      graph.location.id,
      1,
      new Date('2026-08-20T08:00:00.000Z'),
      null,
      SessionStatus.STARTED,
      new Map(),
      'session-1',
      [...attendees]
    )
    graph.rotations[0] = new Rotation(
      graph.session.id,
      1,
      [graph.rotations[0].games[1]],
      [...attendees.slice(0, 2)],
      'rotation-1'
    )
    graph.teams = graph.teams.slice(2)

    expect(() => validateSessionGraph(graph))
      .toThrow('Game "game-2" references unusable Court 2 in Session "session-1"')
  })
})
