const STORAGE_KEYS = {
  COURTS: 'pickleball_courts',
  PLAYERS: 'pickleball_players'
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
    const players = this.getPlayers();
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    if (index !== -1) {
      players[index] = updatedPlayer;
      this.savePlayers(players);
    }
  }

  getPlayers() {
    const players = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return players ? JSON.parse(players) : [];
  }

  getWaitingPlayers() {
    const players = this.getPlayers();
    return players.filter(p => p.status === 'waiting');
  }

  savePlayer(player) {
    const players = this.getPlayers();
    players.push(player);
    this.savePlayers(players);
  }

  updatePlayerTeam(playerId, teamId) {
    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.status = teamId ? 'active' : 'waiting';
      this.savePlayers(players);
    }
  }

  removePlayer(playerId) {
    const players = this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.status = 'waiting';
      player.teamId = null;
      this.savePlayers(players);
    }
  }
}

export default new StorageService();
