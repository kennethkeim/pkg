# Exception System TODOs

## 1. Error codes on `ApiError`

Add a string `code` property (e.g. `"VALIDATION_FAILED"`, `"TOKEN_EXPIRED"`, `"DUPLICATE_RESOURCE"`) so clients can branch on specific scenarios without parsing message strings. Stabilizes the API contract — messages can change, codes don't.

## 2. Field-level validation errors

Add optional `fieldErrors?: Record<string, string[]>` to `ErrDetail` (or as a `ClientError`-specific property) so the UI can render inline field errors instead of just a toast. Forward it in `ApiErrorResponse` from `getErrorResponse`.

## 3. Missing status codes: 409 and 422

Add `409 Conflict` (optimistic concurrency, duplicate creation) and `422 Unprocessable Entity` (valid syntax, invalid semantics) to `ClientErrorStatus` and `ERROR_MSG`.

## 4. `toJSON()` for structured serialization

Add `toJSON()` on `CustomError` to provide a single source of truth for logging, error reporting payloads, and API responses — instead of manually extracting fields in `emailError`, `handleApiError`, etc.

## 5. `timestamp` on `CustomError`

Capture `readonly timestamp = new Date()` at construction time. Currently `emailError` creates `new Date()` at report-time, but if there's latency between throw and report (retries, async catch chains), the real origin time is lost.

## 6. `requestId` on `ErrDetail`

Add optional `requestId?: string` to `ErrDetail` for correlation with server logs. Pairs well with the existing `fullUrl` field and structured logging.
