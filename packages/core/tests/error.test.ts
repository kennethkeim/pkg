import { expect, it, describe } from "vitest"
import {
  ApiError,
  ClientError,
  ConfigError,
  ServiceError,
  UserError,
} from "../src"

describe("Api Errors", () => {
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
  })

  it("Should set user error report from params correctly", () => {
    const userErr = new UserError("user you did it wrong again", {
      report: true,
    })
    expect(userErr.details?.report).toBe(true)
  })
})
