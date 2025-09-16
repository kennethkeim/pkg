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
  /** Error cause - coerced into a proper error by my `getError()` util. */
  cause?: Error
  details?: ErrDetail

  protected constructor(message: string) {
    super(message)
    this.name = "CustomError"
  }

  /** Set `cause` on existing `CustomError`. */
  public setCause(cause: unknown): this {
    this.cause = getError(cause)
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
    status: ClientErrorStatus = 400,
    message: string = ERROR_MSG[status],
    details?: ErrDetail
  ) {
    super(status, message)
    this.name = "ClientError"
    this.details.msg = details?.msg ?? message
    if (details?.desc) this.details.desc = details.desc
    if (details?.report != null) this.details.report = details.report
  }
}

export class ServiceError extends ApiError {
  public constructor(
    status: ServiceErrorStatus = 500,
    message: string = ERROR_MSG[status],
    public details?: ErrDetail
  ) {
    super(status, message)
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

/**
 * Returns error if it's an instanceof Error, else returns a new Error with stringified original value.\
 * https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5
 */
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

/** Returns error if it's an AppError, else ServiceError with original error as cause */
export const getApiError = (value: unknown): ApiError => {
  if (value instanceof ApiError) return value
  // Default to service error and set cause
  return new ServiceError().setCause(getError(value))
}

/** Returns true unless `error.details.report === false` */
export const shouldReport = (error: unknown): boolean => {
  // eslint-disable-next-line sonarjs/prefer-single-boolean-return
  if (error instanceof ApiError && error.details?.report === false) {
    return false
  }

  return true
}
