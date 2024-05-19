import type { IncomingHttpHeaders } from "http"
import { ClientError } from "../errors/exceptions"

export type HttpMethod = "OPTIONS" | "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

/** Allow only defined methods */
export const allowMethods = (
  allowed: HttpMethod[],
  actual: string | undefined
): void => {
  const actualMethod = (actual ?? "").toUpperCase() as HttpMethod
  if (!allowed.includes(actualMethod)) {
    throw new ClientError(405)
  }
}

/** Authenticate request by checking "Authorization" header for token. */
export const authRequest = (
  reqHeaders: IncomingHttpHeaders,
  token: string
): void => {
  if (
    reqHeaders["Authorization"] !== token &&
    reqHeaders["authorization"] !== token
  ) {
    throw new ClientError(403)
  }
}
