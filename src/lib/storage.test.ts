import { describe, expect, it } from 'vitest'
import { readVersioned, writeVersioned, type StorageLike } from './storage'

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

describe('versioned storage', () => {
  it('persists and restores the matching version', () => {
    const storage = memoryStorage()
    writeVersioned(storage, 'key', 1, { value: 42 })
    expect(readVersioned(storage, 'key', 1, { value: 0 })).toEqual({ value: 42 })
  })

  it('falls back when the schema version changes', () => {
    const storage = memoryStorage()
    writeVersioned(storage, 'key', 1, ['old'])
    expect(readVersioned(storage, 'key', 2, ['new'])).toEqual(['new'])
  })
})
