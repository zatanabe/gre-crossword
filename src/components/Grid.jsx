import { useRef, useEffect, useMemo } from 'react'

export default function Grid({
  grid,
  placements,
  numberMap,
  userLetters,
  activeCell,
  activeDirection,
  checked,
  maxWidth,
  onCellClick,
  onKeyDown,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeCell])

  const activeWordCells = getActiveWordCells(activeCell, activeDirection, placements)

  const cols = grid[0]?.length || 1
  const rows = grid.length || 1
  const cellSize = Math.floor(Math.min(maxWidth / cols, maxWidth / rows, 36))

  const fontSize = Math.max(10, cellSize * 0.45)
  const numberSize = Math.max(6, cellSize * 0.24)

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
        className="inline-grid border-[2px] border-black"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) {
              return (
                <div
                  key={`${r}-${c}`}
                  className="bg-black"
                  style={{ width: cellSize, height: cellSize }}
                />
              )
            }

            const isActive =
              activeCell && activeCell.row === r && activeCell.col === c
            const isInWord = activeWordCells.has(`${r},${c}`)
            const userChar = userLetters[r]?.[c] || ''
            const isCorrect = checked && userChar === cell.letter
            const isWrong = checked && userChar && userChar !== cell.letter
            const clueNumber = numberMap[`${r},${c}`]

            let bg = 'bg-white'
            if (isActive) bg = 'bg-[#ffda00]'
            else if (isInWord) bg = 'bg-[#a7d8ff]'

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                className={[
                  'border-[0.5px] border-[#3a3a3a] relative',
                  'flex items-center justify-center',
                  'font-bold cursor-pointer select-none',
                  bg,
                  isCorrect && 'ring-2 ring-inset ring-emerald-500',
                  isWrong && 'ring-2 ring-inset ring-red-500',
                ].filter(Boolean).join(' ')}
                style={{ width: cellSize, height: cellSize }}
              >
                {clueNumber && (
                  <span
                    className="absolute top-[1px] left-[2px] leading-none text-black font-medium"
                    style={{ fontSize: numberSize }}
                  >
                    {clueNumber}
                  </span>
                )}
                <span className="font-semibold text-black" style={{ fontSize }}>
                  {userChar}
                </span>
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
