import { type HttpStatus } from "../http"

export type ClientErrorStatus =
  | HttpStatus.Unauthorized
  | HttpStatus.Forbidden
  | HttpStatus.BadRequest
  | HttpStatus.MethodNotAllowed
  | HttpStatus.NotFound
  | HttpStatus.TooManyRequests

export type ServiceErrorStatus =
  | HttpStatus.ServiceUnavailable
  | HttpStatus.InternalServerError
  | HttpStatus.GatewayTimeout

const ERROR_MSG: Record<ClientErrorStatus | ServiceErrorStatus, string> = {
  400: "Bad request.",
  401: "You are not signed in.",
  403: "You don't have permission to access this.",
  404: "Item not found.",
  405: "Method not allowed.",
  429: "Too many requests.",
  500: "Internal server error.",
  503: "Service unavailable.",
  504: "Service timeout.",
}

export interface ErrDetail {
  /** Toast title */
  msg?: string
  /** Toast description */
  desc?: string
  /** Error will be reported unless `false` */
  report?: boolean
  /** Number of times the request was retried */
  retries?: number
  /** Error message from each retry */
  errorMessages?: string[]
}

// Error classes ------------

/** The base class for all my custom exceptions. Protected constructor. */
export class CustomError extends Error {
  cause?: Error
  details?: ErrDetail

  protected constructor(message: string) {
    super(message)
    this.name = "CustomError"
  }

  /** Set `cause` on existing `CustomError`. */
  public setCause(cause: unknown): this {
    this.cause = cause as Error
    return this
  }
}

/** Base api error class to be ingested by `getErrorResponse()` and returned from an API */
export class ApiError extends CustomError {
  protected constructor(
    public status: ClientErrorStatus | ServiceErrorStatus,
    message: string,
    public details?: ErrDetail
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * IS reported by default.\
 * The user-facing `details.msg` defaults to `message` if not explicitly passed in
 */
export class ClientError extends ApiError {
  details: ErrDetail = {}

  public constructor(
    status?: ClientErrorStatus,
    message?: string,
    details?: ErrDetail
  ) {
    super(status ?? 400, message ?? ERROR_MSG[status ?? 400])
    this.name = "ClientError"
    this.details.msg = details?.msg ?? message ?? ERROR_MSG[status ?? 400]
    if (details?.desc) this.details.desc = details.desc
    if (details?.report != null) this.details.report = details.report
  }
}

export class ServiceError extends ApiError {
  public constructor(
    status?: ServiceErrorStatus,
    message?: string,
    public details?: ErrDetail
  ) {
    super(status ?? 500, message ?? ERROR_MSG[status ?? 500])
    this.name = "ServiceError"
  }
}

export class ConfigError extends CustomError {
  public constructor(message: string) {
    super(message)
    this.name = "ConfigError"
  }
}

/**
 * General purpose custom error for frontend\
 * IS reported by default.
 * @see `UserError`
 */
export class AppError extends CustomError {
  public constructor(message: string, public details?: ErrDetail) {
    super(message)
    this.name = "AppError"
  }
}

/**
 * NOT reported by default.\
 * The user-facing `details.msg` defaults to `message` if not explicitly passed in
 */
export class UserError extends CustomError {
  details: ErrDetail = { report: false }

  public constructor(
    /** Message to show to user (usually in toast title) */
    message: string,
    /** `msg` here takes precedence over `message` if set.  */
    details?: ErrDetail
  ) {
    super(message)
    this.name = "UserError"
    this.details.msg = details?.msg ?? message
    if (details?.desc) this.details.desc = details.desc
    if (details?.report != null) this.details.report = details.report
  }
}

// Error utilities ------------

/** https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5 */
export const getError = (value: unknown): Error => {
  if (value instanceof Error) return value

  let stringified = "[Unable to stringify the thrown value]"
  try {
    stringified = JSON.stringify(value)
  } catch {
    // ignore error
  }

  return new Error(`[Stringified Error]: ${stringified}`)
}

export const getApiError = (value: unknown): ApiError => {
  if (value instanceof ApiError) return value
  // Default to service error and set cause
  return new ServiceError().setCause(getError(value))
}

export const shouldReport = (error: unknown): boolean => {
  // eslint-disable-next-line sonarjs/prefer-single-boolean-return
  if (error instanceof ApiError && error.details?.report === false) {
    return false
  }

  return true
}
