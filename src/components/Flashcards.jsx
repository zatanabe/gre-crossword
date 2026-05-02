import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import MathRenderer, { MathText } from './MathRenderer.jsx'

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
  mathBank,
  onClose,
}) {
  const [deckType, setDeckType] = useState('vocab')
  const [filter, setFilter] = useState('learning')
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const [deck, setDeck] = useState([])
  const [editingClue, setEditingClue] = useState(false)
  const [clueDraft, setClueDraft] = useState('')
  const [editingMathFront, setEditingMathFront] = useState(false)
  const [editingMathBack, setEditingMathBack] = useState(false)
  const [mathFrontDraft, setMathFrontDraft] = useState('')
  const [mathBackDraft, setMathBackDraft] = useState('')
  const clueInputRef = useRef(null)
  const mathFrontRef = useRef(null)
  const mathBackRef = useRef(null)

  const isMath = deckType === 'math'
  const isEditing = editingClue || editingMathFront || editingMathBack

  const sourceWords = useMemo(() => {
    if (isMath) {
      if (filter === 'learning') return mathBank.learningCards
      if (filter === 'familiar') return mathBank.familiarCards
      if (filter === 'mastered') return mathBank.masteredCards
      return [...mathBank.learningCards, ...mathBank.familiarCards]
    }
    if (filter === 'learning') return learningWords
    if (filter === 'familiar') return familiarWords
    if (filter === 'mastered') return masteredWords
    return [...learningWords, ...familiarWords]
  }, [isMath, filter, learningWords, familiarWords, masteredWords, mathBank])

  const sourceKey = useMemo(() => {
    return sourceWords.map((w) => isMath ? String(w.id) : w.word).sort().join('\0')
  }, [sourceWords, isMath])

  const sourceRef = useRef(sourceWords)
  sourceRef.current = sourceWords

  const resetDeck = useCallback(() => {
    setDeck(shuffle(sourceRef.current))
    setIndex(0)
    setFlipped(false)
    setEditingClue(false)
    setEditingMathFront(false)
    setEditingMathBack(false)
  }, [])

  useEffect(() => {
    resetDeck()
  }, [sourceKey])

  const card = deck[index] || null
  const total = deck.length

  const advance = useCallback(() => {
    setFlipped(false)
    setEditingClue(false)
    setEditingMathFront(false)
    setEditingMathBack(false)
    setIndex((i) => {
      if (i + 1 >= deck.length) return i
      return i + 1
    })
  }, [deck.length])

  const goBack = useCallback(() => {
    setFlipped(false)
    setEditingClue(false)
    setEditingMathFront(false)
    setEditingMathBack(false)
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const handleStatusAndAdvance = useCallback((identifier, status) => {
    if (isMath) {
      mathBank.setStatus(identifier, status)
    } else {
      onSetStatus(identifier, status)
    }
    advance()
  }, [isMath, mathBank, onSetStatus, advance])

  const saveMathEdit = useCallback(() => {
    if (!card) return
    const front = mathFrontDraft.trim() || card.front
    const back = mathBackDraft.trim() || card.back
    mathBank.updateCard(card.id, front, back)
    setDeck((d) => d.map((c) => c.id === card.id ? { ...c, front, back } : c))
    setEditingMathFront(false)
    setEditingMathBack(false)
  }, [card, mathFrontDraft, mathBackDraft, mathBank])

  useEffect(() => {
    function onKey(e) {
      if (isEditing) return
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
  }, [advance, goBack, onClose, isEditing])

  const statusFilters = [
    { key: 'learning', label: 'Learning' },
    { key: 'familiar', label: 'Familiar' },
    { key: 'mastered', label: 'Mastered' },
    { key: 'all', label: 'All' },
  ]

  const counts = isMath
    ? {
        learning: mathBank.learningCards.length,
        familiar: mathBank.familiarCards.length,
        mastered: mathBank.masteredCards.length,
        all: mathBank.learningCards.length + mathBank.familiarCards.length,
      }
    : {
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
          onClick={() => { setDeckType('vocab'); setFilter('learning') }}
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
          onClick={() => { setDeckType('math'); setFilter('learning') }}
          className={[
            'py-2 px-4 text-sm font-medium border-b-2 -mb-px transition-colors',
            deckType === 'math'
              ? 'border-[#5c6ac4] text-[#5c6ac4]'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          Math ({mathBank.allCards.length})
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
        {statusFilters.map((f) => {
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

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {total === 0 ? (
          <p className="text-gray-400 text-center">
            {isMath ? 'No math cards in this category' : 'No words in this category'}
          </p>
        ) : card ? (
          <>
            {/* Progress */}
            <div className="text-sm text-gray-400 mb-4">
              {index + 1} / {total}
            </div>

            {/* Card */}
            <div
              onClick={() => { if (!isEditing) setFlipped((f) => !f) }}
              className={[
                'w-full max-w-md rounded-xl border-2 shadow-lg',
                'flex flex-col items-center justify-center p-6 cursor-pointer',
                'transition-all select-none min-h-[200px]',
                STATUS_COLORS[card.status]?.border || 'border-gray-300',
                flipped
                  ? (STATUS_COLORS[card.status]?.bg || 'bg-gray-50')
                  : 'bg-white',
              ].join(' ')}
            >
              {isMath ? (
                !flipped ? (
                  <>
                    {editingMathFront ? (
                      <form
                        className="w-full px-2"
                        onSubmit={(e) => { e.preventDefault(); saveMathEdit() }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={mathFrontRef}
                          type="text"
                          value={mathFrontDraft}
                          onChange={(e) => setMathFrontDraft(e.target.value)}
                          onBlur={saveMathEdit}
                          className="w-full text-sm text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#5c6ac4]"
                          placeholder="Card front text..."
                        />
                        <p className="text-xs text-gray-400 mt-2 text-center">Use $...$ for inline math</p>
                      </form>
                    ) : (
                      <>
                        <MathText
                          text={card.front}
                          className="text-center text-gray-700 text-lg leading-relaxed"
                        />
                        <div className="flex items-center gap-3 mt-4">
                          <p className="text-xs text-gray-400">Tap to reveal</p>
                          <button
                            className="text-xs text-gray-400 hover:text-[#5c6ac4] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMathFrontDraft(card.front)
                              setEditingMathFront(true)
                              setTimeout(() => mathFrontRef.current?.focus(), 0)
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {editingMathBack ? (
                      <form
                        className="w-full px-2"
                        onSubmit={(e) => { e.preventDefault(); saveMathEdit() }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          ref={mathBackRef}
                          value={mathBackDraft}
                          onChange={(e) => setMathBackDraft(e.target.value)}
                          onBlur={saveMathEdit}
                          rows={3}
                          className="w-full text-sm text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#5c6ac4] font-mono"
                          placeholder="LaTeX formula..."
                        />
                        <p className="text-xs text-gray-400 mt-2 text-center">LaTeX syntax</p>
                      </form>
                    ) : (
                      <>
                        <MathRenderer tex={card.back} className="text-xl" />
                        <button
                          className="text-xs text-gray-400 hover:text-[#5c6ac4] mt-3 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMathBackDraft(card.back)
                            setEditingMathBack(true)
                            setTimeout(() => mathBackRef.current?.focus(), 0)
                          }}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </>
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

            {/* Status buttons */}
            {flipped && (
              <div className="flex gap-2 mt-6">
                {card.status !== 'learning' && (
                  <button
                    onClick={() => handleStatusAndAdvance(isMath ? card.id : card.word, 'learning')}
                    className="px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Still learning
                  </button>
                )}
                {card.status !== 'familiar' && (
                  <button
                    onClick={() => handleStatusAndAdvance(isMath ? card.id : card.word, 'familiar')}
                    className="px-4 py-2 rounded-lg border-2 border-amber-300 text-amber-600 text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    Familiar
                  </button>
                )}
                {card.status !== 'mastered' && (
                  <button
                    onClick={() => handleStatusAndAdvance(isMath ? card.id : card.word, 'mastered')}
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
                onClick={resetDeck}
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
