export type Result<T> = { ok: true; data: T } | { ok: false; error: Error }

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function err(error: Error): Result<never> {
  return { ok: false, error }
}

export function isOk<T>(result: Result<T>): result is { ok: true; data: T } {
  return result.ok
}

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw result.error
  return result.data
}
