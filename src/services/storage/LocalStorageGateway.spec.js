// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageGateway } from './LocalStorageGateway'

describe('LocalStorageGateway', () => {
  const gateway = new LocalStorageGateway()

  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the supplied default when a key is absent', () => {
    const fallback = []

    expect(gateway.read('missing-key', fallback)).toBe(fallback)
  })

  it('writes and reads a JSON value without knowing its shape', () => {
    const value = [{ id: 'entity-1', nested: { active: true } }]

    gateway.write('entities', value)

    expect(localStorage.getItem('entities')).toBe(JSON.stringify(value))
    expect(gateway.read('entities', [])).toEqual(value)
    expect(gateway.read('entities', [])).not.toBe(value)
  })

  it('removes only the selected key', () => {
    gateway.write('first', [1])
    gateway.write('second', [2])

    gateway.remove('first')

    expect(gateway.read('first', [])).toEqual([])
    expect(gateway.read('second', [])).toEqual([2])
  })

  it('preserves the existing JSON parsing failure contract', () => {
    localStorage.setItem('invalid', '{not-json')

    expect(() => gateway.read('invalid', [])).toThrow()
  })
})
