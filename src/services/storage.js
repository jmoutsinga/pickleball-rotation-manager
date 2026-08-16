import {
  Game,
  Location,
  LocationBuilder,
  LocationStatus,
  Player,
  PlayerBuilder,
  PlayerStatus,
  Rotation,
  Session,
  SessionStatus,
  Team
} from '@/models'

const STORAGE_KEYS = {
  COURTS: 'pickleball_courts',
  PLAYERS: 'pickleball_players',
  LOCATIONS: 'pickleball_locations',
  SESSIONS: 'pickleball_sessions',
  ROTATIONS: 'pickleball_rotations',
  GAMES: 'pickleball_games',
  TEAMS: 'pickleball_teams'
};

class StorageService {
  saveCourts(courts) {
    localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(courts));
  }

  getCourts() {
    const courts = localStorage.getItem(STORAGE_KEYS.COURTS);
    return courts ? JSON.parse(courts) : [];
  }

  savePlayers(players) {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  }

  updatePlayer(updatedPlayer) {
    this.assertPlayer(updatedPlayer);
    const players = this.getPlayers();
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    if (index !== -1) {
      this.assertUniquePlayerName(updatedPlayer.name, players, updatedPlayer.id);
      players[index] = updatedPlayer;
      this.savePlayers(players);
    }
  }

  changePlayerStatus(playerId, status) {
    const players = this.getPlayers();
    const player = players.find(candidate => candidate.id === playerId);

    if (!player) {
      throw new Error(`Player "${playerId}" does not exist`);
    }

    player.changeStatus(status);
    this.savePlayers(players);

    return player;
  }

  updatePlayers(updatedPlayers) {
    const updatedById = new Map(
      updatedPlayers.map(player => {
        this.assertPlayer(player);
        return [player.id, player];
      })
    );
    const players = this.getPlayers().map(
      player => updatedById.get(player.id) ?? player
    );

    this.savePlayers(players);
  }

  getPlayers() {
    const players = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return players ? JSON.parse(players).map(PlayerBuilder.fromJson) : [];
  }

  getWaitingPlayers() {
    const players = this.getPlayers();
    return players.filter(p => p.status === PlayerStatus.WAITING);
  }

  savePlayer(player) {
    this.assertPlayer(player);
    const players = this.getPlayers();
    this.assertUniquePlayerName(player.name, players);
    players.push(player);
    this.savePlayers(players);
  }

  updatePlayerTeam(playerId, teamId) {
    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.changeStatus(teamId ? PlayerStatus.PLAYING : PlayerStatus.WAITING);
      this.savePlayers(players);
    }
  }

  removePlayer(playerId) {
    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.changeStatus(PlayerStatus.AVAILABLE);
      this.savePlayers(players);
    }
  }

  saveLocations(locations) {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }

  saveLocation(location) {
    this.assertLocation(location);
    const locations = this.getLocations();
    locations.push(location);
    this.saveLocations(locations);
  }

  updateLocation(updatedLocation) {
    this.assertLocation(updatedLocation)

    const locations = this.getLocations()
    const index = locations.findIndex(
        location => location.id === updatedLocation.id
    )

    if (index === -1) {
      throw new Error(
          `Location "${updatedLocation.id}" does not exist`
      )
    }

    locations[index] = updatedLocation
    this.saveLocations(locations)
  }

  getLocations() {
    return this.getCollection(STORAGE_KEYS.LOCATIONS).map(LocationBuilder.fromJson);
  }

  getActiveLocations() {
    return this.getLocations().filter(
      location => location.status === LocationStatus.ACTIVE
    );
  }

  deleteLocation(locationId) {
    const locations = this.getLocations();
    const location = locations.find(candidate => candidate.id === locationId);

    if (!location) {
      throw new Error(`Location "${locationId}" does not exist`);
    }

    location.changeStatus(LocationStatus.DELETED);
    this.saveLocations(locations);
  }

  saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  getSessions() {
    const sessionJsons = this.getCollection(STORAGE_KEYS.SESSIONS);
    const requiresAttendeeMigration = sessionJsons.some(
      session => !Array.isArray(session.attendingPlayers)
    );

    if (!requiresAttendeeMigration) {
      return sessionJsons.map(Session.fromJson);
    }

    const players = this.getPlayers();
    const playersById = new Map(players.map(player => [player.id, player]));
    const rotations = this.getRotations();
    const teamsById = new Map(
      this.getTeams().map(team => [team.id, team])
    );

    const sessions = sessionJsons.map(sessionJson => {
      if (Array.isArray(sessionJson.attendingPlayers)) {
        return Session.fromJson(sessionJson);
      }

      const sessionRotations = rotations.filter(
        rotation => rotation.sessionId === sessionJson.id
      );
      let attendingPlayers = [];

      if (sessionRotations.length > 0) {
        const attendeesById = new Map();

        sessionRotations.forEach(rotation => {
          rotation.waitingPlayers.forEach(player => {
            attendeesById.set(
              player.id,
              playersById.get(player.id) ?? player
            );
          });

          rotation.games.forEach(game => {
            [game.teamAId, game.teamBId].forEach(teamId => {
              teamsById.get(teamId)?.players.forEach(player => {
                attendeesById.set(
                  player.id,
                  playersById.get(player.id) ?? player
                );
              });
            });
          });
        });

        attendingPlayers = [...attendeesById.values()];
      } else if (sessionJson.status !== SessionStatus.CREATED) {
        attendingPlayers = players.filter(
          player => player.status !== PlayerStatus.DELETED
        );
      }

      return Session.fromJson({
        ...sessionJson,
        attendingPlayers: attendingPlayers.map(player => player.toJSON())
      });
    });

    this.saveSessions(sessions);
    return sessions;
  }

  saveSession(session) {
    const sessions = this.getSessions();
    const alreadyStarted = sessions.some(existing =>
      existing.locationId === session.locationId &&
      existing.status === SessionStatus.STARTED &&
      existing.id !== session.id
    );
    if (session.status === SessionStatus.STARTED && alreadyStarted) {
      throw new Error('This location already has a started session');
    }
    const index = sessions.findIndex(existing => existing.id === session.id);
    if (index === -1) sessions.push(session);
    else sessions[index] = session;
    this.saveSessions(sessions);
  }

  saveRotations(rotations) {
    localStorage.setItem(STORAGE_KEYS.ROTATIONS, JSON.stringify(rotations));
  }

  getRotations() {
    return this.getCollection(STORAGE_KEYS.ROTATIONS).map(Rotation.fromJson);
  }

  saveGames(games) {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  }

  getGames() {
    return this.getCollection(STORAGE_KEYS.GAMES).map(Game.fromJson);
  }

  saveTeams(teams) {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }

  getTeams() {
    return this.getCollection(STORAGE_KEYS.TEAMS).map(Team.fromJson);
  }

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  getCollection(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  }

  assertPlayer(player) {
    if (!(player instanceof Player)) {
      throw new TypeError('Players must be created with PlayerBuilder');
    }
  }

  assertLocation(location) {
    if (!(location instanceof Location)) {
      throw new TypeError('Locations must be created with LocationBuilder');
    }
  }

  assertUniquePlayerName(name, players, ignoredPlayerId = null) {
    if (players.some(player => player.id !== ignoredPlayerId && player.name === name)) {
      throw new Error(`A player named "${name}" already exists`);
    }
  }

  saveSessionGraph({
                     location,
                     session,
                     rotation,
                     courts,
                     teams
                   }) {
    const locations = this.getLocations();
    const locationIndex = locations.findIndex(
      candidate => candidate.id === location.id
    );
    if (locationIndex === -1) locations.push(location);
    else locations[locationIndex] = location;

    const storedRotations = this.getRotations();
    const previousRotation = storedRotations.find(
      candidate => candidate.id === rotation.id
    );
    const rotationIndex = storedRotations.findIndex(
      candidate => candidate.id === rotation.id
    );
    if (rotationIndex === -1) storedRotations.push(rotation);
    else storedRotations[rotationIndex] = rotation;

    const replacedGameIds = new Set([
      ...(previousRotation?.games.map(game => game.id) ?? []),
      ...rotation.games.map(game => game.id)
    ]);
    const games = this.getGames().filter(
      game => !replacedGameIds.has(game.id)
    );

    const replacedTeamIds = new Set([
      ...(previousRotation?.games.flatMap(game => [
        game.teamAId,
        game.teamBId
      ]) ?? []),
      ...teams.map(team => team.id)
    ]);
    const storedTeams = this.getTeams().filter(
      team => !replacedTeamIds.has(team.id)
    );

    this.saveCourts([
      ...this.getCourts().filter(
        court => court.locationId !== location.id
      ),
      ...courts
    ]);
    this.saveLocations(locations);
    this.saveSession(session);
    this.saveRotations(storedRotations);
    this.saveGames([...games, ...rotation.games]);
    this.saveTeams([...storedTeams, ...teams]);
  }

}

export default new StorageService();
