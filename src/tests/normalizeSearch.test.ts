import { describe, expect, it } from 'vitest'
import { searchStructures } from '../utils/searchIndex'
import { normalizeSearch } from '../utils/normalizeSearch'

describe('normalizacja wyszukiwania', () => {
  it('usuwa polskie znaki, interpunkcję i różnice wielkości liter', () => {
    expect(normalizeSearch('  Ciało—Migdałowate! ')).toBe('cialo migdalowate')
  })

  it.each([
    'ciało migdałowate',
    'cialo migdalowate',
    'amygdala',
    'corpus amygdaloideum',
  ])('odnajduje ciało migdałowate dla zapytania „%s”', (query) => {
    expect(searchStructures(query)[0]?.structure.id).toBe('amygdala')
  })
})
