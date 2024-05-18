import { ApiError, getApiError } from "./exceptions"
import type { Mailer } from "../mailer"

export interface ErrorResponse {
  message: string
}

export const getErrorResponse = (error: ApiError): ErrorResponse => {
  return {
    message: error.message,
  }
}

export interface GenericResponse {
  status: (status: number) => {
    json: (json: Record<string, unknown>) => void
  }
}

export interface GenericLogger {
  error: (error: ApiError) => void
}

/**
 * Handle an error - log it, [send email], [send api response]\
 * At a minimum, the error will be logged.\
 * If a mailer is provided an email will be sent with the stack trace.\
 * If a response object is provided, the response will be sent so you should return from the handler fn.
 * */
export const handleApiError = async (
  error: unknown,
  logger: GenericLogger,
  mailer?: Mailer,
  res?: GenericResponse
): Promise<void> => {
  const apiError = getApiError(error)
  logger.error(apiError)

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
          <pre>Status: ${apiError.status}</pre>
          <pre>${apiError.stack}</pre>
          <pre>${cause?.stack ?? "No nested error"}</pre>
          <pre>Time: ${now.toISOString()}</pre>`,
    })
  } catch (err) {
    console.log("Error sending email for error.")
  }

  // Only send response if response util is provided
  res?.status(apiError.status).json({ message: apiError.message })
}
