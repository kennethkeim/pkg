import { expect, it, describe } from "vitest"
import { ZodError } from "zod"
import { getFirstZodIssue } from "../src"

describe("Zod Error Utilities", () => {
  it("Should parse zod issues correctly", () => {
    const zodErr = new ZodError([
      {
        path: ["user", "firstName"],
        message: "Required",
        code: "invalid_literal",
        expected: "string",
        received: undefined,
      },
    ])

    expect(getFirstZodIssue(zodErr)).toEqual("user.firstName: Required")
  })
})
