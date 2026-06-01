export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const text = await res.text()

  if (!res.ok) {
    let message = res.statusText || 'Request failed'
    if (text) {
      try {
        const body = JSON.parse(text) as { error?: string }
        if (body.error) message = body.error
      } catch {
        // non-JSON error body
      }
    }
    throw new ApiError(message, res.status)
  }

  if (!text) {
    throw new ApiError('Empty response from server', res.status)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError('Invalid JSON response from server', res.status)
  }
}
