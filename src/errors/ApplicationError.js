export const ErrorCode = Object.freeze({
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_LOCATION_MISMATCH: 'SESSION_LOCATION_MISMATCH',
  SESSION_FINISHED: 'SESSION_FINISHED',
  SESSION_GRAPH_MIGRATION_FAILED: 'SESSION_GRAPH_MIGRATION_FAILED',
  SESSION_GRAPH_INVALID: 'SESSION_GRAPH_INVALID',
  SESSION_LOAD_FAILED: 'SESSION_LOAD_FAILED',
  SESSION_INITIALIZATION_FAILED: 'SESSION_INITIALIZATION_FAILED',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
})

export class ApplicationError extends Error {
  constructor(code, message, { cause = undefined, httpStatus = 500 } = {}) {
    super(message, { cause })
    this.name = 'ApplicationError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

export function isApplicationError(error) {
  return error instanceof ApplicationError
}
