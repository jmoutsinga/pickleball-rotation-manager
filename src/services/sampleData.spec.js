// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  LocationBuilder,
  LocationStatus,
  PlayerBuilder,
  PlayerStatus
} from '@/models'
import storageService from '@/services/storage'
import {
  hasSampleDataBeenInitialized,
  initializeSampleData,
  SAMPLE_DATA_FLAG_KEY,
  SAMPLE_PLAYER_NAMES
} from './sampleData'

describe('sample data initialization', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates the requested Locations and 50 available Players once', () => {
    expect(hasSampleDataBeenInitialized()).toBe(false)

    expect(initializeSampleData()).toBe(true)

    expect(storageService.getLocations().map(location => ({
      name: location.name,
      nbCourts: location.nbCourts,
      status: location.status
    }))).toEqual([
      { name: 'Le Grand Saconnex', nbCourts: 4, status: LocationStatus.ACTIVE },
      { name: 'Genève', nbCourts: 2, status: LocationStatus.ACTIVE },
      { name: 'Lancy', nbCourts: 6, status: LocationStatus.ACTIVE },
      { name: 'Carouge', nbCourts: 2, status: LocationStatus.ACTIVE },
      { name: 'Bellevue', nbCourts: 8, status: LocationStatus.ACTIVE }
    ])

    const players = storageService.getPlayers()

    expect(players).toHaveLength(50)
    expect(players.every(player => player.status === PlayerStatus.AVAILABLE))
      .toBe(true)
    expect(SAMPLE_PLAYER_NAMES.boys).toHaveLength(20)
    expect(SAMPLE_PLAYER_NAMES.girls).toHaveLength(15)
    expect(SAMPLE_PLAYER_NAMES.mixed).toHaveLength(15)
    expect(localStorage.getItem(SAMPLE_DATA_FLAG_KEY)).toBe('true')
    expect(hasSampleDataBeenInitialized()).toBe(true)
  })

  it('does not insert the sample data a second time', () => {
    initializeSampleData()
    const locationsAfterFirstRun = localStorage.getItem(
      'pickleball_locations'
    )
    const playersAfterFirstRun = localStorage.getItem('pickleball_players')

    expect(initializeSampleData()).toBe(false)
    expect(localStorage.getItem('pickleball_locations'))
      .toBe(locationsAfterFirstRun)
    expect(localStorage.getItem('pickleball_players'))
      .toBe(playersAfterFirstRun)
  })

  it('preserves existing entities and skips sample names already present', () => {
    const existingGeneva = new LocationBuilder()
      .withId('existing-geneva')
      .withName('Genève')
      .withNbCourts(9)
      .build()
    const existingLocation = new LocationBuilder()
      .withId('existing-location')
      .withName('Existing Club')
      .withNbCourts(3)
      .build()
    const existingAdam = new PlayerBuilder()
      .withId('existing-adam')
      .withName('Adam')
      .withStatus(PlayerStatus.DELETED)
      .build()
    const existingPlayer = new PlayerBuilder()
      .withId('existing-player')
      .withName('existing-player')
      .build()

    storageService.saveLocations([existingGeneva, existingLocation])
    storageService.savePlayers([existingAdam, existingPlayer])

    initializeSampleData()

    const locations = storageService.getLocations()
    const players = storageService.getPlayers()

    expect(locations).toHaveLength(6)
    expect(locations.find(location => location.id === 'existing-geneva')?.nbCourts)
      .toBe(9)
    expect(locations.some(location => location.id === 'existing-location'))
      .toBe(true)
    expect(players).toHaveLength(51)
    expect(players.find(player => player.id === 'existing-adam')?.status)
      .toBe(PlayerStatus.DELETED)
    expect(players.some(player => player.id === 'existing-player')).toBe(true)
  })
})
