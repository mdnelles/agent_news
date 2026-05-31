import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockClear = vi.fn()
const mockUpdate = vi.fn()
const mockGet = vi.fn()
const mockBatchUpdate = vi.fn()

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn(),
    },
    sheets: vi.fn(() => ({
      spreadsheets: {
        get: mockGet,
        batchUpdate: mockBatchUpdate,
        values: {
          clear: mockClear,
          update: mockUpdate,
        },
      },
    })),
  },
}))

process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  client_email: 'test@example.com',
  private_key: 'key',
})
process.env.GOOGLE_SPREADSHEET_ID = 'sheet-id'

const { syncTopicSheet, ensureTopicSheet } = await import('./google-sheets')

describe('ensureTopicSheet', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockBatchUpdate.mockReset()
    mockUpdate.mockReset()
  })

  it('returns the existing sheet id when the tab already exists', async () => {
    mockGet.mockResolvedValue({
      data: {
        sheets: [{ properties: { title: 'AI News', sheetId: 42 } }],
      },
    })

    await expect(ensureTopicSheet('AI News')).resolves.toBe(42)
    expect(mockBatchUpdate).not.toHaveBeenCalled()
  })

  it('creates a new tab with headers when missing', async () => {
    mockGet.mockResolvedValue({ data: { sheets: [] } })
    mockBatchUpdate.mockResolvedValue({
      data: { replies: [{ addSheet: { properties: { sheetId: 7 } } }] },
    })
    mockUpdate.mockResolvedValue({})

    await expect(ensureTopicSheet('Climate')).resolves.toBe(7)
    expect(mockBatchUpdate).toHaveBeenCalledOnce()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "'Climate'!A1:E1",
        requestBody: {
          values: [['Title', 'URL', 'Source', 'Published', 'Fetched']],
        },
      })
    )
  })
})

describe('syncTopicSheet', () => {
  beforeEach(() => {
    mockClear.mockReset()
    mockUpdate.mockReset()
    mockClear.mockResolvedValue({})
    mockUpdate.mockResolvedValue({})
  })

  it('limits synced rows to 200 headlines', async () => {
    const headlines = Array.from({ length: 250 }, (_, i) => ({
      title: `Story ${i}`,
      url: `https://example.com/${i}`,
      source: 'Example',
      publishedAt: '2024-01-01',
      fetchedAt: '2024-01-01 12:00:00',
    }))

    await syncTopicSheet('AI News', headlines)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: {
          values: expect.arrayContaining([
            ['Story 0', 'https://example.com/0', 'Example', '2024-01-01', '2024-01-01 12:00:00'],
          ]),
        },
      })
    )

    const rows = mockUpdate.mock.calls[0][0].requestBody.values as unknown[][]
    expect(rows).toHaveLength(200)
  })

  it('clears data but skips update when there are no headlines', async () => {
    await syncTopicSheet('AI News', [])

    expect(mockClear).toHaveBeenCalledOnce()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
