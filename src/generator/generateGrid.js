const ACROSS = 'across'
const DOWN = 'down'

export default function generateGrid(words) {
  const sorted = [...words]
    .map((w) => w.toUpperCase())
    .sort((a, b) => b.length - a.length)

  if (sorted.length === 0) {
    return { grid: [], placements: [], unplaced: [] }
  }

  const placements = []
  const unplaced = []
  const cells = new Map()

  const first = sorted[0]
  place(first, 0, -Math.floor(first.length / 2), ACROSS, cells, placements)

  for (let i = 1; i < sorted.length; i++) {
    const word = sorted[i]
    const candidates = findCandidates(word, placements, cells)

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

  const { grid, offsetR, offsetC } = buildGrid(cells)

  const normalizedPlacements = placements.map((p) => ({
    ...p,
    row: p.row - offsetR,
    col: p.col - offsetC,
  }))

  return { grid, placements: normalizedPlacements, unplaced }
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

        const score = countIntersections(word, row, col, dir, cells)
        if (score > 0) {
          candidates.push({ row, col, dir, score })
        }
      }
    }
  }

  return candidates
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

function buildGrid(cells) {
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
