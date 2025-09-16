import { AppError } from "../errors/exceptions"
import { getUrlPathForError } from "./url"

const retryDelays = [50, 500, 1000]

export type FetchJsonInit = RequestInit & {
  /** Default true */
  throwStatus?: boolean
  /**
   * Attempt to JSON parse the payload of an error response? Default - only if `throwStatus` is false. \
   * Note: Pass `| null` in the generic if you use `throwStatus: false` AND `parseErrorResponse: false`
   */
  parseErrorResponse?: boolean
  urlForReport?: string
  retryable?: boolean
  debugLogger?: (msg: string, tags?: Record<string, string>) => void
}

export type FetchJsonRes<T> = Response & {
  data: T
  /** Error from non-2xx http response */
  err?: Error
  /** Number of retries that happened for a response that was eventually successful */
  retries?: number
  /** Error messages from retries (sent back on response if retries eventually succeed) */
  errorMessages: string[]
}

function isNonJsonPayload(error: unknown): boolean {
  return (
    error instanceof Error && error.name === "SyntaxError"
    // (error.message.includes("Unexpected character: <") ||
    //   error.message.includes("not valid JSON"))
  )
}

const fetchWithRetries = async <T = unknown>(
  url: string,
  init: FetchJsonInit,
  retryCount = 0,
  errorMessages: string[] = []
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<FetchJsonRes<T>> => {
  let data
  let res
  const { urlForReport = "", parseErrorResponse } = init
  let retryable = init.retryable

  try {
    try {
      res = await fetch(url, { mode: "cors", ...init })
    } catch (cause) {
      if ((cause as Error).name === "AbortError") {
        // Request is aborted, stop trying
        retryable = false
        // Application controls the abort controller so it can decide what to do with the abort error
        throw cause
      }

      throw new AppError(`Failed to ${init.method} ${urlForReport}`, {
        cause,
        fullUrl: url,
      })
    }

    try {
      if (res.ok || parseErrorResponse) data = (await res.json()) as T
    } catch (cause) {
      if (isNonJsonPayload(cause)) retryable = false

      // Failure to parse json payload after successful response happens often for iOS
      // (at least on embedded Shopify site widgets), so this is retryable
      throw new AppError(`Failed to get json payload for ${urlForReport}`, {
        cause,
        fullUrl: url,
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

    if (error instanceof AppError) {
      // Add metadata about retries before throwing the final exception
      error.details = { ...error.details, retries: retryCount, errorMessages }
    }
    // Max retries exceeded
    throw error
  }

  // Response properties like status, ok are not enumerable so cannot be spread in
  const enhancedResponse: FetchJsonRes<T> = Object.assign(res, {
    data: (data ?? null) as T,
    retries: retryCount,
    errorMessages,
  })

  if (!res.ok) {
    enhancedResponse.err = new AppError(
      `HTTP Error [${res.status}] from ${urlForReport}`,
      { fullUrl: url }
    )
  }
  return enhancedResponse
}

/**
 * ONLY retries connection/network errors. If API responds with error status, that is never retried.\
 * Abort errors are a type of network error that is not retried.
 */
export const fetchJson = async <T = unknown>(
  url: string,
  init?: FetchJsonInit
): Promise<FetchJsonRes<T>> => {
  const urlForReport = getUrlPathForError(url)
  const throwStatus = init?.throwStatus ?? true
  const method = init?.method?.toUpperCase() || "GET"
  const retryable =
    init?.retryable === undefined ? method === "GET" : init.retryable
  const parseErrorResponse = init?.parseErrorResponse ?? !throwStatus

  const response = await fetchWithRetries<T>(url, {
    ...init,
    urlForReport,
    retryable,
    method,
    parseErrorResponse,
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
