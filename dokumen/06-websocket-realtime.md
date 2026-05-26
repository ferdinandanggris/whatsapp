# WebSocket — Real-Time Push

## Architecture

```
Backend WebSocket Hub
  │
  ├─ Room: phone_number_id
  │   (agents yang handle nomor ini)
  │
  └─ Room: user_id
      (personal notifications)
```

## Connection

```
Client: ws://host:port/api/v1/ws?token=<jwt>

Handshake:
  1. Client connects dengan JWT di query string
  2. Server validates JWT → extract user_id, company_id
  3. Server registers connection ke Hub
  4. Server joins user ke room-nya:
     - Room: company_{company_id} (broadcast ke 1 company)
     - Room: user_{user_id}       (personal events)
```

## Hub Structure

```go
type Hub struct {
    rooms      map[string]map[*Client]bool  // room_id → set of clients
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

type Client struct {
    conn     *websocket.Conn
    userID   string
    companyID int64
    send     chan []byte
}

type Event struct {
    Type string      `json:"type"`
    Data interface{} `json:"data"`
}
```

## Event Types

| Event | From | To | Description |
|-------|------|----|-------------|
| `new_message` | Server → Client | Room `phone_number_id` | Inbound message baru |
| `message_sent` | Server → Client | User | Outbound confirmed |
| `message_status` | Server → Client | Room `phone_number_id` | Status update (read/delivered) |
| `service_window_opened` | Server → Client | Room `phone_number_id` | 24h window reset |
| `conversation_updated` | Server → Client | Room `phone_number_id` | Conversation metadata change |

## Event Payloads

```json
// new_message
{
  "type": "new_message",
  "data": {
    "conversation": { ... },
    "message": { ... },
    "contact": { ... }
  }
}

// message_sent
{
  "type": "message_sent",
  "data": {
    "conversation_id": "uuid-xxx",
    "message": { ... }
  }
}

// message_status
{
  "type": "message_status",
  "data": {
    "wamid": "wamid.xxx",
    "status": "read",
    "conversation_id": "uuid-xxx"
  }
}
```

## Client-Side (React)

```typescript
// hooks/useWebSocket.ts
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((token: string) => {
    const ws = new WebSocket(`ws://localhost:8080/api/v1/ws?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto reconnect after 3s
      setTimeout(() => connect(token), 3000);
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      handleEvent(payload); // dispatch to Zustand store
    };

    wsRef.current = ws;
  }, []);

  return { connected, connect };
}
```

## Reconnection Strategy

```
Disconnect detected
     │
     ├─ Wait 1s → reconnect
     ├─ Wait 3s → reconnect
     ├─ Wait 10s → reconnect
     ├─ Wait 30s → reconnect
     └─ Exponential backoff (max 5 min)
```

Client sends `ping` every 30s, server responds `pong`. If no pong in 10s → disconnect.

## Key Points
- JWT di query string (bukan header) karena WebSocket API browser tidak support custom headers
- Token harus punya expiry pendek (15 menit), client refresh via REST sebelum reconnect
- Hub menggunakan `sync.RWMutex` — rooms jarang di-write, sering di-read
- Pastikan cleanup saat client disconnect (remove from all rooms)
- Semua event harus JSON — wire format sederhana, gampang di-debug
- Untuk production, scaling WebSocket butuh mekanisme pub/sub (Redis pub/sub atau RabbitMQ)
