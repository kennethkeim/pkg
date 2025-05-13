import { getUrlPathForError } from "./url"

const retryDelays = [50, 500, 1000]

export type FetchJsonInit = RequestInit & {
  throwStatus?: boolean
  urlForReport?: string
  retryable?: boolean
  debugLogger?: (msg: string, tags?: Record<string, string>) => void
}

export type FetchJsonRes<T> = Response & {
  data: T
  err?: Error
  retries?: number
  errorMessages: string[]
}

const fetchWithRetries = async <T = unknown>(
  url: string,
  init: FetchJsonInit,
  retryCount = 0,
  errorMessages: string[] = []
): Promise<FetchJsonRes<T>> => {
  let data
  let res
  const { urlForReport = "" } = init
  let retryable = init.retryable

  try {
    try {
      res = await fetch(url, { mode: "cors", ...init })
    } catch (cause) {
      throw new Error(`Fatale fehler von ${urlForReport}`, { cause })
    }

    // Usually error http statuses will return json and will NOT throw in this try block
    if (res.status === 403) {
      // Don't run async method to get text unless it's 403
      const text = await res.text()
      // Some companies are blocking my geo request via Zscaler
      if (text.includes("Zscaler")) {
        retryable = false
        throw new Error(`Blocked by Zscaler 😈: ${urlForReport}`)
      }
    }

    try {
      data = (await res.json()) as T
    } catch (cause) {
      throw new Error(`Failed to get json payload for ${urlForReport}`, {
        cause,
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      errorMessages.push(error.message)
    }

    // if the retryCount has not been exceeded, call again
    const delay = retryDelays[retryCount]
    if (retryable && typeof delay === "number") {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchWithRetries(url, init, retryCount + 1, errorMessages)
    }

    // max retries exceeded
    throw error
  }

  const enhancedResponse: FetchJsonRes<T> = {
    ...res,
    data,
    retries: retryCount,
    errorMessages,
  }

  if (!res.ok) {
    enhancedResponse.err = new Error(
      `HTTP Error [${res.status}] from ${urlForReport}`
    )
  }
  return enhancedResponse
}

export const fetchJson = async <T = unknown>(
  url: string,
  init?: FetchJsonInit
): Promise<FetchJsonRes<T>> => {
  const urlForReport = getUrlPathForError(url)
  const throwStatus = init?.throwStatus ?? true
  const method = init?.method?.toUpperCase() || "GET"
  const retryable =
    init?.retryable === undefined ? method === "GET" : init.retryable

  const response = await fetchWithRetries<T>(url, {
    ...init,
    urlForReport,
    retryable,
    method,
  })

  if (response.err && throwStatus) throw response.err

  if (response.retries && response.retries > 0 && init?.debugLogger) {
    const tags: Record<string, string> = { xhrUrl: urlForReport }
    if (response.errorMessages.length) {
      tags.errorMessages = response.errorMessages.join(", ")
    }
    const msg = `${response.retries} retries for ${urlForReport}`
    // Application specific logger or Sentry method
    init.debugLogger(msg, tags)
  }

  return response
}
