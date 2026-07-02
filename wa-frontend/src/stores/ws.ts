import { create } from "zustand"
import type { Conversation, WSEvent } from "../types"

interface WSState {
  connected: boolean
  connect: (token: string, company_id: string) => void
  disconnect: () => void
  onEvent: ((ev: WSEvent) => void) | null
}

export const useWS = create<WSState>((set, get) => {
  let ws: WebSocket | null = null

  function connect(token: string, company_id: string) {
    if (ws) ws.close()
    const proto = window.location.protocol === "https:" ? "wss:" : "  ws:"
    const host = (window as any).__WS_HOST__ || "localhost:8081"
    ws = new WebSocket(`${proto}//${host}/ws?company_id=${company_id}&token=${token}`)

    ws.onopen = () => set({ connected: true })
    ws.onclose = () => set({ connected: false })
    ws.onerror = () => set({ connected: false })

    ws.onmessage = (msg) => {
      try {
        const ev: WSEvent = JSON.parse(msg.data)
        console.log(ev)
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
