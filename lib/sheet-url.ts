export function getSheetTabUrl(sheetTabId: string | null | undefined): string | null {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  if (!spreadsheetId || !sheetTabId) return null
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetTabId}`
}
