import { LocationBuilder, PlayerBuilder } from '@/models'
import type { Location, Player } from '@/models'
import storageService from '@/services/storage'

export const SAMPLE_DATA_FLAG_KEY = 'pickleball_sample_data_initialized'

export const SAMPLE_PLAYER_NAMES = {
  boys: [
    'Adam',
    'Arthur',
    'Gabriel',
    'Hugo',
    'Louis',
    'Léo',
    'Lucas',
    'Nathan',
    'Noah',
    'Paul',
    'Raphaël',
    'Tom',
    'Victor',
    'Alexandre',
    'Baptiste',
    'Enzo',
    'Jules',
    'Martin',
    'Mathis',
    'Théo'
  ],
  girls: [
    'Alice',
    'Ambre',
    'Chloé',
    'Clara',
    'Emma',
    'Inès',
    'Jade',
    'Juliette',
    'Léa',
    'Louise',
    'Manon',
    'Rose',
    'Sarah',
    'Zoé',
    'Agathe'
  ],
  mixed: [
    'Alex',
    'Alix',
    'Andrea',
    'Camille',
    'Casey',
    'Charlie',
    'Claude',
    'Dominique',
    'Eden',
    'Jamie',
    'Jordan',
    'Lou',
    'Morgan',
    'Robin',
    'Sacha'
  ]
} as const

const SAMPLE_LOCATIONS = [
  { name: 'Le Grand Saconnex', nbCourts: 4 },
  { name: 'Genève', nbCourts: 2 },
  { name: 'Lancy', nbCourts: 6 },
  { name: 'Carouge', nbCourts: 2 },
  { name: 'Bellevue', nbCourts: 8 }
] as const

export function hasSampleDataBeenInitialized(): boolean {
  return localStorage.getItem(SAMPLE_DATA_FLAG_KEY) === 'true'
}

export function initializeSampleData(): boolean {
  if (hasSampleDataBeenInitialized()) return false

  const existingLocations = storageService.getLocations() as Location[]
  const existingPlayers = storageService.getPlayers() as Player[]
  const existingLocationNames = new Set(
    existingLocations.map(location => normalizeName(location.name))
  )
  const existingPlayerNames = new Set(
    existingPlayers.map(player => normalizeName(player.name))
  )
  const sampleLocations = SAMPLE_LOCATIONS
    .filter(location => !existingLocationNames.has(normalizeName(location.name)))
    .map(location => new LocationBuilder()
      .withName(location.name)
      .withNbCourts(location.nbCourts)
      .build())
  const samplePlayers = Object.values(SAMPLE_PLAYER_NAMES)
    .flat()
    .filter(name => !existingPlayerNames.has(normalizeName(name)))
    .map(name => new PlayerBuilder().withName(name).build())

  try {
    storageService.saveLocations([...existingLocations, ...sampleLocations])
    storageService.savePlayers([...existingPlayers, ...samplePlayers])
    localStorage.setItem(SAMPLE_DATA_FLAG_KEY, 'true')
  } catch (error) {
    storageService.saveLocations(existingLocations)
    storageService.savePlayers(existingPlayers)
    localStorage.removeItem(SAMPLE_DATA_FLAG_KEY)
    throw error
  }

  return true
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('fr')
}
