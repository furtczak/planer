import { useEffect, useReducer, useRef } from 'react'
import { loadData, saveData } from '../lib/storage'
import { sampleData } from '../lib/sample'
import { appReducer } from '../store/appReducer'
import type { AppData } from '../types'

function initialState(): AppData {
  return loadData() ?? sampleData()
}

/** Stan aplikacji + zapis do localStorage (odroczony, żeby nie pisać przy każdym znaku). */
export function useAppData() {
  const [data, dispatch] = useReducer(appReducer, undefined, initialState)
  const firstRender = useRef(true)
  const latest = useRef(data)
  latest.current = data

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      saveData(data)
      return
    }
    const timer = setTimeout(() => saveData(data), 300)
    return () => clearTimeout(timer)
  }, [data])

  // zamknięcie karty albo przejście w tło nie może zgubić zmiany czekającej na zapis
  useEffect(() => {
    const flush = () => saveData(latest.current)
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onHidden)
      flush()
    }
  }, [])

  return { data, dispatch }
}
