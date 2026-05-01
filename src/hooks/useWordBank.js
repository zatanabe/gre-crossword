import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const STORAGE_PREFIX = 'wordbank-'

function buildSeedBank(seedData) {
  return {
    words: seedData.map((d) =>
      typeof d === 'string'
        ? { word: d.toUpperCase(), clue: '', known: false }
        : { word: d.word.toUpperCase(), clue: d.clue || '', known: false }
    ),
  }
}

function loadLocal(fileName, seedData) {
  const key = STORAGE_PREFIX + fileName
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fall through
    }
  }
  return buildSeedBank(seedData)
}

function saveLocal(fileName, bank) {
  localStorage.setItem(STORAGE_PREFIX + fileName, JSON.stringify(bank))
}

export default function useWordBank(fileName, seedData, user) {
  const [bank, setBank] = useState(() => loadLocal(fileName, seedData))
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const savingRef = useRef(false)

  const firestoreDocRef = user
    ? doc(db, 'wordbanks', user.uid, 'files', fileName)
    : null

  useEffect(() => {
    if (!user) {
      setCloudLoaded(false)
      setBank(loadLocal(fileName, seedData))
      return
    }

    let cancelled = false
    const ref = doc(db, 'wordbanks', user.uid, 'files', fileName)

    getDoc(ref).then((snap) => {
      if (cancelled) return
      if (snap.exists()) {
        const data = snap.data()
        setBank(data)
        saveLocal(fileName, data)
      } else {
        const local = loadLocal(fileName, seedData)
        setDoc(ref, local).catch(console.error)
        setBank(local)
      }
      setCloudLoaded(true)
    }).catch((err) => {
      console.error('Firestore load error:', err)
      if (!cancelled) setCloudLoaded(true)
    })

    return () => { cancelled = true }
  }, [user, fileName, seedData])

  const persist = useCallback(
    (next) => {
      setBank(next)
      saveLocal(fileName, next)
      if (firestoreDocRef && !savingRef.current) {
        savingRef.current = true
        setDoc(firestoreDocRef, next).catch(console.error).finally(() => {
          savingRef.current = false
        })
      }
    },
    [fileName, firestoreDocRef]
  )

  const addWord = useCallback(
    (word, clue) => {
      const upper = word.toUpperCase().replace(/[^A-Z]/g, '')
      if (!upper) return false
      setBank((prev) => {
        if (prev.words.some((w) => w.word === upper)) return prev
        const next = { words: [...prev.words, { word: upper, clue, known: false }] }
        saveLocal(fileName, next)
        if (firestoreDocRef) setDoc(firestoreDocRef, next).catch(console.error)
        return next
      })
      return true
    },
    [fileName, firestoreDocRef]
  )

  const removeWord = useCallback(
    (word) => {
      setBank((prev) => {
        const next = { words: prev.words.filter((w) => w.word !== word) }
        saveLocal(fileName, next)
        if (firestoreDocRef) setDoc(firestoreDocRef, next).catch(console.error)
        return next
      })
    },
    [fileName, firestoreDocRef]
  )

  const toggleKnown = useCallback(
    (word) => {
      setBank((prev) => {
        const next = {
          words: prev.words.map((w) =>
            w.word === word ? { ...w, known: !w.known } : w
          ),
        }
        saveLocal(fileName, next)
        if (firestoreDocRef) setDoc(firestoreDocRef, next).catch(console.error)
        return next
      })
    },
    [fileName, firestoreDocRef]
  )

  const updateClue = useCallback(
    (word, clue) => {
      setBank((prev) => {
        const next = {
          words: prev.words.map((w) =>
            w.word === word ? { ...w, clue } : w
          ),
        }
        saveLocal(fileName, next)
        if (firestoreDocRef) setDoc(firestoreDocRef, next).catch(console.error)
        return next
      })
    },
    [fileName, firestoreDocRef]
  )

  const resetBank = useCallback(() => {
    setBank((prev) => {
      const knownSet = new Set(prev.words.filter((w) => w.known).map((w) => w.word))
      const knownClues = {}
      for (const w of prev.words) {
        if (w.known && w.clue) knownClues[w.word] = w.clue
      }

      const fresh = buildSeedBank(seedData)
      const next = {
        words: fresh.words.map((w) =>
          knownSet.has(w.word)
            ? { ...w, known: true, clue: knownClues[w.word] || w.clue }
            : w
        ),
      }
      saveLocal(fileName, next)
      if (firestoreDocRef) setDoc(firestoreDocRef, next).catch(console.error)
      return next
    })
  }, [seedData, fileName, firestoreDocRef])

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
    cloudLoaded,
  }
}
