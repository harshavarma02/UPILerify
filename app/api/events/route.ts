import { NextRequest } from 'next/server';
import { orderManager } from '@/lib/engine/orderManager';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`));

      const unsubscribe = orderManager.subscribe((event, data) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (err) {
          console.error('[SSE] Error sending event:', err);
        }
      });

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // Stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
