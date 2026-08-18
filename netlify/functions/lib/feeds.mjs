/**
 * Morning Nook — feed sources, RSS/Atom parser, and fetch orchestration.
 *
 * Zero dependencies. Runs on Netlify Functions (Node 18+).
 * Shared by:
 *   - morning-nook-refresh.mjs  (scheduled, 6am)
 *   - morning-nook.mjs          (HTTP: read + manual refresh)
 */

// ─────────────────────────────────────────────────────────────────────────────
// SOURCES
//
// To add a source: drop another object in this array, then add a matching row
// in supabase-morning-nook.sql (or just let the upsert create it), and add the
// same id to MORNING_NOOK_SOURCES in src/MorningNook.jsx so it shows in the UI.
// ─────────────────────────────────────────────────────────────────────────────
export const SOURCES = [
  {
    id: 'morningbrew',
    name: 'Morning Brew',
    kind: 'rss',
    url: 'https://www.morningbrew.com/feed',
    limit: 8,
  },
  {
    id: 'bbc',
    name: 'BBC News',
    kind: 'rss',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    limit: 8,
  },
  {
    id: 'bbc-world',
    name: 'BBC World',
    kind: 'rss',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    limit: 6,
  },
  {
    id: 'bbc-tech',
    name: 'BBC Technology',
    kind: 'rss',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    limit: 6,
  },
  {
    id: 'bbc-business',
    name: 'BBC Business',
    kind: 'rss',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    limit: 6,
  },
  {
    id: 'rte',
    name: 'RTÉ News',
    kind: 'rss',
    url: 'https://www.rte.ie/feeds/rss/?index=/news/',
    limit: 8,
  },
  {
    id: 'rte-business',
    name: 'RTÉ Business',
    kind: 'rss',
    url: 'https://www.rte.ie/feeds/rss/?index=/news/business/',
    limit: 6,
  },
  {
    id: 'rte-ents',
    name: 'RTÉ Entertainment',
    kind: 'rss',
    url: 'https://www.rte.ie/feeds/rss/?index=/entertainment/',
    limit: 6,
  },
  {
    id: 'exploding',
    name: 'Exploding Topics',
    kind: 'exploding',            // custom scraper — no RSS feed exists
    url: 'https://explodingtopics.com/',
    limit: 8,
  },
  {
    id: 'trends-ie',
    name: 'Trending in Ireland',
    kind: 'rss',
    url: 'https://trends.google.com/trending/rss?geo=IE',
    limit: 8,
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    kind: 'rss',
    url: 'https://hnrss.org/frontpage?points=100',
    limit: 6,
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    kind: 'rss',
    url: 'https://techcrunch.com/feed/',
    limit: 6,
  },
];

// Pretend to be a normal browser. Several publishers (RTÉ in particular)
// return 403 to requests with no User-Agent or an obvious bot UA.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FETCH_HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
  'Accept-Language': 'en-IE,en-GB;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

const FETCH_TIMEOUT_MS = 12000;

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// XML / HTML helpers
// ─────────────────────────────────────────────────────────────────────────────

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  '#39': "'", '#039': "'", '#x27': "'", '#x2019': '’', '#8217': '’',
  '#8216': '‘', '#8220': '“', '#8221': '”', '#8230': '…',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  hellip: '…', mdash: '—', ndash: '–', eacute: 'é',
  Eacute: 'É', pound: '£', euro: '€', deg: '°',
};

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*|#x?[0-9a-fA-F]+);/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(ENTITIES, name) ? ENTITIES[name] : m
    );
}

/** Strip CDATA wrappers, HTML tags, entities and collapse whitespace. */
function clean(str, maxLen = 0) {
  if (!str) return '';
  let s = String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '');
  s = decodeEntities(s)
    .replace(/<[^>]*>/g, '')                            // markup that was entity-encoded
    .replace(/[\u00a0\u200b\ufeff]/g, ' ')             // nbsp / zero-width / BOM
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '') // control chars
    .replace(/\s+/g, ' ')
    .trim();
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…';
  return s;
}

/** Grab the inner text of the first <tag>…</tag> inside `xml`. */
function tag(xml, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

/** Grab an attribute off the first self-closing or open tag named `name`. */
function tagAttr(xml, name, attr) {
  const re = new RegExp(`<${name}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = xml.match(re);
  return m ? decodeEntities(m[1]) : '';
}

function toIso(dateStr) {
  if (!dateStr) return null;
  const d = new Date(clean(dateStr));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Only http/https links are ever stored — same allowlist idea as sanitizeUrl. */
function safeUrl(url) {
  const u = clean(url);
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) return '';
  return u;
}

// ─────────────────────────────────────────────────────────────────────────────
// RSS 2.0 + Atom parser
// ─────────────────────────────────────────────────────────────────────────────

export function parseFeed(xml, limit) {
  const items = [];

  // RSS <item>
  const rssBlocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];
  for (const block of rssBlocks) {
    const link =
      safeUrl(tag(block, 'link')) ||
      safeUrl(tagAttr(block, 'link', 'href')) ||
      safeUrl(tag(block, 'guid'));
    const title = clean(tag(block, 'title'), 180);
    if (!title || !link) continue;

    const image =
      safeUrl(tagAttr(block, 'media:thumbnail', 'url')) ||
      safeUrl(tagAttr(block, 'media:content', 'url')) ||
      safeUrl(tagAttr(block, 'enclosure', 'url')) ||
      safeUrl(tag(block, 'ht:picture')) ||
      '';

    items.push({
      title,
      url: link,
      summary: clean(tag(block, 'description') || tag(block, 'content:encoded'), 240),
      image: image || null,
      author: clean(tag(block, 'dc:creator') || tag(block, 'author'), 60) || null,
      publishedAt: toIso(tag(block, 'pubDate') || tag(block, 'dc:date')),
      meta: clean(tag(block, 'ht:approx_traffic'), 30) || null,
    });
    if (items.length >= limit) break;
  }

  if (items.length) return items;

  // Atom <entry>
  const atomBlocks = xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) || [];
  for (const block of atomBlocks) {
    const link = safeUrl(tagAttr(block, 'link', 'href')) || safeUrl(tag(block, 'id'));
    const title = clean(tag(block, 'title'), 180);
    if (!title || !link) continue;
    items.push({
      title,
      url: link,
      summary: clean(tag(block, 'summary') || tag(block, 'content'), 240),
      image: null,
      author: clean(tag(tag(block, 'author'), 'name'), 60) || null,
      publishedAt: toIso(tag(block, 'updated') || tag(block, 'published')),
      meta: null,
    });
    if (items.length >= limit) break;
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exploding Topics — no RSS feed exists, so we read the homepage.
//
// Three strategies, tried in order, so a redesign of their site degrades to
// "fewer details" rather than "broken". If all three fail we return an empty
// list with an error string, and the widget shows a friendly notice while
// every other source keeps working.
// ─────────────────────────────────────────────────────────────────────────────

export function parseExplodingTopics(html, limit) {
  const out = [];
  const seen = new Set();

  const push = (slug, title, growth, volume) => {
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    out.push({
      title: title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      url: `https://explodingtopics.com/topic/${slug}`,
      summary: [growth ? `${growth} growth` : '', volume ? `${volume} monthly searches` : '']
        .filter(Boolean).join(' · '),
      image: null,
      author: null,
      publishedAt: null,
      meta: growth || null,
    });
  };

  // Strategy 1 — Next.js pages-router payload.
  const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextData) {
    try {
      const json = JSON.parse(nextData[1]);
      const found = [];
      (function walk(node, depth) {
        if (!node || depth > 8 || found.length >= limit * 3) return;
        if (Array.isArray(node)) { node.forEach(n => walk(n, depth + 1)); return; }
        if (typeof node !== 'object') return;
        const slug = node.slug || node.topicSlug || node.permalink;
        const name = node.name || node.title || node.topic;
        if (typeof slug === 'string' && typeof name === 'string' && slug.length < 80) {
          found.push({
            slug,
            name,
            growth: node.growth ?? node.growthRate ?? node.change ?? null,
            volume: node.volume ?? node.searchVolume ?? null,
          });
        }
        Object.values(node).forEach(v => walk(v, depth + 1));
      })(json, 0);

      for (const f of found) {
        const growth = f.growth == null ? '' :
          (typeof f.growth === 'number' ? `+${Math.round(f.growth)}%` : String(f.growth));
        const volume = f.volume == null ? '' : String(f.volume);
        push(f.slug, clean(f.name, 120), growth, volume);
        if (out.length >= limit) return out;
      }
    } catch { /* fall through */ }
  }
  if (out.length) return out;

  // Strategy 2 — App-router streamed payload: pull slug/name pairs out of the
  // flight data embedded in self.__next_f.push("...") chunks.
  // Quotes may be backslash-escaped (the JSON is embedded inside a JS string).
  const Q = '\\\\?"';
  const flightRe = new RegExp(
    `${Q}slug${Q}\\s*:\\s*${Q}([a-z0-9-]{2,60})${Q}\\s*,\\s*${Q}name${Q}\\s*:\\s*${Q}((?:[^"\\\\]|\\\\.){2,120}?)${Q}`,
    'gi'
  );
  for (const m of html.matchAll(flightRe)) {
    push(m[1], clean(m[2].replace(/\\"/g, '"'), 120), '', '');
    if (out.length >= limit) return out;
  }
  if (out.length) return out;

  // Strategy 3 — plain HTML: every /topic/<slug> anchor on the page.
  const anchors = html.match(/href="\/topic\/([a-z0-9-]{2,60})"[^>]*>([\s\S]{0,160}?)<\/a>/gi) || [];
  for (const a of anchors) {
    const m = a.match(/href="\/topic\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (m) push(m[1], clean(m[2], 120), '', '');
    if (out.length >= limit) return out;
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch one source
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchSource(source) {
  const started = Date.now();
  try {
    const body = await fetchText(source.url);
    const items = source.kind === 'exploding'
      ? parseExplodingTopics(body, source.limit || 8)
      : parseFeed(body, source.limit || 8);

    if (!items.length) throw new Error('Feed returned no readable items');

    return {
      source_id: source.id,
      source_name: source.name,
      items,
      fetched_at: new Date().toISOString(),
      ok: true,
      error: null,
      _ms: Date.now() - started,
    };
  } catch (err) {
    return {
      source_id: source.id,
      source_name: source.name,
      items: [],
      fetched_at: new Date().toISOString(),
      ok: false,
      error: String(err?.message || err).slice(0, 300),
      _ms: Date.now() - started,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase writes — raw PostgREST, no SDK, so the function bundle stays tiny.
// Uses the SERVICE ROLE key, which bypasses RLS (the daily_feed table has no
// write policies at all, so this is the only way rows can change).
// ─────────────────────────────────────────────────────────────────────────────

function supabaseEnv() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) env var');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  return { url: url.replace(/\/$/, ''), key };
}

async function supabaseRequest(path, { method = 'GET', body, prefer } = {}) {
  const { url, key } = supabaseEnv();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/** Upsert every source row in one round-trip. */
export async function writeResults(rows) {
  const payload = rows.map(({ _ms, ...r }) => r); // strip timing field
  await supabaseRequest('daily_feed?on_conflict=source_id', {
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

export async function logRun({ trigger, ok, summary, durationMs }) {
  try {
    await supabaseRequest('daily_feed_runs', {
      method: 'POST',
      body: [{ trigger, ok, summary, duration_ms: durationMs }],
      prefer: 'return=minimal',
    });
  } catch { /* logging must never break the run */ }
}

export async function readCache() {
  return await supabaseRequest('daily_feed?select=*');
}

// ─────────────────────────────────────────────────────────────────────────────
// The whole job
// ─────────────────────────────────────────────────────────────────────────────

export async function refreshAll({ trigger = 'schedule', only = null } = {}) {
  const started = Date.now();
  const list = only?.length ? SOURCES.filter(s => only.includes(s.id)) : SOURCES;

  // All sources in parallel — the slowest one sets the total time, not the sum.
  const rows = await Promise.all(list.map(fetchSource));

  await writeResults(rows);

  const summary = Object.fromEntries(
    rows.map(r => [r.source_id, r.ok ? `${r.items.length} items (${r._ms}ms)` : `FAILED: ${r.error}`])
  );
  const durationMs = Date.now() - started;
  const allOk = rows.every(r => r.ok);

  await logRun({ trigger, ok: allOk, summary, durationMs });

  return { ok: allOk, durationMs, rows, summary };
}
