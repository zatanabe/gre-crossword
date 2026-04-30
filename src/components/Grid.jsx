import { useRef, useEffect } from 'react'

export default function Grid({
  grid,
  placements,
  userLetters,
  activeCell,
  activeDirection,
  checked,
  onCellClick,
  onKeyDown,
}) {
  const inputRef = useRef(null)
  const gridRef = useRef(null)

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeCell])

  const activeWordCells = getActiveWordCells(activeCell, activeDirection, placements)

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        onKeyDown={(e) => {
          e.preventDefault()
          onKeyDown(e.key)
        }}
        onInput={(e) => {
          const val = e.target.value
          if (val) {
            const char = val.slice(-1).toUpperCase()
            if (/^[A-Z]$/.test(char)) {
              onKeyDown(char)
            }
            e.target.value = ''
          }
        }}
      />
      <div
        ref={gridRef}
        className="inline-grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) {
              return (
                <div
                  key={`${r}-${c}`}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900"
                />
              )
            }

            const isActive =
              activeCell && activeCell.row === r && activeCell.col === c
            const isInWord = activeWordCells.has(`${r},${c}`)
            const userChar = userLetters[r]?.[c] || ''
            const isCorrect = checked && userChar === cell.letter
            const isWrong = checked && userChar && userChar !== cell.letter

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                className={[
                  'w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center',
                  'text-sm sm:text-base font-bold cursor-pointer select-none',
                  'transition-colors duration-100',
                  isActive
                    ? 'bg-sky-500 border-sky-400 text-white'
                    : isInWord
                      ? 'bg-sky-900/50 border-sky-700 text-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-100',
                  isCorrect && 'ring-2 ring-inset ring-emerald-400',
                  isWrong && 'ring-2 ring-inset ring-red-400',
                ].filter(Boolean).join(' ')}
              >
                {userChar}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function getActiveWordCells(activeCell, direction, placements) {
  const set = new Set()
  if (!activeCell) return set

  for (const p of placements) {
    const dr = p.direction === 'across' ? 0 : 1
    const dc = p.direction === 'across' ? 1 : 0

    for (let i = 0; i < p.word.length; i++) {
      const r = p.row + dr * i
      const c = p.col + dc * i
      if (r === activeCell.row && c === activeCell.col && p.direction === direction) {
        for (let j = 0; j < p.word.length; j++) {
          set.add(`${p.row + dr * j},${p.col + dc * j}`)
        }
        return set
      }
    }
  }

  return set
}
