/**
 * Project Manager agent stub — deterministic reply function.
 * Module: portfolio-2026-hal-agents (no server required).
 */

const SIGNATURE = '[PM@hal-agents]'

export type RespondContext = {
  /** Optional context for future use (e.g. conversation id, user id). */
  [key: string]: unknown
}

export type RespondInput = {
  message: string
  context?: RespondContext
}

export type RespondMeta = {
  source: 'hal-agents'
  case: 'standup' | 'default'
}

export type RespondOutput = {
  replyText: string
  meta: RespondMeta
}

/** Standup/status trigger phrases (case-insensitive). */
const STANDUP_TRIGGERS = ['standup', 'status']

function isStandupOrStatus(message: string): boolean {
  const normalized = message.trim().toLowerCase()
  return STANDUP_TRIGGERS.some((trigger) =>
    normalized.includes(trigger)
  )
}

/**
 * Produces a deterministic reply to a user message.
 * No network calls. Designed to be called by HAL.
 */
export function respond(input: RespondInput): RespondOutput {
  const { message } = input

  if (isStandupOrStatus(message)) {
    return {
      replyText: `${SIGNATURE} Standup summary:
• Reviewed ticket backlog
• No blockers identified
• Ready to assist with prioritization`,
      meta: { source: 'hal-agents', case: 'standup' },
    }
  }

  return {
    replyText: `${SIGNATURE} Message received. Here’s a quick checklist to move forward:
• [ ] Clarify scope if needed
• [ ] Confirm priority with stakeholder
• [ ] Break down into tasks when ready`,
    meta: { source: 'hal-agents', case: 'default' },
  }
}
