export default function ClueList({ placements, clueMap, userLetters, checked }) {
  const across = placements
    .filter((p) => p.direction === 'across')
    .sort((a, b) => a.number - b.number)

  const down = placements
    .filter((p) => p.direction === 'down')
    .sort((a, b) => a.number - b.number)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <ClueSection
        title="Across"
        clues={across}
        clueMap={clueMap}
        userLetters={userLetters}
        checked={checked}
      />
      <ClueSection
        title="Down"
        clues={down}
        clueMap={clueMap}
        userLetters={userLetters}
        checked={checked}
      />
    </div>
  )
}

function ClueSection({ title, clues, clueMap, userLetters, checked }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </h2>
      <ol className="space-y-1">
        {clues.map((p) => {
          const solved = checked && isWordSolved(p, userLetters)
          const clue = clueMap[p.word] || `(${p.word.length} letters)`

          return (
            <li key={`${p.number}-${p.direction}`} className="flex gap-2 text-sm">
              <span className="text-slate-500 font-mono w-6 text-right shrink-0">
                {p.number}
              </span>
              <span className={solved ? 'text-emerald-400 line-through' : 'text-slate-300'}>
                {clue}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function isWordSolved(p, userLetters) {
  const dr = p.direction === 'across' ? 0 : 1
  const dc = p.direction === 'across' ? 1 : 0

  for (let i = 0; i < p.word.length; i++) {
    const r = p.row + dr * i
    const c = p.col + dc * i
    if (userLetters[r]?.[c] !== p.word[i]) return false
  }

  return true
}
