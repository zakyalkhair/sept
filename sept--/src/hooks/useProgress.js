import { useCallback, useEffect, useState } from 'react'

const KEY = '20sept.dibuka'

function baca() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function useProgress() {
  const [dibuka, setDibuka] = useState(baca)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...dibuka]))
    } catch {
      /* mode privat / storage penuh — situs tetap harus jalan */
    }
  }, [dibuka])

  const tandai = useCallback((id) => {
    setDibuka((s) => (s.has(id) ? s : new Set(s).add(id)))
  }, [])

  const tandaiSemua = useCallback((ids) => {
    setDibuka((s) => {
      if (ids.every((id) => s.has(id))) return s
      const n = new Set(s)
      ids.forEach((id) => n.add(id))
      return n
    })
  }, [])

  return { dibuka, tandai, tandaiSemua, jumlah: dibuka.size }
}
