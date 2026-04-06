import { fetchFromN8N } from './lib/n8n-client';
import { addMemeToAggregate } from './lib/meme-map';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getDoomData() {
  const data = await fetchFromN8N();
  return {
    daily: addMemeToAggregate(data.daily),
    weekly: addMemeToAggregate(data.weekly),
    monthly: addMemeToAggregate(data.monthly),
    history: data.history || [],
  };
}

const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,

  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Serve meme static files
    if (url.pathname.startsWith('/memes/')) {
      const filename = url.pathname.slice('/memes/'.length);
      // Basic path traversal protection
      if (filename.includes('..') || filename.includes('/')) {
        return new Response('Not found', { status: 404 });
      }
      const file = Bun.file(`./public/memes/${filename}`);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': file.type || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }
      return new Response('Not found', { status: 404 });
    }

    // GET /api/doom
    if (url.pathname === '/api/doom' && req.method === 'GET') {
      try {
        const data = await getDoomData();
        return Response.json(data, { headers: CORS_HEADERS });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('GET /api/doom failed:', message);
        return Response.json(
          { error: 'Failed to fetch data', detail: message },
          { status: 500, headers: CORS_HEADERS },
        );
      }
    }

    // GET /health
    if (url.pathname === '/health' && req.method === 'GET') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
  },
});

console.log(`Doomscroller backend running on http://localhost:${server.port}`);
