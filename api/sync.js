/* Presenter sync endpoint for the Delta decks, running on Vercel.
 *
 * Vercel runs serverless functions, which cannot hold a WebSocket open, so
 * this is a plain request endpoint. Accuracy does not suffer: what travels
 * is the anchor the controller plays from, never a live position, so a reply
 * that is a second old still lands a follower on the exact frame.
 *
 *   POST /api/sync?room=team-report   body {"t":36.5,"playing":true}
 *   GET  /api/sync?room=team-report   -> {"t":36.5,"playing":true,"age":0.4,"rev":...}
 *                                     -> {"empty":true} when nobody is driving
 *
 * Storage: a Redis store when one is connected, otherwise instance memory.
 * Memory works while every request lands on the same warm instance, which is
 * the usual case for one room in one region, but it is not guaranteed. To
 * make it solid, add a Redis store in the Vercel dashboard under Storage.
 * The env vars it injects are picked up here with no code change, and the
 * `store` field in every reply says which one answered.
 *
 * For a real WebSocket, run sync-server.js on a host that keeps connections
 * open and point the deck at wss://that-host instead.
 */
const URL_ENV = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || '';
const TOK_ENV = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const HAS_KV  = !!(URL_ENV && TOK_ENV);
const TTL     = 300;   // seconds a room survives in the store
const STALE   = 180;   // seconds after which a stored anchor is treated as nobody driving

const mem = globalThis.__deckSync || (globalThis.__deckSync = new Map());

async function redis(command) {
  const r = await fetch(URL_ENV, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + TOK_ENV, 'content-type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  const store = HAS_KV ? 'redis' : 'memory';
  const room  = String((req.query && req.query.room) || 'default')
                  .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60) || 'default';
  const key   = 'deck:' + room;
  const json  = (code, body) => {
    res.statusCode = code;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(Object.assign({ store }, body)));
  };

  try {
    if (req.method === 'POST') {
      let body = req.body;
      if (body && typeof body === 'object' && typeof body.byteLength === 'number') body = body.toString('utf8');
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      if (!body || typeof body.t !== 'number' || !isFinite(body.t)) return json(400, { ok: false });

      const rec = { t: Math.min(Math.max(body.t, 0), 36000), playing: !!body.playing, at: Date.now() };
      if (HAS_KV) await redis(['SET', key, JSON.stringify(rec), 'EX', String(TTL)]);
      else mem.set(key, rec);
      return json(200, { ok: true });
    }

    let rec = null;
    if (HAS_KV) {
      const raw = await redis(['GET', key]);
      if (raw) { try { rec = JSON.parse(raw); } catch (_) {} }
    } else {
      rec = mem.get(key) || null;
    }

    if (!rec) return json(200, { empty: true });
    const age = (Date.now() - rec.at) / 1000;
    if (age > STALE) return json(200, { empty: true });
    return json(200, { t: rec.t, playing: !!rec.playing, age, rev: rec.at });
  } catch (err) {
    return json(200, { empty: true, error: String((err && err.message) || err) });
  }
};
