/**
 * Morning Nook — scheduled refresh.
 *
 * Runs every day at 05:00 UTC.
 *   • Irish summer time (UTC+1) → 06:00 local
 *   • Irish winter time (UTC+0) → 05:00 local
 * Either way the headlines are sitting in Supabase before anyone's awake.
 *
 * Netlify picks the schedule up automatically from the `config` export below —
 * there's nothing to add to netlify.toml for this file.
 *
 * Required Netlify environment variables:
 *   SUPABASE_URL                (or the existing VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Project Settings → API → service_role)
 */

import { refreshAll } from './lib/feeds.mjs';

export default async () => {
  try {
    const result = await refreshAll({ trigger: 'schedule' });
    console.log('[Morning Nook] refresh complete in', result.durationMs, 'ms');
    console.log('[Morning Nook]', JSON.stringify(result.summary, null, 2));
    return new Response(JSON.stringify({ ok: result.ok, summary: result.summary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Morning Nook] refresh failed:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  schedule: '0 5 * * *',
};
