import { useState } from 'react'

async function fetchDefinition(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    )
    if (!res.ok) return null
    const data = await res.json()
    const meaning = data?.[0]?.meanings?.[0]
    const def = meaning?.definitions?.[0]?.definition
    if (!def) return null
    return def.replace(/\.$/, '')
  } catch {
    return null
  }
}

export default function WordBank({
  activeWords,
  knownWords,
  onAdd,
  onRemove,
  onToggleKnown,
  onUpdateClue,
  onRegenerate,
  onClose,
}) {
  const [word, setWord] = useState('')
  const [clue, setClue] = useState('')
  const [tab, setTab] = useState('active')
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

  const displayed = tab === 'active' ? activeWords : knownWords

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
          <button
            onClick={() => setTab('active')}
            className={[
              'py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'active'
                ? 'border-[#5c6ac4] text-[#5c6ac4]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            Active ({activeWords.length})
          </button>
          <button
            onClick={() => setTab('known')}
            className={[
              'py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'known'
                ? 'border-[#5c6ac4] text-[#5c6ac4]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            Known ({knownWords.length})
          </button>
        </div>

        {/* Word list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {displayed.length === 0 && (
            <p className="text-gray-400 text-sm py-4 text-center">
              {tab === 'active' ? 'No active words' : 'No known words yet'}
            </p>
          )}
          {displayed.map((w) => (
            <div
              key={w.word}
              className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold text-black">{w.word}</div>
                {fetching === w.word ? (
                  <div className="text-xs text-[#5c6ac4] italic">Looking up definition...</div>
                ) : w.clue ? (
                  <div className="text-xs text-gray-500 truncate">{w.clue}</div>
                ) : null}
              </div>
              <button
                onClick={() => onToggleKnown(w.word)}
                className={[
                  'shrink-0 text-xs px-2 py-1 rounded border transition-colors',
                  w.known
                    ? 'border-[#5c6ac4] text-[#5c6ac4] hover:bg-[#5c6ac4]/10'
                    : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50',
                ].join(' ')}
              >
                {w.known ? 'Reactivate' : 'I know this'}
              </button>
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
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={onRegenerate}
            className="w-full bg-black text-white py-2 rounded font-medium text-sm hover:bg-gray-800 transition-colors"
          >
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  )
}
