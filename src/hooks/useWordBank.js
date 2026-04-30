import { useState, useCallback, useMemo } from 'react'

const STORAGE_PREFIX = 'wordbank-'

function loadBank(fileName, seedData) {
  const key = STORAGE_PREFIX + fileName
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fall through to seed
    }
  }

  const words = seedData.map((d) =>
    typeof d === 'string'
      ? { word: d.toUpperCase(), clue: '', known: false }
      : { word: d.word.toUpperCase(), clue: d.clue || '', known: false }
  )
  return { words }
}

function saveBank(fileName, bank) {
  localStorage.setItem(STORAGE_PREFIX + fileName, JSON.stringify(bank))
}

export default function useWordBank(fileName, seedData) {
  const [bank, setBank] = useState(() => loadBank(fileName, seedData))

  const persist = useCallback(
    (next) => {
      setBank(next)
      saveBank(fileName, next)
    },
    [fileName]
  )

  const addWord = useCallback(
    (word, clue) => {
      const upper = word.toUpperCase().replace(/[^A-Z]/g, '')
      if (!upper) return false
      setBank((prev) => {
        if (prev.words.some((w) => w.word === upper)) return prev
        const next = { words: [...prev.words, { word: upper, clue, known: false }] }
        saveBank(fileName, next)
        return next
      })
      return true
    },
    [fileName]
  )

  const removeWord = useCallback(
    (word) => {
      setBank((prev) => {
        const next = { words: prev.words.filter((w) => w.word !== word) }
        saveBank(fileName, next)
        return next
      })
    },
    [fileName]
  )

  const toggleKnown = useCallback(
    (word) => {
      setBank((prev) => {
        const next = {
          words: prev.words.map((w) =>
            w.word === word ? { ...w, known: !w.known } : w
          ),
        }
        saveBank(fileName, next)
        return next
      })
    },
    [fileName]
  )

  const updateClue = useCallback(
    (word, clue) => {
      setBank((prev) => {
        const next = {
          words: prev.words.map((w) =>
            w.word === word ? { ...w, clue } : w
          ),
        }
        saveBank(fileName, next)
        return next
      })
    },
    [fileName]
  )

  const resetBank = useCallback(() => {
    const fresh = {
      words: seedData.map((d) =>
        typeof d === 'string'
          ? { word: d.toUpperCase(), clue: '', known: false }
          : { word: d.word.toUpperCase(), clue: d.clue || '', known: false }
      ),
    }
    persist(fresh)
  }, [seedData, persist])

  const activeWords = useMemo(() => bank.words.filter((w) => !w.known), [bank])
  const knownWords = useMemo(() => bank.words.filter((w) => w.known), [bank])

  const clueMap = useMemo(() => {
    const map = {}
    for (const w of bank.words) {
      if (w.clue) map[w.word] = w.clue
    }
    return map
  }, [bank])

  return {
    bank,
    activeWords,
    knownWords,
    clueMap,
    addWord,
    removeWord,
    toggleKnown,
    updateClue,
    resetBank,
  }
}
