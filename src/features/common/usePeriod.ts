import { useCallback, useState } from 'react'
import { PERIOD_VIEWS, dateInput } from './period'
import type { PeriodValue, PeriodView } from './period'

const storageKey = (screen: string) => `diagnovetis:periodo:${screen}`

function readStoredView(screen: string): PeriodView | null {
  try {
    const stored = localStorage.getItem(storageKey(screen))
    return PERIOD_VIEWS.some((item) => item.view === stored) ? (stored as PeriodView) : null
  } catch {
    return null
  }
}

export function usePeriod(screen: string, defaultView: PeriodView = 'month') {
  const [value, setValue] = useState<PeriodValue>(() => ({
    view: readStoredView(screen) ?? defaultView,
    date: dateInput(),
  }))

  const change = useCallback(
    (next: PeriodValue) => {
      setValue(next)
      try {
        localStorage.setItem(storageKey(screen), next.view)
      } catch {
        return
      }
    },
    [screen],
  )

  return [value, change] as const
}
