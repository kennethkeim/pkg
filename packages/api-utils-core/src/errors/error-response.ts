import { ApiError, getApiError } from "@kennethkeim/core"
import type { Mailer } from "../mailer"
import type { EventDetail } from "../types/event"
import { logger as defaultLogger } from "../logger"

export interface ErrorResponse {
  message: string
}

export const getErrorResponse = (error: ApiError): ErrorResponse => {
  return {
    message: error.message,
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
