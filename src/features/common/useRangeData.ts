import { useCallback, useEffect, useRef, useState } from 'react'
import { markLoaded, rangesToFetch } from './period'
import type { DateRange, RangeCache } from './period'

export function useRangeData<T>(
  fetcher: (range: DateRange | null) => Promise<T[]>,
  getKey: (item: T) => string | number,
  range: DateRange | null,
) {
  const [items, setItems] = useState<T[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const cache = useRef<RangeCache>({ all: false, ranges: [] })
  const fetcherRef = useRef(fetcher)
  const getKeyRef = useRef(getKey)

  useEffect(() => {
    fetcherRef.current = fetcher
    getKeyRef.current = getKey
  })

  const rangeKey = range ? `${range.start}|${range.end}` : 'all'
  const requestKey = `${rangeKey}#${version}`

  const merge = useCallback((results: T[]) => {
    setItems((current) => {
      const byKey = new Map(current.map((item) => [getKeyRef.current(item), item]))
      for (const item of results) byKey.set(getKeyRef.current(item), item)
      return [...byKey.values()]
    })
  }, [])

  useEffect(() => {
    let active = true
    const target = rangeKey === 'all' ? null : { start: rangeKey.split('|')[0], end: rangeKey.split('|')[1] }
    const gaps = rangesToFetch(cache.current, target)

    Promise.all(gaps.map((gap) => fetcherRef.current(gap)))
      .then((results) => {
        if (!active) return
        cache.current = markLoaded(cache.current, target)
        merge(results.flat())
        setError('')
        setLoadedKey(requestKey)
      })
      .catch((err: Error) => {
        if (!active) return
        setError(err.message || 'Não foi possível carregar os dados.')
        setLoadedKey(requestKey)
      })

    return () => { active = false }
  }, [rangeKey, requestKey, merge])

  const refresh = useCallback(async () => {
    const target = rangeKey === 'all' ? null : { start: rangeKey.split('|')[0], end: rangeKey.split('|')[1] }
    merge(await fetcherRef.current(target))
  }, [rangeKey, merge])

  const reset = useCallback(() => {
    cache.current = { all: false, ranges: [] }
    setItems([])
    setVersion((value) => value + 1)
  }, [])

  return { items, loading: loadedKey !== requestKey, error, refresh, reset, upsert: merge }
}
