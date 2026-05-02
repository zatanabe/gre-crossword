import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import defaultCards from '../data/greMath.js'

const STORAGE_KEY = 'mathbank'

function buildSeedBank() {
  return {
    cards: defaultCards.map((c, i) => ({
      id: i,
      front: c.front,
      back: c.back,
      status: 'learning',
    })),
  }
}

function loadLocal() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const bank = JSON.parse(stored)
      return mergeWithDefaults(bank)
    } catch {
      // fall through
    }
  }
  return buildSeedBank()
}

function mergeWithDefaults(bank) {
  const existing = new Map(bank.cards.map((c) => [c.id, c]))
  const merged = defaultCards.map((c, i) => {
    const saved = existing.get(i)
    if (saved) {
      return {
        id: i,
        front: saved.front !== undefined ? saved.front : c.front,
        back: saved.back !== undefined ? saved.back : c.back,
        status: saved.status || 'learning',
      }
    }
    return { id: i, front: c.front, back: c.back, status: 'learning' }
  })
  const custom = bank.cards.filter((c) => c.id >= defaultCards.length)
  return { cards: [...merged, ...custom] }
}

function saveLocal(bank) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bank))
}

export default function useMathBank(user) {
  const [bank, setBank] = useState(loadLocal)
  const savingRef = useRef(false)

  const firestoreRef = user
    ? doc(db, 'wordbanks', user.uid, 'files', '_math')
    : null

  useEffect(() => {
    if (!user) {
      setBank(loadLocal())
      return
    }

    let cancelled = false
    const ref = doc(db, 'wordbanks', user.uid, 'files', '_math')

    getDoc(ref).then((snap) => {
      if (cancelled) return
      if (snap.exists()) {
        const data = mergeWithDefaults(snap.data())
        setBank(data)
        saveLocal(data)
      } else {
        const local = loadLocal()
        setDoc(ref, local).catch(console.error)
        setBank(local)
      }
    }).catch(console.error)

    return () => { cancelled = true }
  }, [user])

  const persist = useCallback(
    (next) => {
      setBank(next)
      saveLocal(next)
      if (firestoreRef && !savingRef.current) {
        savingRef.current = true
        setDoc(firestoreRef, next).catch(console.error).finally(() => {
          savingRef.current = false
        })
      }
    },
    [firestoreRef]
  )

  const setStatus = useCallback(
    (id, status) => {
      setBank((prev) => {
        const next = {
          cards: prev.cards.map((c) => c.id === id ? { ...c, status } : c),
        }
        saveLocal(next)
        if (firestoreRef) setDoc(firestoreRef, next).catch(console.error)
        return next
      })
    },
    [firestoreRef]
  )

  const updateCard = useCallback(
    (id, front, back) => {
      setBank((prev) => {
        const next = {
          cards: prev.cards.map((c) => c.id === id ? { ...c, front, back } : c),
        }
        saveLocal(next)
        if (firestoreRef) setDoc(firestoreRef, next).catch(console.error)
        return next
      })
    },
    [firestoreRef]
  )

  const learningCards = useMemo(() => bank.cards.filter((c) => c.status === 'learning'), [bank])
  const familiarCards = useMemo(() => bank.cards.filter((c) => c.status === 'familiar'), [bank])
  const masteredCards = useMemo(() => bank.cards.filter((c) => c.status === 'mastered'), [bank])

  return {
    allCards: bank.cards,
    learningCards,
    familiarCards,
    masteredCards,
    setStatus,
    updateCard,
  }
}
