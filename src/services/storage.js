import {
  Game,
  Location,
  Player,
  PlayerBuilder,
  PlayerStatus,
  Rotation,
  Session,
  SessionStatus,
  Team
} from '../models'

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

  getPlayers() {
    const players = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return players ? JSON.parse(players).map(PlayerBuilder.fromJson) : [];
  }

  getWaitingPlayers() {
    const players = this.getPlayers();
    return players.filter(p => p.status === 'waiting');
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
      player.changeStatus(teamId ? PlayerStatus.ACTIVE : PlayerStatus.WAITING);
      this.savePlayers(players);
    }
  }

  removePlayer(playerId) {
    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.changeStatus(PlayerStatus.WAITING);
      this.savePlayers(players);
    }
  }

  saveLocations(locations) {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }

  getLocations() {
    return this.getCollection(STORAGE_KEYS.LOCATIONS).map(Location.fromJson);
  }

  saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  getSessions() {
    return this.getCollection(STORAGE_KEYS.SESSIONS).map(Session.fromJson);
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

  assertUniquePlayerName(name, players, ignoredPlayerId = null) {
    if (players.some(player => player.id !== ignoredPlayerId && player.name === name)) {
      throw new Error(`A player named "${name}" already exists`);
    }
  }
}

export default new StorageService();
