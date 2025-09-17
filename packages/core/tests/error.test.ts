import { expect, it, describe } from "vitest"
import {
  ApiError,
  AppError,
  ClientError,
  ConfigError,
  ServiceError,
  UserError,
  shouldReport,
} from "../src"

describe("Custom Error Basics", () => {
  it("Should extend correct Errors", () => {
    const serviceErr = new ServiceError(500, "Internal Server Error")
    expect(serviceErr).toBeInstanceOf(Error)
    expect(serviceErr).toBeInstanceOf(ServiceError)
    expect(serviceErr).toBeInstanceOf(ApiError)
    expect(serviceErr).not.toBeInstanceOf(ClientError)
  })

  it("Should set cause correctly", () => {
    const clientErr = new ClientError()
    expect(clientErr).toBeInstanceOf(Error)
    expect(clientErr).toBeInstanceOf(ApiError)
    clientErr.setCause(new Error("oh no"))
    expect(clientErr.cause).toBeInstanceOf(Error)
  })

  it("Should have correct name in stack", () => {
    const configErr = new ConfigError("Invalid config")
    expect(configErr.stack).toContain("ConfigError: Invalid config")
    expect(configErr.name).toBe("ConfigError")
  })
})

describe("Internal message attribute", () => {
  it("Should set ServiceError message correctly if message is passed in", () => {
    const svcErr = new ServiceError(503, "that went badly")
    expect(svcErr.message).toBe("that went badly")
  })

  it("Should set 500 ServiceError message correctly if no message passed in", () => {
    const svcErr = new ServiceError(500)
    expect(svcErr.message).toBe("Internal server error.")
  })

  it("Should set 503 message correctly if no message passed in", () => {
    const svcErr = new ServiceError(503)
    expect(svcErr.message).toBe("Service unavailable.")
  })
})

describe("Error details", () => {
  it("Should set ClientError details correctly if passed in", () => {
    const err = new ClientError(400, undefined, { retries: 3 })
    expect(err.details.retries).toBe(3)
  })

  it("Should set ServiceError details correctly if passed in", () => {
    const err = new ServiceError(500, undefined, { retries: 5 })
    expect(err.details.retries).toBe(5)
  })

  it("Should set ConfigError details correctly if passed in", () => {
    const err = new ConfigError("Oh no", { retries: 3 })
    expect(err.details.retries).toBe(3)
  })

  it("Should set AppError details correctly if passed in", () => {
    const err = new AppError("Oh no", { retries: 3 })
    expect(err.details.retries).toBe(3)
  })

  it("Should set UserError details correctly if passed in", () => {
    const err = new UserError("You did that wrong", { retries: 3 })
    expect(err.details.retries).toBe(3)
  })

  it("Should set AppError cause correctly", () => {
    const cause = new Error("the source of our problem")
    const err = new AppError("Oh no", { cause, retries: 7 })
    expect(err.details.retries).toBe(7)
    expect(err.details["cause"]).toBeUndefined()
    expect(err.cause?.message).toBe(cause.message)
    expect(err.cause).toEqual(cause)
  })

  it("Should set ClientError cause correctly", () => {
    const cause = new Error("the source of all our problems")
    const err = new ClientError(400, "Oh no", { cause, retries: 7 })
    expect(err.details.retries).toBe(7)
    expect(err.details["cause"]).toBeUndefined()
    expect(err.cause?.message).toBe(cause.message)
    expect(err.cause).toEqual(cause)
  })

  it("Should set stringify non-error cause", () => {
    const cause = "who throws a string??"
    const err = new AppError("Oh no", { cause })
    expect(err.details["cause"]).toBeUndefined()
    expect(err.cause?.message).toBe(`[Stringified Error]: "${cause}"`)
  })

  it("setCause method should override cause", () => {
    const cause = "who throws a string??"
    const err = new AppError("Oh no", { cause }).setCause(
      new Error("the real issue")
    )
    expect(err.details["cause"]).toBeUndefined()
    expect(err.cause?.message).toBe("the real issue")
  })
})

describe("Report/silence errors by type", () => {
  it("Should set service error report default correctly", () => {
    const serviceErr = new ServiceError()
    expect(serviceErr.details?.report).toBe(undefined)
  })

  it("Should set client error report default correctly", () => {
    const clientErr = new ClientError()
    expect(clientErr.details?.report).toBe(undefined)
  })

  it("Should set user error report default correctly", () => {
    const userErr = new UserError("user you did it wrong again")
    expect(userErr.details?.report).toBe(false)

    const userErr2 = new UserError("you did it wrong", { retries: 2 })
    expect(userErr2.details?.report).toBe(false)
    expect(userErr2.details?.retries).toBe(2)
  })

  it("Should set user error report from params correctly", () => {
    const userErr = new UserError("user you did it wrong again", {
      report: true,
    })
    expect(userErr.details?.report).toBe(true)
  })
})

describe("shouldReport utility", () => {
  it("Should return true for ApiError with no report setting", () => {
    const apiErr = new ServiceError()
    expect(shouldReport(apiErr)).toBe(true)
  })

  it("Should return false for ApiError with report: false", () => {
    const apiErr = new ServiceError(500, "test", { report: false })
    expect(shouldReport(apiErr)).toBe(false)
  })

  it("Should return true for ApiError with report: true", () => {
    const apiErr = new ServiceError(500, "test", { report: true })
    expect(shouldReport(apiErr)).toBe(true)
  })

  it("Should return true for default UserError", () => {
    const userErr = new UserError("user error")
    expect(shouldReport(userErr)).toBe(false)
  })

  it("Should return true for UserError with report: false", () => {
    const userErr = new UserError("user error", { report: false })
    expect(shouldReport(userErr)).toBe(false)
  })

  it("Should return true for non-ApiError errors", () => {
    const regularErr = new Error("regular error")
    expect(shouldReport(regularErr)).toBe(true)
  })

  it("Should return true for unknown values", () => {
    expect(shouldReport("string error")).toBe(true)
    expect(shouldReport({ error: "object error" })).toBe(true)
    expect(shouldReport(null)).toBe(true)
    expect(shouldReport(undefined)).toBe(true)
  })
})
