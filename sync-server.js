/* Presenter sync relay for the Delta decks.
 *
 *   npm install ws
 *   PORT=8090 node sync-server.js
 *
 * It keeps no state: every message from one socket is forwarded to the
 * other sockets in the same room. The deck decides what the messages mean.
 * Put it behind HTTPS so pages served over https can reach it as wss://.
 */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8090;
const MAX  = 8 * 1024;               // ignore anything larger than this
const rooms = new Map();

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/health')) {
    const total = [...rooms.values()].reduce((n, s) => n + s.size, 0);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, rooms: rooms.size, clients: total }));
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('delta deck sync');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const room = new URL(req.url, 'http://local').searchParams.get('room') || 'default';
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (buf) => {
    const text = buf.toString();
    if (text.length > MAX) return;
    for (const peer of rooms.get(room) || []) {
      if (peer !== ws && peer.readyState === 1) peer.send(text);
    }
  });

  ws.on('close', () => {
    const set = rooms.get(room);
    if (!set) return;
    set.delete(ws);
    if (!set.size) rooms.delete(room);
  });
});

/* drop sockets that stopped answering, so rooms do not leak */
setInterval(() => {
  for (const set of rooms.values()) {
    for (const ws of set) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false;
      try { ws.ping(); } catch (_) {}
    }
  }
}, 30000).unref();

server.listen(PORT, () => console.log('deck sync listening on ' + PORT));
