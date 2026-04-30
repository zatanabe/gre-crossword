import { useState, useCallback, useMemo, useEffect } from 'react'
import generateGrid from './generator/generateGrid.js'
import useWordBank from './hooks/useWordBank.js'
import Grid from './components/Grid.jsx'
import ClueBar from './components/ClueBar.jsx'
import ClueList from './components/ClueList.jsx'
import Controls from './components/Controls.jsx'
import WordBank from './components/WordBank.jsx'

const wordModules = import.meta.glob('/words/*.json', { eager: true })

function loadSeedData(fileName) {
  const path = `/words/${fileName}.json`
  const mod = wordModules[path]
  return mod?.default || mod || []
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
  const [bankOpen, setBankOpen] = useState(false)
  const [puzzleKey, setPuzzleKey] = useState(0)

  const seedData = useMemo(() => loadSeedData(selectedFile), [selectedFile])

  const {
    activeWords,
    knownWords,
    clueMap,
    addWord,
    removeWord,
    toggleKnown,
    updateClue,
  } = useWordBank(selectedFile, seedData)

  const puzzle = useMemo(() => {
    void puzzleKey
    const words = activeWords.map((w) => w.word)
    return generateGrid(words)
  }, [activeWords, puzzleKey])

  const { numbered: numberedPlacements, numberMap } = useMemo(
    () => numberPlacements(puzzle.placements),
    [puzzle.placements]
  )

  const sortedClues = useMemo(() => {
    return [...numberedPlacements].sort(
      (a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1)
    )
  }, [numberedPlacements])

  const [userLetters, setUserLetters] = useState(() =>
    createEmptyLetters(puzzle.grid)
  )
  const [activeCell, setActiveCell] = useState(null)
  const [activeDirection, setActiveDirection] = useState('across')

  const activeClue = useMemo(() => {
    if (!activeCell) return null
    return numberedPlacements.find((p) => {
      if (p.direction !== activeDirection) return false
      const dr = p.direction === 'across' ? 0 : 1
      const dc = p.direction === 'across' ? 1 : 0
      for (let i = 0; i < p.word.length; i++) {
        if (p.row + dr * i === activeCell.row && p.col + dc * i === activeCell.col)
          return true
      }
      return false
    })
  }, [activeCell, activeDirection, numberedPlacements])

  const handleFileChange = useCallback((file) => {
    setSelectedFile(file)
    setChecked(false)
    setActiveCell(null)
    setActiveDirection('across')
  }, [])

  const resetPuzzleState = useCallback(() => {
    setUserLetters(createEmptyLetters(puzzle.grid))
    setChecked(false)
    setActiveCell(null)
  }, [puzzle.grid])

  const handleReset = useCallback(() => {
    resetPuzzleState()
  }, [resetPuzzleState])

  const handleCheck = useCallback(() => {
    setChecked(true)
  }, [])

  const handleReveal = useCallback(() => {
    if (!activeClue) return
    setUserLetters((prev) => {
      const next = prev.map((r) => [...r])
      const dr = activeClue.direction === 'across' ? 0 : 1
      const dc = activeClue.direction === 'across' ? 1 : 0
      for (let i = 0; i < activeClue.word.length; i++) {
        next[activeClue.row + dr * i][activeClue.col + dc * i] = activeClue.word[i]
      }
      return next
    })
  }, [activeClue])

  const handleRegenerate = useCallback(() => {
    setPuzzleKey((k) => k + 1)
    setBankOpen(false)
    setChecked(false)
    setActiveCell(null)
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

  const handleClueClick = useCallback((p) => {
    setActiveCell({ row: p.row, col: p.col })
    setActiveDirection(p.direction)
    setChecked(false)
  }, [])

  const navigateClue = useCallback(
    (delta) => {
      if (sortedClues.length === 0) return
      const idx = activeClue
        ? sortedClues.findIndex(
            (c) => c.number === activeClue.number && c.direction === activeClue.direction
          )
        : -1
      const next = sortedClues[(idx + delta + sortedClues.length) % sortedClues.length]
      setActiveCell({ row: next.row, col: next.col })
      setActiveDirection(next.direction)
    },
    [activeClue, sortedClues]
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
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-serif font-bold">The Crossword</h1>
          <Controls
            selectedFile={selectedFile}
            onFileChange={handleFileChange}
            onCheck={handleCheck}
            onReset={handleReset}
            onReveal={handleReveal}
            onOpenBank={() => setBankOpen(true)}
          />
        </div>
      </header>

      <div className="lg:hidden">
        <ClueBar
          activeClue={activeClue}
          clueMap={clueMap}
          onPrev={() => navigateClue(-1)}
          onNext={() => navigateClue(1)}
        />
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Grid — capped so clues always have room */}
          <div className="shrink-0 flex justify-center lg:justify-start overflow-auto">
            <Grid
              grid={puzzle.grid}
              placements={numberedPlacements}
              numberMap={numberMap}
              userLetters={userLetters}
              activeCell={activeCell}
              activeDirection={activeDirection}
              checked={checked}
              maxWidth={520}
              onCellClick={handleCellClick}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Clues — desktop: side panel */}
          <div className="hidden lg:block flex-1 min-w-[280px] max-h-[80vh] overflow-y-auto">
            <ClueList
              placements={numberedPlacements}
              clueMap={clueMap}
              userLetters={userLetters}
              checked={checked}
              activeClue={activeClue}
              onClueClick={handleClueClick}
            />
          </div>
        </div>

        {/* Clues — mobile: below grid */}
        <div className="lg:hidden mt-4">
          <ClueList
            placements={numberedPlacements}
            clueMap={clueMap}
            userLetters={userLetters}
            checked={checked}
            activeClue={activeClue}
            onClueClick={handleClueClick}
          />
        </div>
      </div>

      {bankOpen && (
        <WordBank
          activeWords={activeWords}
          knownWords={knownWords}
          onAdd={addWord}
          onRemove={removeWord}
          onToggleKnown={toggleKnown}
          onUpdateClue={updateClue}
          onRegenerate={handleRegenerate}
          onClose={() => setBankOpen(false)}
        />
      )}
    </div>
  )
}
