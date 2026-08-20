// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { Court } from '@/models'
import { CourtRepository } from './CourtRepository'

describe('CourtRepository', () => {
  const repository = new CourtRepository()

  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and rehydrates Courts without changing their identity', () => {
    const courts = [
      new Court('location-1', 1, 'court-1'),
      new Court('location-1', 2, 'court-2')
    ]

    repository.saveAll(courts)

    const restoredCourts = repository.getAll()
    expect(restoredCourts).toHaveLength(2)
    expect(restoredCourts[0]).toBeInstanceOf(Court)
    expect(restoredCourts.map(court => court.toJSON()))
      .toEqual(courts.map(court => court.toJSON()))
  })

  it('returns an empty collection when no Court is persisted', () => {
    expect(repository.getAll()).toEqual([])
  })
})
