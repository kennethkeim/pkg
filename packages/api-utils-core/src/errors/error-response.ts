import {
  ApiError,
  ClientError,
  getApiError,
  type ClientErrorStatus,
  type ServiceErrorStatus,
} from "@kennethkeim/core"
import type { Mailer } from "../mailer"
import type { EventDetail } from "../types/event"
import { logger as defaultLogger } from "../logger"

/** API Response for success OR failure responses (ui can determine behaviour based on http status) */
export interface ApiResponse {
  /** Should be informative for the user (e.g. toast title) */
  message?: string
  /** Can be used to provide remediation instructions to the user or further details (e.g. toast message body) */
  description?: string
}

export interface ApiErrorResponse extends ApiResponse {
  /** Should be informative for the user (e.g. toast title) */
  message: string
}

export interface GetErrorFnResult {
  response: ApiErrorResponse
  status: ServiceErrorStatus | ClientErrorStatus
}

/**
 * Build an API error response from error.\
 * Can be returned as-is or ingested by alternate transport layer like trpc.
 */
export const getErrorResponse = (
  error: unknown,
  defaultMessage?: string
): GetErrorFnResult => {
  let status = 500
  let message = defaultMessage || "Sorry, something went wrong."
  let description: string | undefined

  if (error instanceof ApiError) {
    status = error.status

    if (error instanceof ClientError) {
      // Return user-friendly error - use details attrs or error.message
      message = error.details?.msg || error.message
      description = error.details?.desc
    } else {
      // Show details attrs even from 5xx errors since those attributes are explicitly meant for the user
      message = error.details?.msg || message
      description = error.details?.desc
    }
  }

  return {
    status,
    response: { message, description },
  }
}

export interface Next13Response {
  status: (status: number) => {
    json: (json: Record<string, unknown>) => void
  }
}

interface Next14Response {
  json: (json: object, init?: { status: number }) => unknown
}

export interface GenericLogger {
  error: (error: ApiError) => void
}

export const emailError = async (
  error: unknown,
  mailer?: Mailer,
  event?: EventDetail
) => {
  const apiError = getApiError(error)

  try {
    const now = new Date()
    // ISO: 2024-05-15T12:47:23.039Z
    // Add date and hour to subject line so gmail groups emails per hour
    const subjectDateStr = now.toISOString().slice(0, 13)
    const cause = apiError.cause

    // Can't fire and forget from serverless fn
    await mailer?.send({
      subject: `API Error [${apiError.status}] [${subjectDateStr}]`,
      html: `
          <pre>Event: ${JSON.stringify(event, null, 2)}</pre>
          <pre>Status: ${apiError.status}</pre>
          <pre>${apiError.stack}</pre>
          <pre>${cause?.stack ?? "No nested error"}</pre>
          <pre>Time: ${now.toISOString()}</pre>`,
    })
  } catch (err) {
    console.log("Error sending email for error.")
  }
}

/**
 * Handle an error - log it, [send email], [send api response]\
 * The error will be logged. (using default logger if none provided)\
 * If a mailer is provided an email will be sent with the stack trace.\
 * If a response object is provided, the response will be sent so you should return from the handler fn.
 *
 * @param logger Pass custom logger *instance* if you use a context feature. i.e. `logger.addContextKey("key", "value")`
 * */
export const handleApiError = async <T>(
  error: unknown,
  event?: EventDetail,
  mailer?: Mailer,
  res?: Next13Response | Next14Response,
  logger?: GenericLogger
): Promise<T> => {
  const apiError = getApiError(error)

  const logError = logger?.error ?? defaultLogger.error
  logError(apiError)

  await emailError(apiError, mailer, event)

  // Only send response if response util is provided
  const body = { message: apiError.message }
  if (res && "status" in res) {
    // Nextjs 13
    res?.status(apiError.status).json(body)
    return null as T
  } else if (res) {
    // Nextjs 14
    return res.json(body, { status: apiError.status }) as T
  } else {
    return null as T
  }
}
