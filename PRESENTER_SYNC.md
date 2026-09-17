# Presenter sync

One screen drives the deck. Every other open copy shows the same frame at the
same moment: same scene, same pause, same restart.

Built into `team-report.html`. Nothing else in the repo changes, and a plain
visit to the deck still auto plays on its own exactly as before.

---

## How it behaves

| You open | What happens |
|---|---|
| `/team-report` | Auto plays on its own. No sync, no badge. Unchanged. |
| `/team-control` | You drive. A **Controlling** badge shows bottom left. |
| `/team-report` while someone is controlling | Follows the controller. A **Following** badge shows. Local keys and clicks are ignored so a stray click cannot break the room. |

A follower that hears nothing for ten seconds releases itself and goes back to
playing on its own, so a screen is never stuck if the presenter closes the tab.

The controller sends its position on every key press and click, plus a
heartbeat about every 1.5 seconds. A follower more than 0.2 seconds out of step
snaps back, otherwise it runs its own clock, so motion stays smooth between
updates rather than stuttering on each message.

---

## Two levels of reach

**Tabs in one browser** work with no setup at all. The deck uses
`BroadcastChannel`, so a second window on the same machine follows immediately.

**Other devices** need a relay, because Vercel serves static files and cannot
hold a WebSocket open. The relay is `sync-server.js` in this repo. Run it on a
server you already manage.

---

## Running the relay

```bash
npm install ws
PORT=8090 node sync-server.js
```

Check it with `curl http://localhost:8090/health`.

It stores nothing. A message from one socket is forwarded to the other sockets
in the same room, and that is all it does. Rooms are created and dropped as
people join and leave, and dead sockets are pinged out every 30 seconds.

Put it behind HTTPS on a subdomain, for example `sync.deltainstitutions.com`,
so a page served over `https` can reach it as `wss://`. A browser refuses a
plain `ws://` connection from an `https` page. Any reverse proxy works as long
as it passes the upgrade headers through:

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

Keep it alive with pm2, systemd, or a cPanel Node app, whichever you already
use for the other services.

---

## Pointing the deck at the relay

Either bake it in once, by uncommenting the line near the top of
`team-report.html`:

```html
<script>window.DECK_SYNC_URL = "wss://sync.deltainstitutions.com";</script>
```

Or pass it per link, which is useful for a one off or for testing:

```
/team-report?control=1&sync=wss://sync.deltainstitutions.com
/team-report?sync=wss://sync.deltainstitutions.com
```

Add `?room=boardroom` on every link to run two independent sessions at once.
The default room is `team-report`.

---

## Driving it

Open `/team-control` on your laptop or phone. Space pauses and resumes, the
arrow keys move a scene at a time, `R` restarts, and a click toggles pause.
Every screen in the room does the same thing at the same time.

`window.DECK` is available from the console for scripted control:
`DECK.seek(36)`, `DECK.play(false)`, and `DECK.state` for a readout.

---

## If a screen is not following

- The badge says **Reconnecting** in amber. The relay is unreachable and the
  page is retrying every 2.5 seconds on its own.
- Check the page and the relay agree on the room name.
- An `https` page cannot open a `ws://` socket. Use `wss://`.
- Confirm the proxy forwards the `Upgrade` header. Without it the socket opens
  as a normal request and closes at once.
