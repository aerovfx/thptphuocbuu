import * as Y from 'yjs'
import { WebSocketServer, WebSocket } from 'ws'
import { prisma } from '@/lib/prisma'

// Store active document rooms
const documentRooms = new Map<string, Set<WebSocket>>()
const documentYdocs = new Map<string, Y.Doc>()

export function setupYjsWebSocketServer(server: any) {
  const wss = new WebSocketServer({ noServer: true })

  // Handle upgrade from HTTP to WebSocket
  server.on('upgrade', (request: any, socket: any, head: any) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname

    if (pathname.startsWith('/api/docs/ws/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', async (ws: WebSocket, request: any) => {
    const url = new URL(request.url, `http://${request.headers.host}`)
    const documentId = url.pathname.split('/').pop()

    if (!documentId) {
      ws.close()
      return
    }

    // Get or create Y.Doc for this document
    let ydoc = documentYdocs.get(documentId)
    if (!ydoc) {
      ydoc = new Y.Doc()

      // Load document content from database
      try {
        const document = await prisma.collaborativeDocument.findUnique({
          where: { id: documentId },
          select: { content: true },
        })

        if (document?.content) {
          // Apply existing content to Y.Doc
          const yxml = ydoc.get('prosemirror', Y.XmlFragment)
          // You'll need to convert your content format to Yjs format
          // This is a simplified version
        }
      } catch (error) {
        console.error('Error loading document:', error)
      }

      documentYdocs.set(documentId, ydoc)
    }

    // Add client to room
    if (!documentRooms.has(documentId)) {
      documentRooms.set(documentId, new Set())
    }
    documentRooms.get(documentId)!.add(ws)

    // Send current document state
    const state = Y.encodeStateAsUpdate(ydoc)
    ws.send(Buffer.from(state))

    // Handle incoming updates
    ws.on('message', async (message: Buffer) => {
      try {
        const update = new Uint8Array(message)
        Y.applyUpdate(ydoc, update)

        // Broadcast to other clients in the same room
        const room = documentRooms.get(documentId!)
        if (room) {
          room.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(message)
            }
          })
        }

        // Save to database periodically (debounced)
        // In production, you'd want to debounce this
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    // Handle Yjs updates
    ydoc.on('update', (update: Uint8Array) => {
      const room = documentRooms.get(documentId!)
      if (room) {
        room.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(Buffer.from(update))
          }
        })
      }
    })

    // Cleanup on disconnect
    ws.on('close', () => {
      const room = documentRooms.get(documentId!)
      if (room) {
        room.delete(ws)
        if (room.size === 0) {
          documentRooms.delete(documentId!)
          // Optionally persist and cleanup Y.Doc
        }
      }
    })
  })

  return wss
}

// Helper function to persist document
export async function persistDocument(documentId: string) {
  const ydoc = documentYdocs.get(documentId)
  if (!ydoc) return

  try {
    const yxml = ydoc.get('prosemirror', Y.XmlFragment)
    const content = yxml.toJSON()

    await prisma.collaborativeDocument.update({
      where: { id: documentId },
      data: {
        content: content as any,
        lastEditedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error persisting document:', error)
  }
}

