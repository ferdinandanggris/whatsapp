function getBase(): string {
  if (typeof window !== "undefined" && (window as any).__API_BASE__) {
    return (window as any).__API_BASE__
  }
  return ""
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

async function handleTokenRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) return null

  try {
    const res = await fetch(`${getBase()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) throw new Error("Refresh failed")
    const data = await res.json()
    localStorage.setItem("token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    return data.access_token
  } catch (err) {
    console.error("[auth] refresh call failed", err)
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    return null
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  let token = localStorage.getItem("token")
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  // Skip 401 interception on the refresh endpoint itself
  if (path === "/api/v1/auth/refresh") {
    const res = await fetch(`${getBase()}${path}`, { ...opts, headers })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json()
  }

  const res = await fetch(`${getBase()}${path}`, { ...opts, headers })
  if (res.status === 401) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          headers["Authorization"] = `Bearer ${newToken}`
          fetch(`${getBase()}${path}`, { ...opts, headers })
            .then((r) => {
              if (!r.ok) {
                r.json().then(b => reject(new Error(b.error || `HTTP ${r.status}`))).catch(() => reject(new Error(`HTTP ${r.status}`)))
              } else {
                resolve(r.json() as Promise<T>)
              }
            })
            .catch(reject)
        })
      })
    }

    isRefreshing = true
    const newToken = await handleTokenRefresh()
    isRefreshing = false

    if (newToken) {
      onRefreshed(newToken)
      headers["Authorization"] = `Bearer ${newToken}`
      const retryRes = await fetch(`${getBase()}${path}`, { ...opts, headers })
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${retryRes.status}`)
      }
      return retryRes.json()
    } else {
      console.error("[auth] refresh failed, clearing session")
      refreshSubscribers = []
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      window.location.href = "/login"
      throw new Error("unauthorized")
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}
