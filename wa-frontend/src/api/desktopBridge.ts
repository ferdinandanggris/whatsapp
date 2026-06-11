/** Check if running inside WinForms WebView2 */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && !!(window as any).chrome?.webview
}

/** Sync token from desktop bridge into localStorage (call once on startup) */
export function initDesktopToken(): void {
  if (!isDesktop()) return
  const bridge = (window as any)?.__DESKTOP_BRIDGE__
  if (bridge?.token) {
    localStorage.setItem("token", bridge.token)
  }

  if (bridge?.refreshToken) {
    localStorage.setItem("refresh_token", bridge.refreshToken)
  }
}

/** Send a message back to the WinForms host */
export function postToDesktop(msg: Record<string, unknown>): void {
  try {
    ;(window as any).chrome?.webview?.postMessage(msg)
  } catch {
    /* ignore */
  }
}
