import type { z } from "zod"
import { ClientError, getFirstZodIssue } from "@kennethkeim/core"
import type { Result } from "@kennethkeim/core"

export const parseBody = async <
  T extends z.AnyZodObject | z.ZodOptional<z.AnyZodObject>
>(
  req: Request,
  schema: T
): Promise<Result<z.infer<T>>> => {
  let json: object | null = null

  try {
    json = (await req.json()) as object
  } catch (err) {
    // JSON parsing will fail if body is empty
    if (
      schema.isOptional() &&
      err instanceof Error &&
      err.message === "Unexpected end of JSON input"
    ) {
      return {}
    }

    const message = "Invalid JSON"
    return { message, error: new ClientError(400, message) }
  }

  const result = schema.safeParse(json)

  if (!result.success) {
    const message = getFirstZodIssue(result.error) ?? "Invalid request"
    return { message, error: new ClientError(400, message) }
  }

  return { data: result.data }
}
