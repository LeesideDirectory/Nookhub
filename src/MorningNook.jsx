// ============================================================================
// Morning Nook — daily updates
//
// Exports:
//   MORNING_NOOK_SOURCES  — source metadata (keep in sync with feeds.mjs)
//   MorningNookWidget     — dashboard widget (register in WIDGET_RENDERERS)
//   MorningNookPage       — full page (route as page === "morning")
//
// Everything is self-contained: palette, fonts and helpers are re-declared
// here so App.jsx doesn't need to export anything new.
// ============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';

// ─── Design tokens (mirrors the P object in App.jsx) ────────────────────────
const P = {
  lavender: "#C9B8F0", lavenderLight: "#EDE8FB", lavenderMid: "#D8CCFA",
  mint: "#B4E8D8", mintLight: "#E4F8F2",
  peach: "#F8CEBA", peachLight: "#FEF0EA",
  sky: "#B8D8F0", skyLight: "#E8F3FC",
  rose: "#F0B8C8", roseLight: "#FDE8EF",
  butter: "#F5E8B0", butterLight: "#FDFAE8",
  ink: "#3D3550", inkLight: "#6B6080", inkFaint: "#A89CC0",
  white: "#FDFCFF", bg: "#F5F2FC",
};
const FF_S = "'DM Sans', sans-serif";
const FF_D = "'DM Serif Display', serif";

const PREFS_KEY = 'morning_nook_prefs';
const lsKey = (userId) => `nook_morning_prefs_${userId}`;

// ─── Sources ────────────────────────────────────────────────────────────────
// `id` must match the id in netlify/functions/lib/feeds.mjs.
export const MORNING_NOOK_SOURCES = [
  { id: 'morningbrew',  name: 'Morning Brew',        emoji: '☕', group: 'Business',  tint: P.butterLight, accent: P.butter,   blurb: 'Business news with a sense of humour', defaultOn: true },
  { id: 'bbc',          name: 'BBC News',            emoji: '🌍', group: 'World',     tint: P.skyLight,    accent: P.sky,      blurb: 'Top stories from the BBC',            defaultOn: true },
  { id: 'bbc-world',    name: 'BBC World',           emoji: '🗺', group: 'World',     tint: P.skyLight,    accent: P.sky,      blurb: 'International headlines',             defaultOn: false },
  { id: 'bbc-tech',     name: 'BBC Technology',      emoji: '💻', group: 'Tech',      tint: P.lavenderLight, accent: P.lavender, blurb: 'Tech from the BBC',                 defaultOn: false },
  { id: 'bbc-business', name: 'BBC Business',        emoji: '📈', group: 'Business',  tint: P.butterLight, accent: P.butter,   blurb: 'Markets and companies',               defaultOn: false },
  { id: 'rte',          name: 'RTÉ News',            emoji: '🇮🇪', group: 'Ireland',   tint: P.mintLight,   accent: P.mint,     blurb: 'Irish headlines',                     defaultOn: true },
  { id: 'rte-business', name: 'RTÉ Business',        emoji: '💶', group: 'Ireland',   tint: P.mintLight,   accent: P.mint,     blurb: 'Irish business news',                 defaultOn: false },
  { id: 'rte-ents',     name: 'RTÉ Entertainment',   emoji: '🎭', group: 'Ireland',   tint: P.mintLight,   accent: P.mint,     blurb: 'Culture and entertainment',           defaultOn: false },
  { id: 'exploding',    name: 'Exploding Topics',    emoji: '🚀', group: 'Trends',    tint: P.peachLight,  accent: P.peach,    blurb: 'Trends before they go mainstream',    defaultOn: true },
  { id: 'trends-ie',    name: 'Trending in Ireland', emoji: '🔥', group: 'Trends',    tint: P.peachLight,  accent: P.peach,    blurb: "What Ireland's searching for today",  defaultOn: false },
  { id: 'hackernews',   name: 'Hacker News',         emoji: '🧠', group: 'Tech',      tint: P.lavenderLight, accent: P.lavender, blurb: 'Front page, 100+ points',           defaultOn: false },
  { id: 'techcrunch',   name: 'TechCrunch',          emoji: '⚡', group: 'Tech',      tint: P.lavenderLight, accent: P.lavender, blurb: 'Startups and funding',              defaultOn: false },
  { id: 'evolvingai',   name: 'Evolving AI',         emoji: '🧬', group: 'Tech',      tint: P.lavenderLight, accent: P.lavender, blurb: 'Daily AI news from @evolving.ai',   defaultOn: false },
];

const SOURCE_BY_ID = Object.fromEntries(MORNING_NOOK_SOURCES.map(s => [s.id, s]));
const GROUPS = [...new Set(MORNING_NOOK_SOURCES.map(s => s.group))];

const DEFAULT_PREFS = {
  sources: Object.fromEntries(MORNING_NOOK_SOURCES.map(s => [s.id, s.defaultOn])),
  perSource: 4,       // headlines shown per source
  view: 'grouped',    // 'grouped' | 'mixed'
  widgetLimit: 6,     // headlines shown in the dashboard widget
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Only http(s) links are ever rendered — mirrors sanitizeUrl in App.jsx. */
const safeHref = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : '#';
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  if (isNaN(d)) return '';
  if (d < 0) return 'just now';
  if (d < 3600000) return `${Math.max(1, Math.floor(d / 60000))}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const prettyDate = () =>
  new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' });

const mergePrefs = (saved) => {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_PREFS };
  return {
    ...DEFAULT_PREFS,
    ...saved,
    // Merge source flags so newly added sources appear with their default.
    sources: { ...DEFAULT_PREFS.sources, ...(saved.sources || {}) },
  };
};

// ─── Shared data hook ───────────────────────────────────────────────────────
// Reads the cache straight from Supabase (fast — it's just one small table)
// and `userId`'s on/off preferences from `user_data`.
//
// `userId` is *whose preferences to show*, which is not always the person
// looking. On a public profile it's the profile owner's id and `readOnly` is
// true, so a visitor sees the owner's real source selection but can't change
// it — and nothing is written to the visitor's browser or database.
//
// Reading someone else's prefs relies on the policy in
// supabase-morning-nook-public-prefs.sql, which only exposes them once that
// user has actually made their Morning Nook widget public. If they haven't,
// the query returns nothing and we fall back to the defaults.
export function useMorningNook(userId, { readOnly = false } = {}) {
  const [rows, setRows]       = useState([]);
  const [prefs, setPrefsRaw]  = useState(() => {
    // Instant load from localStorage so the widget never flashes empty.
    // Skipped in read-only mode — that cache belongs to the person browsing,
    // not to the profile they're looking at.
    if (!readOnly) {
      try {
        const cached = userId && localStorage.getItem(lsKey(userId));
        if (cached) return mergePrefs(JSON.parse(cached));
      } catch { /* ignore */ }
    }
    return { ...DEFAULT_PREFS };
  });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [error, setError]         = useState(null);
  const prefsRef = useRef(prefs);

  // Load headlines + prefs
  const load = useCallback(async () => {
    setError(null);
    try {
      const jobs = [supabase.from('daily_feed').select('*')];
      if (userId) {
        jobs.push(
          supabase.from('user_data').select('value').eq('user_id', userId).eq('key', PREFS_KEY).maybeSingle()
        );
      }
      const [feedRes, prefRes] = await Promise.all(jobs);

      if (feedRes.error) throw feedRes.error;
      setRows(feedRes.data || []);

      if (prefRes && !prefRes.error && prefRes.data?.value) {
        const merged = mergePrefs(prefRes.data.value);
        prefsRef.current = merged;
        setPrefsRaw(merged);
        if (!readOnly) {
          try { localStorage.setItem(lsKey(userId), JSON.stringify(merged)); } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.warn('[Morning Nook] load failed:', err);
      setError(err?.message || 'Could not load today’s updates');
    } finally {
      setLoading(false);
    }
  }, [userId, readOnly]);

  useEffect(() => { load(); }, [load]);

  // Persistent setter — localStorage cache + Supabase, side effects outside
  // the state updater (React 18 StrictMode double-invokes updaters).
  const setPrefs = useCallback((val) => {
    if (readOnly) return;   // viewing someone else's Nook — nothing to save
    const next = typeof val === 'function' ? val(prefsRef.current) : val;
    prefsRef.current = next;
    setPrefsRaw(next);
    if (!userId) return;
    try { localStorage.setItem(lsKey(userId), JSON.stringify(next)); } catch { /* ignore */ }
    supabase
      .from('user_data')
      .upsert({ user_id: userId, key: PREFS_KEY, value: next }, { onConflict: 'user_id,key' })
      .then(({ error: e }) => { if (e) console.warn('[Morning Nook] prefs save error', e); });
  }, [userId, readOnly]);

  const toggleSource = useCallback((id) => {
    setPrefs(p => ({ ...p, sources: { ...p.sources, [id]: !p.sources[id] } }));
  }, [setPrefs]);

  // Manual refresh — asks the Netlify function to re-fetch, then reloads.
  const refresh = useCallback(async () => {
    setRefresh(true);
    try {
      const res = await fetch('/api/morning-nook/refresh', { method: 'POST' });
      const body = await res.json().catch(() => null);
      if (body?.message) console.info('[Morning Nook]', body.message);
    } catch (err) {
      console.warn('[Morning Nook] refresh failed:', err);
    }
    await load();
    setRefresh(false);
  }, [load]);

  const enabledIds = useMemo(
    () => MORNING_NOOK_SOURCES.filter(s => prefs.sources[s.id]).map(s => s.id),
    [prefs.sources]
  );

  const rowById = useMemo(() => Object.fromEntries(rows.map(r => [r.source_id, r])), [rows]);

  const lastUpdated = useMemo(() => {
    const times = rows
      .filter(r => prefs.sources[r.source_id])
      .map(r => new Date(r.fetched_at).getTime())
      .filter(t => !isNaN(t));
    return times.length ? new Date(Math.max(...times)).toISOString() : null;
  }, [rows, prefs.sources]);

  return {
    rows, rowById, prefs, setPrefs, toggleSource, readOnly,
    enabledIds, loading, refreshing, refresh, error, lastUpdated, reload: load,
  };
}

// ─── Small building blocks ──────────────────────────────────────────────────

const Pill = ({ children, tone = P.lavenderLight, color = P.inkLight, style = {} }) => (
  <span style={{
    background: tone, borderRadius: 20, padding: '2px 9px',
    fontFamily: FF_S, fontSize: 10.5, color, fontWeight: 500,
    whiteSpace: 'nowrap', ...style,
  }}>{children}</span>
);

const Headline = ({ item, source, compact = false }) => {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={safeHref(item.url)}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        textDecoration: 'none', padding: compact ? '9px 10px' : '11px 12px',
        borderRadius: 13,
        background: hover ? P.white : 'transparent',
        boxShadow: hover ? '0 3px 12px rgba(61,53,80,0.07)' : 'none',
        transition: 'all 0.16s', border: `1px solid ${hover ? source?.accent + '99' : 'transparent'}`,
      }}
    >
      {item.image && !compact && (
        <img
          src={safeHref(item.image)}
          alt=""
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{ width: 58, height: 58, borderRadius: 11, objectFit: 'cover', flexShrink: 0, background: P.bg }}
        />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: FF_S, fontSize: compact ? 13 : 13.5, color: P.ink,
          fontWeight: 500, lineHeight: 1.4,
        }}>
          {item.title}
        </div>
        {!compact && item.summary && (
          <div style={{
            fontFamily: FF_S, fontSize: 12, color: P.inkLight, lineHeight: 1.45,
            marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.summary}
          </div>
        )}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
          {source && <Pill tone={source.tint} color={P.inkLight}>{source.emoji} {source.name}</Pill>}
          {item.meta && <Pill tone={P.peachLight} color={P.inkLight}>{item.meta}</Pill>}
          {item.author && <span style={{ fontFamily: FF_S, fontSize: 10.5, color: P.inkFaint }}>{item.author}</span>}
          {item.publishedAt && (
            <span style={{ fontFamily: FF_S, fontSize: 10.5, color: P.inkFaint }}>{timeAgo(item.publishedAt)}</span>
          )}
        </div>
      </div>
    </a>
  );
};

const SkeletonRow = ({ i = 0 }) => (
  <div style={{
    display: 'flex', gap: 12, padding: '11px 12px', alignItems: 'center',
    opacity: 1 - i * 0.15,
  }}>
    <div style={{ width: 58, height: 58, borderRadius: 11, background: P.lavenderLight, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div style={{ height: 11, borderRadius: 6, background: P.lavenderLight, width: `${90 - i * 12}%` }} />
      <div style={{ height: 9, borderRadius: 6, background: P.lavenderLight, width: '55%', marginTop: 8, opacity: 0.6 }} />
    </div>
  </div>
);

const EmptyNote = ({ icon = '🌤', title, body, children }) => (
  <div style={{
    textAlign: 'center', padding: '30px 22px', background: P.white,
    borderRadius: 16, border: `1.5px dashed ${P.lavender}77`,
  }}>
    <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 5 }}>{title}</div>
    {body && <div style={{ fontFamily: FF_S, fontSize: 12.5, color: P.inkLight, lineHeight: 1.5, maxWidth: 380, margin: '0 auto' }}>{body}</div>}
    {children}
  </div>
);

/** The on/off switch list. Used by both the widget and the page. */
export const MorningNookSourcePicker = ({ prefs, onToggle, columns = 2 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {GROUPS.map(group => (
      <div key={group}>
        <div style={{
          fontFamily: FF_S, fontSize: 10.5, letterSpacing: 1.1, textTransform: 'uppercase',
          color: P.inkFaint, fontWeight: 600, marginBottom: 8,
        }}>{group}</div>
        <div className="nook-morning-source-grid" style={{
          display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 8,
        }}>
          {MORNING_NOOK_SOURCES.filter(s => s.group === group).map(s => {
            const on = !!prefs.sources[s.id];
            return (
              <button
                key={s.id}
                onClick={() => onToggle(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  background: on ? s.tint : P.white,
                  border: `1.5px solid ${on ? s.accent : '#E6E1F2'}`,
                  borderRadius: 14, padding: '10px 12px', cursor: 'pointer',
                  fontFamily: FF_S, transition: 'all 0.18s', minWidth: 0,
                  minHeight: 44,
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{s.emoji}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{
                    display: 'block', fontSize: 12.5, color: P.ink, fontWeight: on ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{s.name}</span>
                  <span style={{
                    display: 'block', fontSize: 10.5, color: P.inkFaint, marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{s.blurb}</span>
                </span>
                <span style={{
                  width: 32, height: 18, borderRadius: 18, flexShrink: 0, padding: 2,
                  background: on ? s.accent : '#D8D4E8', display: 'flex', alignItems: 'center',
                  transition: 'background 0.25s',
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%', background: P.white,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    transform: on ? 'translateX(14px)' : 'translateX(0)',
                    transition: 'transform 0.25s',
                  }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// ─── Dashboard widget ───────────────────────────────────────────────────────
// Rendered inside WidgetCard, so it gets `data`, `color`, `isOwnDashboard` and
// `onDataChange`, plus whatever `liveData` supplies.
//
// `userId` is whose source selection to display:
//   • own dashboard   → the logged-in user's id, editable
//   • public profile  → the profile owner's id, read-only
export const MorningNookWidget = ({ color, isOwnDashboard = true, userId, onOpenPage }) => {
  const readOnly = !isOwnDashboard;
  const { rowById, prefs, toggleSource, enabledIds, loading, refreshing, refresh, lastUpdated } =
    useMorningNook(userId, { readOnly });
  const [showSettings, setShowSettings] = useState(false);

  const items = useMemo(() => {
    const all = [];
    for (const id of enabledIds) {
      const row = rowById[id];
      if (!row?.items?.length) continue;
      const src = SOURCE_BY_ID[id];
      row.items.slice(0, 3).forEach(it => all.push({ ...it, _source: src }));
    }
    // Newest first; items with no date sink to the bottom but stay grouped.
    return all
      .sort((a, b) => (new Date(b.publishedAt || 0)) - (new Date(a.publishedAt || 0)))
      .slice(0, prefs.widgetLimit);
  }, [rowById, enabledIds, prefs.widgetLimit]);

  const accent = color?.accent || P.lavender;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkLight }}>
          {prettyDate()}
          {lastUpdated && <span style={{ color: P.inkFaint }}> · updated {timeAgo(lastUpdated)}</span>}
        </div>
        {isOwnDashboard && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowSettings(v => !v)}
              title="Choose sources"
              style={{
                background: showSettings ? accent : 'none', border: `1px solid ${accent}`,
                borderRadius: 8, padding: '4px 9px', cursor: 'pointer',
                fontFamily: FF_S, fontSize: 11, color: P.inkLight,
              }}
            >⚙ Sources</button>
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Fetch the latest now"
              style={{
                background: 'none', border: `1px solid ${accent}`, borderRadius: 8,
                padding: '4px 9px', cursor: refreshing ? 'default' : 'pointer',
                fontFamily: FF_S, fontSize: 11, color: P.inkLight, opacity: refreshing ? 0.5 : 1,
              }}
            >{refreshing ? '…' : '↻'}</button>
          </div>
        )}
      </div>

      {showSettings && isOwnDashboard && (
        <div style={{
          background: P.white, borderRadius: 14, padding: 14,
          border: `1px solid ${accent}66`, maxHeight: 300, overflowY: 'auto',
        }}>
          <MorningNookSourcePicker prefs={prefs} onToggle={toggleSource} columns={1} />
        </div>
      )}

      {/* body */}
      {loading ? (
        <div>{[0, 1, 2].map(i => <SkeletonRow key={i} i={i} />)}</div>
      ) : !enabledIds.length ? (
        <EmptyNote
          icon="🔌"
          title={isOwnDashboard ? "No sources switched on" : "No sources picked yet"}
          body={isOwnDashboard
            ? "Pick the ones you want and they'll be waiting for you here every morning."
            : "This Nook doesn't have any sources switched on."}
        >
          {isOwnDashboard && (
            <button onClick={() => setShowSettings(true)} style={{
              marginTop: 12, background: accent, border: 'none', borderRadius: 11,
              padding: '8px 18px', cursor: 'pointer', fontFamily: FF_S, fontSize: 12.5,
              color: P.ink, fontWeight: 600,
            }}>Choose sources</button>
          )}
        </EmptyNote>
      ) : !items.length ? (
        <EmptyNote
          icon="🌙"
          title="Nothing here yet"
          body="The first batch lands at 6am. Hit ↻ if you'd like it now."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((it, i) => (
            <Headline key={`${it.url}-${i}`} item={it} source={it._source} compact />
          ))}
        </div>
      )}

      {onOpenPage && !!items.length && (
        <button
          onClick={onOpenPage}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: FF_S,
            fontSize: 12, color: P.inkLight, textAlign: 'left', padding: '4px 12px',
            alignSelf: 'flex-start',
          }}
        >Open Morning Nook →</button>
      )}
    </div>
  );
};

// ─── Full page ──────────────────────────────────────────────────────────────
export const MorningNookPage = ({ userId, displayName, onNavigate, readOnly = false }) => {
  const {
    rowById, prefs, setPrefs, toggleSource, enabledIds,
    loading, refreshing, refresh, error, lastUpdated,
  } = useMorningNook(userId, { readOnly });

  const [showSettings, setShowSettings] = useState(false);

  const mixed = useMemo(() => {
    const all = [];
    for (const id of enabledIds) {
      const row = rowById[id];
      if (!row?.items?.length) continue;
      row.items.slice(0, prefs.perSource).forEach(it => all.push({ ...it, _source: SOURCE_BY_ID[id] }));
    }
    return all.sort((a, b) => (new Date(b.publishedAt || 0)) - (new Date(a.publishedAt || 0)));
  }, [rowById, enabledIds, prefs.perSource]);

  const failing = enabledIds.filter(id => rowById[id] && rowById[id].ok === false);
  const firstName = (displayName || '').trim().split(/\s+/)[0];

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 64px' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${P.lavenderLight}, ${P.peachLight})`,
        borderRadius: 24, padding: '28px 30px', border: `1.5px solid ${P.lavender}66`,
        marginBottom: 22,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FF_D, fontSize: 30, color: P.ink, lineHeight: 1.15 }}>
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </div>
            <div style={{ fontFamily: FF_S, fontSize: 13.5, color: P.inkLight, marginTop: 6 }}>
              {prettyDate()}
              {lastUpdated && <> · gathered {timeAgo(lastUpdated)}</>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={refresh}
              disabled={refreshing}
              style={{
                background: P.white, border: `1.5px solid ${P.lavender}`, borderRadius: 12,
                padding: '9px 16px', cursor: refreshing ? 'default' : 'pointer',
                fontFamily: FF_S, fontSize: 13, color: P.ink, opacity: refreshing ? 0.55 : 1,
                minHeight: 44,
              }}
            >{refreshing ? 'Refreshing…' : '↻ Refresh'}</button>
          </div>
        </div>
      </div>

      {/* ── Customise banner ─────────────────────────────────────────────── */}
      {/* Sits directly under the greeting so changing sources is impossible to
          miss. The whole strip is the button. */}
      {!readOnly && (
        <button
          onClick={() => setShowSettings(v => !v)}
          className="nook-morning-banner"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            textAlign: 'left', cursor: 'pointer', marginBottom: 22,
            background: showSettings ? P.lavenderLight : P.white,
            border: `1.5px solid ${P.lavender}`, borderRadius: 20,
            padding: '16px 20px', fontFamily: FF_S,
            boxShadow: showSettings ? 'none' : '0 3px 14px rgba(201,184,240,0.16)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = P.lavenderLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = showSettings ? P.lavenderLight : P.white; }}
        >
          <span style={{
            width: 40, height: 40, borderRadius: 13, background: P.lavender,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, flexShrink: 0,
          }}>⚙</span>

          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              display: 'block', fontFamily: FF_D, fontSize: 17, color: P.ink, lineHeight: 1.25,
            }}>
              {showSettings ? 'Done choosing sources' : 'Customise your sources'}
            </span>
            <span style={{
              display: 'block', fontSize: 12.5, color: P.inkLight, marginTop: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {enabledIds.length === 0
                ? `Nothing switched on yet — ${MORNING_NOOK_SOURCES.length} to choose from`
                : `${enabledIds.length} of ${MORNING_NOOK_SOURCES.length} on · ${enabledIds.map(id => SOURCE_BY_ID[id]?.name).filter(Boolean).join(', ')}`}
            </span>
          </span>

          <span className="nook-morning-banner-cta" style={{
            flexShrink: 0, background: P.lavender, borderRadius: 11,
            padding: '9px 15px', fontSize: 12.5, color: P.ink, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            {showSettings ? 'Close' : 'Choose sources'}
            <span style={{
              display: 'inline-block', fontSize: 11,
              transform: showSettings ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}>▾</span>
          </span>
        </button>
      )}

      {/* ── Source picker ────────────────────────────────────────────────── */}
      {showSettings && !readOnly && (
        <div style={{
          background: P.white, borderRadius: 20, padding: '22px 24px',
          border: `1.5px solid ${P.lavender}55`, marginBottom: 22,
          boxShadow: '0 4px 20px rgba(201,184,240,0.12)',
        }}>
          <div style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, marginBottom: 4 }}>
            Your sources
          </div>
          <div style={{ fontFamily: FF_S, fontSize: 12.5, color: P.inkLight, marginBottom: 18 }}>
            Tap any source to switch it on or off. Changes save straight away and follow you across devices.
          </div>

          <MorningNookSourcePicker prefs={prefs} onToggle={toggleSource} columns={2} />

          {/* Layout preferences */}
          <div style={{ height: 1, background: P.lavender + '44', margin: '20px 0 16px' }} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkLight, marginBottom: 7 }}>Layout</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['grouped', 'By source'], ['mixed', 'All mixed']].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setPrefs(p => ({ ...p, view: v }))}
                    style={{
                      background: prefs.view === v ? P.lavender : P.white,
                      border: `1.5px solid ${prefs.view === v ? P.lavender : '#E6E1F2'}`,
                      borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
                      fontFamily: FF_S, fontSize: 12, color: P.ink,
                      fontWeight: prefs.view === v ? 600 : 400, minHeight: 40,
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkLight, marginBottom: 7 }}>
                Headlines per source
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[3, 4, 6, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setPrefs(p => ({ ...p, perSource: n }))}
                    style={{
                      background: prefs.perSource === n ? P.lavender : P.white,
                      border: `1.5px solid ${prefs.perSource === n ? P.lavender : '#E6E1F2'}`,
                      borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
                      fontFamily: FF_S, fontSize: 12, color: P.ink,
                      fontWeight: prefs.perSource === n ? 600 : 400, minHeight: 40, minWidth: 40,
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Notices ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: P.roseLight, border: `1.5px solid ${P.rose}`, borderRadius: 14,
          padding: '12px 16px', marginBottom: 16, fontFamily: FF_S, fontSize: 12.5, color: P.ink,
        }}>
          Couldn't load today's updates. {error}
        </div>
      )}
      {!!failing.length && (
        <div style={{
          background: P.butterLight, border: `1.5px solid ${P.butter}`, borderRadius: 14,
          padding: '12px 16px', marginBottom: 16, fontFamily: FF_S, fontSize: 12.5, color: P.inkLight,
        }}>
          {failing.map(id => SOURCE_BY_ID[id]?.name || id).join(', ')}
          {failing.length === 1 ? " didn't respond" : " didn't respond"} this morning — everything else is up to date.
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ background: P.white, borderRadius: 20, padding: 16, border: `1.5px solid ${P.lavender}44` }}>
          {[0, 1, 2, 3].map(i => <SkeletonRow key={i} i={i} />)}
        </div>
      ) : !enabledIds.length ? (
        <EmptyNote
          icon="🔌"
          title={readOnly ? "No sources picked yet" : "No sources switched on yet"}
          body={readOnly
            ? "This Nook doesn't have any sources switched on."
            : "Pick a few and they'll be here waiting for you tomorrow at 6am."}
        >
          {!readOnly && (
            <button onClick={() => setShowSettings(true)} style={{
              marginTop: 14, background: P.lavender, border: 'none', borderRadius: 12,
              padding: '10px 22px', cursor: 'pointer', fontFamily: FF_S, fontSize: 13,
              color: P.ink, fontWeight: 600,
            }}>Choose sources ↑</button>
          )}
        </EmptyNote>
      ) : prefs.view === 'mixed' ? (
        mixed.length ? (
          <div style={{
            background: P.white, borderRadius: 20, padding: '10px 12px',
            border: `1.5px solid ${P.lavender}44`, display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {mixed.map((it, i) => <Headline key={`${it.url}-${i}`} item={it} source={it._source} />)}
          </div>
        ) : (
          <EmptyNote icon="🌙" title="Nothing to show yet" body="The first batch lands at 6am. Hit ↻ Refresh to pull it in now." />
        )
      ) : (
        <div className="nook-morning-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16,
        }}>
          {enabledIds.map(id => {
            const src = SOURCE_BY_ID[id];
            const row = rowById[id];
            const items = (row?.items || []).slice(0, prefs.perSource);
            return (
              <div key={id} style={{
                background: src.tint, borderRadius: 20, padding: '18px 18px 12px',
                border: `1.5px solid ${src.accent}`, minWidth: 0,
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: src.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, flexShrink: 0,
                  }}>{src.emoji}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontFamily: FF_D, fontSize: 16, color: P.ink,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{src.name}</div>
                    <div style={{ fontFamily: FF_S, fontSize: 10.5, color: P.inkFaint }}>
                      {row?.fetched_at ? `updated ${timeAgo(row.fetched_at)}` : 'not fetched yet'}
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => toggleSource(id)}
                      title={`Turn off ${src.name}`}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: P.inkFaint, fontSize: 15, lineHeight: 1, padding: 4, flexShrink: 0,
                      }}
                    >×</button>
                  )}
                </div>

                {items.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.map((it, i) => <Headline key={`${it.url}-${i}`} item={it} source={null} />)}
                  </div>
                ) : (
                  <div style={{
                    fontFamily: FF_S, fontSize: 12, color: P.inkLight, padding: '14px 4px',
                    textAlign: 'center',
                  }}>
                    {row?.ok === false ? "Didn't respond this morning" : 'Nothing yet — check back after 6am'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 26, textAlign: 'center', fontFamily: FF_S, fontSize: 11.5, color: P.inkFaint,
      }}>
        Gathered fresh every morning at 6am · headlines link straight to the publisher
        {onNavigate && (
          <> · <button onClick={() => onNavigate('dashboard')} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: FF_S, fontSize: 11.5, color: P.inkLight, textDecoration: 'underline',
          }}>back to dashboard</button></>
        )}
      </div>
    </div>
  );
};

export default MorningNookPage;
