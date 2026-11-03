export const SESSION_TTL_MS = 8 * 60 * 60 * 1000

export function isSessionExpired(timestamp: number, now = Date.now()) {
  return !Number.isFinite(timestamp) || timestamp <= 0 || now - timestamp >= SESSION_TTL_MS
}
