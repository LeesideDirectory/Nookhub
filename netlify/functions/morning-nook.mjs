/**
 * Morning Nook — HTTP endpoint.
 *
 *   GET  /api/morning-nook            → the current cache as JSON
 *   POST /api/morning-nook/refresh    → refresh now (rate-limited to 1 per 15 min)
 *
 * The app normally reads straight from Supabase (fast, no function call needed).
 * This endpoint exists for two jobs:
 *   1. The "Refresh" button in the Morning Nook page.
 *   2. A safety net — if the 6am job failed or hasn't run yet, the first person
 *      to open Morning Nook that day triggers a catch-up fetch.
 */

import { refreshAll, readCache, SOURCES } from './lib/feeds.mjs';

// In-memory across warm invocations. Not perfect (a cold start resets it), but
// enough to stop a refresh button being hammered into the news sites' rate limits.
let lastManualRefresh = 0;
const MANUAL_COOLDOWN_MS = 15 * 60 * 1000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });

export default async (req) => {
  const url = new URL(req.url);
  const wantsRefresh =
    req.method === 'POST' || url.pathname.endsWith('/refresh') || url.searchParams.has('refresh');

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    if (wantsRefresh) {
      const since = Date.now() - lastManualRefresh;
      if (since < MANUAL_COOLDOWN_MS) {
        const waitMins = Math.ceil((MANUAL_COOLDOWN_MS - since) / 60000);
        return json(
          {
            ok: true,
            skipped: true,
            message: `Already refreshed recently — try again in ${waitMins} min.`,
            sources: await readCache(),
          },
          200
        );
      }
      lastManualRefresh = Date.now();
      const result = await refreshAll({ trigger: 'manual' });
      return json({
        ok: result.ok,
        refreshed: true,
        durationMs: result.durationMs,
        summary: result.summary,
        sources: result.rows.map(({ _ms, ...r }) => r),
      });
    }

    // Plain read. If everything is stale (>20h) or empty, quietly catch up.
    const cache = await readCache();
    const newest = cache.reduce((max, r) => {
      const t = new Date(r.fetched_at).getTime();
      return isNaN(t) ? max : Math.max(max, t);
    }, 0);
    const stale = !newest || Date.now() - newest > 20 * 60 * 60 * 1000;
    const empty = !cache.some(r => Array.isArray(r.items) && r.items.length);

    if ((stale || empty) && Date.now() - lastManualRefresh > MANUAL_COOLDOWN_MS) {
      lastManualRefresh = Date.now();
      const result = await refreshAll({ trigger: 'manual' });
      return json({
        ok: result.ok,
        refreshed: true,
        caughtUp: true,
        sources: result.rows.map(({ _ms, ...r }) => r),
      });
    }

    return json({ ok: true, refreshed: false, sources: cache });
  } catch (err) {
    console.error('[Morning Nook] endpoint error:', err);
    return json({ ok: false, error: String(err?.message || err), sources: [] }, 500);
  }
};

export const config = {
  path: ['/api/morning-nook', '/api/morning-nook/refresh'],
};

// Exported for local testing / debugging.
export { SOURCES };
