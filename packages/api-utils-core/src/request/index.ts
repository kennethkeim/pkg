import type { z } from "zod"
import { ClientError, getFirstZodIssue } from "@kennethkeim/core"
import type { Result } from "@kennethkeim/core"

export const parseBody = async <
  T extends z.AnyZodObject | z.ZodOptional<z.AnyZodObject>
>(
  req: Request,
  schema: T
): Promise<Result<z.infer<T>>> => {
  try {
    const json = (await req.json()) as object
    const result = schema.safeParse(json)
    if (!result.success) {
      const message = getFirstZodIssue(result.error) ?? "Invalid request"
      return { message, error: new ClientError(400, message) }
    }
    return { data: result.data }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    const message = "Invalid JSON"
    return { message, error: new ClientError(400, message) }
  }
}
