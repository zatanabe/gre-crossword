import { describe, it, expect } from 'vitest'
import generateGrid from './generateGrid.js'
import greData from '../../words/gre-sample.json'

const greWords = greData.map((d) => d.word)

function assertValidResult(result, inputWords) {
  const allWords = [...result.placements.map((p) => p.word), ...result.unplaced]
  const inputUpper = inputWords.map((w) => w.toUpperCase()).sort()
  expect(allWords.sort()).toEqual(inputUpper)

  for (const p of result.placements) {
    const dr = p.direction === 'across' ? 0 : 1
    const dc = p.direction === 'across' ? 1 : 0
    for (let i = 0; i < p.word.length; i++) {
      const cell = result.grid[p.row + dr * i]?.[p.col + dc * i]
      expect(cell).not.toBeNull()
      expect(cell.letter).toBe(p.word[i])
    }
  }
}

describe('generateGrid', () => {
  it('handles empty input', () => {
    const result = generateGrid([])
    expect(result.grid).toEqual([])
    expect(result.placements).toEqual([])
    expect(result.unplaced).toEqual([])
  })

  it('places a single word', () => {
    const result = generateGrid(['HELLO'])
    expect(result.placements).toHaveLength(1)
    expect(result.unplaced).toHaveLength(0)
    assertValidResult(result, ['HELLO'])
  })

  it('handles 3-word trivial case with shared letters', () => {
    const words = ['CAT', 'CAR', 'ACE']
    const result = generateGrid(words)
    expect(result.placements.length).toBeGreaterThanOrEqual(2)
    expect(result.placements.length + result.unplaced.length).toBe(3)
    assertValidResult(result, words)
  })

  it('handles 10-word realistic case', () => {
    const words = [
      'PYTHON', 'JAVA', 'RUST', 'SWIFT', 'RUBY',
      'PERL', 'SCALA', 'JULIA', 'HASKELL', 'TYPESCRIPT',
    ]
    const result = generateGrid(words)
    expect(result.placements.length).toBeGreaterThanOrEqual(5)
    assertValidResult(result, words)
  })

  it('handles the 25-word GRE sample in under 500ms', () => {
    const start = performance.now()
    const result = generateGrid(greWords)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(500)
    expect(result.placements.length).toBeGreaterThanOrEqual(15)
    assertValidResult(result, greWords)
  })

  it('returns unplaceable words in unplaced array', () => {
    const words = ['ABC', 'DEF', 'GHI']
    const result = generateGrid(words)
    expect(result.unplaced.length).toBeGreaterThan(0)
    assertValidResult(result, words)
  })

  it('uppercases input words', () => {
    const result = generateGrid(['hello', 'haste'])
    for (const p of result.placements) {
      expect(p.word).toBe(p.word.toUpperCase())
    }
  })

  it('grid cells are letter objects or null', () => {
    const result = generateGrid(['CAT', 'CAR'])
    for (const row of result.grid) {
      for (const cell of row) {
        if (cell !== null) {
          expect(cell).toHaveProperty('letter')
          expect(cell.letter).toMatch(/^[A-Z]$/)
        }
      }
    }
  })
})
