import wu from 'wu'

// disabled because we will probably have more exports here
// eslint-disable-next-line import/prefer-default-export
export class DefaultMap<K, V> extends Map<K, V> {
  constructor(readonly initDefault: (key: K) => V, entries?: Iterable<[K, V]>) {
    super(wu(entries || []))
  }

  get(key: K): V {
    if (this.has(key)) {
      return super.get(key) as V
    }
    const res = this.initDefault(key)
    this.set(key, res)
    return res
  }
}

export interface DefaultMap<K, V> extends Map<K, V> {
  get(key: K): V
}
