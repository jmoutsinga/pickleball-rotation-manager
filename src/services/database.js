const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../pickleballdb.sqlite'));
    this.initializeTables();
  }

  initializeTables() {
    // Create courts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS courts (
        id INTEGER PRIMARY KEY,
        number INTEGER NOT NULL
      )
    `);

    // Create teams table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY,
        court_id INTEGER,
        side TEXT CHECK(side IN ('A', 'B')),
        FOREIGN KEY (court_id) REFERENCES courts(id),
        UNIQUE(court_id, side)
      )
    `);

    // Create players table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        team_id INTEGER,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);
  }

  // Courts operations
  saveCourts(numCourts) {
    const deleteCourts = this.db.prepare('DELETE FROM courts');
    const deleteTeams = this.db.prepare('DELETE FROM teams');
    const insertCourt = this.db.prepare('INSERT INTO courts (number) VALUES (?)');
    const insertTeam = this.db.prepare('INSERT INTO teams (court_id, side) VALUES (?, ?)');
    
    const transaction = this.db.transaction(() => {
      deleteCourts.run();
      deleteTeams.run();
      
      for (let i = 1; i <= numCourts; i++) {
        const result = insertCourt.run(i);
        // Create two teams for each court (side A and B)
        insertTeam.run(result.lastInsertRowid, 'A');
        insertTeam.run(result.lastInsertRowid, 'B');
      }
    });

    transaction();
  }

  getCourts() {
    const courts = this.db.prepare('SELECT * FROM courts ORDER BY number').all();
    const teams = this.db.prepare(`
      SELECT t.*, p.id as player_id, p.name as player_name, p.status
      FROM teams t
      LEFT JOIN players p ON p.team_id = t.id
      ORDER BY t.court_id, t.side
    `).all();

    return courts.map(court => {
      const courtTeams = teams.filter(t => t.court_id === court.id);
      return {
        ...court,
        teams: {
          A: {
            id: courtTeams.find(t => t.side === 'A')?.id,
            players: courtTeams
              .filter(t => t.side === 'A' && t.player_id)
              .map(t => ({
                id: t.player_id,
                name: t.player_name,
                status: t.status
              }))
          },
          B: {
            id: courtTeams.find(t => t.side === 'B')?.id,
            players: courtTeams
              .filter(t => t.side === 'B' && t.player_id)
              .map(t => ({
                id: t.player_id,
                name: t.player_name,
                status: t.status
              }))
          }
        }
      };
    });
  }

  // Players operations
  savePlayer(player) {
    const stmt = this.db.prepare(`
      INSERT INTO players (id, name, status, team_id)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(player.id, player.name, 'waiting', null);
  }

  updatePlayerTeam(playerId, teamId) {
    const stmt = this.db.prepare(`
      UPDATE players
      SET team_id = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(teamId, teamId ? 'active' : 'waiting', playerId);
  }

  removePlayer(playerId) {
    const stmt = this.db.prepare(`
      UPDATE players
      SET status = 'waiting', team_id = NULL
      WHERE id = ?
    `);
    stmt.run(playerId);
  }

  getPlayers() {
    return this.db.prepare('SELECT * FROM players').all();
  }

  getWaitingPlayers() {
    return this.db.prepare('SELECT * FROM players WHERE status = ?').all('waiting');
  }
}

const dbService = new DatabaseService();
export default dbService;
