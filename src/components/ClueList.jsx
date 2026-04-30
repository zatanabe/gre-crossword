export default function ClueList({
  placements,
  clueMap,
  userLetters,
  checked,
  activeClue,
  onClueClick,
}) {
  const across = placements
    .filter((p) => p.direction === 'across')
    .sort((a, b) => a.number - b.number)

  const down = placements
    .filter((p) => p.direction === 'down')
    .sort((a, b) => a.number - b.number)

  return (
    <div className="grid grid-cols-2 gap-6 text-sm">
      <ClueSection
        title="ACROSS"
        clues={across}
        clueMap={clueMap}
        userLetters={userLetters}
        checked={checked}
        activeClue={activeClue}
        onClueClick={onClueClick}
      />
      <ClueSection
        title="DOWN"
        clues={down}
        clueMap={clueMap}
        userLetters={userLetters}
        checked={checked}
        activeClue={activeClue}
        onClueClick={onClueClick}
      />
    </div>
  )
}

function ClueSection({ title, clues, clueMap, userLetters, checked, activeClue, onClueClick }) {
  return (
    <div>
      <h2 className="font-bold text-sm text-black mb-2 pb-1 border-b border-gray-300">
        {title}
      </h2>
      <ol className="space-y-0">
        {clues.map((p) => {
          const solved = checked && isWordSolved(p, userLetters)
          const clue = clueMap[p.word] || `(${p.word.length} letters)`
          const isActive =
            activeClue &&
            activeClue.number === p.number &&
            activeClue.direction === p.direction

          return (
            <li
              key={`${p.number}-${p.direction}`}
              onClick={() => onClueClick(p)}
              className={[
                'flex gap-2 py-1 px-1 cursor-pointer rounded-sm',
                isActive ? 'bg-[#a7d8ff]' : 'hover:bg-gray-100',
              ].join(' ')}
            >
              <span className="text-black font-bold w-5 text-right shrink-0">
                {p.number}
              </span>
              <span className={solved ? 'text-emerald-600 line-through' : 'text-gray-700'}>
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
