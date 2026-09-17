# Presenter sync

One screen drives the deck. Every other open copy shows the same frame at the
same moment: same scene, same pause, same restart.

Built into `team-report.html`. A plain visit still auto plays on its own
exactly as before.

---

## Using it

| You open | What happens |
|---|---|
| the deck normally | Auto plays on its own. No badge. |
| the deck and press **C** | You drive. A **Controlling** badge shows bottom left. |
| the deck while someone drives | Follows, showing a **Following** badge. Local keys and clicks are ignored so a stray click cannot break the room. |

`/team-control` is a shortcut for opening it already in control. Press C again
to hand control back. Whoever presses C takes the room, and the previous
controller drops to following.

Add `?room=boardroom` to every link to run two independent sessions at once.
The default room is `team-report`.

A follower that hears nothing for ten seconds releases itself and goes back to
playing on its own, so a screen is never stuck if the presenter closes the tab.

---

## Why it stays in step

What travels is the **anchor** the controller is playing from, never a live
position. Every screen works out its frame from that anchor plus real elapsed
time, so frame rate, throttling and message delay do not move it.

Two consequences worth knowing:

- A screen the browser had throttled, which is any tab you are not looking at,
  still computes the right frame and paints it the instant you look at it.
- A reply that is a second old is still exact. That is why polling over plain
  HTTP is as accurate here as a socket.

Measured worst drift between a controller and a follower: **2ms** across the
network endpoint, **7ms** between tabs.

---

## The three transports

The deck picks one from the URL you give it.

### 1. Tabs in one browser: nothing to set up

`BroadcastChannel`, always on. A second window on the same machine follows
immediately, with no server of any kind.

### 2. Other devices on Vercel: `/api/sync`, already shipped

`api/sync.js` deploys with the site, and the deck points at it by default:

```html
<script>window.DECK_SYNC_URL = "/api/sync";</script>
```

Nothing else to host. Vercel runs serverless functions, which cannot hold a
WebSocket open, so this is a request endpoint that followers read about once a
second. Because anchors travel rather than positions, that is frame accurate.

**Storage.** With no store connected it keeps the room in instance memory,
which works while every request lands on the same warm instance. That is the
usual case for one room in one region but it is not guaranteed. To make it
solid, open the Vercel dashboard, go to **Storage**, add a **Redis** store and
connect it to this project. The env vars it injects are picked up with no code
change. Every reply carries a `store` field saying which one answered:

```bash
curl https://your-site.vercel.app/api/sync?room=team-report
```

`{"store":"memory","empty":true}` means no store is connected yet and nobody is
driving. `{"store":"redis",...}` means the store is live.

### 3. A real socket: `sync-server.js`

For instant delivery rather than once a second, run the relay on a host that
keeps connections open. It stores nothing: a message from one socket goes to
the other sockets in the same room.

```bash
npm run sync          # PORT=8090 by default
curl http://localhost:8090/health
```

`Dockerfile.sync` and `render.yaml` are included, so Render deploys it from
this repo on the free plan, which supports WebSockets. Railway, Fly and any VPS
work the same way. Then change one line in the deck:

```html
<script>window.DECK_SYNC_URL = "wss://delta-deck-sync.onrender.com";</script>
```

The deck reads the scheme and switches transport by itself. An `https` page
cannot open a `ws://` socket, so the relay must be behind TLS as `wss://`.
Behind your own proxy, pass the upgrade headers through:

```nginx
location / {
  proxy_pass         http://127.0.0.1:8090;
  proxy_http_version 1.1;
  proxy_set_header   Upgrade $http_upgrade;
  proxy_set_header   Connection "upgrade";
  proxy_set_header   Host $host;
  proxy_read_timeout 600s;
}
```

---

## Overriding per link

Useful for testing without editing the file:

```
/team-report?control=1&sync=https://your-site.vercel.app/api/sync
/team-report?sync=wss://delta-deck-sync.onrender.com
```

---

## If a screen is not following

- The badge says **Reconnecting** in amber. The endpoint or relay is
  unreachable and the page is retrying on its own.
- Check both pages agree on the room name.
- Two tabs in one window cannot both animate. The browser freezes the one you
  are not looking at. Use two windows side by side, or two devices.
- On the endpoint, `curl` it and read the `store` field. If it says `memory`
  and followers sometimes lose the controller, connect a Redis store.
- On a socket, confirm the URL is `wss://` and that the proxy forwards the
  `Upgrade` header. Without it the socket closes at once.

---

## Driving from the console

`window.DECK` is available on any open copy:

```js
DECK.seek(36)      // jump to 36 seconds
DECK.play(false)   // pause the room
DECK.state         // { t, playing, following, driving, room, relay }
```
