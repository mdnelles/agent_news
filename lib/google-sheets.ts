import { google } from 'googleapis'

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentials) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set')
  const parsed = JSON.parse(credentials)
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || ''

/**
 * Ensure a sheet tab exists for a topic. Returns the sheet's gid.
 */
export async function ensureTopicSheet(topicName: string): Promise<number> {
  const sheets = await getSheets()

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  })

  const existing = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === topicName
  )

  if (existing) {
    return existing.properties?.sheetId ?? 0
  }

  // Create new sheet tab
  const response = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: { title: topicName },
          },
        },
      ],
    },
  })

  const newSheetId =
    response.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0

  // Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${topicName}'!A1:E1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['Title', 'URL', 'Source', 'Published', 'Fetched']],
    },
  })

  return newSheetId
}

export interface HeadlineRow {
  title: string
  url: string
  source: string
  publishedAt: string
  fetchedAt: string
}

/**
 * Replace the content of a topic's sheet with the provided headlines (max 200).
 */
export async function syncTopicSheet(
  topicName: string,
  headlines: HeadlineRow[]
) {
  const sheets = await getSheets()
  const limited = headlines.slice(0, 200)

  const rows = limited.map((h) => [
    h.title,
    h.url,
    h.source,
    h.publishedAt,
    h.fetchedAt,
  ])

  // Clear existing data (keep header)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${topicName}'!A2:E1000`,
  })

  if (rows.length === 0) return

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${topicName}'!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })
}
