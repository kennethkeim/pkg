import type { z } from "zod"

export const getFirstZodIssue = (error: z.ZodError) => {
  const firstIssue = error.issues[0]
  if (!firstIssue) return null
  return `${firstIssue.path.join(".")}: ${firstIssue.message}`
}
