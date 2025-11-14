import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type AuthUser = {
  id: number | string
  email: string
  displayName: string
  avatarUrl?: string
  bio?: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<Pick<AuthUser, "displayName" | "avatarUrl" | "bio">>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (data?.error && typeof data.error === "string") return data.error
  } catch {
    // ignore
  }
  return `${res.status} ${res.statusText}`.trim()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    // try to fetch current session on mount
    fetch(`${API_BASE}/api/me`, { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u) {
          setUser({
            id: u.id,
            email: u.email,
            displayName: u.displayName ?? u.display_name ?? "",
            avatarUrl: u.avatarUrl ?? u.avatar_url ?? undefined,
            bio: u.bio ?? undefined,
          })
        }
      })
      .catch(() => void 0)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      async login(email: string, password: string) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) throw new Error(await readError(res))
        const u = await res.json()
        setUser({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
        })
      },
      async register(email: string, displayName: string, password: string) {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, displayName, password }),
        })
        if (!res.ok) throw new Error(await readError(res))
        const u = await res.json()
        setUser({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
        })
      },
      logout() {
        fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" }).finally(() => {
          setUser(null)
        })
      },
      updateProfile(updates) {
        ;(async () => {
          const res = await fetch(`${API_BASE}/api/profile`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: updates.displayName,
              avatarUrl: updates.avatarUrl,
              bio: updates.bio,
            }),
          })
          if (!res.ok) {
            throw new Error(await readError(res))
          }
          const u = await res.json()
          setUser({
            id: u.id,
            email: u.email,
            displayName: u.displayName ?? u.display_name ?? "",
            avatarUrl: u.avatarUrl ?? u.avatar_url ?? undefined,
            bio: u.bio ?? undefined,
          })
        })()
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}


