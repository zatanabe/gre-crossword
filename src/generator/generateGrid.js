const ACROSS = 'across'
const DOWN = 'down'
const NUM_ATTEMPTS = 40
const MAX_GRID_SIZE = 18

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

  fillGaps(best)

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
  const densityA = a.cells.size / Math.max(boundsArea(a.bounds), 1)
  const densityB = b.cells.size / Math.max(boundsArea(b.bounds), 1)
  if (Math.abs(densityA - densityB) > 0.02) {
    return densityA > densityB
  }
  return a.cells.size > b.cells.size
}

function boundsArea(b) {
  if (!b) return 0
  return (b.maxR - b.minR + 1) * (b.maxC - b.minC + 1)
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function wouldFit(word, row, col, dir, bounds) {
  if (!bounds) return true
  const dr = dir === ACROSS ? 0 : 1
  const dc = dir === ACROSS ? 1 : 0
  const endR = row + dr * (word.length - 1)
  const endC = col + dc * (word.length - 1)
  const newRows = Math.max(bounds.maxR, row, endR) - Math.min(bounds.minR, row, endR) + 1
  const newCols = Math.max(bounds.maxC, col, endC) - Math.min(bounds.minC, col, endC) + 1
  return newRows <= MAX_GRID_SIZE && newCols <= MAX_GRID_SIZE
}

function expandBounds(bounds, row, col, dir, wordLen) {
  const dr = dir === ACROSS ? 0 : 1
  const dc = dir === ACROSS ? 1 : 0
  const endR = row + dr * (wordLen - 1)
  const endC = col + dc * (wordLen - 1)
  if (!bounds) {
    return {
      minR: Math.min(row, endR), maxR: Math.max(row, endR),
      minC: Math.min(col, endC), maxC: Math.max(col, endC),
    }
  }
  return {
    minR: Math.min(bounds.minR, row, endR),
    maxR: Math.max(bounds.maxR, row, endR),
    minC: Math.min(bounds.minC, col, endC),
    maxC: Math.max(bounds.maxC, col, endC),
  }
}

function buildPuzzle(words) {
  const placements = []
  const unplaced = []
  const cells = new Map()
  const placedSet = new Set()
  let bounds = null

  const first = words[0]
  place(first, 0, -Math.floor(first.length / 2), ACROSS, cells, placements)
  placedSet.add(first)
  bounds = expandBounds(bounds, 0, -Math.floor(first.length / 2), ACROSS, first.length)

  const remaining = words.slice(1)
  let deferred = []

  for (const word of remaining) {
    const result = tryPlace(word, placements, cells, placedSet, bounds)
    if (result) {
      bounds = result
    } else {
      deferred.push(word)
    }
  }

  for (let pass = 0; pass < 3 && deferred.length > 0; pass++) {
    const stillDeferred = []
    for (const word of deferred) {
      const result = tryPlace(word, placements, cells, placedSet, bounds)
      if (result) {
        bounds = result
      } else {
        stillDeferred.push(word)
      }
    }
    deferred = stillDeferred
  }

  unplaced.push(...deferred)

  return { placements, unplaced, cells, placedSet, bounds }
}

function tryPlace(word, placements, cells, placedSet, bounds) {
  const candidates = findCandidates(word, placements, cells)
  scoreCandidates(candidates, word, cells, bounds)
  candidates.sort((a, b) => b.score - a.score)

  for (const candidate of candidates) {
    if (!wouldFit(word, candidate.row, candidate.col, candidate.dir, bounds)) continue
    if (isValid(word, candidate.row, candidate.col, candidate.dir, cells)) {
      place(word, candidate.row, candidate.col, candidate.dir, cells, placements)
      placedSet.add(word)
      return expandBounds(bounds, candidate.row, candidate.col, candidate.dir, word.length)
    }
  }
  return null
}

function fillGaps(puzzle) {
  const { placements, cells, placedSet, bounds } = puzzle
  if (!bounds) return

  for (let pass = 0; pass < 2; pass++) {
    for (let r = bounds.minR; r <= bounds.maxR; r++) {
      tryFillRun(r, bounds.minC, bounds.maxC, ACROSS, cells, placements, placedSet, bounds)
    }
    for (let c = bounds.minC; c <= bounds.maxC; c++) {
      tryFillRun(c, bounds.minR, bounds.maxR, DOWN, cells, placements, placedSet, bounds)
    }
  }
}

function tryFillRun(fixed, rangeStart, rangeEnd, dir, cells, placements, placedSet, bounds) {
  let pos = rangeStart
  while (pos <= rangeEnd) {
    const r = dir === ACROSS ? fixed : pos
    const c = dir === ACROSS ? pos : fixed
    const key = cellKey(r, c)

    if (cells.has(key)) { pos++; continue }

    const dr = dir === ACROSS ? 0 : 1
    const dc = dir === ACROSS ? 1 : 0

    if (cells.has(cellKey(r - dr, c - dc))) { pos++; continue }

    let len = 0
    const letters = []
    let scanR = r, scanC = c
    while (scanR >= bounds.minR && scanR <= bounds.maxR &&
           scanC >= bounds.minC && scanC <= bounds.maxC) {
      const sk = cellKey(scanR, scanC)
      const sideA = cellKey(scanR + dc, scanC + dr)
      const sideB = cellKey(scanR - dc, scanC - dr)

      if (cells.has(sk)) {
        letters.push(cells.get(sk).letter)
      } else if (cells.has(sideA) || cells.has(sideB)) {
        break
      } else {
        letters.push(null)
      }
      len++
      scanR += dr
      scanC += dc
    }

    if (cells.has(cellKey(r + dr * len, c + dc * len))) { pos += Math.max(len, 1); continue }

    if (len >= 3) {
      const candidate = findGapWord(letters, len, placedSet)
      if (candidate && isValid(candidate, r, c, dir, cells) &&
          wouldFit(candidate, r, c, dir, bounds)) {
        placeFiller(candidate, r, c, dir, cells, placements)
        placedSet.add(candidate)
      }
    }

    pos += Math.max(len, 1)
  }
}

const GAP_FILLERS = [
  'ACE', 'ACT', 'ADD', 'AGE', 'AID', 'AIM', 'AIR', 'ALE', 'ALL', 'AND',
  'ANT', 'APE', 'ARC', 'ARE', 'ARK', 'ARM', 'ART', 'ATE', 'AWE', 'AXE',
  'BAD', 'BAG', 'BAN', 'BAR', 'BAT', 'BED', 'BET', 'BIG', 'BIN', 'BIT',
  'BOW', 'BOX', 'BUD', 'BUG', 'BUS', 'BUT', 'BUY', 'CAB', 'CAN', 'CAP',
  'CAR', 'CAT', 'COB', 'COD', 'COG', 'COT', 'COW', 'CRY', 'CUB', 'CUP',
  'CUR', 'CUT', 'DAB', 'DAM', 'DAY', 'DEN', 'DEW', 'DID', 'DIG', 'DIM',
  'DIP', 'DOC', 'DOG', 'DOT', 'DRY', 'DUB', 'DUE', 'DUG', 'DUN', 'DUO',
  'EAR', 'EAT', 'EEL', 'EGG', 'ELF', 'ELK', 'ELM', 'EMU', 'END', 'ERA',
  'EVE', 'EWE', 'EYE', 'FAN', 'FAR', 'FAT', 'FAX', 'FED', 'FEW', 'FIG',
  'FIN', 'FIR', 'FIT', 'FIX', 'FLU', 'FLY', 'FOB', 'FOE', 'FOG', 'FOP',
  'FOR', 'FOX', 'FRY', 'FUN', 'FUR', 'GAB', 'GAG', 'GAP', 'GAS', 'GEL',
  'GEM', 'GET', 'GNU', 'GOB', 'GOD', 'GOT', 'GUM', 'GUN', 'GUT', 'GUY',
  'GYM', 'HAD', 'HAM', 'HAS', 'HAT', 'HAY', 'HEN', 'HER', 'HEW', 'HID',
  'HIM', 'HIP', 'HIS', 'HIT', 'HOB', 'HOG', 'HOP', 'HOT', 'HOW', 'HUB',
  'HUE', 'HUG', 'HUM', 'HUT', 'ICE', 'ICY', 'ILL', 'IMP', 'INK', 'INN',
  'ION', 'IRE', 'IRK', 'ITS', 'IVY', 'JAB', 'JAG', 'JAM', 'JAR', 'JAW',
  'JAY', 'JET', 'JIG', 'JOB', 'JOG', 'JOT', 'JOY', 'JUG', 'JUT', 'KEG',
  'KEN', 'KEY', 'KID', 'KIN', 'KIT', 'LAB', 'LAD', 'LAG', 'LAP', 'LAW',
  'LAY', 'LEA', 'LED', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LIT', 'LOG',
  'LOT', 'LOW', 'LUG', 'MAD', 'MAN', 'MAP', 'MAR', 'MAT', 'MAW', 'MAY',
  'MEN', 'MET', 'MIX', 'MOB', 'MOP', 'MOW', 'MUD', 'MUG', 'NAB', 'NAG',
  'NAP', 'NET', 'NEW', 'NIL', 'NIT', 'NOB', 'NOD', 'NOR', 'NOT', 'NOW',
  'NUB', 'NUN', 'NUT', 'OAK', 'OAR', 'OAT', 'ODD', 'ODE', 'OFT', 'OIL',
  'OLD', 'ONE', 'OPT', 'ORB', 'ORE', 'OUR', 'OUT', 'OWE', 'OWL', 'OWN',
  'PAD', 'PAL', 'PAN', 'PAT', 'PAW', 'PEA', 'PEG', 'PEN', 'PEP', 'PET',
  'PIE', 'PIG', 'PIN', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'POW', 'PRY',
  'PUB', 'PUN', 'PUP', 'PUT', 'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW',
  'RAY', 'RED', 'REF', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD',
  'ROT', 'ROW', 'RUB', 'RUG', 'RUM', 'RUN', 'RUT', 'RYE', 'SAC', 'SAD',
  'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SET', 'SEW', 'SHE', 'SHY',
  'SIN', 'SIP', 'SIR', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SOD',
  'SON', 'SOP', 'SOT', 'SOW', 'SOY', 'SPA', 'SPY', 'STY', 'SUB', 'SUM',
  'SUN', 'SUP', 'TAB', 'TAD', 'TAG', 'TAN', 'TAP', 'TAR', 'TAT', 'TAX',
  'TEA', 'TEN', 'THE', 'TIE', 'TIN', 'TIP', 'TOE', 'TON', 'TOO', 'TOP',
  'TOT', 'TOW', 'TOY', 'TUB', 'TUG', 'TUN', 'TWO', 'URN', 'USE', 'VAN',
  'VAT', 'VET', 'VIA', 'VIE', 'VOW', 'WAD', 'WAG', 'WAR', 'WAS', 'WAX',
  'WAY', 'WEB', 'WED', 'WET', 'WHO', 'WIG', 'WIN', 'WIT', 'WOE', 'WOK',
  'WON', 'WOO', 'WOW', 'YAK', 'YAM', 'YAP', 'YAW', 'YEA', 'YES', 'YET',
  'YEW', 'YIN', 'YOU', 'ZAP', 'ZEN', 'ZIP', 'ZIT', 'ZOO',
]

function findGapWord(letters, maxLen, placedSet) {
  const len = 3
  if (maxLen < len) return null

  const hasTrailingLetters = letters.slice(len).some((l) => l !== null)
  if (hasTrailingLetters) return null

  const matches = []
  for (const w of GAP_FILLERS) {
    if (placedSet.has(w)) continue
    let ok = true
    for (let i = 0; i < len; i++) {
      if (letters[i] !== null && letters[i] !== w[i]) { ok = false; break }
    }
    if (ok) matches.push(w)
  }
  if (matches.length === 0) return null
  return matches[Math.floor(Math.random() * matches.length)]
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
  placements.push({ word, row, col, direction: dir, filler: false })
}

function placeFiller(word, row, col, dir, cells, placements) {
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
  placements.push({ word, row, col, direction: dir, filler: true })
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

function scoreCandidates(candidates, word, cells, bounds) {
  for (const c of candidates) {
    const intersections = countIntersections(word, c.row, c.col, c.dir, cells)
    if (intersections === 0) {
      c.score = -Infinity
      continue
    }

    const newCells = word.length - intersections

    if (bounds) {
      const dr = c.dir === ACROSS ? 0 : 1
      const dc = c.dir === ACROSS ? 1 : 0
      const endR = c.row + dr * (word.length - 1)
      const endC = c.col + dc * (word.length - 1)

      const newMinR = Math.min(bounds.minR, c.row, endR)
      const newMaxR = Math.max(bounds.maxR, c.row, endR)
      const newMinC = Math.min(bounds.minC, c.col, endC)
      const newMaxC = Math.max(bounds.maxC, c.col, endC)

      const oldArea = boundsArea(bounds)
      const newArea = (newMaxR - newMinR + 1) * (newMaxC - newMinC + 1)
      const areaExpansion = newArea - oldArea

      const aspectPenalty = Math.abs(
        (newMaxR - newMinR) - (newMaxC - newMinC)
      ) * 0.5

      c.score = intersections * 30 - newCells * 2 - areaExpansion * 3 - aspectPenalty
    } else {
      c.score = intersections * 30 - newCells * 2
    }
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
