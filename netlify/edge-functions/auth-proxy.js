/**
 * auth-proxy — Netlify Edge Function
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxies the three sensitive Supabase auth operations through Netlify so we
 * can apply server-side, IP-based rate limiting before the request ever reaches
 * Supabase. Runs on Netlify's Deno-based edge runtime.
 *
 * Routes (configured in netlify.toml):
 *   POST /api/auth/login          → Supabase /auth/v1/token?grant_type=password
 *   POST /api/auth/signup         → Supabase /auth/v1/signup
 *   POST /api/auth/reset-password → Supabase /auth/v1/recover
 *
 * Rate limits (sliding window, per IP per operation, in-memory per edge node):
 *   login          — 5 attempts per 15 minutes
 *   signup         — 3 attempts per hour
 *   reset-password — 3 attempts per 15 minutes
 *
 * In-memory state means limits are per edge node instance, not global. Combined
 * with Supabase's own built-in auth rate limits and the client-side guard in
 * useAuth.js, this provides meaningful layered protection without needing an
 * external KV store.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Rate limit configuration ─────────────────────────────────────────────────
const LIMITS = {
  login:           { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  signup:          { max: 3,  windowMs: 60 * 60 * 1000 }, // 3 per hour
  'reset-password':{ max: 3,  windowMs: 15 * 60 * 1000 }, // 3 per 15 min
}

// Supabase GoTrue endpoint for each operation
const SUPABASE_PATH = {
  login:           '/auth/v1/token?grant_type=password',
  signup:          '/auth/v1/signup',
  'reset-password':'/auth/v1/recover',
}

// ── In-memory sliding window store ───────────────────────────────────────────
// key: "<ip>:<operation>" → array of attempt timestamps (ms)
const windows = new Map()

function checkLimit(ip, operation) {
  const limit = LIMITS[operation]
  const key   = `${ip}:${operation}`
  const now   = Date.now()
  const cutoff = now - limit.windowMs

  // Prune expired entries
  const prev = (windows.get(key) || []).filter(t => t > cutoff)

  if (prev.length >= limit.max) {
    // Oldest entry in the window tells us when a slot will free up
    const retryAfterMs = prev[0] + limit.windowMs - now
    return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) }
  }

  windows.set(key, [...prev, now])
  return { allowed: true }
}

// Periodically prune the store so it doesn't grow unbounded in long-lived instances
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000 // keep at most 1 hour of data
  for (const [key, times] of windows) {
    const pruned = times.filter(t => t > cutoff)
    if (pruned.length === 0) windows.delete(key)
    else windows.set(key, pruned)
  }
}, 5 * 60 * 1000) // run every 5 minutes

// ── CORS helpers ─────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  }
}

function jsonResponse(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(), ...extra },
  })
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Extract operation name from the path: /api/auth/<operation>
  const url       = new URL(request.url)
  const operation = url.pathname.split('/').pop()

  if (!LIMITS[operation]) {
    return jsonResponse({ error: 'Not found' }, 404)
  }

  // ── Get client IP ──
  // Netlify sets x-nf-client-connection-ip to the real client IP (not a proxy).
  // Fall back to x-forwarded-for if running outside Netlify infra (e.g. netlify dev).
  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'

  // ── Rate limit check ──
  const { allowed, retryAfter } = checkLimit(ip, operation)
  if (!allowed) {
    return jsonResponse(
      { error: 'Too many requests. Please try again later.' },
      429,
      { 'Retry-After': String(retryAfter) },
    )
  }

  // ── Forward to Supabase ──
  const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')
  const SUPABASE_KEY = Deno.env.get('VITE_SUPABASE_ANON_KEY')

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[auth-proxy] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
    return jsonResponse({ error: 'Server configuration error.' }, 500)
  }

  // For signup, forward the redirect_to query param so Supabase sends the right
  // confirmation link URL (e.g. https://nook-hub.com rather than localhost).
  let upstreamPath = SUPABASE_PATH[operation]
  if (operation === 'signup') {
    const redirectTo = url.searchParams.get('redirect_to')
    if (redirectTo) upstreamPath += `?redirect_to=${encodeURIComponent(redirectTo)}`
  }

  let body = '{}'
  try { body = await request.text() } catch { /* use empty body */ }

  let upstream
  try {
    upstream = await fetch(`${SUPABASE_URL}${upstreamPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body,
    })
  } catch (e) {
    console.error('[auth-proxy] Upstream fetch failed:', e)
    return jsonResponse({ error: 'Upstream request failed. Please try again.' }, 502)
  }

  const responseText = await upstream.text()
  return new Response(responseText, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// Route configuration — Netlify reads this export to know which paths to handle
export const config = {
  path: ['/api/auth/login', '/api/auth/signup', '/api/auth/reset-password'],
}
