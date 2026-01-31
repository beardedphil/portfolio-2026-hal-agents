/**
 * Redacts sensitive values from objects for diagnostics.
 * Removes OpenAI API keys, JWT tokens, Supabase URLs.
 */

const OPENAI_KEY_PATTERN = /sk-[a-zA-Z0-9_-]{20,}/g
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g
const SUPABASE_URL_PATTERN =
  /https:\/\/([a-zA-Z0-9-]+\.)?supabase\.co(\/[a-zA-Z0-9_-]*)*/gi

const REDACTED = '[REDACTED]'

function redactString(value: string): string {
  return value
    .replace(OPENAI_KEY_PATTERN, REDACTED)
    .replace(JWT_PATTERN, REDACTED)
    .replace(SUPABASE_URL_PATTERN, REDACTED)
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactString(value)
  }
  if (Array.isArray(value)) {
    return value.map(redactValue)
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = redactValue(v)
    }
    return out
  }
  return value
}

/**
 * Redacts sensitive values (API keys, JWTs, Supabase URLs) from an object.
 * Returns a deep copy with sensitive values replaced by [REDACTED].
 */
export function redact(obj: unknown): unknown {
  return redactValue(obj)
}
