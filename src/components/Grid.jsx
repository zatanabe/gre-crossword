import { useRef, useEffect, useState, useCallback } from 'react'

export default function Grid({
  grid,
  placements,
  numberMap,
  userLetters,
  activeCell,
  activeDirection,
  checked,
  fillerCells,
  maxWidth,
  onCellClick,
  onKeyDown,
}) {
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(maxWidth)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeCell])

  const activeWordCells = getActiveWordCells(activeCell, activeDirection, placements)

  const cols = grid[0]?.length || 1
  const rows = grid.length || 1
  const effectiveMax = Math.min(containerWidth, maxWidth)
  const cellSize = Math.floor(Math.min(effectiveMax / cols, effectiveMax / rows, 36))

  const fontSize = Math.max(10, cellSize * 0.45)
  const numberSize = Math.max(6, cellSize * 0.24)

  return (
    <div ref={containerRef} className="relative w-full">
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

            const isFiller = fillerCells?.has(`${r},${c}`)
            const isActive =
              !isFiller && activeCell && activeCell.row === r && activeCell.col === c
            const isInWord = !isFiller && activeWordCells.has(`${r},${c}`)
            const userChar = userLetters[r]?.[c] || ''
            const isCorrect = !isFiller && checked && userChar === cell.letter
            const isWrong = !isFiller && checked && userChar && userChar !== cell.letter
            const clueNumber = numberMap[`${r},${c}`]

            let bg = isFiller ? 'bg-gray-100' : 'bg-white'
            if (isActive) bg = 'bg-[#ffda00]'
            else if (isInWord) bg = 'bg-[#a7d8ff]'

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => !isFiller && onCellClick(r, c)}
                className={[
                  'border-[0.5px] border-[#3a3a3a] relative',
                  'flex items-center justify-center',
                  isFiller ? 'select-none' : 'font-bold cursor-pointer select-none',
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
                <span
                  className={isFiller ? 'font-semibold text-gray-400' : 'font-semibold text-black'}
                  style={{ fontSize }}
                >
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
