import type { IncomingHttpHeaders } from "http"
import { ClientError } from "@kennethkeim/core"

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
  reqHeaders: IncomingHttpHeaders | Headers,
  token: string
): void => {
  if ("get" in reqHeaders && typeof reqHeaders.get === "function") {
    // Check fetch api headers (Nextjs14)
    if (reqHeaders.get("Authorization") !== token) throw new ClientError(401)
  } else if (
    // Check http headers (Nextjs13)
    (reqHeaders as IncomingHttpHeaders)["Authorization"] !== token &&
    (reqHeaders as IncomingHttpHeaders)["authorization"] !== token
  ) {
    throw new ClientError(401)
  }
}
