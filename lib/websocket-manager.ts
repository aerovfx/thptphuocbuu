/**
 * WebSocket Manager
 * 
 * Manages WebSocket connections for real-time updates
 * Moved from route.ts to avoid Next.js route export restrictions
 */

// WebSocket connection manager (simplified)
class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map()

  addConnection(userId: string, ws: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(ws)

    // Use standard WebSocket close event to stay compatible with both browser WebSocket and Node's WebSocket
    ws.addEventListener('close', () => {
      this.removeConnection(userId, ws)
    })
  }

  removeConnection(userId: string, ws: WebSocket) {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      userConnections.delete(ws)
      if (userConnections.size === 0) {
        this.connections.delete(userId)
      }
    }
  }

  broadcastToUser(userId: string, message: any) {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      const messageStr = JSON.stringify(message)
      userConnections.forEach((ws) => {
        // readyState === 1 means OPEN
        if (ws.readyState === 1) {
          ws.send(messageStr)
        }
      })
    }
  }

  broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message)
    this.connections.forEach((userConnections) => {
      userConnections.forEach((ws) => {
        if (ws.readyState === 1) {
          ws.send(messageStr)
        }
      })
    })
  }
}

export const wsManager = new WebSocketManager()

