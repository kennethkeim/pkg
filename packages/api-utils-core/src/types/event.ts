export type EventType = "oltp" | "batch-job" | "webhook" | "other"

/** Event detail for batch job reports, error reports, etc. */
export interface EventDetail {
  /** e.g. create-order, process-payment, etc. */
  event?: string
  eventType?: EventType
  /** resource name, url, id, etc */
  target?: string
  notes?: string
  /** Instructions for remediation (useful in email error report) */
  remediation?: string
  /** Only if it's idempotent */
  retryable?: boolean
  [key: string]: unknown
}
