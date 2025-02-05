import { expect, it, describe } from "vitest"
import {
  GetErrorFnResult,
  getErrorResponse,
} from "../src/errors/error-response"
import { ClientError, ServiceError } from "@kennethkeim/core"

describe("Math", () => {
  it("Should math", () => {
    expect(2 + 2).toBe(4)
  })
})

describe("getErrorResponse", () => {
  const defaultMsg = "Sorry, something went wrong."

  it("Should return a sensible default if random object is thrown", () => {
    const result = getErrorResponse({ foo: "what is this" })
    const expected: GetErrorFnResult = {
      response: { message: defaultMsg },
      status: 500,
    }
    expect(result).toEqual(expected)
  })

  it("Should return a sensible default if Error is thrown", () => {
    const err = new Error("confidential system error message")
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: { message: defaultMsg },
      status: 500,
    }
    expect(result).toEqual(expected)
  })

  it("Should return a sensible default if ServiceError is thrown", () => {
    const err = new ServiceError(503, "confidential system error message")
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: { message: defaultMsg },
      status: 503,
    }
    expect(result).toEqual(expected)
  })

  it("Should return a sensible default if ServiceError is thrown w no message", () => {
    const err = new ServiceError(504)
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: { message: defaultMsg },
      status: 504,
    }
    expect(result).toEqual(expected)
  })

  it("Should return user messaging if provided on ServiceError", () => {
    const err = new ServiceError(504, "hi", {
      msg: "We are struggling here",
      desc: "Please try again in a few seconds",
    })
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: {
        message: "We are struggling here",
        description: "Please try again in a few seconds",
      },
      status: 504,
    }
    expect(result).toEqual(expected)
  })

  it("Should return user messaging if provided on ClientError", () => {
    const err = new ClientError(400, "hi", {
      msg: "Not like that",
      desc: "Please enter a real name",
    })
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: {
        message: "Not like that",
        description: "Please enter a real name",
      },
      status: 400,
    }
    expect(result).toEqual(expected)
  })

  it("Should return error.message from ClientError if no other error.details attrs", () => {
    const err = new ClientError(400, "you can do better")
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: { message: "you can do better" },
      status: 400,
    }
    expect(result).toEqual(expected)
  })

  it("Should return default error.message from ClientError if no msg provided", () => {
    const err = new ClientError(400)
    const result = getErrorResponse(err)
    const expected: GetErrorFnResult = {
      response: { message: "Bad request." },
      status: 400,
    }
    expect(result).toEqual(expected)
  })
})
