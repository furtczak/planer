import { useEffect, useReducer, useRef } from 'react'
import { loadData, saveData } from '../lib/storage'
import { sampleData } from '../lib/sample'
import { notesReducer } from '../store/notesReducer'
import type { AppData } from '../types'

function initialState(): AppData {
  return loadData() ?? sampleData()
}

/** Stan aplikacji + zapis do localStorage (odroczony, żeby nie pisać przy każdym znaku). */
export function useAppData() {
  const [data, dispatch] = useReducer(notesReducer, undefined, initialState)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      // pierwszy zapis od razu, żeby dane startowe przetrwały odświeżenie
      saveData(data)
      return
    }
    const timer = setTimeout(() => saveData(data), 300)
    return () => clearTimeout(timer)
  }, [data])

  return { data, dispatch }
}
