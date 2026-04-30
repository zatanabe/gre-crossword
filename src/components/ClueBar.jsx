export default function ClueBar({ activeClue, clueMap, onPrev, onNext }) {
  if (!activeClue) {
    return (
      <div className="bg-[#5c6ac4] text-white px-4 py-2.5 flex items-center justify-center text-sm">
        Tap a cell to begin
      </div>
    )
  }

  const clue = clueMap[activeClue.word] || `(${activeClue.word.length} letters)`
  const label = `${activeClue.number} ${activeClue.direction === 'across' ? 'A' : 'D'}`

  return (
    <div className="bg-[#5c6ac4] text-white px-2 py-2.5 flex items-center gap-2 text-sm">
      <button
        onClick={onPrev}
        className="shrink-0 w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded"
      >
        &lt;
      </button>
      <div className="flex-1 text-center min-w-0">
        <span className="font-bold">{label}</span>
        {' '}
        <span>{clue}</span>
      </div>
      <button
        onClick={onNext}
        className="shrink-0 w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded"
      >
        &gt;
      </button>
    </div>
  )
}
