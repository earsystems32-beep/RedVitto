// Shared session store for admin authentication
const sessionStore = new Map<string, { created: number; ip: string }>()
const SESSION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

// Clean expired sessions every minute
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of sessionStore.entries()) {
    if (now - data.created > SESSION_EXPIRY) {
      sessionStore.delete(token)
    }
  }
}, 60000)

export function addSession(token: string, ip: string) {
  sessionStore.set(token, {
    created: Date.now(),
    ip,
  })
}

export function validateSession(token: string): boolean {
  const session = sessionStore.get(token)
  if (!session) return false
  
  const now = Date.now()
  if (now - session.created > SESSION_EXPIRY) {
    sessionStore.delete(token)
    return false
  }
  
  return true
}

export function removeSession(token: string) {
  sessionStore.delete(token)
}
