import { afterEach, describe, expect, it } from 'vitest'
import { getSheetTabUrl } from './sheet-url'

describe('getSheetTabUrl', () => {
  afterEach(() => {
    delete process.env.GOOGLE_SPREADSHEET_ID
  })

  it('builds a Google Sheets tab URL', () => {
    process.env.GOOGLE_SPREADSHEET_ID = 'abc123'

    expect(getSheetTabUrl('456')).toBe(
      'https://docs.google.com/spreadsheets/d/abc123/edit#gid=456'
    )
  })

  it('returns null when spreadsheet id or tab id is missing', () => {
    process.env.GOOGLE_SPREADSHEET_ID = 'abc123'

    expect(getSheetTabUrl(null)).toBeNull()
    expect(getSheetTabUrl('')).toBeNull()

    delete process.env.GOOGLE_SPREADSHEET_ID
    expect(getSheetTabUrl('456')).toBeNull()
  })
})
