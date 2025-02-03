import type { z } from "zod"
import { getFirstZodIssue } from "@kennethkeim/core"
import type { Result } from "@kennethkeim/core"

export const parseBody = async <T extends z.AnyZodObject>(
  req: Request,
  schema: T
): Promise<Result<z.infer<T>>> => {
  try {
    const json = (await req.json()) as object
    const result = schema.safeParse(json)
    if (!result.success) {
      const msg = getFirstZodIssue(result.error)
      return { message: msg ?? "Invalid request" }
    }
    return { data: result.data }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return { message: "Invalid JSON" }
  }
}
