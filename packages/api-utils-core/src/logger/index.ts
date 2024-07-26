import type { GenericLogger } from "../errors/error-response"
import type { ApiError } from "../errors/exceptions"

export class Logger implements GenericLogger {
  error(error: ApiError) {
    // JSON format
    // const attributes = {
    //   message: error.message,
    //   errorName: error.name,
    //   errorStack: error.stack,
    // };

    // This prints error name, message, and stack trace
    console.error(`${error.stack}\n${error.cause?.stack}`)
  }
}

export const logger = new Logger()
