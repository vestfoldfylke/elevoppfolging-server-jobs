export type MemoryCacheEntry<T> = T & {
  /** Number of milliseconds elapsed since epoch */
  insertedAt: number
}

export class MemoryCache<T> {
  private cache: Map<string, MemoryCacheEntry<T>> = new Map<string, MemoryCacheEntry<T>>()

  set(key: string, value: T): void {
    const cacheEntry: MemoryCacheEntry<T> = {
      ...value,
      insertedAt: Date.now()
    }

    this.cache.set(key, cacheEntry)
  }

  get(key: string, isValid?: (input: MemoryCacheEntry<T>) => boolean): MemoryCacheEntry<T> | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    const cacheEntry: MemoryCacheEntry<T> | undefined = this.cache.get(key)
    if (cacheEntry === undefined) {
      return undefined
    }

    if (typeof isValid !== "function") {
      return cacheEntry
    }

    if (isValid(cacheEntry)) {
      return cacheEntry
    }

    return undefined
  }
}
