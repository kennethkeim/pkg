/* eslint-disable sonarjs/no-duplicate-string */
import { describe, expect, it } from "vitest"
import { parseBody } from "../src/request"
import { z } from "zod"

describe("parseBody", () => {
  it("Should require request object", async () => {
    const req = new Request("http://localhost")
    const schema = z.object({})
    const { error, data, message } = await parseBody(req, schema)
    expect(error).toBeDefined()
    expect(message).toBeDefined()
    expect(data).toBeUndefined()
  })

  it("Should not require request object if optional", async () => {
    const req = new Request("http://localhost")
    const schema = z.object({}).optional()
    const result = await parseBody(req, schema)
    expect(result).toEqual({})
  })

  it("Should require request object props", async () => {
    const req = new Request("http://localhost", {
      body: '{"foo":"bar"}',
      method: "POST",
    })
    const schema = z.object({ foo: z.string() })
    const { error, data, message } = await parseBody(req, schema)
    expect(message).toBeUndefined()
    expect(error).toBeUndefined()
    expect(data).toEqual({ foo: "bar" })
  })
})
