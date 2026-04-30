export default function WordList({ placements, unplaced, userLetters, checked }) {
  const allWords = [
    ...placements.map((p) => p.word),
    ...unplaced,
  ].sort()

  return (
    <div className="w-full">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Words ({allWords.length})
      </h2>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {allWords.map((word) => {
          const solved = checked && isWordSolved(word, placements, userLetters)
          const isUnplaced = unplaced.includes(word)

          return (
            <span
              key={word}
              className={[
                'text-sm font-mono',
                isUnplaced
                  ? 'text-slate-600'
                  : solved
                    ? 'text-emerald-400 line-through'
                    : 'text-slate-300',
              ].filter(Boolean).join(' ')}
            >
              {word}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function isWordSolved(word, placements, userLetters) {
  const p = placements.find((pl) => pl.word === word)
  if (!p) return false

  const dr = p.direction === 'across' ? 0 : 1
  const dc = p.direction === 'across' ? 1 : 0

  for (let i = 0; i < p.word.length; i++) {
    const r = p.row + dr * i
    const c = p.col + dc * i
    if (userLetters[r]?.[c] !== p.word[i]) return false
  }

  return true
}
