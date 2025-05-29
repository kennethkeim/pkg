import { expect, it, describe } from "vitest"
import { fetchJson } from "../src"

const urlHtml404 = "https://www.google.com/testing"

describe("fetchJson", () => {
  it("Should retry network errors", async () => {
    // check retries via console logs (metadata not available since it's thrown)
    await expect(fetchJson("https://googl.com")).rejects.toThrow(
      "Failed to GET https://googl.com"
    )
  })

  it("Should throw on http non-200", async () => {
    await expect(fetchJson(urlHtml404)).rejects.toThrow(
      "HTTP Error [404] from /testing"
    )
  })

  it("Should fail while parsing html error response if throwStatus false (no retries)", async () => {
    // check retries via console logs
    await expect(fetchJson(urlHtml404, { throwStatus: false })).rejects.toThrow(
      "Failed to get json payload for /testing"
    )
  })

  it("Should not parse error responses if parseErrorResponse is false", async () => {
    const res = await fetchJson(urlHtml404, {
      throwStatus: false,
      parseErrorResponse: false,
    })
    // Error was not thrown therefore we know it didn't try to parse the html
    expect(res.ok).toBe(false)
    expect(res.retries).toBe(0)
    expect(res.status).toBe(404)
    expect(res.data).toBe(null)
  })
})
