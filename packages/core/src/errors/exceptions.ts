import { type HttpStatus } from "../http"

export type ClientErrorStatus =
  | HttpStatus.Unauthorized
  | HttpStatus.Forbidden
  | HttpStatus.BadRequest
  | HttpStatus.MethodNotAllowed
  | HttpStatus.NotFound

export type ServiceErrorStatus =
  | HttpStatus.ServiceUnavailable
  | HttpStatus.InternalServerError
  | HttpStatus.GatewayTimeout

const ERROR_MSG: Record<ClientErrorStatus | ServiceErrorStatus, string> = {
  400: "Bad request.",
  401: "Unauthorized.",
  403: "Forbidden.",
  404: "Not found.",
  405: "Method not allowed.",
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
}

// Error classes ------------

export class CustomError extends Error {
  cause?: Error

  protected constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }

  /** Set `cause` on existing `CustomError`. */
  public setCause(cause: Error): this {
    this.cause = cause
    return this
  }
}

export class ApiError extends CustomError {
  protected constructor(
    public status: ClientErrorStatus | ServiceErrorStatus,
    message: string,
    public details?: ErrDetail
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ClientError extends ApiError {
  public constructor(
    status?: ClientErrorStatus,
    message?: string,
    public details?: ErrDetail
  ) {
    super(status ?? 400, message ?? ERROR_MSG[status ?? 400])
    this.name = this.constructor.name
  }
}

export class ServiceError extends ApiError {
  public constructor(
    status?: ServiceErrorStatus,
    message?: string,
    public details?: ErrDetail
  ) {
    super(status ?? 500, message ?? ERROR_MSG[status ?? 500])
    this.name = this.constructor.name
  }
}

export class ConfigError extends CustomError {
  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class AppError extends CustomError {
  public constructor(message: string, public details?: ErrDetail) {
    super(message)
    this.name = this.constructor.name
  }
}

/** User error that will not be reported by default */
export class UserError extends CustomError {
  details: Pick<ErrDetail, "desc" | "report"> = { report: false }

  public constructor(
    /** Message to show to user (usually in toast title) */
    message: string,
    details?: Pick<ErrDetail, "desc" | "report">
  ) {
    super(message)
    this.name = this.constructor.name
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
