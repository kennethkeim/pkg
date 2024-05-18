import type { ApiError } from "../errors/exceptions"

export type Result<TData, TError extends Error = ApiError> = {
  data: TData
  message?: string
  error?: TError
}
