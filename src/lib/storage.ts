export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type VersionedValue<T> = {
  version: number
  value: T
}

export const readVersioned = <T>(
  storage: StorageLike | undefined,
  key: string,
  version: number,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T => {
  if (!storage) return fallback
  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as VersionedValue<unknown>
    if (parsed.version !== version) return fallback
    if (validate && !validate(parsed.value)) return fallback
    return parsed.value as T
  } catch {
    return fallback
  }
}

export const writeVersioned = <T>(storage: StorageLike | undefined, key: string, version: number, value: T) => {
  if (!storage) return
  storage.setItem(key, JSON.stringify({ version, value } satisfies VersionedValue<T>))
}
