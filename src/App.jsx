import { useState, useCallback, useMemo, useEffect } from 'react'
import generateGrid from './generator/generateGrid.js'
import Grid from './components/Grid.jsx'
import ClueList from './components/ClueList.jsx'
import Controls from './components/Controls.jsx'

const wordModules = import.meta.glob('/words/*.json', { eager: true })

function loadWordData(fileName) {
  const path = `/words/${fileName}.json`
  const mod = wordModules[path]
  const data = mod?.default || mod || []
  if (data.length === 0) return { words: [], clueMap: {} }

  if (typeof data[0] === 'string') {
    return { words: data, clueMap: {} }
  }

  const words = data.map((d) => d.word)
  const clueMap = {}
  for (const d of data) {
    clueMap[d.word.toUpperCase()] = d.clue
  }
  return { words, clueMap }
}

function createEmptyLetters(grid) {
  return grid.map((row) => row.map(() => ''))
}

function numberPlacements(placements) {
  const starts = new Map()
  for (const p of placements) {
    const key = `${p.row},${p.col}`
    if (!starts.has(key)) {
      starts.set(key, { row: p.row, col: p.col })
    }
  }

  const sorted = [...starts.values()].sort(
    (a, b) => a.row - b.row || a.col - b.col
  )

  const numberMap = {}
  sorted.forEach((s, i) => {
    numberMap[`${s.row},${s.col}`] = i + 1
  })

  const numbered = placements.map((p) => ({
    ...p,
    number: numberMap[`${p.row},${p.col}`],
  }))

  return { numbered, numberMap }
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState('gre-sample')
  const [checked, setChecked] = useState(false)

  const { puzzle, clueMap } = useMemo(() => {
    const { words, clueMap } = loadWordData(selectedFile)
    const puzzle = generateGrid(words)
    return { puzzle, clueMap }
  }, [selectedFile])

  const { numbered: numberedPlacements, numberMap } = useMemo(
    () => numberPlacements(puzzle.placements),
    [puzzle.placements]
  )

  const [userLetters, setUserLetters] = useState(() =>
    createEmptyLetters(puzzle.grid)
  )
  const [activeCell, setActiveCell] = useState(null)
  const [activeDirection, setActiveDirection] = useState('across')

  const handleFileChange = useCallback((file) => {
    setSelectedFile(file)
    setChecked(false)
    setActiveCell(null)
    setActiveDirection('across')
  }, [])

  const handleReset = useCallback(() => {
    setUserLetters(createEmptyLetters(puzzle.grid))
    setChecked(false)
    setActiveCell(null)
  }, [puzzle.grid])

  const handleCheck = useCallback(() => {
    setChecked(true)
  }, [])

  const isGridCell = useCallback(
    (r, c) => puzzle.grid[r]?.[c] != null,
    [puzzle.grid]
  )

  const getWordAt = useCallback(
    (row, col, direction) => {
      return numberedPlacements.find((p) => {
        if (p.direction !== direction) return false
        const dr = direction === 'across' ? 0 : 1
        const dc = direction === 'across' ? 1 : 0
        for (let i = 0; i < p.word.length; i++) {
          if (p.row + dr * i === row && p.col + dc * i === col) return true
        }
        return false
      })
    },
    [numberedPlacements]
  )

  const handleCellClick = useCallback(
    (row, col) => {
      if (!isGridCell(row, col)) return

      if (activeCell && activeCell.row === row && activeCell.col === col) {
        const newDir = activeDirection === 'across' ? 'down' : 'across'
        if (getWordAt(row, col, newDir)) {
          setActiveDirection(newDir)
        }
      } else {
        const hasAcross = getWordAt(row, col, 'across')
        const hasDown = getWordAt(row, col, 'down')
        if (hasAcross && !hasDown) setActiveDirection('across')
        else if (hasDown && !hasAcross) setActiveDirection('down')
        setActiveCell({ row, col })
      }
      setChecked(false)
    },
    [activeCell, activeDirection, isGridCell, getWordAt]
  )

  const advanceCell = useCallback(
    (row, col, dir, reverse = false) => {
      const dr = dir === 'across' ? 0 : 1
      const dc = dir === 'across' ? 1 : 0
      const step = reverse ? -1 : 1
      const nr = row + dr * step
      const nc = col + dc * step
      if (isGridCell(nr, nc)) {
        setActiveCell({ row: nr, col: nc })
      }
    },
    [isGridCell]
  )

  const handleKeyDown = useCallback(
    (key) => {
      if (!activeCell) return

      const { row, col } = activeCell

      if (/^[A-Za-z]$/.test(key)) {
        const letter = key.toUpperCase()
        setUserLetters((prev) => {
          const next = prev.map((r) => [...r])
          next[row][col] = letter
          return next
        })
        setChecked(false)
        advanceCell(row, col, activeDirection)
        return
      }

      if (key === 'Backspace') {
        if (userLetters[row][col]) {
          setUserLetters((prev) => {
            const next = prev.map((r) => [...r])
            next[row][col] = ''
            return next
          })
        } else {
          const dr = activeDirection === 'across' ? 0 : 1
          const dc = activeDirection === 'across' ? 1 : 0
          const pr = row - dr
          const pc = col - dc
          if (isGridCell(pr, pc)) {
            setActiveCell({ row: pr, col: pc })
            setUserLetters((prev) => {
              const next = prev.map((r) => [...r])
              next[pr][pc] = ''
              return next
            })
          }
        }
        setChecked(false)
        return
      }

      if (key === 'ArrowRight') {
        advanceCell(row, col, 'across')
        setActiveDirection('across')
      } else if (key === 'ArrowLeft') {
        advanceCell(row, col, 'across', true)
        setActiveDirection('across')
      } else if (key === 'ArrowDown') {
        advanceCell(row, col, 'down')
        setActiveDirection('down')
      } else if (key === 'ArrowUp') {
        advanceCell(row, col, 'down', true)
        setActiveDirection('down')
      } else if (key === 'Tab') {
        const newDir = activeDirection === 'across' ? 'down' : 'across'
        if (getWordAt(row, col, newDir)) {
          setActiveDirection(newDir)
        }
      }
    },
    [activeCell, activeDirection, advanceCell, getWordAt, isGridCell, userLetters]
  )

  useEffect(() => {
    setUserLetters(createEmptyLetters(puzzle.grid))
  }, [puzzle])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center px-2 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">GRE Crossword</h1>

      <Controls
        selectedFile={selectedFile}
        onFileChange={handleFileChange}
        onCheck={handleCheck}
        onReset={handleReset}
      />

      <div className="mt-4 overflow-auto max-w-full">
        <Grid
          grid={puzzle.grid}
          placements={numberedPlacements}
          numberMap={numberMap}
          userLetters={userLetters}
          activeCell={activeCell}
          activeDirection={activeDirection}
          checked={checked}
          onCellClick={handleCellClick}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="mt-4 max-w-2xl w-full px-2">
        <ClueList
          placements={numberedPlacements}
          clueMap={clueMap}
          userLetters={userLetters}
          checked={checked}
        />
      </div>
    </div>
  )
}
