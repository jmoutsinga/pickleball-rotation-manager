import courtRepository from './storage/CourtRepository'
import localStorageGateway from './storage/LocalStorageGateway'
import locationRepository from './storage/LocationRepository'
import playerRepository from './storage/PlayerRepository'
import rotationGameNumberMigration from './storage/RotationGameNumberMigration'
import rotationRepository from './storage/RotationRepository'
import sessionGraphPersistenceService from './storage/SessionGraphPersistenceService'
import sessionPersistenceService from './storage/SessionPersistenceService'
import sessionRepository from './storage/SessionRepository'
import sessionUsableCourtMigration from './storage/SessionUsableCourtMigration'
import { STORAGE_KEYS } from './storage/StorageKeys'
import teamRepository from './storage/TeamRepository'

class StorageService {
  saveCourts(courts) {
    courtRepository.saveAll(courts);
  }

  getCourts() {
    return courtRepository.getAll();
  }

  savePlayers(players) {
    playerRepository.saveAll(players);
  }

  updatePlayer(updatedPlayer) {
    playerRepository.update(updatedPlayer);
  }

  changePlayerStatus(playerId, status) {
    return playerRepository.changeStatus(playerId, status);
  }

  updatePlayers(updatedPlayers) {
    playerRepository.merge(updatedPlayers);
  }

  getPlayers() {
    return playerRepository.getAll();
  }

  getWaitingPlayers() {
    return playerRepository.getWaiting();
  }

  savePlayer(player) {
    playerRepository.add(player);
  }

  updatePlayerTeam(playerId, teamId) {
    playerRepository.updateTeam(playerId, teamId);
  }

  removePlayer(playerId) {
    playerRepository.release(playerId);
  }

  saveLocations(locations) {
    locationRepository.saveAll(locations);
  }

  saveLocation(location) {
    locationRepository.add(location);
  }

  updateLocation(updatedLocation) {
    locationRepository.update(updatedLocation)
  }

  getLocations() {
    return locationRepository.getAll();
  }

  getActiveLocations() {
    return locationRepository.getActive();
  }

  deleteLocation(locationId) {
    locationRepository.delete(locationId);
  }

  saveSessions(sessions) {
    sessionRepository.saveAll(sessions);
  }

  getSessions() {
    return sessionPersistenceService.getAll();
  }

  saveSession(session) {
    sessionPersistenceService.save(session);
  }

  saveRotations(rotations) {
    rotationRepository.saveAll(rotations);
  }

  getRotations() {
    return rotationGameNumberMigration.migrate();
  }

  migrateSessionUsableCourts(graphContext) {
    return sessionUsableCourtMigration.migrate(graphContext)
  }

  saveTeams(teams) {
    teamRepository.saveAll(teams);
  }

  getTeams() {
    return teamRepository.getAll();
  }

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorageGateway.remove(key));
  }

  assertPlayer(player) {
    playerRepository.assertPlayer(player);
  }

  assertLocation(location) {
    locationRepository.assertLocation(location);
  }

  assertUniquePlayerName(name, players, ignoredPlayerId = null) {
    playerRepository.assertUniqueName(name, players, ignoredPlayerId);
  }

  saveSessionGraph({
                     location,
                     session,
                     rotation,
                     courts,
                     teams,
                     discardRotation = false
                   }) {
    sessionGraphPersistenceService.save({
      location,
      session,
      rotation,
      courts,
      teams,
      discardRotation
    });
  }

}

export default new StorageService();
