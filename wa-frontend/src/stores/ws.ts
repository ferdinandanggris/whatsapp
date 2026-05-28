import { create } from "zustand"
import type { Conversation, WSEvent } from "../types"

interface WSState {
  connected: boolean
  connect: (token: string) => void
  disconnect: () => void
  onEvent: ((ev: WSEvent) => void) | null
}

export const useWS = create<WSState>((set, get) => {
  let ws: WebSocket | null = null

  function connect(token: string) {
    if (ws) ws.close()
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = (window as any).__WS_HOST__ || window.location.host
    ws = new WebSocket(`${proto}//${host}/ws?token=${token}`)

    ws.onopen = () => set({ connected: true })
    ws.onclose = () => set({ connected: false })
    ws.onerror = () => set({ connected: false })

    ws.onmessage = (msg) => {
      try {
        const ev: WSEvent = JSON.parse(msg.data)
        get().onEvent?.(ev)
      } catch {
        /* ignore malformed */
      }
    }
  }

  function disconnect() {
    ws?.close()
    ws = null
    set({ connected: false })
  }

  return { connected: false, connect, disconnect, onEvent: null }
})
