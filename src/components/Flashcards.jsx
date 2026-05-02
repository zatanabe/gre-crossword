import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import MathRenderer, { MathText } from './MathRenderer.jsx'
import greMath from '../data/greMath.js'

const STATUS_COLORS = {
  learning: { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  familiar: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  mastered: { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards({
  learningWords,
  familiarWords,
  masteredWords,
  onSetStatus,
  onUpdateClue,
  onClose,
}) {
  const [deckType, setDeckType] = useState('vocab')
  const [filter, setFilter] = useState('learning')
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const [deck, setDeck] = useState([])
  const [editingClue, setEditingClue] = useState(false)
  const [clueDraft, setClueDraft] = useState('')
  const clueInputRef = useRef(null)

  const isMath = deckType === 'math'

  const sourceWords = useMemo(() => {
    if (isMath) return greMath.map((c, i) => ({ id: i, ...c }))
    if (filter === 'learning') return learningWords
    if (filter === 'familiar') return familiarWords
    if (filter === 'mastered') return masteredWords
    return [...learningWords, ...familiarWords]
  }, [isMath, filter, learningWords, familiarWords, masteredWords])

  const reshuffleDeck = useCallback(() => {
    setDeck(shuffle(sourceWords))
    setIndex(0)
    setFlipped(false)
    setEditingClue(false)
  }, [sourceWords])

  useEffect(() => {
    reshuffleDeck()
  }, [reshuffleDeck])

  const card = deck[index] || null
  const total = deck.length

  const advance = useCallback(() => {
    setFlipped(false)
    setEditingClue(false)
    setIndex((i) => {
      if (i + 1 >= deck.length) return i
      return i + 1
    })
  }, [deck.length])

  const goBack = useCallback(() => {
    setFlipped(false)
    setEditingClue(false)
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const handleStatusAndAdvance = useCallback((word, status) => {
    onSetStatus(word, status)
    advance()
  }, [onSetStatus, advance])

  useEffect(() => {
    function onKey(e) {
      if (editingClue) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') {
        advance()
      } else if (e.key === 'ArrowLeft') {
        goBack()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, goBack, onClose, editingClue])

  const vocabFilters = [
    { key: 'learning', label: 'Learning' },
    { key: 'familiar', label: 'Familiar' },
    { key: 'mastered', label: 'Mastered' },
    { key: 'all', label: 'All' },
  ]

  const counts = {
    learning: learningWords.length,
    familiar: familiarWords.length,
    mastered: masteredWords.length,
    all: learningWords.length + familiarWords.length,
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-serif font-bold text-lg">Flashcards</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black text-xl leading-none"
        >
          &times;
        </button>
      </div>

      {/* Deck selector */}
      <div className="flex border-b border-gray-200 px-4">
        <button
          onClick={() => setDeckType('vocab')}
          className={[
            'py-2 px-4 text-sm font-medium border-b-2 -mb-px transition-colors',
            deckType === 'vocab'
              ? 'border-[#5c6ac4] text-[#5c6ac4]'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          Vocabulary
        </button>
        <button
          onClick={() => setDeckType('math')}
          className={[
            'py-2 px-4 text-sm font-medium border-b-2 -mb-px transition-colors',
            deckType === 'math'
              ? 'border-[#5c6ac4] text-[#5c6ac4]'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          Math ({greMath.length})
        </button>
      </div>

      {/* Status filter tabs (vocab only) */}
      {!isMath && (
        <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
          {vocabFilters.map((f) => {
            const colors = STATUS_COLORS[f.key]
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={[
                  'py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5',
                  filter === f.key
                    ? `${colors ? colors.border : 'border-[#5c6ac4]'} ${colors ? colors.text : 'text-[#5c6ac4]'}`
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                {colors && <span className={`inline-block w-2 h-2 rounded-full ${colors.dot}`} />}
                {f.label} ({counts[f.key]})
              </button>
            )
          })}
        </div>
      )}

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {total === 0 ? (
          <p className="text-gray-400 text-center">
            {isMath ? 'No math cards' : 'No words in this category'}
          </p>
        ) : card ? (
          <>
            {/* Progress */}
            <div className="text-sm text-gray-400 mb-4">
              {index + 1} / {total}
            </div>

            {/* Card */}
            <div
              onClick={() => { if (!editingClue) setFlipped((f) => !f) }}
              className={[
                'w-full max-w-md rounded-xl border-2 shadow-lg',
                'flex flex-col items-center justify-center p-6 cursor-pointer',
                'transition-all select-none min-h-[200px]',
                isMath ? 'border-[#5c6ac4]' : (STATUS_COLORS[card.status]?.border || 'border-gray-300'),
                flipped
                  ? (isMath ? 'bg-[#5c6ac4]/5' : (STATUS_COLORS[card.status]?.bg || 'bg-gray-50'))
                  : 'bg-white',
              ].join(' ')}
            >
              {isMath ? (
                !flipped ? (
                  <>
                    <MathText
                      text={card.front}
                      className="text-center text-gray-700 text-lg leading-relaxed"
                    />
                    <p className="text-xs text-gray-400 mt-4">Tap to reveal</p>
                  </>
                ) : (
                  <MathRenderer tex={card.back} className="text-xl" />
                )
              ) : !flipped ? (
                <>
                  <p className="text-center text-gray-600 text-lg leading-relaxed">
                    {card.clue || 'No clue available'}
                  </p>
                  <p className="text-xs text-gray-400 mt-4">Tap to reveal</p>
                </>
              ) : (
                <>
                  <p className="text-center font-mono font-bold text-2xl tracking-wider">
                    {card.word}
                  </p>
                  {editingClue ? (
                    <form
                      className="w-full mt-3 px-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        onUpdateClue(card.word, clueDraft.trim())
                        setDeck((d) => d.map((w) => w.word === card.word ? { ...w, clue: clueDraft.trim() } : w))
                        setEditingClue(false)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={clueInputRef}
                        type="text"
                        value={clueDraft}
                        onChange={(e) => setClueDraft(e.target.value)}
                        onBlur={() => {
                          onUpdateClue(card.word, clueDraft.trim())
                          setDeck((d) => d.map((w) => w.word === card.word ? { ...w, clue: clueDraft.trim() } : w))
                          setEditingClue(false)
                        }}
                        className="w-full text-sm text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#5c6ac4]"
                        placeholder="Enter a clue..."
                      />
                    </form>
                  ) : (
                    <p
                      className="text-center text-gray-500 text-sm mt-3 leading-relaxed cursor-pointer hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        setClueDraft(card.clue || '')
                        setEditingClue(true)
                        setTimeout(() => clueInputRef.current?.focus(), 0)
                      }}
                    >
                      {card.clue || <span className="italic text-gray-400">Tap to add clue...</span>}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Status buttons (vocab only) */}
            {flipped && !isMath && (
              <div className="flex gap-2 mt-6">
                {card.status !== 'learning' && (
                  <button
                    onClick={() => handleStatusAndAdvance(card.word, 'learning')}
                    className="px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Still learning
                  </button>
                )}
                {card.status !== 'familiar' && (
                  <button
                    onClick={() => handleStatusAndAdvance(card.word, 'familiar')}
                    className="px-4 py-2 rounded-lg border-2 border-amber-300 text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    Familiar
                  </button>
                )}
                {card.status !== 'mastered' && (
                  <button
                    onClick={() => handleStatusAndAdvance(card.word, 'mastered')}
                    className="px-4 py-2 rounded-lg border-2 border-emerald-300 text-emerald-600 text-sm font-medium hover:bg-emerald-50 transition-colors"
                  >
                    Mastered
                  </button>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={goBack}
                disabled={index === 0}
                className="px-4 py-2 text-sm text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                onClick={reshuffleDeck}
                className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                Reshuffle
              </button>
              <button
                onClick={advance}
                disabled={index + 1 >= total}
                className="px-4 py-2 text-sm text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
