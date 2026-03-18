# Nook — Developer Handoff Document
*Last updated: 2026-03-18 (session 22)*

---

## Project Overview

**Nook** is a pastel-themed personal dashboard SPA. Users get a public-facing profile page with customisable widgets (to-dos, reading list, goals, notes, etc.), a private settings area, and a real-time messaging system (DMs + group chats).

**Stack:**
- React 18 + Vite, all inline styles (no CSS files), single file `src/App.jsx` (~9118 lines)
- Supabase (Postgres + Auth + Realtime)
- Row Level Security (RLS) on all tables
- `src/hooks/useAuth.js` — auth + profile state
- `src/hooks/useMessages.js` — all messaging logic
- `src/lib/supabase.js` — Supabase client

**To run locally:** `npm run dev` in the Nook folder.

---

## Supabase Schema (current state)

### Core tables (pre-existing)
- `profiles` — id, name, handle, bio, avatar_color, avatar_url, created_at
- `user_data` — id, user_id, key (text), value (jsonb), created_at — generic key/value store
- `widget_configs` — widget configuration per user

### Messaging tables (added via migrations this session)
```sql
conversations (
  id UUID PRIMARY KEY,
  type TEXT CHECK (type IN ('dm', 'group')),
  name TEXT,  -- group chat name, nullable
  created_at TIMESTAMPTZ DEFAULT NOW()
)

conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
)

chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## RLS Policies (current state — all applied)

All policies were applied by:
1. Manually deleting all policies on `conversations` and `conversation_members` via Supabase Dashboard UI
2. Running `supabase-policies-only.sql`
3. Running `supabase-members-policy-fix.sql`
4. Running individual SQL statements for delete policies

### conversation_members
```sql
-- IMPORTANT: uses SECURITY DEFINER function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.my_conversation_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid();
$$;

-- Allows seeing ALL members of YOUR conversations (not just your own row)
CREATE POLICY "conv_members_read" ON public.conversation_members
  FOR SELECT USING (conversation_id IN (SELECT public.my_conversation_ids()));

CREATE POLICY "conv_members_insert" ON public.conversation_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### conversations
```sql
CREATE POLICY "conversations_member_read" ON public.conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members
            WHERE conversation_id = conversations.id AND user_id = auth.uid())
  );

CREATE POLICY "conversations_authenticated_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_member_delete" ON public.conversations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.conversation_members
            WHERE conversation_id = conversations.id AND user_id = auth.uid())
  );
```

### chat_messages
```sql
CREATE POLICY "chat_messages_member_read" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members
            WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "chat_messages_member_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM public.conversation_members
                WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "chat_messages_member_delete" ON public.chat_messages
  FOR DELETE USING (auth.uid() = sender_id);
```

---

## Changes Made This Session (session 16)

### 48. Persistent notifications — Supabase table + pref-aware filtering

**Problem:** All notifications (new follower, comment, calendar share) were held in React state only — they vanished on every page refresh. There was also no enforcement of the user's notification preference toggles.

**New SQL migration — `supabase-notifications.sql`:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,   -- 'follow' | 'like' | 'comment' | 'mention' | 'calendar_share'
  uid TEXT,             -- UUID of the triggering user
  name TEXT,
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
RLS: SELECT / INSERT (own rows only) / UPDATE / DELETE — all scoped to `auth.uid() = user_id`.
Index on `(user_id, created_at DESC)` for fast per-user queries.
**Action required: run `supabase-notifications.sql` in Supabase SQL Editor once.**

**Code changes in App.jsx:**

1. **`addNotif` enhanced** — now checks `notifPrefsRef.current` before firing (respects the user's toggles for follows, comments, likes, mentions), generates a UUID with `crypto.randomUUID()`, and saves to the `notifications` table via `supabase.from('notifications').insert(...)`. State update still happens synchronously; DB write is fire-and-forget.

2. **Load on login** — new combined `useEffect([user?.id])` loads the last 50 notifications from Supabase on login and maps them to the existing UI shape `{ id, type, uid, name, text, read, ts }`. Clears notifications on logout.

3. **`onMarkRead` / `onMarkAllRead`** — both now also update the `notifications` table:
   - `onMarkRead(id)` → `.update({ read: true }).eq('id', id).eq('user_id', user.id)`
   - `onMarkAllRead()` → `.update({ read: true }).eq('user_id', user.id).eq('read', false)`

---

### 49. Settings page — notification & privacy prefs now cross-device persistent

**Problem:** `notifPrefs` and `privPrefs` were local state inside `SettingsPage`, saved only to `localStorage`. Switching devices or browsers lost all toggle settings.

**Fix:**

1. **Lifted to App** — `notifPrefs` and `privPrefs` `useState` declarations moved from `SettingsPage` into the App component (around line 7803). `SettingsPage` now receives both as props + setters.

2. **Supabase persistence via `user_data`** — two new save effects in App:
   - `notifPrefs` changes → upsert `{ key: 'notif_prefs', value: notifPrefs }` into `user_data`
   - `privPrefs` changes → upsert `{ key: 'priv_prefs', value: privPrefs }` into `user_data`
   Both also write to `localStorage` as a cache for instant rehydration.

3. **Load on login** — the combined settings/notif load effect (same `useEffect` as #48) fetches `notif_prefs` and `priv_prefs` from `user_data` and calls the setters. Falls back to `localStorage` if no Supabase row exists yet (first login on new device).

4. **`notifPrefsRef`** — stable `useRef` always pointing at the latest `notifPrefs`. Kept in sync by a `useEffect([notifPrefs])`. The async realtime subscription closure reads from this ref so it always uses current prefs without needing to re-subscribe.

**SettingsPage signature change:**
```js
// Before:
const SettingsPage = ({ profilePic, setProfilePic, onLogout, accent, onAccentChange }) => {
// After:
const SettingsPage = ({ profilePic, setProfilePic, onLogout, accent, onAccentChange, notifPrefs, setNotifPrefs, privPrefs, setPrivPrefs }) => {
```
The local `useState` declarations for `notifPrefs`/`privPrefs` and their `useEffect` save hooks were removed from `SettingsPage`. The toggles in the Notifications and Privacy sections are unchanged — they call `setNotifPrefs`/`setPrivPrefs` as before, now correctly pointing at the App-level setters.

**Privacy `allowMessages`:** wiring to the Message button on public profiles requires fetching the target user's `priv_prefs` at profile-view time — not yet implemented. Noted in Known Issues.

**⚠️ Settings props are a temporary arrangement:** `notifPrefs`, `setNotifPrefs`, `privPrefs`, and `setPrivPrefs` are currently passed into `SettingsPage` as plain props from App. This works but is not scalable — as the settings surface grows, the prop chain will become unwieldy. The proper long-term fix is to move these (and other cross-cutting user preferences) into a dedicated React context (e.g. `UserPrefsContext`) or a lightweight global store, so any component can read or update prefs without threading props through the tree. This refactor should be done before adding more settings sections.

---

### 50. Note auto-focus — definitive fix (attempt 13, `editorKey` + native `autoFocus`)

**Root cause (confirmed in session 12, re-applied here):** `React.StrictMode` (active in `main.jsx`) double-invokes effects and layout-effects in development. Every `useEffect`, `useLayoutEffect`, `setTimeout`, `requestAnimationFrame`, `flushSync`, and ref-based approach tried across 12 attempts all ultimately fail because StrictMode invalidates the timing window or runs cleanup between the focus call and the browser processing it.

**Fix (bypasses React scheduler entirely):**

1. `const [editorKey, setEditorKey] = useState(0)` added to `WorkNotes`.
2. `createNote` calls `setEditorKey(k => k + 1)` instead of any focus/ref logic.
3. The editor's outer `<div>` receives `key={editorKey}`. When `editorKey` changes, React **fully unmounts and remounts** the editor as a new DOM subtree.
4. The `<textarea>` receives `autoFocus={editorKey > 0}`. The browser applies native autofocus when the element is inserted into the DOM — this happens outside React's scheduler and is completely immune to StrictMode.
5. `pendingFocusRef`, the `useLayoutEffect` with no deps, and the `setTimeout(150)` safety net are all removed.
6. Switching between existing notes does **not** change `editorKey`, so no remount or focus steal occurs on note switching.
7. `editorKey > 0` prevents autofocus when the component first mounts with pre-existing notes loaded from storage.

**Note:** `textareaRef` is retained for the `autoGrow` height calculation — it does not affect focus behaviour.

---

## Changes Made This Session (session 15)

### 45. Supabase persistence — root cause corrected and full fix applied

**Problem (carried over from session 14):** Work page data (todos, notes, calendar) disappeared when logging in from a new browser. Session 14 had diagnosed the `user_data.value` column as `text` and applied `JSON.stringify()` before saving. This diagnosis was wrong.

**Root cause (corrected):** The column type is `value jsonb NOT NULL DEFAULT '{}'` (confirmed by reading `supabase-schema.sql`). Passing `JSON.stringify(value)` to a `jsonb` column causes Postgres to store a JSON-encoded string inside JSON, creating double-encoding. Additionally, Supabase JS v2 API errors (RLS violations, type mismatches, etc.) arrive in the resolved `{ data, error }` object — not as thrown exceptions — so `.catch(() => {})` silently swallowed all save failures without any indication.

A third issue: users who had only ever used the app on one browser had all their data in `localStorage` but nothing in Supabase (no save had ever succeeded due to the above bugs). Those users' new-browser logins loaded from Supabase and found nothing.

**Three-part fix in `saveWorkData` and the load `useEffect`:**

1. **Correct save format** — reverted `JSON.stringify(value)` back to `value` (raw JS object, correct for `jsonb`):
```js
const saveWorkData = useCallback((sbKey, lsKey, value) => {
  if (lsKey) try { localStorage.setItem(lsKey, JSON.stringify(value)); } catch {}
  if (user?.id) {
    supabase.from('user_data')
      .upsert({ user_id: user.id, key: sbKey, value }, { onConflict: 'user_id,key' })
      .then(({ error }) => { if (error) console.error('[WorkPage] save error for', sbKey, error); })
      .catch(err => console.error('[WorkPage] save network error for', sbKey, err));
  }
}, [user?.id]);
```

2. **Error visibility** — replaced `.catch(() => {})` with `.then(({ error }) => ...)` so Supabase API errors are logged to console.

3. **localStorage → Supabase migration** — after the Supabase load resolves, any key present in `localStorage` but absent from Supabase is upserted in a single batch. This runs once per browser on first login, permanently migrating historical data:
```js
const toMigrate = [
  !keysInDb.has('work_todos_master') && lsMaster   ? { user_id, key: 'work_todos_master', value: lsMaster }   : null,
  !keysInDb.has('work_todos_daily')  && lsDaily    ? { user_id, key: 'work_todos_daily',  value: lsDaily }    : null,
  !keysInDb.has('work_notes')        && lsNotes    ? { user_id, key: 'work_notes',        value: lsNotes }    : null,
  !keysInDb.has('work_todos_custom') && lsCustom   ? { user_id, key: 'work_todos_custom', value: lsCustom }   : null,
  !keysInDb.has('work_calendar')     && lsCalendar ? { user_id, key: 'work_calendar',     value: lsCalendar } : null,
].filter(Boolean);
if (toMigrate.length > 0) {
  supabase.from('user_data').upsert(toMigrate, { onConflict: 'user_id,key' }) ...
}
```

**`safeParse` helper added** to the load effect to handle values that may be stored as jsonb objects (normal) or JSON strings (from the brief session-14 window when double-encoding was active):
```js
const safeParse = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
  return v;
};
```

---

### 46. Work sidebar — Calendar section missing from live site and in-session

**Problem:** Calendar did not appear in the Work sidebar nav, either on nook-hub.com or after closing/reopening the tab in the same browser.

**Root causes (two separate bugs):**

1. **Live site ran old code** — all code changes across sessions 14–15 (including the addition of `'calendar'` to `WORK_SECTIONS`) had never been committed to git, so Netlify was deploying a version of `src/App.jsx` that predated the Calendar feature entirely. Confirmed with `git status`: 2491 insertions unstaged across 17 files.

2. **Section state was ephemeral** — `WorkPage` used `useState("overview")` with no persistence. Closing and reopening the tab always reset to Overview, hiding the Calendar section unless the user manually re-navigated.

**Fix for #1 — git commit:**
Resolved a stale `.git/index.lock` file (required `mcp__cowork__allow_cowork_file_delete` permission), set git author identity (`git config user.email/user.name`), staged all 17 modified files, and committed as:
> `fix: persist work data to Supabase, add calendar section, improve sidebar layout`
> Commit `1860501` — 17 files changed, 3863 insertions.

**Note: VM cannot push to GitHub** — the sandbox has no GitHub credentials and hits a 403 proxy error on `git push`. **The user must run `git push origin main` from their own machine** to trigger a Netlify rebuild.

**Fix for #2 — section persistence via `localStorage`:**
Replaced `useState("overview")` with a lazy initializer that reads `localStorage`:
```js
const [section, setSection] = useState(() => {
  try {
    const s = localStorage.getItem('nook_work_section');
    if (s && WORK_SECTIONS.find(w => w.id === s)) return s;
  } catch {}
  return 'overview';
});
```
Added `goToSection()` that writes back on every navigation:
```js
const goToSection = (s) => {
  setSection(s);
  try { localStorage.setItem('nook_work_section', s); } catch {}
};
```
All `goTo(...)` and `setSection(s.id)` call sites updated to `goToSection(...)`. Key `nook_work_section` is shared across user sessions (UI preference only, no user-ID suffix needed).

---

### 47. Work sidebar layout — full-height desktop, 4-column mobile grid

**Problem (desktop):** The sidebar used `minHeight: calc(100vh - 61px)` on the layout container, which allowed the sidebar to shrink to its content height on short pages. This caused the sidebar to appear truncated and not fill the viewport.

**Problem (mobile):** The sidebar nav used `flex-wrap: nowrap; overflow-x: auto`, rendering as a horizontal scroll strip. With 8 sections, Calendar was off-screen and required swiping to discover.

**Fix — desktop CSS** (global styles block in `App.jsx`):
```css
/* Before */
.nook-sidebar-layout { display: flex; }
.nook-sidebar { width: 220px; flex-shrink: 0; }
.nook-sidebar-content { flex: 1; min-width: 0; overflow-y: auto; }

/* After */
.nook-sidebar-layout { display: flex; height: calc(100vh - 61px); overflow: hidden; }
.nook-sidebar { width: 220px; flex-shrink: 0; overflow-y: auto; position: sticky; top: 0; align-self: flex-start; height: 100%; }
.nook-sidebar-content { flex: 1; min-width: 0; overflow-y: auto; height: 100%; }
```
The `minHeight` inline style was also removed from the layout's JSX `style` prop (the CSS class now handles it).

**Fix — mobile CSS** (inside `@media (max-width: 640px)`):
```css
/* Before */
.nook-sidebar-nav-inner { display: flex; flex-wrap: nowrap; overflow-x: auto; padding: 8px 12px; gap: 6px; }
.nook-sidebar-nav-inner button { flex-shrink: 0; }

/* After */
.nook-sidebar-nav-inner { display: grid; grid-template-columns: repeat(4, 1fr); overflow-x: visible; padding: 8px 10px; gap: 5px; }
.nook-sidebar-nav-inner button { width: 100% !important; margin-bottom: 0 !important; padding: 8px 6px !important; justify-content: center; }
```
8 sections now display in two compact rows of 4, fully visible without scrolling.

---

### Deployment status after session 15

| Item | Status |
|------|--------|
| All session 14–15 code changes | ✅ Committed (`1860501`) |
| Push to GitHub | ⏳ **Pending — user must run `git push origin main`** |
| Netlify rebuild | ⏳ Triggers automatically once push lands |
| localStorage → Supabase migration | ✅ Fires automatically on next login |

---

## Changes Made This Session (session 14)

### 42. Expand/collapse crashing the app — fixed

**Problem:** Clicking the "Expand" / "Collapse" button on a widget caused the entire app to crash (blank screen) until the user refreshed. After refresh it loaded correctly because localStorage/Supabase had saved the new state.

**Root cause:** Same React 18 StrictMode bug as session 10's work-panel crash (issue #25). The `toggleExpand` function used a functional state-setter to do side effects:
```js
// BROKEN — side effects inside setter
setExpandedWidgets(s => {
  const n = new Set(s); ...
  localStorage.setItem(EXPAND_KEY, ...);   // ← side effect inside setter
  supabase.from('user_data').upsert(...);  // ← side effect inside setter
  return n;
});
```
React 18 StrictMode double-invokes state-setter functions to detect impurity. This caused duplicate Supabase writes and crashes.

**Fix:** Move all side effects outside the setter. Compute the new Set first, call `setExpandedWidgets` with the plain value (not a function), then do localStorage + Supabase calls after:
```js
const toggleExpand = (id) => {
  const n = new Set(expandedWidgets);
  n.has(id) ? n.delete(id) : n.add(id);
  const arr = [...n];
  setExpandedWidgets(n);  // plain value, no side effects inside
  if (EXPAND_KEY) localStorage.setItem(EXPAND_KEY, JSON.stringify(arr));
  if (user?.id) supabase.from('user_data').upsert(...).catch(() => {});
};
```

---

### 43. Social media widgets — redesigned (real embed for X, link cards for Instagram/LinkedIn)

**Twitter/X:** Replaced the fake static tweet list with the **official Twitter timeline embed** (`platform.twitter.com/widgets.js`). When the user sets their username, the widget dynamically injects a `<a class="twitter-timeline">` anchor and calls `twttr.widgets.load()`. The widgets.js script is injected into `<head>` once globally (guarded by `#twitter-widgets-js` id check). The timeline renders the user's real, live public posts inside the widget.

**Instagram:** Instagram's public API requires OAuth + business account approval and does not support profile grid embeds. Replaced the misleading fake-posts grid with a clean **profile link card** (Instagram-gradient styling, avatar area, username, and a "View on Instagram →" button). Users can still display their handle and direct visitors to their real profile.

**LinkedIn:** Same situation — LinkedIn provides no public profile embed API. Replaced fake post list with a clean **profile link card** (LinkedIn blue styling, `in` logo, username, and "View on LinkedIn →" button).

All three widgets now open with the username field visible if no username is saved, and support Enter key to confirm.

---

## Changes Made This Session (session 13)

### 40. Profile navigation — fixed (navigate directly with UUID)

**Problem:** Clicking a user's name/handle (in notifications, feed, sidebar) was silently failing to navigate. The user stayed on their current page (own dashboard), which looked like "a random placeholder dashboard."

**Root cause:** `openUserProfile` was doing a Supabase `profiles` lookup before navigating. For UUID inputs, if that lookup returned `null` (RLS-blocked read, missing profile row, or any Supabase error), the function hit `return;` without ever calling `goToProfile`. The dropdown closed and the current page remained visible.

**Fix:** Removed the redundant profiles lookup for UUIDs entirely. `openUserProfile` now calls `goToProfile(handleOrId)` directly when it detects a UUID — `PublicProfilePage` already does its own profile lookup and shows "User not found" gracefully if needed. Handle-based lookups (non-UUID) are unchanged.

---

### 41. Public profile page — only public widgets shown

**Problem:** `PublicProfilePage` was querying `widget_configs` with `.eq('enabled', true)` only, so ALL enabled widgets (including private ones) were shown to visitors.

**Fix:** Added `.eq('public', true)` to the query. The "X public widgets" count in the bio is automatically correct since it reads from `widgets.length` (which now only contains public+enabled rows).

---

### 42. widget_configs RLS + auto-populate — fixed

**Problem:** `widget_configs` was created manually in Supabase with no explicit RLS policies, so the default-deny policy blocked all reads from other users. Also, `saveWidgetConfig` only fires on explicit user actions (toggle/reorder), so users who never visited the Customise page had no rows in `widget_configs` — their public profiles showed "0 public widgets" even though their dashboard had widgets configured.

**Fixes:**
- New file `supabase-widget-configs-fix.sql`: creates the table if missing, enables RLS, adds public SELECT policy (`using (true)`) plus owner-only INSERT/UPDATE/DELETE. **Action required: run this in Supabase SQL Editor.**
- DashboardPage load effect: when `widget_configs` returns empty but localStorage has widget data, the code now auto-saves those widgets to `widget_configs` (fire-and-forget upsert). This means the first time a user loads their dashboard after the SQL fix, their existing widgets are persisted to the DB for public visibility.

---

### 43. Public profile page — bio links and email now visible

**Problem:** `PublicProfilePage` was not fetching or displaying the viewed user's bio links (website links) and contact email. These are stored in `user_data` under key `bio_links` with value `{ email, links: [{label, url}] }`. The `user_data` table only had an owner-only RLS policy, so other users' `bio_links` could not be read at all.

**Fixes:**
- New file `supabase-bio-links-public-read.sql`: adds a SELECT policy on `user_data` scoped to `key = 'bio_links'` only (all other keys remain private). **Action required: run this in Supabase SQL Editor.**
- `PublicProfilePage` now fetches `user_data` for `bio_links` in the same `Promise.all` as the other profile data.
- Renders email pill (`✉ email`) and link pills (`🔗 label`) in the profile header, matching the style used on the owner's own dashboard view.

---

### 44. Note auto-focus — STILL NOT SOLVED

**Current state:** Multiple approaches have been tried across sessions 7–13. None have worked in practice. The session 12 entry claiming this was "fixed" was incorrect — the fix was reverted/replaced and the bug persists.

**Current implementation (session 13):** `useLayoutEffect` (no dependency array) + `pendingFocusRef` (set to `true` before state updates in `createNote`) — the layout effect fires after every commit and calls `textareaRef.current.focus()` when the ref is set. Additionally, `setTimeout(() => textareaRef.current?.focus(), 150)` fires as a belt-and-suspenders fallback. The Enter key handler in the title input also calls `e.preventDefault()`. Despite this, the textarea does not receive focus after note creation.

**Full history of failed attempts (sessions 7–13):**
1. `useLayoutEffect` (no deps) + `shouldFocusEditorRef`
2. `justCreatedRef` + `requestAnimationFrame` inside `useEffect([active])`
3. `focusPending` state + `useEffect([focusPending])`
4. `pendingFocusNoteId` ref + `useEffect([activeNoteId])`
5. `pendingFocusNoteId` ref + `useEffect` (no deps)
6. `pendingFocusNoteId` ref + `useLayoutEffect` (no deps)
7. `flushSync` + direct `focus()` call
8. `setTimeout(0)`
9. `onMouseDown` preventDefault on ✓ button + `setTimeout(0)`
10. Double `requestAnimationFrame`
11. `key={editorKey}` on editor div + `autoFocus={editorKey > 0}` on textarea
12. `useLayoutEffect` (no deps) + `pendingFocusRef` + `setTimeout(150)` safety net (current)

**Likely root cause:** Something is stealing focus after the textarea receives it. Candidates: the NoteItem component (defined *inside* WorkNotes, causing full unmount/remount of list items on every render, which could briefly steal focus), a browser-level focus management behaviour, or an interaction with Vite HMR in development. Consider: (a) moving `NoteItem` outside `WorkNotes` to stop it re-mounting on every render, (b) testing in a production build (`npm run build && npm run preview`) to rule out dev-only interference, (c) adding a `console.log(document.activeElement)` after the `setTimeout` to see what element has focus when focus should be on the textarea.

---

## Changes Made This Session (session 12)

### 38. New follower notification — fixed (postgres_changes + SQL migration)

**Problem:** New follower notifications were never firing. The original `postgres_changes` subscription used a server-side filter (`following_id=eq.${user.id}`), which requires `REPLICA IDENTITY FULL` on the table. A broadcast channel approach was tried (session 12 first pass) but also failed — Supabase `channel()` uses a name-keyed registry, so creating a temporary sender channel with the same name as the receiver's channel caused conflicts and unreliable delivery.

**Root cause (confirmed):** The `follows` table was simply not in the `supabase_realtime` publication. Supabase `postgres_changes` never fire for tables not in the publication, regardless of RLS.

**Fix — postgres_changes without server-side filter:**
- New file `supabase-follows-realtime.sql`: `ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;` — adds the table to the publication. **Action required: run this once in Supabase SQL Editor.**
- Notification `useEffect`: subscription uses `postgres_changes` on `follows` with **no filter** (avoids needing `REPLICA IDENTITY FULL`, which is only required for UPDATE/DELETE events — INSERT events work filter-free). Client-side guard: `if (followingId !== user.id) return` keeps only events where the current user is being followed.
- `toggleFollow`: reverted to simple DB-only logic (no broadcast code). The DB insert is all that's needed — `postgres_changes` picks it up.

### 39. Note auto-focus — fixed (key + autoFocus)

**Root cause (confirmed):** `React.StrictMode` is active (`main.jsx` wraps `<App>` in `<React.StrictMode>`). StrictMode double-invokes effects in development: mount → effects run → effects cleanup → effects run again. Every `useEffect`/`useLayoutEffect`/`setTimeout` approach fails because by the time the macro/microtask fires (or the effect runs), StrictMode's cleanup has invalidated refs or the timing window has closed. This is why 8+ previous attempts (sessions 7–12) all failed — they all relied on timing-based focus.

**Fix — `key` + native `autoFocus`:**
- Added `const [editorKey, setEditorKey] = useState(0)` to `WorkNotes`.
- `createNote` increments `editorKey` (`setEditorKey(k => k + 1)`) instead of calling `setTimeout`. No refs or effects involved.
- The editor outer `<div>` has `key={editorKey}`. When `editorKey` changes (i.e., on every note creation), React fully **unmounts and remounts** the editor panel as a new DOM subtree.
- The `<textarea>` has `autoFocus={editorKey > 0}`. When the editor remounts with this prop, the **browser's native autofocus** fires immediately as the element is inserted into the DOM — completely outside React's scheduler. StrictMode cannot interfere because native autofocus is applied by the browser, not by a React effect.
- Switching between existing notes does **not** change `editorKey`, so the editor doesn't remount and focus is not stolen.
- `editorKey > 0` guard prevents auto-focus on the initial page load when notes are already present.

---

## Changes Made This Session (session 11)

### 37. Note auto-focus — multiple attempts, still unresolved

**Current state of code:** `createNote` in `WorkNotes` calls all state setters then `setTimeout(() => textareaRef.current?.focus(), 0)`. No effect-based approach is in use.

**Full history of attempts (all failed in practice):**
1. `useLayoutEffect` (no deps) + `shouldFocusEditorRef` — didn't work
2. `justCreatedRef` + `requestAnimationFrame` inside `useEffect([active])` — worked first note, not second
3. `focusPending` state + `useEffect([focusPending])` — worked first note, not second
4. `pendingFocusNoteId` ref + `useEffect([activeNoteId])` — neither note
5. `pendingFocusNoteId` ref + `useEffect` (no deps) — neither note
6. `pendingFocusNoteId` ref + `useLayoutEffect` (no deps) — neither note
7. `flushSync` + direct `focus()` call — neither note (flushSync may be problematic inside React synthetic event handlers in concurrent mode)
8. `setTimeout(0)` — not yet confirmed working

**Working hypothesis for why attempts 1–7 all fail:** Clicking the ✓ button causes the browser to natively assign focus to that button as part of the click event. This happens *after* any programmatically set focus within the React event handler (including effects that fire during the same task). `setTimeout(0)` (attempt 8) is the current code and runs as a macrotask after all browser event processing is complete — it has not yet been confirmed by the user.

**Current `createNote` code:**
```js
const createNote = () => {
  const title = newTitleInputRef.current?.value?.trim();
  if (!title) return;
  if (newTitleInputRef.current) newTitleInputRef.current.value = "";
  const note = { id: `n${Date.now()}`, ... };
  setNotes(ns => [note, ...ns]);
  setActive(note.id);
  setDraftBody("");
  setUnsaved(false);
  setCreating(false);
  setTimeout(() => textareaRef.current?.focus(), 0);
};
```

**Next thing to try if `setTimeout(0)` also fails:** Add `onMouseDown={(e) => e.preventDefault()}` to the ✓ button. This prevents the browser from giving focus to the button on click (while still firing the click), so there is nothing to override our focus call. This would be combined with the `setTimeout(0)` or a direct post-state focus.

---

## Changes Made This Session (session 10)

### 36. Note auto-focus + work data persistence (second pass)

#### Note auto-focus — `useLayoutEffect` (no deps)
**Problem:** `useEffect` (no deps) still didn't reliably focus after note creation. Root cause: `useEffect` is asynchronous — React schedules it to run after the browser has painted. In some React 18 rendering scenarios (concurrent mode, Strict Mode double-invocations) the async window means the effect can fire before `textareaRef.current` is attached, or miss the render entirely.

**Fix:** Changed `useEffect` → `useLayoutEffect`. `useLayoutEffect` fires **synchronously** after every DOM commit and before the browser paints, guaranteeing `textareaRef.current` is set by the time the callback runs. Combined with the `pendingFocusNoteId` ref check, this reliably focuses the correct note every time.

#### Work data persistence — `useState` initializer was always loading defaults
**Problem (root cause of persistence failure):** `WorkPage` computes its localStorage keys as `const WORK_NOTES_KEY = user ? \`nook_work_notes_${user.id}\` : null`. At the time the `useState(() => loadLS(WORK_NOTES_KEY, INIT_NOTES))` initializer runs (component mount), `user` is still `null` (async from `useAuth()`). So `WORK_NOTES_KEY = null` and `loadLS(null, INIT_NOTES)` always returns `INIT_NOTES`. The localStorage data was never read, so every session started with placeholder data.

Additionally, the previous `let next` approach in the setters meant data was never written to localStorage OR Supabase in the first place (fixed in session 9 with ref-based setters).

**Fix:**
- Changed `useState` initializers to use defaults only (not `loadLS(...)`): `useState(INIT_NOTES)`, `useState(INIT_MASTER_TODOS)`, etc.
- Rewrote the Supabase load `useEffect` to do two-stage loading: **Step 1 (synchronous)** — once `user.id` is available, immediately reads from localStorage (correct keys now available) and sets state/refs. **Step 2 (async)** — fetches from Supabase and overrides with authoritative server data.

This ensures: data loads instantly from localStorage on the same browser, and from Supabase on any browser. Writes go to both on every change (via the ref-based setters from session 9).

---

## Changes Made This Session (session 9)

### 35. Note auto-focus (second+ notes) + work data not persisting to Supabase

#### Note auto-focus — definitive fix (session 9)
**Problem:** The `useEffect([activeNoteId])` approach from session 8 still failed for the second note (neither note got focused after creation). Root cause: the effect only fires when the `activeNoteId` dep changes. After the first note is created, `activeNoteId` is set to `note1_id`. When the second note is created, if React processes cross-component state updates in separate renders (WorkPage's `notes` vs WorkNotes' `active`), there can be an intermediate render where `active=note2_id` but `notes` doesn't include it yet — so `activeNote` is `undefined` and `activeNoteId` is `undefined`. The dep would change (`note1_id → undefined`), but `pendingFocusNoteId.current !== undefined`, so no focus. Then when `notes` updates, `activeNoteId` changes again (`undefined → note2_id`), which SHOULD trigger the effect — but in practice this second dep change was not reliably triggering a re-run.

**Fix:** Changed to `useEffect` with **no deps array** — runs after every render. The body is a fast no-op (`if (!pendingFocusNoteId.current) return`) until both conditions are met: the pending note ID matches `activeNote?.id` AND `textareaRef.current` is attached. This guarantees focus regardless of batching order or Strict Mode double-invocation.

#### Work data not persisting to Supabase (notes + todos)
**Problem:** The `let next` trick in the persistent setters was fundamentally broken in React 18. When `setNotesRaw(prev => { next = ...; return next; })` is called, React 18 queues the functional updater to run during the *render phase* — not immediately. So `next` remains `undefined` when the `if (next !== undefined) saveWorkData(...)` line runs immediately after. Neither `localStorage` nor Supabase was ever being written to on updates, only on initial load.

**Fix:** Replaced the `let next` pattern with state-mirroring refs (`notesRef`, `masterRef`, `dailyRef`, `customRef`). Each setter:
1. Computes `next` synchronously from the ref (not from a functional updater)
2. Updates the ref immediately (`notesRef.current = next`)
3. Calls `setNotesRaw(next)` with a direct value (not a functional updater — no StrictMode issues)
4. Calls `saveWorkData(...)` with the correctly-computed `next`

The Supabase load effect now also syncs the refs (`notesRef.current = map.work_notes` etc.) so that the first `setNotes` call after login sees the correct server state, not the stale localStorage state.

---

## Changes Made This Session (session 18)

### Bug fixes — 3 issues resolved

**1. Widget data temporarily disappearing on navigation + slow initial load (Fix 1)**

Root cause (two-part):
- `widgets` state was initialised with all widgets `enabled: false` (blank slate). Supabase load is async — so there's always a flash of a blank dashboard before data arrives.
- When `onDataChange` saved widget content, it only updated `widgetData` state and Supabase, NOT the `widgets` array. So `widget.data` was stale. If the DashboardPage ever remounted (e.g. due to Supabase auth token refresh briefly setting `user` to null), widgets would reinitialise from `widget.data` — showing old data until the next Supabase fetch.

**Fix 1a — instant localStorage-first load:**
Changed `widgets` `useState` initializer from a hard-coded "all disabled" array to reading from `localStorage` synchronously:
```js
const [widgets, setWidgets] = useState(() => {
  if (STORAGE_KEY) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ws = JSON.parse(saved);
        return ws.map(w => {
          const wd = savedWidgetData[w.id];
          return wd ? { ...w, data: { ...w.data, ...wd } } : w;
        });
      }
    } catch {}
  }
  return INITIAL_WIDGETS.map(w => ({ ...w, enabled: false, isPublic: false }));
});
```
Widgets now render immediately from localStorage before Supabase responds. Supabase load still runs and overrides with the authoritative data once it arrives.

**Fix 1b — keep `widgets` array data in sync with `onDataChange`:**
```js
const onDataChange = useCallback((widgetId, newData) => {
  setWidgetData(prev => ({ ...prev, [widgetId]: newData }));
  // Also keep widgets array in sync so widget.data stays fresh
  setWidgets(prev => prev.map(w =>
    w.id === widgetId ? { ...w, data: { ...w.data, ...newData } } : w
  ));
  // Supabase upsert...
}, [user?.id]);
```
Now `widget.data` always reflects the latest user edits, so if the component remounts, widgets reinitialise with current data rather than stale Supabase-fetch-time data.

---

**2. Work section reminders — edit functionality (Fix 2)**

Added inline edit mode to `WorkReminders`:
- New state: `editingId`, `editDraft` (`{ text, date, time, priority }`)
- Each reminder row now has a ✎ button (visible only for real, non-example reminders).
- Clicking ✎ replaces the row with an inline edit form (same fields as the "Add" form: text, date, time, priority buttons, Save / Delete / ✕ Cancel).
- `saveEdit()` calls `setReminders(...)` (the persistent setter from WorkPage) so edits are immediately written to Supabase.
- `startEdit` collapses the "Add" form (`setAdding(false)`) to avoid two open forms.
- Delete button in edit mode removes the reminder (and collapses edit form via the `remove` function).

---

**3. Work section reminders & meetings data not saving (Fix 3)**

Root causes:
- `reminders` in `WorkPage` used a plain `useState` setter — no call to `saveWorkData`.
- `meetings` in `WorkPage` had no setter at all (`const [meetings] = useState(...)`). `WorkMeetings` managed its own internal `useState(init)` — changes were never propagated back to `WorkPage` and never persisted.
- Neither `work_reminders` nor `work_meetings` was in the Supabase `sbKeys` fetch list.
- `WorkPage` unmounts when navigating away (it's conditionally rendered), so any in-memory state was lost.

**Fix:**
1. Added `WORK_REMINDERS_KEY` and `WORK_MEETINGS_KEY` localStorage keys.
2. Added `remindersRef` and `meetingsRef` (same ref-mirror pattern as masterRef, dailyRef, etc.).
3. Changed `const [reminders, setReminders] = useState(...)` → `const [reminders, setRemindersRaw] = useState(...)` and added a persistent wrapper:
```js
const setReminders = useCallback((val) => {
  const next = typeof val === "function" ? val(remindersRef.current) : val;
  remindersRef.current = next;
  setRemindersRaw(next);
  saveWorkData('work_reminders', WORK_REMINDERS_KEY, next);
}, [saveWorkData, WORK_REMINDERS_KEY]);
```
4. Same pattern for `setMeetings` (similarly wrapped around `setMeetingsRaw`).
5. Changed `WorkMeetings` signature from `({ meetings: init })` with its own `useState(init)` to `({ meetings, setMeetings })` — state is now fully owned by `WorkPage` and passed down.
6. Updated render call: `<WorkMeetings meetings={meetings} setMeetings={setMeetings} />`.
7. Added `'work_reminders'` and `'work_meetings'` to `sbKeys` in the Supabase load effect, with load/apply/migration logic matching the other five keys.
8. localStorage Step 1 load also now reads `lsReminders` and `lsMeetings` for instant display before Supabase responds.

---

## Changes Made This Session (session 17)

### Bug fixes — 7 issues resolved

**1. Email confirmation → Onboarding (Fix 1)**
- `showOnboarding` is now initialised from `window.location.hash` — if the hash contains `type=signup` (Supabase email confirmation redirect), `showOnboarding` starts as `true` so the protection redirect can't pre-empt onboarding.
- Added a guard `useEffect`: if `showOnboarding` is true but `nook_onboarded_${user.id}` already exists in localStorage, skip onboarding and go straight to dashboard (handles returning users who somehow hit the link again).
- `completeOnboarding` now clears the confirmation hash from the URL via `window.history.replaceState`.

**2. Onboarding widget selections persist (Fix 2)**
- Added `widgetReloadKey` state (`useState(0)`) in `App`. Passed as prop to `DashboardPage`.
- `DashboardPage` adds `widgetReloadKey` to the dependency array of its widget-load `useEffect`, so the load re-fires whenever the key changes.
- `completeOnboarding` calls `setWidgetReloadKey(k => k + 1)` after saving widget configs to Supabase, triggering a fresh DB load that picks up the newly-saved selections.
- Root cause: `DashboardPage` stays mounted (hidden via CSS) even during onboarding; the initial empty load was never re-triggered after onboarding saved.

**3. Saved links widget URLs (Fix 3)**
- Added `ensureHttps(url)` helper at the top of widget definitions.
- `LinksWidget.add()` now runs the URL through `ensureHttps` before saving, so pasting a bare domain like `google.com` becomes `https://google.com` instead of navigating to a relative path.

**4. Sports tracker — edit sports + emoji picker (Fix 4)**
- Added `SPORT_EMOJIS` constant (32 sport emoji).
- `SportsWidget` now has `editingActivityId` / `editDraft` / `showEditEmojiPicker` state.
- Each activity tab now has an inline ✎ edit button.
- Clicking edit shows an inline form (name, unit, emoji picker) with Save / Delete sport / Cancel.
- The "Add sport" form was also upgraded to use a popup emoji picker instead of a free-text input.

**5. Gallery widget (Fix 5)**
- Initial state changed from `GALLERY_SEED` fallback → `data.posts || []`. New dashboards start empty.
- "Link URL" and "Link label" inputs removed from both the add-post form and the edit modal (no longer stored or displayed).
- `GalleryWidget` now fetches real user handles from `supabase.from('profiles').select('id, name, handle')` on mount and exposes them as `allUserHandles`.
- Tag suggestion chips and the edit-modal dropdown now show actual Nook users instead of hardcoded dummy handles.
- Tagged handles in the post detail view are now wrapped in `<HandleBadge>` (clickable → navigates to their profile).
- `allUserHandles` passed as prop to `GalleryPostModal`.

**6. Bookmarks widget URLs (Fix 6)**
- `BookmarkEditModal` normalises `url` via `ensureHttps` on save.
- `addBm` in `BookmarksWidget` also normalises the URL so pasting bare domains opens correctly.

**7. All widgets save to database (Fix 7)**
- Changed merge priority in DashboardPage widget load: `{ ...savedWidgetData, ...dbDataMap }` (Supabase wins) instead of the previous order where localStorage overrode DB. Supabase is now the source of truth for widget content across devices.
- `onDataChange` callback now passes `updated_at` in the upsert and logs a warning (not silent) on error.

---

## Changes Made This Session (session 8)

### 34. Note auto-focus broken for second+ notes + widget badge still resetting on login

#### Notes auto-focus (definitive fix — session 8)
**Problem:** The `focusPending` state approach from session 7 worked for the *first* note but failed for all subsequent ones. Root cause: React 18 automatic batching. In `createNote`, `setNotes(...)` calls the patched `setNotes` which invokes `setNotesRaw` (a `WorkPage` state setter), while `setActive(note.id)` updates `WorkNotes`-local state. These cross-component state updates can be processed in **separate renders**:
- Render A: `focusPending=true`, but `notes` doesn't yet include the new note → `activeNote=undefined` → editor not in DOM → `textareaRef.current=null` → focus is a no-op; then `setFocusPending(false)` is called.
- Render B: `notes` now includes the new note → editor renders → but `focusPending` is already `false` → effect early-returns. No focus.

The first note worked only by coincidence (initial `active=null` meant the editor wasn't showing, so the batching gap happened to resolve differently).

**Fix (`WorkNotes`):**
- Removed `focusPending` state + `useEffect([focusPending])` entirely.
- Added `pendingFocusNoteId = useRef(null)` — a ref that survives renders without causing them.
- Derived `activeNoteId = activeNote?.id` (a plain variable, not state).
- New `useEffect([activeNoteId])` checks `pendingFocusNoteId.current === activeNoteId` — this fires whenever the resolved active note ID changes (i.e. when either `active` or `notes` updates, whichever comes last). At that point the editor textarea is guaranteed to be in the DOM.
- In `createNote`: `pendingFocusNoteId.current = note.id` (synchronous, no re-render) — replacing `setFocusPending(true)`.

#### Widget requests badge persistence (definitive fix — session 8)
**Problem:** The `useState` initializer that read from `localStorage` ran **once at mount** when `adminUser` was still `null` (because `useAuth()` resolves asynchronously). `SEEN_KEY` was therefore `null` in the initializer, so the `if (!SEEN_KEY) return new Set()` branch always fired, and localStorage was never read. After login the badge always showed all requests as "new".

**Fix (`AdminPage`):**
- Changed `useState` initializer from a function (that attempted the localStorage read) to simply `useState(new Set())`.
- Added `useEffect([SEEN_KEY])`: fires when `adminUser` becomes available and `SEEN_KEY` becomes a valid string, then reads from `localStorage` and calls `setSeenRequestIds(new Set(...))`. This correctly restores the previously-seen set after any login.

---

## Changes Made This Session (session 7)

### 33. Notes auto-focus still not working + widget badge reset on login + message button still broken (session 7 follow-up)

#### Notes auto-focus (third attempt — superseded by session 8 fix)
**Problem:** Even with `requestAnimationFrame` inside `useEffect([active])`, the editor textarea was still not focused after creating a note. Root cause: `requestAnimationFrame` fires during React Strict Mode's effect cleanup/remount cycle, at which point the timing relative to `textareaRef.current` being set is non-deterministic.
**Fix applied:** `focusPending` state + `useEffect([focusPending])`. Worked for first note only — see session 8 for root cause and definitive fix.

#### Widget requests badge persists across login (superseded by session 8 fix)
**Problem:** `seenRequestIds` was plain in-memory state — every login reset it to an empty `Set`.
**Fix applied:** `useState` initializer reading localStorage. Broken because `adminUser` is null at mount — see session 8 for root cause and definitive fix.

#### Message button from profile page now opens correct DM
**Problem:** `useEffect([pendingDmUserId])` in `MessagesPage` fired immediately on mount (before conversations had loaded). `conversations` was `[]`, so the existing-DM check found nothing, and `startDM` was called with an empty conversations list — creating a duplicate DM and/or silently failing to open the right conversation.
**Fix:** Added `loading` to the effect's dependency array: `useEffect([pendingDmUserId, loading])`. The effect now returns early if `loading` is `true`. When `loading` transitions to `false` (conversations fully fetched), the effect fires again with the real `conversations` list, correctly finding an existing DM or creating a new one.

---

### 31. Notes panel — auto-focus editor + clear title field on create
**Problem 1:** After clicking ✓ to create a new note, the user had to manually click into the editor textarea to start writing.
**Problem 2:** The title input was not cleared after creating a note — it still showed the previous note's name.

**Root cause of both:** The `newTitle` React state was shared across the controlled input and `createNote`. Because `setNotes` (the patched version) triggers a re-render of the parent `WorkPage` before WorkNotes' own local state updates (`setNewTitle`, `setCreating`) are fully applied, the controlled input could re-render with the old title still set. Similarly, the focus call via `useLayoutEffect` fired before the editor panel was guaranteed to have mounted with a focused-ready textarea.

**Fix (`WorkNotes` in `App.jsx`):**
- Removed `newTitle` state and `shouldFocusEditorRef` / `useLayoutEffect` approach entirely.
- Added `newTitleInputRef = useRef(null)` — the create-note input is now **uncontrolled** (`defaultValue=""` instead of `value={newTitle}`). The value is read imperatively via `newTitleInputRef.current.value` and cleared via `newTitleInputRef.current.value = ""` directly on the DOM — completely bypassing React state batching.
- Added `justCreatedRef = useRef(false)` — set to `true` in `createNote` before the state setters, then checked inside the existing `useEffect([active])`. When it's set, a `requestAnimationFrame` callback fires after the browser paints and focuses `textareaRef.current`. This guarantees the textarea is in the DOM and painted before focus is attempted.
- Since the create input unmounts when `creating` becomes false and remounts fresh (with `defaultValue=""`) when `creating` becomes true again, the field is always blank on open with no extra logic needed.

### 32. Profile page Message button opens the correct DM
**Problem:** Clicking ✉ Message on a user's `PublicProfilePage` navigated to the Messages page but didn't open or create a conversation with that user — the user landed on a blank messages view.

**Fix — `NookApp`:**
- Added `pendingDmUserId` state (`null` by default).
- `PublicProfilePage` now receives `onMessage={(userId) => { setPendingDmUserId(userId); navigate("messages"); }}` — it passes the profile's `userId` rather than nothing.
- `MessagesPage` receives two new props: `pendingDmUserId` and `onPendingDmHandled`.

**Fix — `MessagesPage`:**
- Added `useEffect` on `pendingDmUserId`: immediately calls `onPendingDmHandled()` to clear the pending ID, then checks if a DM with that user already exists in `conversations`. If yes, opens it via `handleSelect`. If no, calls `startDM(pendingDmUserId)` and opens the new conversation.

**Fix — `PublicProfilePage`:**
- Message button's `onClick` changed from `onMessage` to `() => onMessage(userId)` so the profile's `userId` is forwarded.

---

## Changes Made This Session (session 6)

### 25. Work panel crash — note/todo creation fixed
**Problem:** Clicking the ✓ button to create a new note, or creating a new to-do list in WorkPage, crashed the entire app.
**Root cause:** `saveWorkData` was being called as a **side effect inside React state updater functions** (the callback passed to `setNotesRaw`, `setMasterTodos`, etc.). React 18 Strict Mode double-invokes state updater functions to detect exactly this pattern, causing duplicate writes, stale-state errors, and crashes.
**Fix (all four persistent setters in WorkPage — `setNotes`, `setMasterTodos`, `setDailyTodos`, `setCustomLists`):**
```js
// BEFORE (side effect inside updater — broken):
const setNotes = useCallback((val) => {
  setNotesRaw(prev => {
    const next = typeof val === "function" ? val(prev) : val;
    saveWorkData('work_notes', WORK_NOTES_KEY, next); // ← side effect in updater!
    return next;
  });
}, [...]);

// AFTER (side effect outside updater — correct):
const setNotes = useCallback((val) => {
  let next;
  setNotesRaw(prev => { next = typeof val === "function" ? val(prev) : val; return next; });
  if (next !== undefined) saveWorkData('work_notes', WORK_NOTES_KEY, next);
}, [...]);
```

### 26. Placeholder tallies fixed + reduced to 1 each
**Problem:** The two example reminders and two example meetings were included in the Work page overview tallies. Also both `INIT_REMINDERS` and `INIT_MEETINGS` had 2 placeholder items each.
**Fix — reduce to 1 placeholder each:**
```js
const INIT_REMINDERS = [{ id: "r_ex1", text: "Add your first reminder here", date: "", done: false, _example: true }];
const INIT_MEETINGS  = [{ id: "m_ex1", title: "Add your first meeting here", date: "", time: "", attendees: "", notes: "", done: false, _example: true }];
```
**Fix — exclude `_example` items from WorkOverview tallies:**
- Added `realTodos`, `realMaster`, `realRems`, `realMtgs` variables (filtered with `!t._example`) throughout the tally computations.
- `overdueRem` filter now also guards `r.date &&` to prevent empty-string dates from being counted as overdue (JS: `"" < "2026-03-11"` is `true`).
- `StatCard` for Daily tasks now shows `${dailyDone}/${realTodos.length}`.
**Fix — WorkReminders display:**
- `upcoming` and `done` filtered with `!r._example`.
- Added separate `examples` array; rendered as greyed-out dashed-border cards only when no real reminders exist, with instructional copy.

### 27. Notifications for follows and comments
**Problem:** Users received no notification when someone followed them or commented on one of their posts.
**Fix:** Added a new `useEffect` after `toggleFollow` in `NookApp` that subscribes to two Supabase Realtime `postgres_changes` channels:
1. **Follow channel** (`notif-follows-{userId}`) — INSERT on `follows` where `following_id = {userId}`. Fetches the follower's name from `profiles` and prepends a notification: `"{name} started following you"`.
2. **Comment channel** (`notif-comments-{userId}`) — INSERT on `comments` (global). Filters server-side to only process comments on posts owned by the current user (queries `posts` for `user_id = current user AND id = comment.post_id`). Prepends: `"{name} commented on your post: "{preview}…""`.
Notifications are in-session only (cleared on page refresh) — no new DB table required.

### 28. Admin widget usage stats wired to real data
**Problem:** Widget usage statistics in the admin panel always showed the same fake hardcoded numbers.
**Fix — `src/hooks/useAdminData.js`:**
- Added `widgetUsage` state (`{}`).
- Added `fetchWidgetUsage` callback: queries `widget_configs` for all rows where `enabled = true`, groups by `widget_id`, counts occurrences.
- `fetchAll` now runs `fetchWidgetUsage` in parallel with `fetchUsers` and `fetchSignupsByDay`.
- `widgetUsage` exported from hook return value.

**Fix — `AdminPage` in `App.jsx`:**
- Added `widgetUsage` to the `useAdminData()` destructure.
- `WidgetUsageSection` completely rewritten to use real data: iterates `INITIAL_WIDGETS`, maps each to `{ ...w, count: widgetUsage[w.id] || 0 }`, sorts by count descending. Progress bars show real percentage of total enabled configurations. A "No data yet" state shown when no `widget_configs` rows exist.

### 29. Followers — Feed sidebar + dashboard bio count
**Problem:** No way to see who follows you anywhere in the app, and the dashboard bio only showed "following" count, not "followers".

**Fix — Feed sidebar (`FeedSidebar` in `App.jsx`):**
- Added `followerProfiles` state and `peopleTab` state (`"following"` | `"followers"`).
- New `useEffect` on `currentUserId`: queries `follows` where `following_id = currentUserId`, then batch-fetches those users' profiles from `profiles`.
- Sidebar "People" section now has two tabs: **Following (N)** and **Followers (N)**, each listing profile cards.

**Fix — Dashboard bio line (`DashboardPage` in `App.jsx`):**
- Added `followerCount` state + `useEffect` that queries `follows` with `{ count: 'exact', head: true }` where `following_id = user.id`.
- Bio line updated: `{following?.length || 0} following · {followerCount} follower{s}`.

### 30. Handle click → real profile page (not popup)
**Problem:** Clicking any `@handle` anywhere in the app opened a `UserProfileModal` overlay with placeholder/random data instead of navigating to the user's real dashboard.

**Fix — navigation infrastructure:**
- Added `profileViewId` state (UUID of the profile to display) and `prevPage` state (for the Back button) to `NookApp`.
- Added `pageRef` (`useRef`) that syncs with `page` via `useEffect`, so `openUserProfile` can always read the current page without a stale closure.
- Added `'profile'` to `protectedPages` list (requires auth).
- `navigate()` now calls `setPrevPage` before changing page.

**Fix — `openUserProfile` rewritten:**
- No longer calls `setViewingUser`. Instead, resolves the handle/UUID to an ID (via Supabase lookup or mock `USERS` fallback) then calls `setProfileViewId(id)` + `setPage('profile')` + `setPrevPage(pageRef.current)`.
- Uses `pageRef.current` (not stale closure) to capture the correct "back" destination.

**New component — `PublicProfilePage`:**
- Self-contained page component: fetches `profiles`, `widget_configs` (enabled + public), follower count, and following count for the given `userId` from Supabase in a single `Promise.all`.
- Renders a full-page profile header (avatar, name, handle, bio, follower/following/widget counts, Follow + Message buttons) using the same styling as `DashboardPage`.
- Renders public widgets in a 2-column grid using the existing `WidgetCard` with `isOwnDashboard={false}`.
- "← Back" button navigates to `prevPage`.
- Inserted in JSX: `{page === "profile" && user && profileViewId && <PublicProfilePage … />}`.

---

## Changes Made This Session (session 5)

### 22. Clickable @handles — global profile lookup
**Problem:** Handles displayed across the app (admin widget requests, feed posts, message search, etc.) were plain text with no action.
**Fix:**
- Added `createContext` / `useContext` to React imports.
- Added `ProfileViewContext` (a React context) — holds a single `openProfileByHandle(handleOrId)` function.
- Added `HandleBadge` component — renders a handle as a purple clickable span; calls `openProfileByHandle` on click with `stopPropagation()`. Falls back to plain text if context is null.
- Rewrote `openUserProfile` in `NookApp` to be async and accept either a handle string (`@…`) or a UUID. Queries `profiles` table from Supabase by `handle` or `id`, maps the row to the shape `UserProfileModal` expects (`id`, `name`, `handle`, `bio`, `color`, `initials`, `status`). Falls back to the mock USERS array.
- Wrapped the entire NookApp render tree in `<ProfileViewContext.Provider value={openUserProfile}>` so every child component can consume it.
- Updated 3 key locations to use `HandleBadge`:
  - Admin widget requests panel: `r.user` field
  - Feed posts: `poster?.handle`
  - Messages new-chat user search: `u.handle`

### 23. Admin widget-request badge clears on view
**Problem:** The `✦ Widget Requests` badge in the Admin left-sidebar always showed the total count of "new" status requests, even after the admin had already viewed them. It never cleared.
**Fix:**
- Added `seenRequestIds` state (a `Set`) to `AdminPage`.
- A `useEffect` on `section` fires whenever the section changes to `"requests"` and adds all current request IDs to `seenRequestIds`.
- The badge in `navItems` now counts `widgetRequests.filter(r => r.status === "new" && !seenRequestIds.has(r.id)).length` — so it shows only genuinely new (unseen) requests. Navigating to the panel immediately clears the badge.

### 24. Full cross-device persistence via Supabase
**Problem:** Multiple pieces of user state only lived in `localStorage`, meaning they were lost when logging in from a different browser or device:
- Widget expanded/collapsed state on dashboard
- Work section notes
- Work section master / today / custom to-do lists

**Fix — widget expanded state:**
- The existing `useEffect` that loaded `bio_links` from `user_data` was extended to also fetch `widget_expanded` in the same query (single round-trip, using `.in('key', ['bio_links', 'widget_expanded'])`).
- On load: if a `widget_expanded` row exists, `setExpandedWidgets(new Set(row.value))` and update localStorage cache.
- `toggleExpand` now calls `supabase.from('user_data').upsert(...)` with `{ key: 'widget_expanded', value: [...expandedSet] }` after every toggle.

**Fix — Work section data (notes + todos):**
- Added `saveWorkData(sbKey, lsKey, value)` helper inside `WorkPage` — writes to localStorage and upserts to `user_data` in one call.
- All four persistent setters (`setMasterTodos`, `setDailyTodos`, `setNotes`, `setCustomLists`) are now `useCallback`-wrapped and use the functional updater pattern so the correct next-state is always written (no stale closure bugs).
- A new `useEffect` on `user?.id` fetches all four keys (`work_notes`, `work_todos_master`, `work_todos_daily`, `work_todos_custom`) from Supabase in a single query on login and overrides the localStorage cache.
- Supabase keys: `work_todos_master`, `work_todos_daily`, `work_notes`, `work_todos_custom` (all stored in `user_data` table with `onConflict: 'user_id,key'` upsert).
- `localStorage` is still written as an instant-load cache on every save.

---

## Changes Made This Session (session 4)

### 15. Widget request @ handle fixed
**Problem:** `WidgetRequestModal` was hardcoding `ME_BASE.handle` (`@margot`) as the sender handle in every widget request, regardless of the logged-in user.
**Fix:** Added `handle` prop to `WidgetRequestModal`; `DashboardPage` now passes `handle={displayHandle}` (which is derived from `profile?.handle`). The submit call uses `handle || ME_BASE.handle` as the fallback.

### 16. Widget expanded state persists across sessions
**Problem:** `expandedWidgets` was a `new Set(["gallery", "blog"])` with no persistence — it reset to its defaults after every logout/refresh.
**Fix:** Added a `EXPAND_KEY = nook_expanded_{userId}` localStorage key. `expandedWidgets` is initialised by reading from localStorage; `toggleExpand` now writes the updated set back to localStorage immediately on every toggle. Works per-user.

### 17. To-Do List widget — named subgroups
**Problem:** The `TodoWidget` (dashboard widget) only had a flat list of items.
**Fix:** Complete rewrite of `TodoWidget` to support multiple named groups:
- Data format upgraded from `{ items: [] }` to `{ groups: [{ id, name, items }] }` — **backward-compatible** (old flat `items` array is migrated into a default group named "My Tasks" on first load).
- Each group has its own input row and item list.
- Groups can be collapsed/expanded individually.
- Group names are editable inline.
- Groups can be deleted (minimum 1 group enforced).
- "+ Add group" button at the bottom creates new named groups.
- `onDataChange` saves both new `groups` array AND flattened `items` for backward compat.

### 18. Current Projects widget — arrow link fixed
**Problem:** The `↗` link arrow next to a project URL was navigating to the dashboard (or causing unexpected navigation) when the URL was entered without a protocol (e.g. `google.com` instead of `https://google.com`), causing the browser to treat it as a relative path.
**Fix:** The `href` now prepends `https://` if the URL doesn't already start with `http://` or `https://`. Also added `e.stopPropagation()` on the anchor's `onClick` to prevent any parent click handlers from firing.

### 19. Work page — notes save button + persistence
**Problem:** Notes in the Work section (a) had no explicit Save button, and (b) were lost on logout/page change because state was never persisted.
**Fix:**
- `WorkPage` now stores notes in `localStorage` under key `nook_work_notes_{userId}`. State is initialised from localStorage and re-loaded whenever `user.id` changes (e.g. after login).
- `WorkNotes` now tracks a `draftBody` state separate from the committed note body. The textarea writes to `draftBody` only; a **Save** button commits the draft to the notes list. The button shows "Save" (highlighted) when there are unsaved changes, "Saved" (dimmed) when clean, and a "✓ Saved" flash for 1.8 s after saving.
- When switching notes with unsaved changes, the draft is auto-committed before switching.
- The note editor border highlights when there are unsaved changes.

### 20. Work page — to-do lists persist across logout/navigation
**Problem:** `masterTodos`, `dailyTodos`, and custom lists in the Work section were stored only in component state and lost on every logout or page navigation.
**Fix:** All four data arrays (`masterTodos`, `dailyTodos`, `notes`, `customLists`) now persist via localStorage:
- Keys: `nook_work_master_{userId}`, `nook_work_daily_{userId}`, `nook_work_notes_{userId}`, `nook_work_custom_{userId}`
- Wrapped setters (`setMasterTodos`, `setDailyTodos`, `setNotes`, `setCustomLists`) write to localStorage on every call.
- `useEffect` on `user?.id` re-loads all four from localStorage when the user changes (e.g. after sign-in).

### 21. Work page — create custom named to-do lists
**Problem:** The Work Todos section only had a hardcoded "Master List" and "Today" list; users had no way to create additional lists.
**Fix:** `WorkTodos` refactored from a pure functional component to a stateful one. A `customLists` prop (array of `{ id, name, items }`) is passed down from `WorkPage`.
- Each custom list renders in the same grid as Master List / Today, using the existing `WorkTodoList` component.
- List names are editable inline.
- Lists can be deleted (🗑 button in the header).
- A "+ New list" button (dashed border, below the grid) lets users create any number of additional lists.
- Custom lists persist via localStorage (key `nook_work_custom_{userId}`).

---

## Changes Made This Session (session 3)

### 14. Admin signup chart — real data fixed

**Problem:** The 7-day signups bar chart in the Admin panel always showed all zeros because `profiles` had no `created_at` column. `useAdminData.js` already had the correct query logic (with a graceful zero-fallback), so the fix was purely a database migration.

**Fix — `supabase-signup-fix.sql`** (run in Supabase SQL Editor):
1. `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()` — adds the column
2. `UPDATE profiles p SET created_at = u.created_at FROM auth.users u WHERE p.id = u.id` — backfills existing profiles with their **real** signup date from `auth.users` (Supabase profiles use the auth user UUID as their primary key, so the join is exact)
3. `CREATE OR REPLACE FUNCTION set_profile_created_at()` + trigger `trg_profile_created_at` — ensures every future profile insert automatically gets the correct timestamp from `auth.users`, not just `NOW()` at insert time

**No JS changes required** — `fetchSignupsByDay` in `useAdminData.js` already queries `profiles.created_at` and will work correctly once the column exists.

---

## Changes Made (session 2)

### 1. Accent colour applied to app theme
**Problem:** Accent colour selection in Settings only updated a CSS variable but all components used hardcoded `P.lavender`.

**Fix:**
- Lifted `accent` state from `SettingsPage` up to `App` component
- On user load, reads from `localStorage` (`nook_accent_{userId}`)
- Two `useEffect`s in App: one to load from localStorage on user change, one to set `--nook-accent` and `--nook-accent-light` CSS variables on the document root
- `Nav` component now accepts `accent` prop (with `#C9B8F0` default); all hardcoded `P.lavender` references in Nav replaced with `accent`/`accentLight`
- `SettingsPage` receives `accent` + `onAccentChange` props; swatch onClick calls `onAccentChange`

### 2. Bio links persisted to Supabase
**Problem:** Bio links (email + custom links) only saved to React state, lost on refresh.

**Fix:** Uses existing `user_data` table with `key = 'bio_links'` and `value = { email, links }` jsonb.
- `useEffect` on mount loads from `user_data` table
- Save button `async`, upserts to `user_data` with `onConflict: 'user_id,key'`

### 3. Bio description persisting on reload
**Problem:** `bio` state initialised from `profile?.bio` synchronously at mount, but profile loads async — so bio was always blank on first load.

**Fix:** Added `useEffect(() => { if (profile?.bio !== undefined) setBio(profile.bio || ""); }, [profile?.bio])` in SettingsPage.

### 4. Messaging infrastructure (major work)

#### Problem chain:
- Original schema had `messages` table; hook referenced `chat_messages` — mismatch
- First RLS migration created a self-referential `conv_members_read` policy that caused Postgres infinite recursion error `42P17`
- Multiple SQL fix attempts failed because the recursion crashed execution before DROP ran
- User deleted all policies manually via Supabase UI, then ran clean SQL
- After clean policies, still got 400 errors on `conversations` fetch — PostgREST nested join `conversation_members(profiles:user_id(...))` requires a registered FK that didn't exist
- After flattening queries, `conv_members_read` policy was `user_id = auth.uid()` — meaning users could only see THEIR OWN membership row, so `otherMembers` was always empty → "Unknown" display names

#### Fixes applied:
- **`supabase-policies-only.sql`**: Clean RLS policies + creates `chat_messages` table
- **`supabase-members-policy-fix.sql`**: Replaces `conv_members_read` with SECURITY DEFINER function approach to allow seeing all members without recursion
- **`src/hooks/useMessages.js`**: Complete rewrite to use flat queries (no nested PostgREST joins):
  - `fetchConversations`: 4 separate flat queries — own memberships → conversations → all members → profiles; assembled manually
  - `fetchMessages`: flat query + separate profile fetch
  - `startDM` + `startGroupChat`: use `crypto.randomUUID()` client-side — avoids SELECT-after-INSERT RLS chicken-and-egg problem
  - `sendMessage`: also uses client-side UUID + optimistic update
  - `selectConversation`: clears `unreadCount` to 0 immediately on open
  - `lastMessage` in conversations enriched with profile from already-fetched `profilesById` map

### 5. Group chat creation fixed
**Problem:** Create Group Chat button dismissed the modal but no chat appeared.

**Fix:** Removed `pendingSelectRef` approach; `startConvo` in MessagesPage now calls `handleSelect(conversationId)` directly after `startGroupChat` returns, then calls `refresh()` to update sidebar.

### 6. Message delete
- `deleteMessage(messageId)` in `useMessages.js` — deletes from DB, removes from local `messages` state, clears `lastMessage` if it was the deleted message
- Hover a message you sent → 🗑 button appears inline to the left of bubble (not absolutely positioned)
- Requires SQL policy: `CREATE POLICY "chat_messages_member_delete" ON public.chat_messages FOR DELETE USING (auth.uid() = sender_id);`

### 7. Conversation delete
- `deleteConversation(conversationId)` in `useMessages.js` — deletes conversation (cascades to members + messages), removes from local state, clears active conversation if it was the deleted one
- Hover a conversation in the left panel → 🗑 button appears on the right
- Requires SQL policy: `CREATE POLICY "conversations_member_delete" ON public.conversations FOR DELETE USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid()));`

### 8. Unread count clears on open
`selectConversation` now immediately sets `unreadCount: 0` for the opened conversation in local state — bold text and unread badge disappear as soon as you click.

### 9. Sidebar message preview sender name fixed
`fetchConversations` now enriches `lastMessage` with `profiles: profilesById[lastMsg.sender_id]` using the already-fetched member profiles map — previously `lastMsg.profiles` was always undefined.

### 10. Duplicate DM prevention
`startDM` checks `conversations` state for an existing DM with the target user before creating a new one. Requires the `conv_members_read` fix (item 4 above) to work — `otherMembers` must be populated for the check to match.

### 11. Member count in group chat header
Fixed: was using `convo.conversation_members?.length` (nested array no longer present after query rewrite). Now uses `(convo.otherMembers?.length || 0) + 1`.

### 13. Admin panel — real user data wired up

**Problem:** Admin panel was using dead mock data constants (`ADMIN_USERS`, `DAU_DATA`, `WIDGET_POPULARITY`, `FLAGGED_CONTENT`, `FEEDBACK_SEED`) that were never connected to `AdminPage`. `useAdminData` already fetched from Supabase but `fetchSignupsByDay` returned all-zero data, and `flagUser` didn't exist.

**Changes:**
- Deleted all dead mock constants from `App.jsx`; `useState(ANNOUNCEMENTS_SEED)` replaced with `useState([])`
- `fetchSignupsByDay` in `useAdminData.js` attempts to query `profiles.created_at` but gracefully falls back to zeros — `created_at` does **not** exist on `profiles` in the current schema, so the signup chart always shows flat zero data (see Known Issues)
- Added `flagUser(userId, flagged)` to `useAdminData.js` — updates `profiles.flagged` in Supabase + local state; exposed as `flagUser` in hook return
- Added `flaggedUsers` derived count to hook return
- **SQL required:** Run `supabase-admin-columns.sql` in Supabase → SQL Editor to add `suspended` and `flagged` boolean columns to `profiles` (uses `ADD COLUMN IF NOT EXISTS` so safe to re-run)

### 12. Admin panel restored
**Problem:** Admin panel (ADMIN button in Nav + `AdminPage`) was not visible for the admin account.

**Root cause:** `isAdmin` is computed as `!!user && !!ADMIN_ID && user.id === ADMIN_ID` where `ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID`. This env var was missing from `.env`, so `ADMIN_ID` was always `undefined` → `isAdmin` always `false` → button never rendered.

**Fix:** Added `VITE_ADMIN_USER_ID=b13abdda-9561-4b54-a452-1a533d84b5a8` to `.env`. Dev server restart required after this change (Vite reads env at startup).

---

## Session 22 Changes (2026-03-18)

### 56. Settings privacy toggles — allowMessages + defaultPublic wired up; showOnline marked coming soon

**Problem:** All three Privacy section toggles in Settings were saving to Supabase correctly but had no effect on the app — they were pure stubs.

**`allowMessages` fix (two parts):**

1. **New SQL file `supabase-priv-prefs-public-read.sql`** — replaces the existing `user_data_bio_links_public_read` policy with a broader `user_data_public_keys_read` policy that allows reading both `bio_links` AND `priv_prefs` for any user. Required so `PublicProfilePage` can read the target user's preferences. **Action required: run this in Supabase SQL Editor.**

2. **`PublicProfilePage` updated** — the `Promise.all` now fetches `user_data` for both `bio_links` and `priv_prefs` in a single query (`.in('key', ['bio_links', 'priv_prefs'])`). New `allowMessages` state (defaults `true`). If `priv_prefs.allowMessages === false`, the ✉ Message button is replaced with a greyed-out "✉ Messages off" pill (non-clickable, with tooltip).

**`defaultPublic` fix:**

- `DashboardPage` now accepts a `privPrefs` prop (passed from App).
- `toggleEnabled` updated: when turning a widget **on**, if `privPrefs?.defaultPublic` is `true`, the widget is also set to `isPublic: true` in the same update. Turning widgets off is unchanged.

**`showOnline` — marked coming soon:**

- No online status infrastructure exists (no `last_seen` column, no presence channel). Rather than leave the toggle active with no effect, `ToggleRow` now accepts a `disabled` prop (renders at 45% opacity, click is a no-op). The "Show online status" row uses `disabled` with "coming soon" in the subtitle.

3. **`NewConvoModal` updated** — after the profiles search returns, a second query fetches `priv_prefs` for all result user IDs. Users with `allowMessages: false` are added to a `dmBlocked` Set. In the DM tab: blocked users render at 50% opacity with a "Messages off" badge and cannot be selected. Group tab: unaffected. Existing conversations: unaffected (block only prevents starting new DMs).

---

### 55. Mood tracker widget — stuck on yesterday's date

**Problem:** The mood tracker showed yesterday as "Today" and blocked the user from logging today's mood.

**Root cause:** The `useState` initializer loaded `data.history` directly:
```js
const [history, setHistory] = useState(() => data.history || buildHistory());
```
`data.history` is a frozen array saved at the time of last use. `today` is `history[history.length - 1]` — the last element. If data was saved yesterday, `today.date` was yesterday's ISO string. `buildHistory()` was only called when `data.history` was falsy (first-ever use), so returning users always got the stale frozen array.

**Fix — `mergeHistory` helper** (replaces the raw `data.history` load):
```js
const mergeHistory = (saved) => {
  if (!saved || saved.length === 0) return buildHistory();
  const fresh = buildHistory();  // 30-day window anchored to real today
  const savedMap = {};
  saved.forEach(d => { savedMap[d.date] = d; });
  return fresh.map(d => savedMap[d.date] ? { ...savedMap[d.date] } : d);
};
const [history, setHistory] = useState(() => mergeHistory(data.history));
```
On every mount, generates a fresh date window then overlays saved mood entries by date string. Today is always today; all past logged moods are preserved.

---

### 54. Admin panel — click into user dashboards/profiles

**Problem:** The admin Users section showed a table of all users with Name, Email, and a Suspend/Restore action, but there was no way to actually view or inspect a specific user's dashboard or public profile from the admin panel.

**Fix — two locations:**

1. **`AdminPage` — added `useContext(ProfileViewContext)`** at the top of the component (line ~6303):
```js
const openUserProfile = useContext(ProfileViewContext);
```
`ProfileViewContext` is the app-wide context that exposes the `openUserProfile(handleOrId)` function. Since `AdminPage` renders inside the `<ProfileViewContext.Provider>` in App's JSX tree, it can consume this directly — no prop changes needed.

2. **`UsersSection` — grid columns widened + "👁 View" button added:**
   - Grid template changed from `"2fr 2fr 120px"` → `"2fr 2fr 180px"` to accommodate the extra button.
   - A `👁 View` button added before the Suspend/Restore button:
```jsx
<button onClick={() => openUserProfile && openUserProfile(u.id)}
  style={{ background: P.lavenderLight, border: `1.5px solid ${P.lavender}`, ... }}
  title="View this user's dashboard">👁 View</button>
```
   Clicking it navigates to the user's `PublicProfilePage` (same as clicking any handle anywhere in the app). Guard `openUserProfile &&` ensures graceful no-op if context is somehow unavailable.

3. **Overview section "Recent signups" list** — added a small `👁` icon-only button to each row in the Recent Signups card so admins can jump to a user's profile directly from the Overview too.

**No new props, no SQL changes, no new state** — the fix purely wires up the existing `ProfileViewContext` within `AdminPage`.

---

## Session 21 Changes (2026-03-17)

### 52. Notification click — post detail modal

**Problem:** Clicking a like/comment notification needed to show the specific post that was liked/commented on. The post belongs to the current user, so it doesn't appear in the feed (which only shows followed users' posts).

**Fix:**
- New `PostDetailModal` component: fetches the post by ID from Supabase on mount (including likes + comments with profiles), renders the full post with like toggle and comment thread, allows adding new comments inline. Click outside or ✕ to close.
- New `viewPostId` state in App. `onOpenPost` prop now just calls `setViewPostId(postId)` — no page navigation needed.
- `PostDetailModal` rendered in App alongside other modals; shown whenever `viewPostId` is set.
- `NotificationsDropdown` already had `onOpenPost` wired from session 20 work. No changes needed there.
- SQL: `supabase-notification-source-id.sql` was **applied** this session — adds `source_id TEXT` column to `notifications` and updates both trigger functions to populate it with `post_id`.

### 53. Feed excludes own posts

**Problem:** The current user's own posts were appearing in their feed. Feed should show only posts from followed users.

**Fix — `src/hooks/useFeed.js`:**
- `following` filter: removed `ids.push(user.id)` — own posts no longer included.
- `all` filter: added `.neq('user_id', user.id)` — own posts excluded from the "All" view too.

---

## Session 20 Changes (2026-03-17)

### 51. Feed like/comment notifications — DB triggers + notifications subscription

**Problem:** Users received no notification when someone liked or commented on their feed posts. Investigation showed all SQL was already set up (`posts`, `likes`, `comments` in Realtime publication; `notifications` table with RLS existing). The previous client-side approach (subscribe to `likes`/`comments` → async ownership query → call addNotif) was silently failing — the `try/catch` blocks swallowed errors and the async post-ownership queries were unreliable.

**Root cause:** Client-side Realtime handlers that perform async DB queries in the callback are fragile. The ownership check (`supabase.from('posts').eq('user_id', user.id)`) could return null under various conditions, causing the handler to exit without firing a notification.

**Fix — two parts:**

**1. New file `supabase-feed-notification-triggers.sql`** (run once in Supabase SQL Editor):
- Adds `notifications` table to Realtime publication (safe DO block, idempotent).
- Creates `notify_on_like()` — PLPGSQL SECURITY DEFINER function that fires on `likes` INSERT: looks up post owner + liker name, inserts `type='like'` notification into `notifications` for the post owner.
- Creates `notify_on_comment()` — same pattern for `comments` INSERT.
- Attaches both as `AFTER INSERT` triggers on `likes` and `comments`.

**2. App.jsx changes (notification `useEffect`):**
- Removed `commentCh` and `likesCh` (subscribe to `comments`/`likes` tables) — replaced by DB triggers.
- Added `notifCh` — subscribes to `notifications` table INSERT events with filter `user_id=eq.${user.id}`. When a DB trigger inserts a notification, Supabase Realtime delivers it directly to the post owner. Handler just updates in-memory state with dedup. No async ownership queries needed.
- Cleanup: now `followCh` + `notifCh` (was `followCh` + `commentCh` + `likesCh`).

**How it all works together:**
- **Real-time (same session):** DB trigger fires → inserts into `notifications` → `notifCh` delivers to owner's client → bell lights up immediately.
- **Offline (next login):** existing load-on-login loads last 50 rows from `notifications` — DB-inserted notifications are automatically included, no extra code needed.

**Action required: run `supabase-feed-notification-triggers.sql`** in Supabase SQL Editor.

---

## Session 19 Changes (2026-03-17)

### 13. Dashboard blank on login until tab switch — fixed

**Root cause:** `DashboardPage` was mounted (with `display: none`) while `page` was still `"home"`. The browser never painted the widgets. When the user switched tabs and back, the browser triggered a repaint and the widgets appeared.

**Fix — `dashboardEverMounted` render-phase guard:**
- Added `const dashboardEverMounted = useRef(false);` in `App`.
- Inline (render phase, before `return (`): `if (user && ["dashboard","customize"].includes(page)) dashboardEverMounted.current = true;`
- JSX: `{user && dashboardEverMounted.current && <div style={{ display: [...].includes(page) ? "block" : "none" }}><DashboardPage .../></div>}`
- This ensures `DashboardPage` only ever **first mounts** when it will be visible (`display: block`), so the browser paints it correctly. Once mounted it stays mounted (CSS `display:none/block`) to preserve widget state.
- **Key lesson**: Setting a ref inside `useEffect` runs *after* render — JSX conditions reading that ref won't see it in the same render. The assignment must be in the render phase (function body, before `return`).

### 14. Goals / reading list / habit tracker / podcast picks / exercise log not saving cross-browser — fixed

**Root cause:** These 5 widgets use "lifted state" — their data lives in `DashboardPage` state (`readingItems`, `goals`, `habits`, `pods`, `exerciseChecked`) passed down via `getLiveData()`. The raw `setState` setters were returned directly; they update React state and `localStorage` but never called `onDataChange`, so Supabase (`widget_configs`) was never written. Opening a new browser had no data to load.

**Fix — `getLiveData` rewrite with `saveToDb` wrapper:**
Each lifted-state entry in `getLiveData` now wraps its setter with a `saveToDb` call that upserts to `widget_configs`:
```js
const saveToDb = (widgetId, data) => {
  if (!user?.id) return;
  supabase.from('widget_configs')
    .upsert({ user_id: user.id, widget_id: widgetId, data, updated_at: new Date().toISOString() },
             { onConflict: 'user_id,widget_id', ignoreDuplicates: false })
    .then(({ error }) => { if (error) console.warn('[Nook] lifted-state save error', widgetId, error); });
};
```
Affected widget IDs: `"reading"`, `"goals"`, `"habitstreak"`, `"podcast"`, `"exercise"`.

### 15. Saved links / bookmarks open `localhost:5173/google.ie` — fixed

**Root cause:** `ensureHttps(url)` was applied when *saving* new links (session 17) but not when *rendering* existing ones. Bare URLs like `google.ie` in an `<a href>` are treated as relative paths by the browser → `localhost:5173/google.ie`.

**Fix:** Applied `ensureHttps()` at render time on every `<a href>`:
- `LinksWidget` (~line 698): `href={ensureHttps(l.url)}`
- `BookmarksWidget` (~lines 2643, 2768, 2798): `href={ensureHttps(bm.url)}`

### 16. Profile photo not saved cross-device — fixed

**Root cause:** `profilePic` was only persisted to `localStorage` (`nook_state`). A new device/browser had no photo.

**Fix:**
- Load: added `'profile_pic'` to the `user_data` Supabase query in the auth load effect. When found, sets `profilePic` state and writes to `localStorage`.
- Save: added a `useEffect` on `[profilePic, user?.id]` that upserts `{ key: 'profile_pic', value: { data: profilePic } }` to `user_data` table.

### 17. Exercise log shows different data in public view — fixed

Resolved automatically by fix #14 (session 19). Once the exercise widget saves to `widget_configs` via `saveToDb`, the `PublicProfilePage` (which reads `widget_configs`) shows the correct data.

### 18. Blog posts stuck as draft — no way to publish — fixed

**Root cause:** The Publish toggle was only accessible inside the edit modal. Users had to click Edit, toggle published, then save — not discoverable.

**Fix:** Added Publish / Unpublish buttons directly in the **view mode** of `BlogPostModal` (visible to the post owner only):
- "✓ Publish" button: calls `onSave({ ...post, published: true })` inline
- "← Unpublish" button: calls `onSave({ ...post, published: false })` inline
- Existing Edit / Delete buttons remain unchanged

---

## SQL Files in Project Root

| File | Status | Purpose |
|------|--------|---------|
| `supabase-schema.sql` | Reference | Original schema |
| `supabase-messaging-migration.sql` | Superseded | First attempt — had recursive policy |
| `supabase-messaging-fix.sql` | Superseded | Failed to fix recursion |
| `supabase-messaging-fix2.sql` | Superseded | Failed |
| `supabase-messaging-fix3.sql` | Superseded | Failed |
| `supabase-policies-only.sql` | **Applied** | Clean policies + chat_messages table |
| `supabase-members-policy-fix.sql` | **Applied** | SECURITY DEFINER fix for member visibility |
| `supabase-admin-columns.sql`      | **Applied** | Adds `suspended` + `flagged` columns to `profiles` |
| `supabase-signup-fix.sql`         | **Applied** | Adds `created_at` to `profiles`, backfills real dates from `auth.users`, adds trigger for future inserts |
| `supabase-follows-realtime.sql`   | **Applied** | Adds `follows` table to `supabase_realtime` publication — required for follower notifications |
| `supabase-widget-configs-fix.sql` | **Applied** | Creates `widget_configs` table with RLS: public SELECT, owner-only write — required for public profiles to show widgets |
| `supabase-bio-links-public-read.sql` | **Applied** | Adds SELECT policy on `user_data` for `key = 'bio_links'` — required for bio links/email to appear on public profiles |
| `supabase-calendar-contributions-v2.sql` | **Applied** | Creates `calendar_contributions` table with RLS policies for shared calendar events (session 14) |
| `supabase-notifications.sql` | **Applied** | Creates `notifications` table with RLS — required for bell-icon notifications to persist across refreshes (session 16) |
| `supabase-feed-events.sql` | **Applied** | Adds `posts`, `likes`, `comments` to `supabase_realtime` publication + adds `content`/`image_url` columns to `posts`. Confirmed applied — all three tables already in publication. |
| `supabase-feed-notification-triggers.sql` | **Applied** | Creates DB triggers on `likes` and `comments` that insert into `notifications` table. Also adds `notifications` to Realtime publication. (session 20) |
| `supabase-notification-source-id.sql` | **Applied** | Adds `source_id TEXT` column to `notifications`; updates `notify_on_like` and `notify_on_comment` trigger functions to populate it with the post ID. Required for notification click → post detail modal. (session 21) |
| `supabase-priv-prefs-public-read.sql` | **Pending** | Replaces `user_data_bio_links_public_read` policy with a broader policy covering both `bio_links` and `priv_prefs` — required for `allowMessages` to work on public profiles. (session 22) |

---

## Known Remaining Issues / Next Steps

### Messaging
- **Realtime for deleted messages**: If user A deletes a message, user B's view doesn't update until refresh. Need to subscribe to DELETE events on `chat_messages` in the realtime channel handler.
- **Realtime for deleted conversations**: Same — deletion not broadcast to other participants.
- **Unread count accuracy**: Current unread count counts ALL messages not from the current user since the beginning of time, not since last read. Should store a `last_read_at` per user per conversation.
- **Message read receipts**: Not implemented.
- **Image/file attachments in messages**: Not implemented.
- **Push notifications**: Not implemented.
- **Mobile responsiveness of messages**: The two-panel layout uses CSS classes `nook-msg-layout`, `nook-msg-sidebar`, `nook-msg-hidden` — verify these are defined.

### Settings
- **`showOnline` privacy pref**: Marked "coming soon" and disabled in Settings UI. Requires online presence infrastructure (a `last_seen` column on `profiles` updated on login/activity, plus display on public profiles and in messages). Not yet built.
- **Action required — run `supabase-priv-prefs-public-read.sql`** for `allowMessages` to work on public profiles. Until this is run, `priv_prefs` is not publicly readable and the Message button will always show.
- **Settings props need a proper home**: `notifPrefs`/`privPrefs` (and setters) are passed as props from App → SettingsPage. Before adding more settings sections, move these into a `UserPrefsContext` so any component can access prefs without prop-drilling.

### Admin
- **`lastSeen`, `widgets`, `posts` counts** in admin Users table: no data source in schema; currently show blank/zero. Decide whether to track these.

### Public profiles
- **Widget data on public profiles**: If a user has never edited a widget's content, `data` will be null in `widget_configs` and the widget renders empty on their public profile. Goals, reading list, habit tracker, podcast picks, and exercise log are handled (save via `saveToDb` in `getLiveData`), but other widgets only save on explicit user edit.

### General
- **Widget reordering**: Drag-and-drop exists but cross-device persistence may need verification.

---

### ~~Resolved — no longer pending~~
- ~~**All SQL migrations pending**~~ **ALL APPLIED (session 22)** — admin columns, signup backfill, follows realtime, widget_configs RLS, bio links public read, calendar contributions, notifications table.
- ~~**DEPLOY PENDING**~~ **DEPLOYED (session 22)** — commit `1860501` pushed to GitHub; Netlify rebuilt with Calendar section, sidebar fixes, and Supabase persistence fix.
- ~~**Email confirmation link going to localhost**~~ **FIXED (session 22)** — `emailRedirectTo: 'https://nook-hub.com'` added to `signUp` in `useAuth.js`; Supabase Site URL updated in dashboard.
- ~~**Mood tracker stuck on yesterday**~~ **FIXED (session 22)** — `mergeHistory()` now rebuilds a fresh 30-day window on every mount and overlays saved entries by date string.
- ~~**Admin panel — no way to view user dashboards**~~ **FIXED (session 22)** — `👁 View` button added to Users section and Overview recent signups list; uses `ProfileViewContext` (no new props needed).
- ~~**allowMessages / defaultPublic toggles were stubs**~~ **FIXED (session 22)** — both now enforced. `allowMessages` hides the Message button on public profiles; `defaultPublic` sets new widgets to public on enable. `showOnline` marked coming soon (no infrastructure yet).
- ~~**Work data lost on new-browser login**~~ **FIXED (session 15)**
- ~~**Calendar section missing from Work sidebar**~~ **FIXED (session 15)**
- ~~**Signup chart always zero**~~ **FIXED (session 3)**
- ~~**Handle clicks opened popup with fake data**~~ **FIXED (session 6)**
- ~~**No follower visibility**~~ **FIXED (session 6)**
- ~~**In-session notifications only**~~ **FIXED (session 16)**
- ~~**Note auto-focus after create**~~ **FIXED (session 16)**

---

## Key Architecture Notes

### Why flat queries (no PostgREST nested joins)?
PostgREST nested join syntax like `conversation_members(profiles:user_id(...))` requires a registered foreign key in the database schema. Without that FK, PostgREST returns 400. Rather than add FKs (which requires schema changes and cache refreshes), all queries in `useMessages.js` use separate flat SELECT statements assembled in JS.

### Why `crypto.randomUUID()` for inserts?
Supabase's `.insert().select().single()` pattern does an INSERT then a SELECT filtered by RLS. For `conversations`, the SELECT requires the user to be a member — but members haven't been inserted yet at that point (chicken-and-egg). Solution: generate the UUID client-side, insert without `.select()`, then insert members using the pre-known ID.

### Why the SECURITY DEFINER function for `conv_members_read`?
The natural RLS policy `conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())` is self-referential — the policy queries the same table it's protecting, causing Postgres error `42P17` (infinite recursion). The fix: a `SECURITY DEFINER` function `my_conversation_ids()` that runs as the DB owner (bypassing RLS). The policy calls this function instead of querying the table directly, breaking the recursion loop.
