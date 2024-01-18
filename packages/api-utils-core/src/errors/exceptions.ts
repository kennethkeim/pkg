import { type HttpStatus } from "../http"

type ClientErrorStatus =
  | HttpStatus.Unauthorized
  | HttpStatus.Forbidden
  | HttpStatus.BadRequest
  | HttpStatus.MethodNotAllowed
  | HttpStatus.NotFound

type ServiceErrorStatus =
  | HttpStatus.ServiceUnavailable
  | HttpStatus.InternalServerError
  | HttpStatus.GatewayTimeout

export class ApiError extends Error {
  cause?: Error

  protected constructor(
    public status: ClientErrorStatus | ServiceErrorStatus,
    message: string
  ) {
    super(message)
    this.name = this.constructor.name
  }

  /** Set `cause` on existing `ApiError`. */
  public setCause(cause: Error): ApiError {
    this.cause = cause
    return this
  }
}

export class ClientError extends ApiError {
  public constructor(status?: ClientErrorStatus, message?: string) {
    super(status ?? 400, message ?? "Bad Request.")
    this.name = this.constructor.name
  }
}

export class ServiceError extends ApiError {
  public constructor(status?: ServiceErrorStatus, message?: string) {
    super(status ?? 500, message ?? "Internal Server Error.")
    this.name = this.constructor.name
  }
}

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
