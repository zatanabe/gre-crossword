const ACROSS = 'across'
const DOWN = 'down'
const NUM_ATTEMPTS = 20

export default function generateGrid(words) {
  const upper = words.map((w) => w.toUpperCase())

  if (upper.length === 0) {
    return { grid: [], placements: [], unplaced: [] }
  }

  let best = null

  for (let attempt = 0; attempt < NUM_ATTEMPTS; attempt++) {
    const ordered = attempt === 0
      ? [...upper].sort((a, b) => b.length - a.length)
      : shuffle([...upper])

    const result = buildPuzzle(ordered)

    if (!best || compareBetter(result, best)) {
      best = result
    }
  }

  const { grid, offsetR, offsetC } = buildGridArray(best.cells)

  const normalizedPlacements = best.placements.map((p) => ({
    ...p,
    row: p.row - offsetR,
    col: p.col - offsetC,
  }))

  return { grid, placements: normalizedPlacements, unplaced: best.unplaced }
}

function compareBetter(a, b) {
  if (a.placements.length !== b.placements.length) {
    return a.placements.length > b.placements.length
  }
  return gridArea(a.cells) < gridArea(b.cells)
}

function gridArea(cells) {
  if (cells.size === 0) return 0
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
  for (const key of cells.keys()) {
    const [r, c] = key.split(',').map(Number)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
    minC = Math.min(minC, c)
    maxC = Math.max(maxC, c)
  }
  return (maxR - minR + 1) * (maxC - minC + 1)
}

function getBounds(cells) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
  for (const key of cells.keys()) {
    const [r, c] = key.split(',').map(Number)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
    minC = Math.min(minC, c)
    maxC = Math.max(maxC, c)
  }
  return { minR, maxR, minC, maxC }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildPuzzle(words) {
  const placements = []
  const unplaced = []
  const cells = new Map()

  const first = words[0]
  place(first, 0, -Math.floor(first.length / 2), ACROSS, cells, placements)

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const candidates = findCandidates(word, placements, cells)

    scoreCandidates(candidates, word, cells)
    candidates.sort((a, b) => b.score - a.score)

    let placed = false
    for (const candidate of candidates) {
      if (isValid(word, candidate.row, candidate.col, candidate.dir, cells)) {
        place(word, candidate.row, candidate.col, candidate.dir, cells, placements)
        placed = true
        break
      }
    }

    if (!placed) {
      unplaced.push(word)
    }
  }

  return { placements, unplaced, cells }
}

function cellKey(r, c) {
  return `${r},${c}`
}

function place(word, row, col, dir, cells, placements) {
  for (let i = 0; i < word.length; i++) {
    const r = dir === ACROSS ? row : row + i
    const c = dir === ACROSS ? col + i : col
    const key = cellKey(r, c)
    const existing = cells.get(key)
    if (existing) {
      existing.count++
    } else {
      cells.set(key, { letter: word[i], count: 1 })
    }
  }
  placements.push({ word, row, col, direction: dir })
}

function findCandidates(word, placements, cells) {
  const candidates = []
  const seen = new Set()

  for (const p of placements) {
    for (let pi = 0; pi < p.word.length; pi++) {
      for (let wi = 0; wi < word.length; wi++) {
        if (p.word[pi] !== word[wi]) continue

        const dir = p.direction === ACROSS ? DOWN : ACROSS
        let row, col

        if (dir === ACROSS) {
          row = p.row + pi
          col = p.col - wi
        } else {
          row = p.row - wi
          col = p.col + pi
        }

        const key = `${row},${col},${dir}`
        if (seen.has(key)) continue
        seen.add(key)

        candidates.push({ row, col, dir, score: 0 })
      }
    }
  }

  return candidates
}

function scoreCandidates(candidates, word, cells) {
  const hasBounds = cells.size > 0
  let bounds
  if (hasBounds) bounds = getBounds(cells)

  for (const c of candidates) {
    const intersections = countIntersections(word, c.row, c.col, c.dir, cells)
    if (intersections === 0) {
      c.score = -Infinity
      continue
    }

    let expansionPenalty = 0
    if (hasBounds) {
      const dr = c.dir === ACROSS ? 0 : 1
      const dc = c.dir === ACROSS ? 1 : 0
      const endR = c.row + dr * (word.length - 1)
      const endC = c.col + dc * (word.length - 1)

      const newMinR = Math.min(bounds.minR, c.row, endR)
      const newMaxR = Math.max(bounds.maxR, c.row, endR)
      const newMinC = Math.min(bounds.minC, c.col, endC)
      const newMaxC = Math.max(bounds.maxC, c.col, endC)

      const oldArea = (bounds.maxR - bounds.minR + 1) * (bounds.maxC - bounds.minC + 1)
      const newArea = (newMaxR - newMinR + 1) * (newMaxC - newMinC + 1)
      expansionPenalty = (newArea - oldArea) / oldArea
    }

    c.score = intersections * 10 - expansionPenalty * 5
  }
}

function countIntersections(word, row, col, dir, cells) {
  let count = 0
  for (let i = 0; i < word.length; i++) {
    const r = dir === ACROSS ? row : row + i
    const c = dir === ACROSS ? col + i : col
    const existing = cells.get(cellKey(r, c))
    if (existing && existing.letter === word[i]) {
      count++
    }
  }
  return count
}

function isValid(word, row, col, dir, cells) {
  const dr = dir === ACROSS ? 0 : 1
  const dc = dir === ACROSS ? 1 : 0

  const beforeR = row - dr
  const beforeC = col - dc
  if (cells.has(cellKey(beforeR, beforeC))) return false

  const afterR = row + dr * word.length
  const afterC = col + dc * word.length
  if (cells.has(cellKey(afterR, afterC))) return false

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    const key = cellKey(r, c)
    const existing = cells.get(key)

    if (existing) {
      if (existing.letter !== word[i]) return false
      continue
    }

    const sideA = cellKey(r + dc, c + dr)
    const sideB = cellKey(r - dc, c - dr)
    if (cells.has(sideA) || cells.has(sideB)) return false
  }

  return true
}

function buildGridArray(cells) {
  if (cells.size === 0) return { grid: [], offsetR: 0, offsetC: 0 }

  let minR = Infinity, maxR = -Infinity
  let minC = Infinity, maxC = -Infinity

  for (const key of cells.keys()) {
    const [r, c] = key.split(',').map(Number)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
    minC = Math.min(minC, c)
    maxC = Math.max(maxC, c)
  }

  const rows = maxR - minR + 1
  const cols = maxC - minC + 1
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null))

  for (const [key, { letter }] of cells) {
    const [r, c] = key.split(',').map(Number)
    grid[r - minR][c - minC] = { letter }
  }

  return { grid, offsetR: minR, offsetC: minC }
}
