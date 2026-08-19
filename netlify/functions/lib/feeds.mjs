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
    // Tried in order, first one that yields items wins.
    //   /topic  — the trending directory ("Discover Trending Topics And
    //             Products"). Singular. /topics 404s — and its 404 page
    //             happens to show trending cards too, which is why a broken
    //             URL still returned data.
    //   /       — homepage, smaller featured set
    //   /blog   — real articles; less timely but stable, so the card is
    //             never empty just because the topic markup changed
    urls: [
      'https://explodingtopics.com/topic',
      'https://explodingtopics.com/',
      'https://explodingtopics.com/blog',
    ],
    url: 'https://explodingtopics.com/topic',   // kept for logging
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
    if (!res.ok) {
      // Distinguish "they blocked us" from "we parsed it wrong" — this ends up
      // in daily_feed.error, so make it say something useful.
      const hint =
        res.status === 403 ? ' (blocked — likely bot protection on the data-centre IP)' :
        res.status === 404 ? ' (page moved?)' :
        res.status === 429 ? ' (rate limited)' : '';
      throw new Error(`HTTP ${res.status} ${res.statusText}${hint}`);
    }
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

// Exploding Topics ships its data as a `__NEXT_DATA__ = {…}` assignment.
// Pull it out by brace-matching (a regex can't balance braces, and the payload
// is ~250KB of nested JSON).
function extractNextData(html) {
  const marker = html.indexOf('__NEXT_DATA__');
  if (marker === -1) return null;
  const start = html.indexOf('{', marker);
  if (start === -1) return null;

  let depth = 0, inStr = false, esc = false;
  for (let p = start; p < html.length; p++) {
    const c = html[p];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, p + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

/** 2400 → "2.4K", 165000 → "165K", 1830000 → "1.83M" — as the site shows them. */
function formatVolume(n) {
  if (typeof n !== 'number' || !isFinite(n) || n <= 0) return '';
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) {
    const k = n / 1000;
    return `${k < 10 || k % 1 >= 0.05 ? Number(k.toFixed(1)) : Math.round(k)}K`;
  }
  return `${Number((n / 1e6).toFixed(2))}M`;
}

/** growth is a multiplier keyed by period: {"24": 2.33} → "+233%". */
function formatGrowth(growth) {
  if (growth == null) return '';
  let v = growth;
  if (typeof v === 'object') {
    // Prefer the longest period available (24 months), else whatever is there.
    const keys = Object.keys(v).sort((a, b) => Number(b) - Number(a));
    v = keys.length ? v[keys[0]] : null;
  }
  if (typeof v !== 'number' || !isFinite(v)) return '';
  const pct = Math.round(v * 100);
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

export function parseExplodingTopics(html, limit) {
  const out = [];
  const seen = new Set();

  const titleCase = (slug) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Fallback only. Real topic paths come from the payload, because some carry
  // a disambiguating suffix ("Pdrn serum" → pdrn-serum-nLoLq6tz) that can't be
  // derived from the name.
  const slugify = (name) => String(name)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  // Tags become spaces, not nothing — otherwise adjacent <span>s fuse
  // ("PowerBank" + "2.4K" → "PowerBank2.4K") and the figures stop matching.
  const spacedText = (frag, maxLen) => clean(String(frag).replace(/<[^>]*>/g, ' '), maxLen);

  const push = (slug, title, growth, volume, path = 'topic', desc = '') => {
    if (!slug || seen.has(slug) || out.length >= limit) return;
    if (path === 'topic' && SLUG_BLOCKLIST.has(slug)) return;
    seen.add(slug);
    const bits = [];
    if (growth) bits.push(`${growth} growth`);
    if (volume) bits.push(`${volume} monthly searches`);
    // "+233% growth · 2.4K monthly searches — A 20K power bank is a…"
    const summary = desc ? (bits.length ? `${bits.join(' · ')} — ${desc}` : desc) : bits.join(' · ');
    out.push({
      title: title || titleCase(slug),
      url: `https://explodingtopics.com/${path}/${slug}`,
      summary,
      image: null,
      author: null,
      publishedAt: null,
      meta: growth || null,
    });
  };

  // ── Strategy 1: the __NEXT_DATA__ payload, read precisely ────────────────
  // props.pageProps.data.trends is the main grid (30 entries, sorted by
  // growth); trendingDesktopData.trends is the smaller featured strip. Each
  // entry gives us everything the card shows:
  //   keyword · path · growth{"24"} · keywordDataGlobal.vol · briefDescription
  const nextData = extractNextData(html);
  if (nextData) {
    const pp = nextData?.props?.pageProps || {};
    const lists = [pp?.data?.trends, pp?.trendingDesktopData?.trends].filter(Array.isArray);

    for (const list of lists) {
      for (const t of list) {
        if (!t || typeof t !== 'object') continue;
        const name = t.keyword || t.name || t.title;
        const slug = t.path || t.slug;
        if (typeof name !== 'string' || typeof slug !== 'string') continue;
        push(
          slug,
          clean(name, 120),
          formatGrowth(t.growth ?? t.growthRate),
          formatVolume(t.keywordDataGlobal?.vol ?? t.volume ?? t.searchVolume),
          'topic',
          clean(t.briefDescription || t.description || '', 180)
        );
        if (out.length >= limit) return out;
      }
      if (out.length) return out;
    }
  }

  // ── Strategy 2: generic scan of any embedded JSON ────────────────────────
  // Deliberately strict. An earlier version accepted any object with a
  // slug + title, which happily matched blogDesktopData.latestBlogPosts and
  // emitted blog articles under /topic/… — right-looking titles, dead links.
  // A trend must look like a trend.
  if (nextData) {
    const found = [];
    (function walk(node, depth) {
      if (!node || depth > 10 || found.length >= limit * 4) return;
      if (Array.isArray(node)) { node.forEach(n => walk(n, depth + 1)); return; }
      if (typeof node !== 'object') return;
      const name = node.keyword || node.name;
      const slug = node.path || node.slug;
      const looksLikeTrend =
        typeof name === 'string' && typeof slug === 'string' &&
        (node.growth != null || node.keywordDataGlobal != null || node.searchHistory != null);
      if (looksLikeTrend) found.push(node);
      Object.values(node).forEach(v => walk(v, depth + 1));
    })(nextData, 0);

    for (const t of found) {
      push(
        t.path || t.slug,
        clean(t.keyword || t.name, 120),
        formatGrowth(t.growth ?? t.growthRate),
        formatVolume(t.keywordDataGlobal?.vol ?? t.volume ?? t.searchVolume),
        'topic',
        clean(t.briefDescription || t.description || '', 180)
      );
      if (out.length >= limit) return out;
    }
    if (out.length) return out;
  }

  // ── Strategy 3: card scan around each /topic/<slug> link ────────────────
  // For when the payload shape changes. The cards read, in DOM order:
  //   title · "2.4K Volume" · "+233% Growth" · sparkline · description.
  const linkRe = /href="(?:https:\/\/explodingtopics\.com)?\/topic\/([a-zA-Z0-9-]{2,70})"/g;
  for (const m of html.matchAll(linkRe)) {
    const slug = m[1];
    if (seen.has(slug) || SLUG_BLOCKLIST.has(slug)) continue;

    // Start the window after the opening tag closes, or leftover attributes
    // survive tag-stripping and get glued onto the title.
    const rest = html.slice(m.index + m[0].length, m.index + m[0].length + 1700);
    const gt = rest.indexOf('>');
    const text = spacedText(gt > -1 ? rest.slice(gt + 1) : rest, 0);

    const volume = (text.match(/(\d[\d,.]*\s*[KMB]?)\s*(?:Volume|searches|\/\s*mo)\b/i) || [])[1] || '';
    const growth = (text.match(/([+\-]?\d[\d,.]*\s*%)\s*Growth\b/i) || [])[1]
                || (text.match(/([+\-]?\d[\d,.]*\s*%)/) || [])[1] || '';

    const figureAt = text.search(/\d[\d,.]*\s*[KMB]?\s*(?:Volume|searches)|[+\-]?\d[\d,.]*\s*%/i);
    let title = (figureAt > 0 ? text.slice(0, figureAt) : '').trim();
    if (!title || title.length > 90 || /^[\d\s.,%+-]*$/.test(title)) title = '';

    let desc = '';
    const growthAt = text.search(/Growth\b/i);
    if (growthAt > -1) {
      desc = text.slice(growthAt + 6).replace(/\b(19|20)\d{2}\b/g, ' ').replace(/\s{2,}/g, ' ').trim();
      const stop = desc.search(/(?<=[.!?])\s/);
      if (stop > 20) desc = desc.slice(0, stop + 1);
      desc = clean(desc, 180);
      if (desc.split(' ').length < 4) desc = '';
    }

    push(slug, title, growth, volume, 'topic', desc);
    if (out.length >= limit) return out;
  }
  if (out.length) return out;

  // ── Strategy 3b: read the visible card text, ignoring links entirely ────
  {
    const flat = spacedText(html, 0);
    const cardRe = /([^.!?|]{2,80}?)\s+(\d[\d,.]*\s*[KMB]?)\s*Volume\s*([+\-]?\d[\d,.]*\s*%)\s*Growth\b/gi;
    const hits = [...flat.matchAll(cardRe)];

    for (let i = 0; i < hits.length; i++) {
      const m = hits[i];
      let raw = m[1].trim();
      const chrome = [...raw.matchAll(CHROME_RE)];
      if (chrome.length) {
        const last = chrome[chrome.length - 1];
        const after = raw.slice(last.index + last[0].length).trim();
        if (after && after.split(/\s+/).filter(Boolean).length <= 6) raw = after;
      }
      const name = raw.split(/\s+/).slice(-6).join(' ').replace(/^[^A-Za-z0-9]+/, '').trim();
      if (!name || name.length < 2) continue;
      const slug = slugify(name);
      if (!slug) continue;

      const from = m.index + m[0].length;
      const to = i + 1 < hits.length ? hits[i + 1].index : Math.min(flat.length, from + 400);
      let desc = flat.slice(from, to).replace(/\b(19|20)\d{2}\b/g, ' ').replace(/\s{2,}/g, ' ').trim();
      const lastStop = desc.search(/[.!?](?=[^.!?]*$)/);
      if (lastStop > 20) desc = desc.slice(0, lastStop + 1);
      desc = clean(desc, 180);
      if (desc.split(' ').length < 4) desc = '';

      push(slug, name, m[3].trim(), m[2].trim(), 'topic', desc);
      if (out.length >= limit) return out;
    }
  }
  if (out.length) return out;

  // ── Strategy 4: bare slugs anywhere in the markup ────────────────────────
  for (const m of html.matchAll(/\/topic\/([a-zA-Z0-9][a-zA-Z0-9-]{2,69})\b/g)) {
    push(m[1], '', '', '');
    if (out.length >= limit) return out;
  }
  if (out.length) return out;

  // ── Strategy 5: blog articles, correctly labelled as /blog/ ─────────────
  // Last resort. Still genuine Exploding Topics content, and crucially the
  // links actually resolve.
  const blogRe = /href="(?:https:\/\/explodingtopics\.com)?\/blog\/([a-z0-9-]{3,80})"[^>]*>([\s\S]{0,300}?)<\/a>/gi;
  for (const m of html.matchAll(blogRe)) {
    push(m[1], spacedText(m[2] || '', 160), '', '', 'blog');
    if (out.length >= limit) return out;
  }

  return out;
}

// Page furniture on /topic — the filter row, headings and table labels. Used
// to stop the first card's name absorbing the UI text that precedes it.
const CHROME_RE = /(?:Past\s+\d+\s+Years?|All\s+Categories|Search\s+Trends|Discover\s+Trending\s+Topics(?:\s+And\s+Products)?|Sort\s+By|Stable|Volume|Growth|PRO)/gi;

// Nav, footer and marketing links that live on the same pages as real topics.
const SLUG_BLOCKLIST = new Set([
  'all', 'new', 'top', 'trending', 'pricing', 'about', 'login', 'signup',
  'blog', 'topics', 'contact', 'privacy', 'terms', 'api', 'meta-trends',
  'categories', 'search', 'dashboard', 'faq', 'help',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Fetch one source
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchSource(source) {
  const started = Date.now();
  const parse = source.kind === 'exploding' ? parseExplodingTopics : parseFeed;
  const limit = source.limit || 8;

  // Most sources have one URL. Exploding Topics has several, tried in order,
  // because it has no feed and its markup is not a contract.
  const urls = source.urls?.length ? source.urls : [source.url];
  const attempts = [];

  for (const url of urls) {
    try {
      const body = await fetchText(url);
      const items = parse(body, limit);
      if (items.length) {
        return {
          source_id: source.id,
          source_name: source.name,
          items,
          fetched_at: new Date().toISOString(),
          ok: true,
          // Succeeded — but if we had to fall back, keep the trail. The UI only
          // reads `error` when ok === false, so this is invisible to users and
          // available in the table when something needs explaining.
          error: attempts.length
            ? `ok via ${url} after: ${attempts.join(' | ')}`.slice(0, 600)
            : null,
          _ms: Date.now() - started,
          _via: url,
        };
      }
      attempts.push(`${url} → fetched ${body.length} bytes, no items matched`);
    } catch (err) {
      attempts.push(`${url} → ${String(err?.message || err)}`);
    }
  }

  return {
    source_id: source.id,
    source_name: source.name,
    items: [],
    fetched_at: new Date().toISOString(),
    ok: false,
    // Every attempt, so daily_feed.error tells you what actually happened
    // rather than just "no items".
    error: attempts.join(' | ').slice(0, 600),
    _ms: Date.now() - started,
  };
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
  const payload = rows.map(({ _ms, _via, ...r }) => r); // strip debug-only fields
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
    rows.map(r => [r.source_id, r.ok
      ? `${r.items.length} items (${r._ms}ms)${r._via && r._via !== SOURCES.find(s => s.id === r.source_id)?.url ? ` via ${r._via}` : ''}`
      : `FAILED: ${r.error}`])
  );
  const durationMs = Date.now() - started;
  const allOk = rows.every(r => r.ok);

  await logRun({ trigger, ok: allOk, summary, durationMs });

  return { ok: allOk, durationMs, rows, summary };
}
