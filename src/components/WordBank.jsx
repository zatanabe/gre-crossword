import { useState, useRef, useEffect } from 'react'
import greDefinitions from '../data/greDefinitions.js'

const ARCHAIC_PATTERNS = /\b(archaic|obsolete|rare|dated|historical)\b/i
const VERBOSE_THRESHOLD = 120

async function fetchDefinition(word) {
  const upper = word.toUpperCase().replace(/[^A-Z]/g, '')
  const greDef = greDefinitions[upper]
  if (greDef) return greDef

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    )
    if (!res.ok) return null
    const data = await res.json()

    const allDefs = []
    for (const entry of data) {
      for (const meaning of entry.meanings || []) {
        for (const d of meaning.definitions || []) {
          if (d.definition) allDefs.push(d.definition)
        }
      }
    }
    if (allDefs.length === 0) return null

    const scored = allDefs.map((def) => {
      let score = 0
      if (ARCHAIC_PATTERNS.test(def)) score -= 10
      if (def.length > VERBOSE_THRESHOLD) score -= 3
      if (def.length < 20) score -= 1
      return { def, score }
    })
    scored.sort((a, b) => b.score - a.score)

    return scored[0].def.replace(/\.$/, '')
  } catch {
    return null
  }
}

const STATUS_CONFIG = {
  learning: { label: 'Learning', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', dot: 'bg-red-500' },
  familiar: { label: 'Familiar', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500' },
  mastered: { label: 'Mastered', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500' },
}

const TABS = [
  { key: 'learning', label: 'Learning' },
  { key: 'familiar', label: 'Familiar' },
  { key: 'mastered', label: 'Mastered' },
]

function StatusButtons({ word, currentStatus, onSetStatus }) {
  const next = currentStatus === 'learning' ? 'familiar' : currentStatus === 'familiar' ? 'mastered' : null
  const prev = currentStatus === 'mastered' ? 'familiar' : currentStatus === 'familiar' ? 'learning' : null

  return (
    <div className="flex gap-1 shrink-0">
      {prev && (
        <button
          onClick={() => onSetStatus(word, prev)}
          className={[
            'text-xs px-2 py-1 rounded border transition-colors',
            STATUS_CONFIG[prev].border, STATUS_CONFIG[prev].color,
            `hover:${STATUS_CONFIG[prev].bg}`,
          ].join(' ')}
        >
          {STATUS_CONFIG[prev].label}
        </button>
      )}
      {next && (
        <button
          onClick={() => onSetStatus(word, next)}
          className={[
            'text-xs px-2 py-1 rounded border transition-colors',
            STATUS_CONFIG[next].border, STATUS_CONFIG[next].color,
            `hover:${STATUS_CONFIG[next].bg}`,
          ].join(' ')}
        >
          {STATUS_CONFIG[next].label}
        </button>
      )}
    </div>
  )
}

function EditableClue({ word, clue, fetching, onUpdateClue }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(clue || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  if (fetching === word) {
    return <div className="text-xs text-[#5c6ac4] italic">Looking up definition...</div>
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onUpdateClue(word, draft.trim())
          setEditing(false)
        }}
        className="flex gap-1 mt-0.5"
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onUpdateClue(word, draft.trim())
            setEditing(false)
          }}
          className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#5c6ac4]"
        />
      </form>
    )
  }

  return (
    <div
      onClick={() => { setDraft(clue || ''); setEditing(true) }}
      className="text-xs text-gray-500 truncate cursor-pointer hover:text-gray-700"
      title="Click to edit"
    >
      {clue || <span className="italic text-gray-400">Add a clue...</span>}
    </div>
  )
}

export default function WordBank({
  learningWords,
  familiarWords,
  masteredWords,
  onAdd,
  onRemove,
  onSetStatus,
  onUpdateClue,
  onRegenerate,
  onReset,
  onClose,
}) {
  const [word, setWord] = useState('')
  const [clue, setClue] = useState('')
  const [tab, setTab] = useState('learning')
  const [fetching, setFetching] = useState(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    const trimmed = word.trim()
    if (!trimmed) return
    const upper = trimmed.toUpperCase().replace(/[^A-Z]/g, '')

    const manualClue = clue.trim()
    onAdd(trimmed, manualClue)
    setWord('')
    setClue('')

    if (!manualClue) {
      setFetching(upper)
      const def = await fetchDefinition(trimmed)
      setFetching(null)
      if (def) {
        onUpdateClue(upper, def)
      }
    }
  }

  const counts = {
    learning: learningWords.length,
    familiar: familiarWords.length,
    mastered: masteredWords.length,
  }

  const displayed = tab === 'learning' ? learningWords
    : tab === 'familiar' ? familiarWords
    : masteredWords

  const emptyMessages = {
    learning: 'No words in learning',
    familiar: 'No familiar words yet',
    mastered: 'No mastered words yet',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-serif font-bold text-lg">Word Bank</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="New word"
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c6ac4]"
            />
            <button
              type="submit"
              className="bg-[#5c6ac4] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#4b59b3] transition-colors"
            >
              Add
            </button>
          </div>
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            placeholder="Clue (auto-generated if left blank)"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c6ac4]"
          />
        </form>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5',
                tab === t.key
                  ? `${STATUS_CONFIG[t.key].border} ${STATUS_CONFIG[t.key].color}`
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${STATUS_CONFIG[t.key].dot}`} />
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {/* Word list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {displayed.length === 0 && (
            <p className="text-gray-400 text-sm py-4 text-center">
              {emptyMessages[tab]}
            </p>
          )}
          {displayed.map((w) => (
            <div
              key={w.word}
              className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold text-black">{w.word}</div>
                <EditableClue
                  word={w.word}
                  clue={w.clue}
                  fetching={fetching}
                  onUpdateClue={onUpdateClue}
                />
              </div>
              <StatusButtons
                word={w.word}
                currentStatus={w.status}
                onSetStatus={onSetStatus}
              />
              <button
                onClick={() => onRemove(w.word)}
                className="shrink-0 text-gray-300 hover:text-red-500 text-lg leading-none transition-colors"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
          <button
            onClick={onRegenerate}
            className="flex-1 bg-black text-white py-2 rounded font-medium text-sm hover:bg-gray-800 transition-colors"
          >
            New Puzzle
          </button>
          <button
            onClick={onReset}
            className="text-gray-500 hover:text-red-600 text-xs px-3 py-2 border border-gray-300 rounded transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}
