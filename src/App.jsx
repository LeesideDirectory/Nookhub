// NOOK BUILD v42 - onboarding fix
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useFeed } from './hooks/useFeed'
import { useMessages } from './hooks/useMessages'
import { useAdminData } from './hooks/useAdminData'


const P = {
  lavender: "#C9B8F0", lavenderLight: "#EDE8FB", lavenderMid: "#D8CCFA",
  mint: "#B4E8D8", mintLight: "#E4F8F2",
  peach: "#F8CEBA", peachLight: "#FEF0EA",
  sky: "#B8D8F0", skyLight: "#E8F3FC",
  rose: "#F0B8C8", roseLight: "#FDE8EF",
  butter: "#F5E8B0", butterLight: "#FDFAE8",
  ink: "#3D3550", inkLight: "#6B6080", inkFaint: "#A89CC0",
  white: "#FDFCFF", bg: "#F5F2FC",
  online: "#6DCBA0", away: "#F5C26B",
};
const FF_S = "'DM Sans', sans-serif";
const FF_D = "'DM Serif Display', serif";

const WIDGET_COLORS = [
  { bg: P.lavenderLight, accent: P.lavender, dot: "#9B85D8" },
  { bg: P.mintLight,     accent: P.mint,     dot: "#5DCAAA" },
  { bg: P.peachLight,    accent: P.peach,    dot: "#E8956A" },
  { bg: P.skyLight,      accent: P.sky,      dot: "#5AAADE" },
  { bg: P.roseLight,     accent: P.rose,     dot: "#D8708A" },
  { bg: P.butterLight,   accent: P.butter,   dot: "#C8A830" },
];

const ME_BASE = { id: "me", name: "Margot Ellison", handle: "@margot", initials: "ME", color: P.lavender, status: "online" };

const USERS = [
  { id: "u1", name: "Cleo Hartwell",  handle: "@cleo",  initials: "CH", color: P.mint,    status: "online",  bio: "Writer & illustrator 🖋" },
  { id: "u2", name: "Soren Vale",     handle: "@soren", initials: "SV", color: P.sky,     status: "online",  bio: "Photographer & wanderer" },
  { id: "u3", name: "Iris Nakamura",  handle: "@iris",  initials: "IN", color: P.rose,    status: "away",    bio: "Designer, plant parent 🌱" },
  { id: "u4", name: "Felix Oduya",    handle: "@felix", initials: "FO", color: P.peach,   status: "offline", bio: "Musician & coffee enthusiast" },
  { id: "u5", name: "Ada Kowalski",   handle: "@ada",   initials: "AK", color: P.butter,  status: "online",  bio: "Engineer & weekend baker" },
  { id: "u6", name: "Theo Marsh",     handle: "@theo",  initials: "TM", color: P.lavender,status: "offline", bio: "Bookworm & slow traveller" },
];
const ALL_USERS = [ME_BASE, ...USERS];
const getUser = (id) => ALL_USERS.find(u => u.id === id);

const now = Date.now();
const mins = (n) => now - n * 60000;

const INITIAL_CONVOS = [];
const INITIAL_REQUESTS = [];

const INITIAL_WIDGETS = [
  { id: "todo",        title: "To-Do List",         icon: "✓",  enabled: false, isPublic: false, colorIdx: 0, category: "productivity",     data: { items: [] }},
  { id: "goals",       title: "Goals for the Year",  icon: "★",  enabled: false, isPublic: false, colorIdx: 1, category: "productivity",     data: { items: [] }},
  { id: "reading",     title: "Reading List",         icon: "📖", enabled: false, isPublic: false, colorIdx: 2, category: "culture",          data: { items: [] }},
  { id: "mood",        title: "Mood Tracker",         icon: "☀",  enabled: false, isPublic: false, colorIdx: 3, category: "lifestyle",        data: { week: [] }},
  { id: "links",       title: "Saved Links",           icon: "🔗", enabled: false, isPublic: false, colorIdx: 4, category: "productivity",     data: { items: [] }},
  { id: "gratitude",   title: "Gratitude Journal",     icon: "♡",  enabled: false, isPublic: false, colorIdx: 5, category: "lifestyle",        data: { entries: [] }},
  { id: "sobriety",    title: "Sobriety Streak",       icon: "🌱", enabled: false, isPublic: false, colorIdx: 1, category: "lifestyle",        data: { label: "", startDate: null }},
  { id: "habitstreak", title: "Habit Tracker",         icon: "🔥", enabled: false, isPublic: false, colorIdx: 2, category: "lifestyle",        data: { habits: [] }},
  { id: "instagram",   title: "Instagram",              icon: "📸", enabled: false, isPublic: false, colorIdx: 4, category: "social",           data: { username: "" }},
  { id: "sports",      title: "Sports Tracker",         icon: "🏃", enabled: false, isPublic: false, colorIdx: 3, category: "sports",           data: { activities: [] }},
  { id: "hobbies",     title: "Hobbies",                icon: "🎨", enabled: false, isPublic: false, colorIdx: 5, category: "lifestyle",        data: { hobbies: [] }},
  { id: "linkedin",    title: "LinkedIn",               icon: "💼", enabled: false, isPublic: false, colorIdx: 0, category: "social",           data: { username: "", headline: "", followers: "", posts: [] }},
  { id: "twitter",     title: "Twitter / X",            icon: "✕",  enabled: false, isPublic: false, colorIdx: 3, category: "social",           data: { username: "", followers: "", tweets: [] }},
  { id: "projects",    title: "Current Projects",       icon: "🚀", enabled: false, isPublic: false, colorIdx: 1, category: "entrepreneurship", data: { projects: [] }},
  { id: "podcast",     title: "Podcast Picks",          icon: "🎙", enabled: false, isPublic: false, colorIdx: 4, category: "culture",          data: { pods: [] }},
  { id: "travel",      title: "Travel",                 icon: "✈",  enabled: false, isPublic: false, colorIdx: 2, category: "lifestyle",        data: { trips: [] }},
  { id: "articles",    title: "Articles",               icon: "✍",  enabled: false, isPublic: false, colorIdx: 5, category: "culture",          data: { articles: [] }},
  { id: "exercise",    title: "Exercise Log",            icon: "🏃", enabled: false, isPublic: false, colorIdx: 1, category: "sports",           data: { days: [] }},
  { id: "archive",     title: "Year in Review",          icon: "✦",  enabled: false, isPublic: false, colorIdx: 5, category: "lifestyle",        data: { years: [] }},
  { id: "gallery",     title: "Gallery",                 icon: "🖼",  enabled: false, isPublic: false, colorIdx: 4, category: "social",           data: { posts: [] }},
  { id: "blog",        title: "Blog",                    icon: "✍",  enabled: false, isPublic: false, colorIdx: 0, category: "culture",          data: { posts: [] }},
  { id: "bookmarks",   title: "Bookmarks",               icon: "🔖", enabled: false, isPublic: false, colorIdx: 2, category: "productivity",     data: { bookmarks: null }},
];

function fmtTime(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const UserAvatar = ({ user, size = 36, showStatus = false, photoPic = null }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: user?.color || P.lavender,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FF_D, fontSize: size * 0.33,
      color: P.ink, border: `2px solid ${P.white}`,
      boxShadow: "0 2px 8px rgba(61,53,80,0.10)",
      overflow: "hidden",
    }}>
      {photoPic
        ? <img src={photoPic} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : user?.initials
      }
    </div>
    {showStatus && user?.status && (
      <div style={{
        position: "absolute", bottom: 1, right: 1,
        width: size * 0.28, height: size * 0.28, borderRadius: "50%",
        background: user.status === "online" ? P.online : user.status === "away" ? P.away : "#C8C0D8",
        border: `1.5px solid ${P.white}`,
      }} />
    )}
  </div>
);

const GroupAvatar = ({ participants, size = 36 }) => {
  const others = participants.filter(id => id !== "me").slice(0, 2).map(getUser);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {others.map((u, i) => (
        <div key={u.id} style={{
          position: "absolute",
          left: i === 0 ? 0 : size * 0.35, top: i === 0 ? 0 : size * 0.35,
          width: size * 0.65, height: size * 0.65, borderRadius: "50%",
          background: u.color, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FF_D, fontSize: size * 0.22, color: P.ink,
          border: `1.5px solid ${P.white}`, zIndex: i === 1 ? 2 : 1,
        }}>{u.initials}</div>
      ))}
    </div>
  );
};

const Toggle = ({ on, onChange, small }) => {
  const w = small ? 32 : 40, h = small ? 18 : 22;
  return (
    <div onClick={onChange} style={{
      width: w, height: h, borderRadius: h, cursor: "pointer",
      background: on ? P.lavender : "#D8D4E8", transition: "background 0.25s",
      display: "flex", alignItems: "center", padding: "2px", flexShrink: 0,
    }}>
      <div style={{
        width: h - 4, height: h - 4, borderRadius: "50%",
        background: P.white, boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        transform: on ? `translateX(${w - h}px)` : "translateX(0)",
        transition: "transform 0.25s",
      }} />
    </div>
  );
};

const Nav = ({ page, onNavigate, onLogout, unreadCount, isLoggedIn, isAdmin, me, profilePic, following, unreadNotifs, showNotifs, setShowNotifs, notifications, onMarkRead, onMarkAllRead }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <nav style={{ background: P.white, borderBottom: `1px solid ${P.lavender}44`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(201,184,240,0.10)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px" }}>
        {/* Logo */}
        <div onClick={() => { onNavigate(isLoggedIn ? "dashboard" : "home"); close(); }}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <span style={{ fontFamily: FF_D, fontSize: 22, color: P.ink }}>Nook</span>
        </div>

        {/* Desktop links */}
        <div className="nook-nav-links">
          {isLoggedIn ? (
            <>
              {[["dashboard","My Dashboard"],["feed","Feed"],["messages","Messages"],["work","Work 🔒"],["customize","Customise"]].map(([v, label]) => (
                <button key={v} onClick={() => onNavigate(v)} style={{ background: page === v ? P.lavender : "transparent", border: `1.5px solid ${page === v ? P.lavender : P.lavender + "66"}`, borderRadius: 10, padding: "7px 15px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.ink, fontWeight: page === v ? 600 : 400, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
                  {label}
                  {v === "messages" && unreadCount > 0 && <span style={{ background: P.rose, borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700, color: P.ink }}>{unreadCount}</span>}
                </button>
              ))}
              <div style={{ width: 1, height: 22, background: P.lavender + "55", margin: "0 4px" }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowNotifs(v => !v)} style={{ position: "relative", background: showNotifs ? P.lavenderLight : "transparent", border: `1.5px solid ${showNotifs ? P.lavender : P.lavender + "44"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 16, lineHeight: 1, transition: "all 0.2s" }}>
                  🔔
                  {unreadNotifs > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: P.rose, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_S, fontSize: 9, fontWeight: 700, color: P.ink, border: `2px solid ${P.white}` }}>{unreadNotifs}</span>}
                </button>
                {showNotifs && <NotificationsDropdown notifs={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} onNavigate={onNavigate} onClose={() => setShowNotifs(false)} />}
              </div>
              <UserAvatar user={me} size={32} showStatus photoPic={profilePic} />
              <button onClick={() => onNavigate("settings")} title="Settings" style={{ background: page === "settings" ? P.lavender : "transparent", border: `1.5px solid ${page === "settings" ? P.lavender : P.lavender + "44"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: P.inkLight, lineHeight: 1, transition: "all 0.2s" }}>⚙</button>
              {isAdmin && <button onClick={() => onNavigate("admin")} title="Admin panel" style={{ background: page === "admin" ? P.lavender : "transparent", border: `1.5px solid ${page === "admin" ? P.lavender : P.lavender + "44"}`, borderRadius: 10, padding: "6px 8px", cursor: "pointer", fontSize: 11, color: P.inkFaint, lineHeight: 1, transition: "all 0.2s", fontFamily: FF_S, fontWeight: 600 }}>ADMIN</button>}
              <button onClick={onLogout} style={{ background: "transparent", border: `1.5px solid ${P.rose}55`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate("login")} style={{ background: "transparent", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 22px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink }}>Log in</button>
              <button onClick={() => onNavigate("signup")} style={{ background: P.lavender, border: "none", borderRadius: 12, padding: "8px 22px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: 600 }}>Sign up</button>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="nook-nav-mobile-menu">
          {isLoggedIn && (
            <>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowNotifs(v => !v)} style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px" }}>
                  🔔
                  {unreadNotifs > 0 && <span style={{ position: "absolute", top: -2, right: -2, background: P.rose, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_S, fontSize: 8, fontWeight: 700, color: P.ink }}>{unreadNotifs}</span>}
                </button>
                {showNotifs && <NotificationsDropdown notifs={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} onNavigate={onNavigate} onClose={() => setShowNotifs(false)} />}
              </div>
              <UserAvatar user={me} size={28} photoPic={profilePic} />
            </>
          )}
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: menuOpen ? P.lavenderLight : "transparent", border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{ borderTop: `1px solid ${P.lavender}33`, background: P.white, padding: "12px 16px 20px" }}>
          {isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[["dashboard","🏠 My Dashboard"],["feed","✦ Feed"],["messages","✉ Messages"],["work","🔒 Work"],["customize","⊞ Customise"],["settings","⚙ Settings"],...(isAdmin ? [["admin","◈ Admin"]] : [])].map(([v, label]) => (
                <button key={v} onClick={() => { onNavigate(v); close(); }} style={{ background: page === v ? P.lavenderLight : "transparent", border: `1px solid ${page === v ? P.lavender : "transparent"}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: page === v ? 600 : 400, textAlign: "left", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                  <span>{label}</span>
                  {v === "messages" && unreadCount > 0 && <span style={{ background: P.rose, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700, color: P.ink }}>{unreadCount}</span>}
                </button>
              ))}
              <div style={{ height: 1, background: P.lavender + "33", margin: "8px 0" }} />
              <button onClick={() => { onLogout(); close(); }} style={{ background: "transparent", border: `1px solid ${P.rose}44`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: "#D8708A", textAlign: "left" }}>Log out</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onNavigate("login"); close(); }} style={{ flex: 1, background: "transparent", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "11px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink }}>Log in</button>
              <button onClick={() => { onNavigate("signup"); close(); }} style={{ flex: 1, background: P.lavender, border: "none", borderRadius: 12, padding: "11px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: 600 }}>Sign up</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

const TodoWidget = ({ data, color }) => {
  const [items, setItems] = useState(data.items);
  const [input, setInput] = useState("");
  const toggle = (i) => setItems(items.map((it, idx) => idx === i ? { ...it, done: !it.done } : it));
  const add = () => { if (input.trim()) { setItems([...items, { text: input.trim(), done: false }]); setInput(""); } };
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${color.accent}55`, cursor: "pointer" }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: it.done ? color.dot : "transparent", border: `2px solid ${it.done ? color.dot : color.dot + "80"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            {it.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, textDecoration: it.done ? "line-through" : "none", opacity: it.done ? 0.5 : 1, transition: "all 0.2s" }}>{it.text}</span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add a task…"
          style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
        <button onClick={add} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>+</button>
      </div>
    </div>
  );
};

const inp = (color, extra = {}) => ({ border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", ...extra });
const delBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", color: color.dot + "99", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 });

const GoalsWidget = ({ data, color, items: extItems, setItems: extSetItems }) => {
  const [localItems, localSetItems] = useState(data.items);
  const items    = extItems    ?? localItems;
  const setItems = extSetItems ?? localSetItems;
  const [editIdx, setEditIdx] = useState(null);
  const [draft, setDraft] = useState({});
  const [newGoal, setNewGoal] = useState({ text: "", progress: 0, total: 100 });

  const startEdit = (i) => { setEditIdx(i); setDraft({ ...items[i] }); };
  const saveEdit = () => { setItems(it => it.map((g, i) => i === editIdx ? { ...draft, progress: Number(draft.progress), total: Number(draft.total) } : g)); setEditIdx(null); };
  const remove = (i) => setItems(it => it.filter((_, idx) => idx !== i));
  const addGoal = () => {
    if (!newGoal.text.trim()) return;
    setItems(it => [...it, { text: newGoal.text.trim(), progress: Number(newGoal.progress), total: Number(newGoal.total) }]);
    setNewGoal({ text: "", progress: 0, total: 100 });
  };

  return (
    <div>
      {items.map((g, i) => {
        const pct = Math.min(Math.round((Number(g.progress) / Number(g.total)) * 100), 100);
        if (editIdx === i) return (
          <div key={i} style={{ marginBottom: 12, background: color.accent + "44", borderRadius: 12, padding: "10px 12px" }}>
            <input value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} placeholder="Goal name" style={{ ...inp(color), width: "100%", marginBottom: 6, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" value={draft.progress} onChange={e => setDraft(d => ({ ...d, progress: e.target.value }))} style={{ ...inp(color), width: 60 }} />
              <span style={{ color: P.inkFaint, fontSize: 13 }}>/</span>
              <input type="number" value={draft.total} onChange={e => setDraft(d => ({ ...d, total: e.target.value }))} style={{ ...inp(color), width: 60 }} />
              <button onClick={saveEdit} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>✓</button>
              <button onClick={() => setEditIdx(null)} style={{ ...delBtn(color), fontSize: 13 }}>✕</button>
            </div>
          </div>
        );
        return (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, flex: 1 }}>{g.text}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: FF_S, fontSize: 12, color: color.dot, fontWeight: 600 }}>{g.progress}/{g.total}</span>
                <button onClick={() => startEdit(i)} style={delBtn(color)}>✎</button>
                <button onClick={() => remove(i)} style={delBtn(color)}>×</button>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: color.accent, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 8, background: `linear-gradient(90deg, ${color.dot}cc, ${color.dot})`, transition: "width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <input value={newGoal.text} onChange={e => setNewGoal(g => ({ ...g, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && addGoal()} placeholder="New goal…" style={{ ...inp(color), flex: 1, minWidth: 100 }} />
        <input type="number" value={newGoal.progress} onChange={e => setNewGoal(g => ({ ...g, progress: e.target.value }))} style={{ ...inp(color), width: 52 }} />
        <span style={{ alignSelf: "center", color: P.inkFaint, fontSize: 13 }}>/</span>
        <input type="number" value={newGoal.total} onChange={e => setNewGoal(g => ({ ...g, total: e.target.value }))} style={{ ...inp(color), width: 52 }} />
        <button onClick={addGoal} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+</button>
      </div>
    </div>
  );
};

const StarRating = ({ rating = 0, onRate, color, size = 14 }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? rating;
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}
      onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          onClick={() => onRate(rating === star ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          style={{
            fontSize: size, cursor: "pointer", lineHeight: 1,
            color: star <= display ? color.dot : color.accent,
            transition: "color 0.1s",
            userSelect: "none",
          }}>★</span>
      ))}
    </div>
  );
};

const ReadingWidget = ({ data, color, items: extItems, setItems: extSetItems }) => {
  const STATUSES = ["reading", "next", "done"];
  const sStyle = { reading: { label: "Reading", bg: color.dot + "22", text: color.dot }, done: { label: "Done ✓", bg: "#5DCAAA22", text: "#3BAA80" }, next: { label: "Up next", bg: "#C9B8F022", text: "#9B85D8" } };
  const [localItems, localSetItems] = useState(data.items);
  const items    = extItems    ?? localItems;
  const setItems = extSetItems ?? localSetItems;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", author: "", status: "next", rating: 0 });

  const cycleStatus = (i) => setItems(it => it.map((b, idx) => idx === i ? { ...b, status: STATUSES[(STATUSES.indexOf(b.status) + 1) % STATUSES.length] } : b));
  const setRating   = (i, rating) => setItems(it => it.map((b, idx) => idx === i ? { ...b, rating } : b));
  const remove      = (i) => setItems(it => it.filter((_, idx) => idx !== i));
  const addBook = () => {
    if (!draft.title.trim()) return;
    setItems(it => [...it, { ...draft, title: draft.title.trim(), author: draft.author.trim() }]);
    setDraft({ title: "", author: "", status: "next", rating: 0 });
    setAdding(false);
  };

  return (
    <div>
      {items.map((b, i) => (
        <div key={i} style={{ padding: "9px 0", borderBottom: `1px solid ${color.accent}55` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>{b.author}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span onClick={() => cycleStatus(i)} title="Click to change status" style={{ fontFamily: FF_S, fontSize: 11, fontWeight: 600, background: sStyle[b.status].bg, color: sStyle[b.status].text, borderRadius: 20, padding: "3px 9px", cursor: "pointer", userSelect: "none" }}>{sStyle[b.status].label}</span>
              <button onClick={() => remove(i)} style={delBtn(color)}>×</button>
            </div>
          </div>
          {/* Stars — only show for done/reading, always tappable */}
          <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
            <StarRating rating={b.rating || 0} onRate={(r) => setRating(i, r)} color={color} size={13} />
            {b.rating > 0 && <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{b.rating}/5</span>}
            {b.status !== "next" && b.rating === 0 && <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>Rate it</span>}
          </div>
        </div>
      ))}
      {adding ? (
        <div style={{ marginTop: 12, background: color.accent + "44", borderRadius: 12, padding: "10px 12px" }}>
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Book title…" style={{ ...inp(color), width: "100%", marginBottom: 6, boxSizing: "border-box" }} />
          <input value={draft.author} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))} placeholder="Author…" style={{ ...inp(color), width: "100%", marginBottom: 6, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setDraft(d => ({ ...d, status: s }))} style={{ flex: 1, background: draft.status === s ? color.dot : color.accent, color: draft.status === s ? "#fff" : P.ink, border: "none", borderRadius: 8, padding: "5px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{sStyle[s].label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>Rating:</span>
            <StarRating rating={draft.rating} onRate={(r) => setDraft(d => ({ ...d, rating: r }))} color={color} size={16} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={addBook} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add book</button>
            <button onClick={() => setAdding(false)} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: P.ink }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop: 10, width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Add a book</button>
      )}
    </div>
  );
};

const MoodWidget = ({ data, color }) => {
  const EMOJIS   = ["", "😞", "😕", "😐", "🙂", "😊"];
  const LABELS   = ["", "Rough", "Low", "Okay", "Good", "Great"];
  const COLORS   = ["", "#D8708A", "#E8956A", "#C8A830", "#5DCAAA", "#9B85D8"];

  // Seed 30 days of history
  const buildHistory = () => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const history = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      const seed = [4,3,5,4,5,3,4,5,4,3,5,4,4,3,5,4,5,4,3,4,5,3,4,5,4,4,3,5,4,5][29 - i];
      history.push({ date: d.toISOString().slice(0,10), day: label, mood: seed, note: "" });
    }
    return history;
  };

  const [history, setHistory] = useState(buildHistory);
  const [tab, setTab]         = useState("week");   // week | month | log
  const [editIdx, setEditIdx] = useState(null);
  const [noteVal, setNoteVal] = useState("");

  const week  = history.slice(-7);
  const month = history.slice(-30);
  const today = history[history.length - 1];

  const setMood = (dateStr, mood) =>
    setHistory(h => h.map(d => d.date === dateStr ? { ...d, mood } : d));
  const saveNote = (dateStr) => {
    setHistory(h => h.map(d => d.date === dateStr ? { ...d, note: noteVal } : d));
    setEditIdx(null);
  };

  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b.mood, 0) / arr.length);
  const weekAvg  = avg(week);
  const monthAvg = avg(month);

  // Streak: consecutive days with mood ≥ 3 ending today
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].mood >= 3) streak++; else break;
  }

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ background: tab === id ? color.dot : "transparent", border: `1.5px solid ${tab === id ? color.dot : color.accent}`, borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: tab === id ? 700 : 400, color: tab === id ? "#fff" : P.inkFaint, transition: "all 0.15s" }}>{label}</button>
  );

  return (
    <div>
      {/* Today quick-set */}
      <div style={{ background: color.accent + "44", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Today</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(m => (
              <button key={m} onClick={() => setMood(today.date, m)} title={LABELS[m]} style={{ width: 32, height: 32, borderRadius: 10, border: `2px solid ${today.mood === m ? color.dot : color.accent}`, background: today.mood === m ? color.dot + "33" : "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {EMOJIS[m]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: 44 }}>
          <div style={{ fontSize: 28 }}>{EMOJIS[today.mood]}</div>
          <div style={{ fontFamily: FF_S, fontSize: 10, color: color.dot, fontWeight: 600 }}>{LABELS[today.mood]}</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Week avg", val: `${EMOJIS[weekAvg]} ${weekAvg}/5` },
          { label: "Month avg", val: `${EMOJIS[monthAvg]} ${monthAvg}/5` },
          { label: "Good streak", val: `${streak}d 🔥` },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: color.accent + "33", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 700, color: color.dot }}>{s.val}</div>
            <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <TabBtn id="week" label="Week" />
        <TabBtn id="month" label="Month" />
        <TabBtn id="log" label="Log" />
      </div>

      {/* Week bar chart */}
      {tab === "week" && (
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 72, paddingBottom: 20, position: "relative" }}>
          {week.map((d, i) => {
            const h = (d.mood / 5) * 52;
            const c = COLORS[d.mood];
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
                <div title={`${d.day}: ${LABELS[d.mood]}`} style={{ width: "100%", height: h, background: c + "99", borderRadius: "5px 5px 0 0", border: `1.5px solid ${c}`, transition: "height 0.3s ease", cursor: "pointer", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.background = c; }}
                  onMouseLeave={e => { e.currentTarget.style.background = c + "99"; }}>
                  <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 11, whiteSpace: "nowrap" }}>{EMOJIS[d.mood]}</div>
                </div>
                <div style={{ fontFamily: FF_S, fontSize: 9, color: P.inkFaint, position: "absolute", bottom: 0, textAlign: "center" }}>{d.day[0]}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month dots grid */}
      {tab === "month" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {month.map((d, i) => (
            <div key={i} title={`${d.date}: ${LABELS[d.mood]}`} style={{ width: 20, height: 20, borderRadius: 5, background: COLORS[d.mood] + "aa", border: `1.5px solid ${COLORS[d.mood]}`, cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>
              {EMOJIS[d.mood]}
            </div>
          ))}
        </div>
      )}

      {/* Log with notes */}
      {tab === "log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
          {[...history].reverse().slice(0, 14).map((d, i) => (
            <div key={d.date} style={{ background: color.accent + "33", borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: d.note || editIdx === i ? 4 : 0 }}>
                <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, width: 64 }}>{d.date.slice(5)}</span>
                <span style={{ fontSize: 14 }}>{EMOJIS[d.mood]}</span>
                <span style={{ fontFamily: FF_S, fontSize: 12, color: COLORS[d.mood], fontWeight: 600 }}>{LABELS[d.mood]}</span>
                <button onClick={() => { setEditIdx(editIdx === i ? null : i); setNoteVal(d.note); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>
                  {editIdx === i ? "✕" : "✎"}
                </button>
              </div>
              {editIdx === i ? (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input value={noteVal} onChange={e => setNoteVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveNote(d.date)} placeholder="Add a note…" style={{ flex: 1, border: `1px solid ${color.accent}`, borderRadius: 7, padding: "4px 8px", fontFamily: FF_S, fontSize: 12, background: "transparent", color: P.ink, outline: "none" }} autoFocus />
                  <button onClick={() => saveNote(d.date)} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✓</button>
                </div>
              ) : d.note ? (
                <p style={{ fontFamily: FF_S, fontSize: 11, color: P.inkLight, margin: "2px 0 0 72px", fontStyle: "italic" }}>{d.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LinksWidget = ({ data, color }) => {
  const [items, setItems] = useState(data.items);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const remove = (i) => setItems(it => it.filter((_, idx) => idx !== i));
  const add = () => {
    if (!draftTitle.trim()) return;
    setItems(it => [...it, { title: draftTitle.trim(), url: draftUrl.trim() || "#" }]);
    setDraftTitle(""); setDraftUrl("");
  };
  return (
    <div>
      {items.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, marginBottom: 6, background: color.accent + "55" }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🔗</span>
          <a href={l.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontFamily: FF_S, fontSize: 13.5, color: P.ink, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</a>
          <button onClick={() => remove(i)} style={delBtn(color)}>×</button>
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Link title…" style={{ ...inp(color), width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 6 }}>
          <input value={draftUrl} onChange={e => setDraftUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="https://…" style={{ ...inp(color), flex: 1 }} />
          <button onClick={add} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+</button>
        </div>
      </div>
    </div>
  );
};

const GratitudeWidget = ({ data, color }) => {
  const [entries, setEntries] = useState(data.entries);
  const [input, setInput] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const add = () => { if (!input.trim()) return; setEntries(e => [input.trim(), ...e]); setInput(""); };
  const remove = (i) => setEntries(e => e.filter((_, idx) => idx !== i));
  const startEdit = (i) => { setEditIdx(i); setEditVal(entries[i]); };
  const saveEdit = () => { setEntries(e => e.map((x, i) => i === editIdx ? editVal : x)); setEditIdx(null); };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="I'm grateful for…"
          style={{ ...inp(color), flex: 1 }} />
        <button onClick={add} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+</button>
      </div>
      {entries.map((e, i) => (
        <div key={i} style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 8, background: color.accent + "44", borderLeft: `3px solid ${color.dot}`, position: "relative" }}>
          {editIdx === i ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={editVal} onChange={ev => setEditVal(ev.target.value)} style={{ ...inp(color), flex: 1 }} />
              <button onClick={saveEdit} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>✓</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontFamily: FF_D, fontSize: 14, color: P.ink, fontStyle: "italic", flex: 1 }}>"{e}"</span>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <button onClick={() => startEdit(i)} style={delBtn(color)}>✎</button>
                <button onClick={() => remove(i)} style={delBtn(color)}>×</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const SobrietyWidget = ({ data, color }) => {
  const [startDate, setStartDate] = useState(data.startDate);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(startDate);
  const days = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
  const milestones = [1,7,30,60,90,180,365];
  const next = milestones.find(m => m > days) || milestones[milestones.length - 1];
  const pct = Math.min((days / next) * 100, 100);
  const badges = milestones.filter(m => days >= m);
  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 0 18px" }}>
        <div style={{ fontFamily: FF_D, fontSize: 56, color: color.dot, lineHeight: 1 }}>{days}</div>
        <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginTop: 4 }}>days {data.label}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>Next milestone</span>
          <span style={{ fontFamily: FF_S, fontSize: 12, color: color.dot, fontWeight: 600 }}>{next} days</span>
        </div>
        <div style={{ height: 8, borderRadius: 8, background: color.accent, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 8, background: `linear-gradient(90deg, ${color.dot}99, ${color.dot})`, transition: "width 0.6s ease" }} />
        </div>
      </div>
      {badges.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {badges.map(b => (
            <span key={b} style={{ background: color.dot + "22", color: color.dot, borderRadius: 20, padding: "3px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>🏅 {b}d</span>
          ))}
        </div>
      )}
      {editing ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" value={draft} onChange={e => setDraft(e.target.value)}
            style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
          <button onClick={() => { setStartDate(draft); setEditing(false); }} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} style={{ background: color.accent + "88", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkLight, width: "100%" }}>
          Edit start date ✎
        </button>
      )}
    </div>
  );
};

const HabitStreakWidget = ({ data, color, habits: extHabits, setHabits: extSetHabits }) => {
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
  const [localHabits, localSetHabits] = useState(() => data.habits.map(h => ({ ...h, history: h.history || [] })));
  const habits    = extHabits    ?? localHabits;
  const setHabits = extSetHabits ?? localSetHabits;
  const [newName, setNewName] = useState("");

  // Recompute streak purely from history (so it's always correct after a day rollover)
  const calcStreak = (history) => {
    if (!history.length) return 0;
    const sorted = [...history].sort();
    const last = sorted[sorted.length - 1];
    // Streak is only live if last entry is today or yesterday
    if (last !== todayStr() && last !== yesterdayStr()) return 0;
    let streak = 0;
    let cursor = new Date(last);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const expected = cursor.toISOString().slice(0, 10);
      if (sorted[i] === expected) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
    return streak;
  };

  const toggleToday = (id) => {
    const today = todayStr();
    setHabits(hs => hs.map(h => {
      if (h.id !== id) return h;
      const doneToday = h.history.includes(today);
      const newHistory = doneToday ? h.history.filter(d => d !== today) : [...h.history, today];
      return { ...h, history: newHistory, streak: calcStreak(newHistory) };
    }));
  };

  const removeHabit = (id) => setHabits(hs => hs.filter(h => h.id !== id));

  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits(hs => [...hs, { id: `h${Date.now()}`, name: newName.trim(), streak: 0, history: [] }]);
    setNewName("");
  };

  return (
    <div>
      {habits.map(h => {
        const doneToday = h.history.includes(todayStr());
        const streak = calcStreak(h.history);
        const isAlive = h.history.includes(todayStr()) || h.history.includes(yesterdayStr());
        return (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${color.accent}55` }}>
            <div onClick={() => toggleToday(h.id)} style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0, cursor: "pointer",
              background: doneToday ? color.dot : "transparent",
              border: `2px solid ${doneToday ? color.dot : color.dot + "60"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", fontSize: 14,
            }}>{doneToday ? "✓" : ""}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink }}>{h.name}</div>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 1 }}>
                {doneToday ? "Done today ✓" : "Not done yet today"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>{isAlive ? "🔥" : "💤"}</span>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 700, color: isAlive ? color.dot : P.inkFaint }}>{streak}</span>
            </div>
            <button onClick={() => removeHabit(h.id)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14, padding: "0 2px" }}>×</button>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addHabit()} placeholder="Add a habit…"
          style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
        <button onClick={addHabit} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>+</button>
      </div>
      <p style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, margin: "10px 0 0", textAlign: "center" }}>
        🔥 streak resets if you miss a day · 💤 means streak is broken
      </p>
    </div>
  );
};

const FAKE_IG_POSTS = [
  { id: 1, bg: "#C9B8F0", emoji: "🌿", likes: 214, caption: "morning light ✨" },
  { id: 2, bg: "#B4E8D8", emoji: "☕", likes: 189, caption: "slow sundays" },
  { id: 3, bg: "#F8CEBA", emoji: "📚", likes: 302, caption: "currently reading" },
  { id: 4, bg: "#B8D8F0", emoji: "🌸", emoji2: "", likes: 156, caption: "spring walks" },
  { id: 5, bg: "#F5E8B0", emoji: "🕯️", likes: 241, caption: "cosy evenings" },
  { id: 6, bg: "#F0B8C8", emoji: "🎨", likes: 178, caption: "studio days" },
  { id: 7, bg: "#EDE8FB", emoji: "🌙", likes: 267, caption: "late night thoughts" },
  { id: 8, bg: "#E4F8F2", emoji: "🌱", likes: 193, caption: "new beginnings" },
  { id: 9, bg: "#FEF0EA", emoji: "🍊", likes: 221, caption: "colour everywhere" },
];

const InstagramWidget = ({ data, color }) => {
  const [username, setUsername] = useState(data.username);
  const [editingUser, setEditingUser] = useState(false);
  const [draftUser, setDraftUser] = useState(username);
  const [activePost, setActivePost] = useState(null);
  return (
    <div>
      {/* IG header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${color.accent}55` }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, #F8CEBA, #C9B8F0, #B4E8D8)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `2px solid ${color.dot}` }}>📸</div>
        <div style={{ flex: 1 }}>
          {editingUser ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={draftUser} onChange={e => setDraftUser(e.target.value)}
                style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
              <button onClick={() => { setUsername(draftUser); setEditingUser(false); }} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✓</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>@{username}</span>
              <button onClick={() => setEditingUser(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint, padding: 0 }}>✎</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 3 }}>
            {[["9","posts"],["1.2k","followers"],["340","following"]].map(([n, l]) => (
              <span key={l} style={{ fontFamily: FF_S, fontSize: 11, color: P.inkLight }}><strong style={{ color: P.ink }}>{n}</strong> {l}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
        {FAKE_IG_POSTS.map(post => (
          <div key={post.id} onClick={() => setActivePost(activePost?.id === post.id ? null : post)}
            style={{ aspectRatio: "1", borderRadius: 8, background: post.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, cursor: "pointer", transition: "transform 0.15s, opacity 0.15s", transform: activePost?.id === post.id ? "scale(0.96)" : "scale(1)", position: "relative", overflow: "hidden" }}>
            {post.emoji}
            {activePost?.id === post.id && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(61,53,80,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 8 }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>♥ {post.likes}</span>
                <span style={{ color: "#fff", fontSize: 10, opacity: 0.85, fontFamily: FF_S }}>{post.caption}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <a href={`https://instagram.com/${username}`} target="_blank" rel="noreferrer"
        style={{ display: "block", textAlign: "center", marginTop: 12, fontFamily: FF_S, fontSize: 12, color: color.dot, textDecoration: "none", fontWeight: 600 }}>
        View on Instagram →
      </a>
    </div>
  );
};

const SportsWidget = ({ data, color }) => {
  const [activities, setActivities] = useState(data.activities);
  const [activeId, setActiveId] = useState(data.activities[0]?.id);
  const [adding, setAdding] = useState(false);
  const [newSession, setNewSession] = useState({ date: new Date().toISOString().slice(0, 10), time: "", value: "", note: "", location: "" });
  const [newActivity, setNewActivity] = useState({ type: "", icon: "🏃", unit: "km" });
  const [addingActivity, setAddingActivity] = useState(false);

  const active = activities.find(a => a.id === activeId);
  const isSurfing = active?.type?.toLowerCase() === "surfing";
  const total = active ? active.sessions.reduce((s, r) => s + Number(r.value), 0) : 0;

  const addSession = () => {
    if (!newSession.value) return;
    setActivities(acts => acts.map(a => a.id === activeId
      ? { ...a, sessions: [...a.sessions, { ...newSession, value: Number(newSession.value) }] }
      : a));
    setNewSession({ date: new Date().toISOString().slice(0, 10), time: "", value: "", note: "", location: "" });
    setAdding(false);
  };
  const removeSession = (idx) => setActivities(acts => acts.map(a => a.id === activeId
    ? { ...a, sessions: a.sessions.filter((_, i) => i !== idx) }
    : a));
  const addActivity = () => {
    if (!newActivity.type.trim()) return;
    const id = `s${Date.now()}`;
    setActivities(acts => [...acts, { id, ...newActivity, sessions: [] }]);
    setActiveId(id);
    setNewActivity({ type: "", icon: "🏃", unit: "km" });
    setAddingActivity(false);
  };

  const inpS = { border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" };

  return (
    <div>
      {/* Activity tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {activities.map(a => (
          <button key={a.id} onClick={() => setActiveId(a.id)} style={{ background: activeId === a.id ? color.dot : color.accent, color: activeId === a.id ? "#fff" : P.ink, border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: activeId === a.id ? 600 : 400 }}>
            {a.icon} {a.type}
          </button>
        ))}
        <button onClick={() => setAddingActivity(v => !v)} style={{ background: "none", border: `1.5px dashed ${color.dot}66`, borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: P.inkFaint }}>+</button>
      </div>

      {addingActivity && (
        <div style={{ background: color.accent + "55", borderRadius: 12, padding: "10px 12px", marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input value={newActivity.icon} onChange={e => setNewActivity(a => ({ ...a, icon: e.target.value }))} style={{ ...inpS, width: 40, textAlign: "center", fontSize: 14 }} />
          <input value={newActivity.type} onChange={e => setNewActivity(a => ({ ...a, type: e.target.value }))} placeholder="Activity name" style={{ ...inpS, flex: 1 }} />
          <input value={newActivity.unit} onChange={e => setNewActivity(a => ({ ...a, unit: e.target.value }))} placeholder="unit" style={{ ...inpS, width: 48 }} />
          <button onClick={addActivity} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add</button>
        </div>
      )}

      {active && (
        <>
          {/* Totals bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, background: color.accent + "44", borderRadius: 12, padding: "10px 14px" }}>
            <div>
              <div style={{ fontFamily: FF_D, fontSize: 28, color: color.dot, lineHeight: 1 }}>{total.toFixed(1)}</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>{active.unit} total · {active.sessions.length} sessions</div>
            </div>
            <div style={{ fontSize: 32 }}>{active.icon}</div>
          </div>

          {/* Session list */}
          {active.sessions.slice().reverse().map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${color.accent}55` }}>
              <div style={{ flexShrink: 0, minWidth: 0 }}>
                <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>{s.date}{s.time ? ` · ${s.time}` : ""}</div>
                {isSurfing && s.location && (
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: color.dot, marginTop: 1 }}>📍 {s.location}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, fontWeight: 600 }}>{s.value}{active.unit}</span>
                {s.note && <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginLeft: 8 }}>{s.note}</span>}
              </div>
              <button onClick={() => removeSession(active.sessions.length - 1 - i)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14, flexShrink: 0 }}>×</button>
            </div>
          ))}

          {/* Add session form */}
          {adding ? (
            <div style={{ marginTop: 10, background: color.accent + "44", borderRadius: 12, padding: "12px" }}>
              {/* Row 1: date, time, value */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                <input type="date" value={newSession.date} onChange={e => setNewSession(s => ({ ...s, date: e.target.value }))} style={inpS} />
                <input type="time" value={newSession.time} onChange={e => setNewSession(s => ({ ...s, time: e.target.value }))} style={{ ...inpS, width: 100 }} placeholder="Time" />
                <input type="number" value={newSession.value} onChange={e => setNewSession(s => ({ ...s, value: e.target.value }))} placeholder={active.unit} style={{ ...inpS, width: 70 }} />
              </div>
              {/* Row 2: note + optional location for surfing */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <input value={newSession.note} onChange={e => setNewSession(s => ({ ...s, note: e.target.value }))} placeholder="Note…" style={{ ...inpS, flex: 1 }} />
                {isSurfing && (
                  <input value={newSession.location} onChange={e => setNewSession(s => ({ ...s, location: e.target.value }))} placeholder="📍 Wave location…" style={{ ...inpS, flex: 1 }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addSession} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Log session</button>
                <button onClick={() => setAdding(false)} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: P.ink }}>✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ marginTop: 10, width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Log a session</button>
          )}
        </>
      )}
    </div>
  );
};

const HobbiesWidget = ({ data, color }) => {
  const [hobbies, setHobbies] = useState(data.hobbies);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", emoji: "🎨", note: "", level: 1 });
  const LEVELS = ["Curious", "Beginner", "Developing", "Skilled", "Passionate"];
  const remove = (id) => setHobbies(hs => hs.filter(h => h.id !== id));
  const updateNote = (id, note) => setHobbies(hs => hs.map(h => h.id === id ? { ...h, note } : h));
  const updateLevel = (id, level) => setHobbies(hs => hs.map(h => h.id === id ? { ...h, level } : h));
  const add = () => { if (!draft.name.trim()) return; setHobbies(hs => [...hs, { id: `h${Date.now()}`, ...draft }]); setDraft({ name: "", emoji: "🎨", note: "", level: 1 }); setAdding(false); };
  return (
    <div>
      {hobbies.map(h => (
        <div key={h.id} style={{ marginBottom: 14, background: color.accent + "44", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{h.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{h.name}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {[1,2,3,4,5].map(l => (
                  <div key={l} onClick={() => updateLevel(h.id, l)} style={{ width: 20, height: 6, borderRadius: 3, background: l <= h.level ? color.dot : color.accent, cursor: "pointer", transition: "all 0.15s" }} />
                ))}
                <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginLeft: 4, alignSelf: "center" }}>{LEVELS[h.level - 1]}</span>
              </div>
            </div>
            <button onClick={() => remove(h.id)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14 }}>×</button>
          </div>
          <input value={h.note} onChange={e => updateNote(h.id, e.target.value)} placeholder="Add a note…"
            style={{ width: "100%", border: `1px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 12, background: color.bg, color: P.inkLight, outline: "none", boxSizing: "border-box" }} />
        </div>
      ))}
      {adding ? (
        <div style={{ background: color.accent + "55", borderRadius: 12, padding: "12px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} style={{ width: 42, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px", fontFamily: FF_S, fontSize: 16, background: color.bg, color: P.ink, outline: "none", textAlign: "center" }} />
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Hobby name…" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
          </div>
          <input value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="A short note…" style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={add} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add hobby</button>
            <button onClick={() => setAdding(false)} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Add a hobby</button>
      )}
    </div>
  );
};

const LinkedInWidget = ({ data, color }) => {
  const [info, setInfo] = useState(data);
  const [editUser, setEditUser] = useState(false);
  const [draftUser, setDraftUser] = useState(data.username);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${color.accent}55` }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#0077B5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "sans-serif" }}>in</span>
        </div>
        <div style={{ flex: 1 }}>
          {editUser ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={draftUser} onChange={e => setDraftUser(e.target.value)} style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
              <button onClick={() => { setInfo(i => ({ ...i, username: draftUser })); setEditUser(false); }} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✓</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{info.username}</span>
              <button onClick={() => setEditUser(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint }}>✎</button>
            </div>
          )}
          <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>{info.headline} · {info.followers} followers</div>
        </div>
      </div>
      {info.posts.map((p, i) => (
        <div key={i} style={{ padding: "9px 0", borderBottom: `1px solid ${color.accent}44` }}>
          <p style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, margin: "0 0 5px", lineHeight: 1.5 }}>{p.text}</p>
          <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>👍 {p.likes}</span>
        </div>
      ))}
      <a href={`https://linkedin.com/in/${info.username}`} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", marginTop: 12, fontFamily: FF_S, fontSize: 12, color: color.dot, textDecoration: "none", fontWeight: 600 }}>View on LinkedIn →</a>
    </div>
  );
};

const TwitterWidget = ({ data, color }) => {
  const [info, setInfo] = useState(data);
  const [editUser, setEditUser] = useState(false);
  const [draftUser, setDraftUser] = useState(data.username);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${color.accent}55` }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, fontFamily: "sans-serif" }}>✕</span>
        </div>
        <div style={{ flex: 1 }}>
          {editUser ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={draftUser} onChange={e => setDraftUser(e.target.value)} style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
              <button onClick={() => { setInfo(i => ({ ...i, username: draftUser })); setEditUser(false); }} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✓</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>@{info.username}</span>
              <button onClick={() => setEditUser(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint }}>✎</button>
            </div>
          )}
          <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>{info.followers} followers</div>
        </div>
      </div>
      {info.tweets.map((t, i) => (
        <div key={i} style={{ padding: "9px 0", borderBottom: `1px solid ${color.accent}44` }}>
          <p style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, margin: "0 0 5px", lineHeight: 1.5 }}>{t.text}</p>
          <div style={{ display: "flex", gap: 14 }}>
            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>♥ {t.likes}</span>
            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>↺ {t.rts}</span>
          </div>
        </div>
      ))}
      <a href={`https://x.com/${info.username}`} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", marginTop: 12, fontFamily: FF_S, fontSize: 12, color: color.dot, textDecoration: "none", fontWeight: 600 }}>View on X →</a>
    </div>
  );
};

const ProjectsWidget = ({ data, color }) => {
  const [projects, setProjects] = useState(data.projects);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", desc: "", url: "", status: "building", emoji: "🚀", logo: null });
  const logoRefs = useRef({});
  const STATUS = { building: { label: "Building", bg: color.dot + "22", text: color.dot }, beta: { label: "Beta", bg: "#5DCAAA22", text: "#3BAA80" }, live: { label: "Live 🟢", bg: "#C9B8F022", text: "#9B85D8" }, paused: { label: "Paused", bg: "#F0B8C822", text: "#D8708A" } };
  const cycleStatus = (id) => {
    const order = ["building", "beta", "live", "paused"];
    setProjects(ps => ps.map(p => p.id === id ? { ...p, status: order[(order.indexOf(p.status) + 1) % order.length] } : p));
  };
  const remove = (id) => setProjects(ps => ps.filter(p => p.id !== id));
  const update = (id, field, val) => setProjects(ps => ps.map(p => p.id === id ? { ...p, [field]: val } : p));
  const add = () => { if (!draft.name.trim()) return; setProjects(ps => [...ps, { id: `p${Date.now()}`, ...draft }]); setDraft({ name: "", desc: "", url: "", status: "building", emoji: "🚀", logo: null }); setAdding(false); };
  const handleLogo = (id, file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => update(id, "logo", ev.target.result);
    r.readAsDataURL(file);
  };
  const handleDraftLogo = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setDraft(d => ({ ...d, logo: ev.target.result }));
    r.readAsDataURL(file);
  };

  return (
    <div>
      {projects.map(p => (
        <div key={p.id} style={{ marginBottom: 14, background: color.accent + "44", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            {/* Logo / emoji area */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                onClick={() => logoRefs.current[p.id]?.click()}
                title="Click to upload logo"
                style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", background: color.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1.5px solid ${color.dot}33` }}>
                {p.logo
                  ? <img src={p.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 22 }}>{p.emoji || "🚀"}</span>
                }
              </div>
              {/* Hover overlay */}
              <div
                onClick={() => logoRefs.current[p.id]?.click()}
                style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(61,53,80,0.55)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s", cursor: "pointer", fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                📷
              </div>
              <input ref={el => logoRefs.current[p.id] = el} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogo(p.id, e.target.files?.[0])} />
            </div>
            <div style={{ flex: 1 }}>
              <input value={p.name} onChange={e => update(p.id, "name", e.target.value)} style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, border: "none", background: "none", outline: "none", width: "100%", padding: 0 }} />
              <textarea value={p.desc} onChange={e => update(p.id, "desc", e.target.value)} rows={2} style={{ fontFamily: FF_S, fontSize: 12.5, color: P.inkLight, border: "none", background: "none", outline: "none", width: "100%", resize: "none", padding: 0, lineHeight: 1.5 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14 }}>×</button>
              {p.logo && <button onClick={() => update(p.id, "logo", null)} title="Remove logo" style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 10 }}>✕ logo</button>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={p.url} onChange={e => update(p.id, "url", e.target.value)} placeholder="https://…" style={{ flex: 1, border: `1px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 11, background: color.bg, color: color.dot, outline: "none" }} />
            <span onClick={() => cycleStatus(p.id)} title="Click to change status" style={{ background: STATUS[p.status].bg, color: STATUS[p.status].text, borderRadius: 20, padding: "3px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0, userSelect: "none" }}>{STATUS[p.status].label}</span>
            {p.url && p.url !== "#" && <a href={p.url} target="_blank" rel="noreferrer" style={{ fontFamily: FF_S, fontSize: 11, color: color.dot, textDecoration: "none" }}>↗</a>}
          </div>
        </div>
      ))}
      {adding ? (
        <div style={{ background: color.accent + "55", borderRadius: 12, padding: "12px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            {/* Logo/emoji picker in add form */}
            <div style={{ position: "relative" }}>
              <div onClick={() => document.getElementById("draft-logo-input")?.click()} style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", background: color.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1.5px solid ${color.dot}33`, fontSize: 22 }}>
                {draft.logo ? <img src={draft.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : draft.emoji}
              </div>
              <input id="draft-logo-input" type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleDraftLogo(e.target.files?.[0])} />
            </div>
            {!draft.logo && <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} style={{ width: 42, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px", fontSize: 16, background: color.bg, outline: "none", textAlign: "center" }} />}
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Project name" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
          </div>
          <textarea value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} placeholder="Brief description…" rows={2} style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", resize: "none", marginBottom: 6, boxSizing: "border-box" }} />
          <input value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://…" style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={add} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add project</button>
            <button onClick={() => { setAdding(false); setDraft({ name: "", desc: "", url: "", status: "building", emoji: "🚀", logo: null }); }} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: P.ink }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Add a project</button>
      )}
    </div>
  );
};

const PodcastWidget = ({ data, color, pods: extPods, setPods: extSetPods }) => {
  const STATUSES = ["listening", "done", "next"];
  const sStyle = { listening: { label: "🎧 Now", bg: color.dot + "22", text: color.dot }, done: { label: "Done ✓", bg: "#5DCAAA22", text: "#3BAA80" }, next: { label: "Up next", bg: "#C9B8F022", text: "#9B85D8" } };
  const [localPods, localSetPods] = useState(data.pods);
  const pods    = extPods    ?? localPods;
  const setPods = extSetPods ?? localSetPods;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", host: "", ep: "", status: "next", emoji: "🎙", rating: 0 });
  const cycleStatus = (id) => setPods(ps => ps.map(p => p.id === id ? { ...p, status: STATUSES[(STATUSES.indexOf(p.status) + 1) % STATUSES.length] } : p));
  const setRating   = (id, rating) => setPods(ps => ps.map(p => p.id === id ? { ...p, rating } : p));
  const remove      = (id) => setPods(ps => ps.filter(p => p.id !== id));
  const add = () => { if (!draft.name.trim()) return; setPods(ps => [...ps, { id: `pd${Date.now()}`, ...draft }]); setDraft({ name: "", host: "", ep: "", status: "next", emoji: "🎙", rating: 0 }); setAdding(false); };
  return (
    <div>
      {pods.map(p => (
        <div key={p.id} style={{ padding: "9px 0", borderBottom: `1px solid ${color.accent}55` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
              <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkLight }}>{p.host}{p.ep ? ` · "${p.ep}"` : ""}</div>
              <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <StarRating rating={p.rating || 0} onRate={(r) => setRating(p.id, r)} color={color} size={13} />
                {p.rating > 0 && <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{p.rating}/5</span>}
                {p.status !== "next" && !p.rating && <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>Rate it</span>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span onClick={() => cycleStatus(p.id)} style={{ background: sStyle[p.status].bg, color: sStyle[p.status].text, borderRadius: 20, padding: "3px 9px", fontFamily: FF_S, fontSize: 11, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>{sStyle[p.status].label}</span>
              <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14 }}>×</button>
            </div>
          </div>
        </div>
      ))}
      {adding ? (
        <div style={{ marginTop: 12, background: color.accent + "44", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} style={{ width: 42, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 6px", fontSize: 16, background: color.bg, outline: "none", textAlign: "center" }} />
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Podcast name" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={draft.host} onChange={e => setDraft(d => ({ ...d, host: e.target.value }))} placeholder="Host" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
            <input value={draft.ep} onChange={e => setDraft(d => ({ ...d, ep: e.target.value }))} placeholder="Episode" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {STATUSES.map(s => <button key={s} onClick={() => setDraft(d => ({ ...d, status: s }))} style={{ flex: 1, background: draft.status === s ? color.dot : color.accent, color: draft.status === s ? "#fff" : P.ink, border: "none", borderRadius: 8, padding: "5px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{sStyle[s].label}</button>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>Rating:</span>
            <StarRating rating={draft.rating} onRate={(r) => setDraft(d => ({ ...d, rating: r }))} color={color} size={16} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={add} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop: 10, width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Add a podcast</button>
      )}
    </div>
  );
};

const TravelWidget = ({ data, color }) => {
  const [trips, setTrips] = useState(data.trips);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ place: "", date: "", note: "", photo: null, emoji: "✈" });
  const fileRefs = useRef({});
  const remove = (id) => setTrips(ts => ts.filter(t => t.id !== id));
  const updateNote = (id, note) => setTrips(ts => ts.map(t => t.id === id ? { ...t, note } : t));
  const handlePhoto = (id, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setTrips(ts => ts.map(t => t.id === id ? { ...t, photo: ev.target.result } : t));
    reader.readAsDataURL(file);
  };
  const handleNewPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setDraft(d => ({ ...d, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };
  const addTrip = () => { if (!draft.place.trim()) return; setTrips(ts => [{ id: `t${Date.now()}`, ...draft }, ...ts]); setDraft({ place: "", date: "", note: "", photo: null, emoji: "✈" }); setAdding(false); };
  return (
    <div>
      {trips.map(t => (
        <div key={t.id} style={{ marginBottom: 14, borderRadius: 16, overflow: "hidden", border: `1.5px solid ${color.accent}` }}>
          {t.photo ? (
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRefs.current[t.id]?.click()}>
              <img src={t.photo} alt={t.place} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(61,53,80,0.6) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 8, left: 12, color: "#fff", fontFamily: FF_D, fontSize: 16 }}>{t.emoji} {t.place}</div>
              <input type="file" accept="image/*" ref={el => fileRefs.current[t.id] = el} onChange={e => handlePhoto(t.id, e)} style={{ display: "none" }} />
            </div>
          ) : (
            <div style={{ height: 72, background: color.accent + "88", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", gap: 4 }} onClick={() => fileRefs.current[t.id]?.click()}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>Tap to add photo</span>
              <input type="file" accept="image/*" ref={el => fileRefs.current[t.id] = el} onChange={e => handlePhoto(t.id, e)} style={{ display: "none" }} />
            </div>
          )}
          <div style={{ padding: "10px 12px", background: color.bg }}>
            {!t.photo && <div style={{ fontFamily: FF_D, fontSize: 15, color: P.ink, marginBottom: 4 }}>{t.emoji} {t.place}</div>}
            <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 6 }}>{t.date}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input value={t.note} onChange={e => updateNote(t.id, e.target.value)} placeholder="Add a memory…" style={{ flex: 1, border: `1px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 12, background: "transparent", color: P.inkLight, outline: "none" }} />
              <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14 }}>×</button>
            </div>
          </div>
        </div>
      ))}
      {adding ? (
        <div style={{ background: color.accent + "55", borderRadius: 12, padding: "12px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} style={{ width: 42, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px", fontSize: 16, background: color.bg, outline: "none", textAlign: "center" }} />
            <input value={draft.place} onChange={e => setDraft(d => ({ ...d, place: e.target.value }))} placeholder="Place, Country" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
            <input value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} placeholder="Month Year" style={{ width: 100, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 8px", fontFamily: FF_S, fontSize: 12, background: color.bg, color: P.ink, outline: "none" }} />
          </div>
          <input value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="A favourite memory…" style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
          {draft.photo ? <img src={draft.photo} alt="preview" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} /> : null}
          <div style={{ display: "flex", gap: 6 }}>
            <label style={{ flex: 1, background: color.accent, border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.ink, textAlign: "center" }}>
              📷 Photo <input type="file" accept="image/*" onChange={handleNewPhoto} style={{ display: "none" }} />
            </label>
            <button onClick={addTrip} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add trip</button>
            <button onClick={() => setAdding(false)} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Add a trip</button>
      )}
    </div>
  );
};

const ArticlesWidget = ({ data, color }) => {
  const TYPES = ["written", "reading"];
  const tStyle = { written: { label: "Written ✍", bg: color.dot + "22", text: color.dot }, reading: { label: "Interesting", bg: "#C9B8F022", text: "#9B85D8" } };
  const [articles, setArticles] = useState(data.articles);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", url: "", type: "reading", date: "", note: "" });
  const remove = (id) => setArticles(as => as.filter(a => a.id !== id));
  const cycleType = (id) => setArticles(as => as.map(a => a.id === id ? { ...a, type: TYPES[(TYPES.indexOf(a.type) + 1) % TYPES.length] } : a));
  const add = () => { if (!draft.title.trim()) return; setArticles(as => [{ id: `a${Date.now()}`, ...draft }, ...as]); setDraft({ title: "", url: "", type: "reading", date: "", note: "" }); setAdding(false); };
  return (
    <div>
      {articles.map(a => (
        <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${color.accent}55` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <a href={a.url || "#"} target="_blank" rel="noreferrer" style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, fontWeight: 500, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</a>
            <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{a.note}{a.date ? ` · ${a.date}` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span onClick={() => cycleType(a.id)} style={{ background: tStyle[a.type].bg, color: tStyle[a.type].text, borderRadius: 20, padding: "3px 9px", fontFamily: FF_S, fontSize: 11, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>{tStyle[a.type].label}</span>
            <button onClick={() => remove(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: color.dot + "88", fontSize: 14 }}>×</button>
          </div>
        </div>
      ))}
      {adding ? (
        <div style={{ marginTop: 12, background: color.accent + "44", borderRadius: 12, padding: "10px 12px" }}>
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Article title" style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://…" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 12, background: color.bg, color: P.ink, outline: "none" }} />
            <input value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="Source / note" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 12, background: color.bg, color: P.ink, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {TYPES.map(t => <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))} style={{ flex: 1, background: draft.type === t ? color.dot : color.accent, color: draft.type === t ? "#fff" : P.ink, border: "none", borderRadius: 8, padding: "5px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tStyle[t].label}</button>)}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={add} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "7px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add article</button>
            <button onClick={() => setAdding(false)} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: P.ink }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop: 10, width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>+ Add an article</button>
      )}
    </div>
  );
};

const ARCHIVE_YEARS = (() => {
  const currentYear = new Date().getFullYear();
  // Generate seed data for past 3 years
  return [2024, 2023, 2022].map(year => ({
    year,
    books: [
      { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", rating: 5, status: "done" },
      { title: "The Remains of the Day", author: "Kazuo Ishiguro", rating: 5, status: "done" },
      { title: "Convenience Store Woman", author: "Sayaka Murata", rating: 4, status: "done" },
      { title: "Pachinko", author: "Min Jin Lee", rating: 4, status: "done" },
      ...(year <= 2023 ? [{ title: "Normal People", author: "Sally Rooney", rating: 3, status: "done" }] : []),
      ...(year <= 2022 ? [{ title: "Educated", author: "Tara Westover", rating: 5, status: "done" }] : []),
    ].slice(0, year === 2024 ? 4 : year === 2023 ? 5 : 6),
    exerciseDays: year === 2024 ? 218 : year === 2023 ? 195 : 241,
    totalDays: year === 2024 ? 366 : 365,
    goalsCompleted: year === 2024 ? 5 : year === 2023 ? 4 : 6,
    goalsTotal: year === 2024 ? 7 : year === 2023 ? 6 : 8,
    podcastsListened: year === 2024 ? 34 : year === 2023 ? 28 : 41,
    habitBestStreak: year === 2024 ? 47 : year === 2023 ? 31 : 52,
    reflection: year === 2024
      ? "A year of building — Studio Ellison finally felt real. Travelled less than hoped but read more than ever."
      : year === 2023
      ? "The year I started taking rest seriously. Slower, but more intentional."
      : "Big leaps. Moved cities, changed direction. Chaotic but necessary.",
  }));
})();

const ArchiveWidget = ({ data, color, liveThisYear }) => {
  const [years, setYears] = useState(data.years || ARCHIVE_YEARS);
  const currentYear = new Date().getFullYear();
  // Merge live current year at front; past years come from state
  const allYears = liveThisYear ? [liveThisYear, ...years.filter(y => y.year !== currentYear)] : years;
  const [activeYear, setActiveYear] = useState(liveThisYear?.year ?? years[0]?.year);
  const [editReflection, setEditReflection] = useState(false);
  const [addingYear, setAddingYear] = useState(false);
  const [newYear, setNewYear] = useState({ year: new Date().getFullYear() - 1, books: [], exerciseDays: "", totalDays: 365, goalsCompleted: "", goalsTotal: "", podcastsListened: "", habitBestStreak: "", reflection: "" });

  const active = allYears.find(y => y.year === activeYear);
  const updateReflection = (text) => {
    if (active?.isLive) return; // live year reflection handled differently
    setYears(ys => ys.map(y => y.year === activeYear ? { ...y, reflection: text } : y));
  };
  const addYear = () => {
    if (years.find(y => y.year === Number(newYear.year))) return;
    const entry = { ...newYear, year: Number(newYear.year), exerciseDays: Number(newYear.exerciseDays) || 0, goalsCompleted: Number(newYear.goalsCompleted) || 0, goalsTotal: Number(newYear.goalsTotal) || 0, podcastsListened: Number(newYear.podcastsListened) || 0, habitBestStreak: Number(newYear.habitBestStreak) || 0, books: [] };
    setYears(ys => [...ys, entry].sort((a, b) => b.year - a.year));
    setActiveYear(entry.year);
    setAddingYear(false);
    setNewYear({ year: new Date().getFullYear() - 1, books: [], exerciseDays: "", totalDays: 365, goalsCompleted: "", goalsTotal: "", podcastsListened: "", habitBestStreak: "", reflection: "" });
  };

  const exercisePct = active ? Math.round((active.exerciseDays / active.totalDays) * 100) : 0;
  const goalsPct    = active && active.goalsTotal ? Math.round((active.goalsCompleted / active.goalsTotal) * 100) : 0;
  const avgRating   = active && active.books.length ? (active.books.reduce((s, b) => s + (b.rating || 0), 0) / active.books.filter(b => b.rating).length).toFixed(1) : "—";

  const StatBar = ({ label, value, total, pct, unit = "" }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>{label}</span>
        <span style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 700, color: color.dot }}>{value}{unit}{total ? ` / ${total}` : ""}</span>
      </div>
      {pct !== undefined && (
        <div style={{ height: 5, borderRadius: 5, background: color.accent, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color.dot, borderRadius: 5, transition: "width 0.6s ease" }} />
        </div>
      )}
    </div>
  );

  const inp = { border: `1.5px solid ${color.accent}`, borderRadius: 9, padding: "6px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" };

  return (
    <div>
      {/* Year tabs */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        {allYears.map(y => (
          <button key={y.year} onClick={() => setActiveYear(y.year)} style={{ background: activeYear === y.year ? color.dot : color.accent, color: activeYear === y.year ? "#fff" : P.ink, border: "none", borderRadius: 20, padding: "6px 18px", cursor: "pointer", fontFamily: FF_D, fontSize: 16, fontWeight: 400, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
            {y.year}
            {y.isLive && <span style={{ fontFamily: FF_S, fontSize: 9, fontWeight: 700, background: activeYear === y.year ? "rgba(255,255,255,0.3)" : color.dot + "33", color: activeYear === y.year ? "#fff" : color.dot, borderRadius: 20, padding: "1px 6px", letterSpacing: 0.5 }}>LIVE</span>}
          </button>
        ))}
        <button onClick={() => setAddingYear(v => !v)} style={{ background: "none", border: `1.5px dashed ${color.dot}66`, borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontSize: 13, color: P.inkFaint, fontFamily: FF_S }}>+ Add year</button>
      </div>

      {/* Add year form */}
      {addingYear && (
        <div style={{ background: color.accent + "55", borderRadius: 16, padding: "16px 18px", marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { label: "Year", key: "year", w: 80 },
            { label: "Days exercised", key: "exerciseDays", w: 130 },
            { label: "Total days", key: "totalDays", w: 100 },
            { label: "Goals done", key: "goalsCompleted", w: 100 },
            { label: "Goals total", key: "goalsTotal", w: 100 },
            { label: "Podcasts", key: "podcastsListened", w: 90 },
            { label: "Best streak (days)", key: "habitBestStreak", w: 130 },
          ].map(({ label, key, w }) => (
            <div key={key}>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 4 }}>{label}</div>
              <input type="number" value={newYear[key]} onChange={e => setNewYear(d => ({ ...d, [key]: e.target.value }))} style={{ ...inp, width: w }} />
            </div>
          ))}
          <button onClick={addYear} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13, alignSelf: "flex-end" }}>Add</button>
          <button onClick={() => setAddingYear(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16, alignSelf: "flex-end" }}>✕</button>
        </div>
      )}

      {active && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

          {/* Col 1 — Reading */}
          <div style={{ background: color.accent + "44", borderRadius: 18, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>📖</span>
              <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: 0, fontWeight: 400 }}>Reading</h4>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: color.dot, fontWeight: 700, marginLeft: "auto" }}>{active.books.length} books</span>
            </div>
            {active.books.map((b, i) => (
              <div key={i} style={{ padding: "7px 0", borderBottom: `1px solid ${color.accent}88` }}>
                <div style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, fontWeight: 500 }}>{b.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                  <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{b.author}</span>
                  <span style={{ fontSize: 11, letterSpacing: 1 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= (b.rating||0) ? color.dot : color.accent }}>★</span>)}</span>
                </div>
              </div>
            ))}
            {active.books.length > 0 && (
              <div style={{ marginTop: 10, fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>
                Avg rating: <span style={{ color: color.dot, fontWeight: 700 }}>{avgRating} ★</span>
              </div>
            )}
            {active.books.length === 0 && <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: "8px 0 0" }}>No books logged for {active.year}</p>}
          </div>

          {/* Col 2 — Activity stats */}
          <div style={{ background: color.accent + "44", borderRadius: 18, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: 0, fontWeight: 400 }}>By the numbers</h4>
            </div>

            {/* Big stat */}
            <div style={{ textAlign: "center", marginBottom: 20, background: color.bg, borderRadius: 14, padding: "14px" }}>
              <div style={{ fontFamily: FF_D, fontSize: 48, color: color.dot, lineHeight: 1 }}>{exercisePct}%</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginTop: 4 }}>of {active.year} spent exercising</div>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>{active.exerciseDays} of {active.totalDays} days</div>
            </div>

            <StatBar label="Goals completed" value={active.goalsCompleted} total={active.goalsTotal} pct={goalsPct} />
            <StatBar label="Podcasts listened" value={active.podcastsListened} />
            <StatBar label="Best habit streak" value={active.habitBestStreak} unit=" days" />
          </div>

          {/* Col 3 — Reflection */}
          <div style={{ background: color.accent + "44", borderRadius: 18, padding: "18px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: 0, fontWeight: 400 }}>Reflection</h4>
              {!editReflection && !active?.isLive && (
                <button onClick={() => setEditReflection(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint, marginLeft: "auto" }}>Edit ✎</button>
              )}
            </div>

            {active?.isLive ? (
              <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, lineHeight: 1.6, margin: 0, flex: 1, fontStyle: "italic" }}>
                {active.year} is still in progress — come back at year end to write your reflection ✨
              </p>
            ) : editReflection ? (
              <>
                <textarea
                  autoFocus
                  value={active.reflection}
                  onChange={e => updateReflection(e.target.value)}
                  placeholder={`How was ${active.year}? What defined it?`}
                  rows={6}
                  style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 12, padding: "10px 12px", fontFamily: FF_S, fontSize: 14, background: color.bg, color: P.ink, outline: "none", resize: "none", lineHeight: 1.7 }}
                />
                <button onClick={() => setEditReflection(false)} style={{ marginTop: 10, background: color.dot, color: "#fff", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
              </>
            ) : (
              <p style={{ fontFamily: FF_D, fontStyle: "italic", fontSize: 15, color: P.inkLight, lineHeight: 1.75, margin: 0, flex: 1 }}>
                {active.reflection || <span style={{ color: P.inkFaint, fontStyle: "normal", fontSize: 13 }}>No reflection yet — click Edit to add one.</span>}
              </p>
            )}

            {/* Year stamp */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${color.accent}88`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FF_D, fontSize: 28, color: color.dot + "55" }}>{active.year}</span>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{active.books.length} books · {active.exerciseDays} active days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const ExerciseWidget = ({ data, color, checked: extChecked, setChecked: extSetChecked }) => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const [localChecked, localSetChecked] = useState(() => {
    const s = new Set(data?.days || []);
    if (s.size === 0) {
      const d = new Date(yearStart);
      let i = 0;
      while (d <= today) {
        if (i % 7 !== 2 && i % 7 !== 5) s.add(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
        i++;
      }
    }
    return s;
  });

  const checked    = extChecked    ?? localChecked;
  const setChecked = extSetChecked ?? localSetChecked;

  const toggle = (dateStr) => {
    setChecked(s => {
      const n = new Set(s);
      n.has(dateStr) ? n.delete(dateStr) : n.add(dateStr);
      return n;
    });
  };

  // Days elapsed so far this year (including today)
  const dayOfYear = Math.floor((today - yearStart) / 86400000) + 1;
  const exercisedCount = [...checked].filter(d => d >= yearStart.toISOString().slice(0, 10) && d <= todayStr).length;
  const pct = Math.round((exercisedCount / dayOfYear) * 100);

  // Build full year grid
  const months = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(today.getFullYear(), m + 1, 0).getDate();
    const cells = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${today.getFullYear()}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isFuture = dateStr > todayStr;
      const isToday  = dateStr === todayStr;
      const isDone   = checked.has(dateStr);
      cells.push({ dateStr, isFuture, isToday, isDone, d });
    }
    months.push({ m, cells });
  }

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Current streak
  const streak = (() => {
    let s = 0;
    const d = new Date(today);
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (!checked.has(ds)) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { label: "This year", value: `${pct}%`, sub: `${exercisedCount} of ${dayOfYear} days` },
          { label: "Current streak", value: `${streak}`, sub: streak === 1 ? "day" : "days" },
          { label: "Days logged", value: exercisedCount, sub: `${today.getFullYear()}` },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ flex: 1, background: color.accent + "55", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: FF_D, fontSize: 22, color: color.dot, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: FF_S, fontSize: 10, color: P.ink, fontWeight: 600, marginTop: 3 }}>{label}</div>
            <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>Year progress</span>
          <span style={{ fontFamily: FF_S, fontSize: 11, fontWeight: 600, color: color.dot }}>{pct}% active</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: color.accent, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color.dot}99, ${color.dot})`, borderRadius: 6, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Annual grid */}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px 8px", minWidth: 280 }}>
          {months.map(({ m, cells }) => (
            <div key={m}>
              <div style={{ fontFamily: FF_S, fontSize: 9, fontWeight: 700, color: P.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                {MONTH_LABELS[m]}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {cells.map(({ dateStr, isFuture, isToday, isDone, d }) => (
                  <div
                    key={d}
                    onClick={() => !isFuture && toggle(dateStr)}
                    title={dateStr}
                    style={{
                      width: 9, height: 9, borderRadius: 2,
                      background: isFuture
                        ? color.accent + "33"
                        : isDone
                          ? color.dot
                          : color.accent + "88",
                      cursor: isFuture ? "default" : "pointer",
                      boxShadow: isToday ? `0 0 0 1.5px ${color.dot}` : "none",
                      transition: "background 0.15s, transform 0.1s",
                      transform: "scale(1)",
                    }}
                    onMouseEnter={e => { if (!isFuture) e.currentTarget.style.transform = "scale(1.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend + today button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: color.dot }} />
            <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>Exercised</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: color.accent + "88" }} />
            <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>Rest</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: color.accent + "33" }} />
            <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>Upcoming</span>
          </div>
        </div>
        <button
          onClick={() => toggle(todayStr)}
          style={{
            background: checked.has(todayStr) ? color.dot : color.accent,
            color: checked.has(todayStr) ? "#fff" : P.ink,
            border: "none", borderRadius: 10, padding: "6px 14px", cursor: "pointer",
            fontFamily: FF_S, fontSize: 12, fontWeight: 600,
            transition: "all 0.2s",
          }}>
          {checked.has(todayStr) ? "✓ Done today" : "Log today"}
        </button>
      </div>
    </div>
  );
};

const GALLERY_SEED = [
  { id: "g1", mediaType: "image", mediaSrc: null, caption: "Golden hour at the studio 🌅 New branding work in progress — can't wait to share the full reveal.", tags: ["@cleo", "@soren"], link: "", linkLabel: "", ts: Date.now() - 86400000 * 2, color: "#F8CEBA" },
  { id: "g2", mediaType: "image", mediaSrc: null, caption: "Finally got my hands on a first edition copy 📖 Worth every penny.", tags: ["@iris"],        link: "",                     linkLabel: "", ts: Date.now() - 86400000 * 5, color: "#B4E8D8" },
  { id: "g3", mediaType: "image", mediaSrc: null, caption: "Morning light through the kitchen window. Some days just start right ☀️",  tags: [],       link: "",                     linkLabel: "", ts: Date.now() - 86400000 * 9, color: "#C9B8F0" },
];

const GalleryPostModal = ({ post, onClose, onUpdate, onDelete, isOwner, color }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ caption: post.caption, tags: post.tags.join(" "), link: post.link, linkLabel: post.linkLabel });
  const [copied, setCopied] = useState(false);
  const allUsers = ["@margot","@cleo","@soren","@iris","@felix","@ada","@theo"];

  const save = () => {
    const tags = draft.tags.split(/[\s,]+/).filter(t => t.startsWith("@") && t.length > 1);
    onUpdate({ ...post, caption: draft.caption, tags, link: draft.link, linkLabel: draft.linkLabel });
    setEditing(false);
  };
  const copyLink = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,24,48,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, width: "100%", maxWidth: 780, maxHeight: "90vh", overflow: "hidden", display: "flex", boxShadow: "0 20px 60px rgba(30,24,48,0.35)", animation: "popIn 0.2s ease" }}>

        {/* Left — media */}
        <div style={{ width: 420, flexShrink: 0, background: post.mediaSrc ? "#111" : post.color + "cc", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 360, position: "relative" }}>
          {post.mediaSrc
            ? post.mediaType === "video"
              ? <video src={post.mediaSrc} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <img src={post.mediaSrc} alt="post" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <div style={{ textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🖼</div>
                <p style={{ fontFamily: FF_S, fontSize: 13, color: "#fff", opacity: 0.7, margin: 0 }}>No media uploaded</p>
              </div>
          }
        </div>

        {/* Right — details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${P.lavender}44`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <UserAvatar user={ME_BASE} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{ME_BASE.name}</div>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{fmtDate(post.ts)}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.inkFaint, lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Caption</label>
                  <textarea value={draft.caption} onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))} rows={4} style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 12px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Tag users <span style={{ fontWeight: 400 }}>(space-separated, e.g. @cleo @soren)</span></label>
                  <input value={draft.tags} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} placeholder="@username @another" style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {allUsers.filter(u => !draft.tags.includes(u)).map(u => (
                      <span key={u} onClick={() => setDraft(d => ({ ...d, tags: (d.tags + " " + u).trim() }))} style={{ background: P.lavenderLight, border: `1px solid ${P.lavender}`, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, color: "#9B85D8", cursor: "pointer" }}>{u}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Link URL</label>
                    <input value={draft.link} onChange={e => setDraft(d => ({ ...d, link: e.target.value }))} placeholder="https://…" style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Link label</label>
                    <input value={draft.linkLabel} onChange={e => setDraft(d => ({ ...d, linkLabel: e.target.value }))} placeholder="e.g. View project" style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={save} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditing(false)} style={{ background: P.lavenderLight, border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {/* Caption */}
                <p style={{ fontFamily: FF_S, fontSize: 14, color: P.ink, lineHeight: 1.75, margin: "0 0 14px" }}>
                  {post.caption || <span style={{ color: P.inkFaint, fontStyle: "italic" }}>No caption</span>}
                </p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {post.tags.map(t => (
                      <span key={t} style={{ background: P.lavenderLight, borderRadius: 20, padding: "3px 12px", fontFamily: FF_S, fontSize: 12, color: "#9B85D8", fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                )}

                {/* Link */}
                {post.link && (
                  <a href={post.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: color.accent, borderRadius: 10, padding: "8px 14px", fontFamily: FF_S, fontSize: 13, color: color.dot, fontWeight: 600, textDecoration: "none", marginBottom: 14 }}>
                    🔗 {post.linkLabel || post.link}
                  </a>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          {!editing && (
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${P.lavender}44`, display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <button onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? "#B4E8D8" : P.lavenderLight, border: `1.5px solid ${copied ? P.mint : P.lavender}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: copied ? "#3BAA80" : "#9B85D8", transition: "all 0.2s" }}>
                {copied ? "✓ Copied!" : "↗ Share post"}
              </button>
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} style={{ background: P.lavenderLight, border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.inkLight }}>Edit ✎</button>
                  <button onClick={() => { onDelete(post.id); onClose(); }} style={{ background: "#F0B8C833", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: "#D8708A", marginLeft: "auto" }}>Delete</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GalleryWidget = ({ data, color, isOwnDashboard }) => {
  const [posts, setPosts] = useState(() => data.posts.length > 0 ? data.posts : GALLERY_SEED);
  const [activePost, setActivePost] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ caption: "", tags: "", link: "", linkLabel: "", mediaSrc: null, mediaType: "image" });
  const fileRef = useRef(null);
  const allUsers = ["@cleo","@soren","@iris","@felix","@ada","@theo"];

  const updatePost = (updated) => setPosts(ps => ps.map(p => p.id === updated.id ? updated : p));
  const deletePost = (id) => setPosts(ps => ps.filter(p => p.id !== id));

  const handleFile = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const r = new FileReader();
    r.onload = ev => setDraft(d => ({ ...d, mediaSrc: ev.target.result, mediaType: isVideo ? "video" : "image" }));
    r.readAsDataURL(file);
  };

  const addPost = () => {
    const tags = draft.tags.split(/[\s,]+/).filter(t => t.startsWith("@") && t.length > 1);
    const COLORS = ["#F8CEBA","#B4E8D8","#C9B8F0","#B8D8F0","#F0B8C8","#F5E8B0"];
    setPosts(ps => [{ id: `g${Date.now()}`, mediaType: draft.mediaType, mediaSrc: draft.mediaSrc, caption: draft.caption, tags, link: draft.link, linkLabel: draft.linkLabel, ts: Date.now(), color: COLORS[ps.length % COLORS.length] }, ...ps]);
    setDraft({ caption: "", tags: "", link: "", linkLabel: "", mediaSrc: null, mediaType: "image" });
    setAdding(false);
  };

  const THUMB_COLORS = ["#F8CEBA","#B4E8D8","#C9B8F0","#B8D8F0","#F0B8C8","#F5E8B0"];

  return (
    <div>
      {/* Grid */}
      {posts.length === 0 && !adding ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: P.inkLight }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🖼</div>
          <p style={{ fontFamily: FF_S, fontSize: 14 }}>No posts yet — add your first!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: adding ? 16 : 0 }}>
          {posts.map((p, i) => (
            <div key={p.id} onClick={() => setActivePost(p)} style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: p.mediaSrc ? "#111" : (p.color || THUMB_COLORS[i % THUMB_COLORS.length]), position: "relative", transition: "transform 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.querySelector(".hover-overlay").style.opacity = "1"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.querySelector(".hover-overlay").style.opacity = "0"; }}>
              {p.mediaSrc
                ? p.mediaType === "video"
                  ? <video src={p.mediaSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                  : <img src={p.mediaSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 28, opacity: 0.5 }}>🖼</span>
              }
              {/* Hover overlay */}
              <div className="hover-overlay" style={{ position: "absolute", inset: 0, background: "rgba(30,24,48,0.5)", opacity: 0, transition: "opacity 0.18s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8 }}>
                {p.caption && <p style={{ fontFamily: FF_S, fontSize: 11, color: "#fff", textAlign: "center", margin: "0 0 6px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.caption}</p>}
                {p.tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>{p.tags.map(t => <span key={t} style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "1px 7px" }}>{t}</span>)}</div>}
              </div>
              {p.mediaType === "video" && p.mediaSrc && <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "2px 7px", fontSize: 10, color: "#fff" }}>▶</div>}
            </div>
          ))}
        </div>
      )}

      {/* Add post form */}
      {adding && (
        <div style={{ background: color.accent + "44", borderRadius: 18, padding: "18px", marginBottom: 14 }}>
          {/* Media upload */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{ height: 160, borderRadius: 14, border: `2px dashed ${color.dot}55`, background: draft.mediaSrc ? "#111" : color.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 14, overflow: "hidden", position: "relative" }}>
            {draft.mediaSrc
              ? draft.mediaType === "video"
                ? <video src={draft.mediaSrc} style={{ width: "100%", height: "100%", objectFit: "contain" }} muted />
                : <img src={draft.mediaSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
                  <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: 0 }}>Click to upload image or video</p>
                </div>
            }
            {draft.mediaSrc && (
              <button onClick={e => { e.stopPropagation(); setDraft(d => ({ ...d, mediaSrc: null })); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 20, width: 24, height: 24, cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />

          {/* Caption */}
          <textarea value={draft.caption} onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))} placeholder="Write a caption…" rows={3} style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 12, padding: "10px 12px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", resize: "none", marginBottom: 10, boxSizing: "border-box", lineHeight: 1.6 }} />

          {/* Tags */}
          <div style={{ marginBottom: 10 }}>
            <input value={draft.tags} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} placeholder="Tag people  e.g. @cleo @soren" style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {allUsers.filter(u => !draft.tags.includes(u)).map(u => (
                <span key={u} onClick={() => setDraft(d => ({ ...d, tags: (d.tags + " " + u).trim() }))} style={{ background: color.bg, border: `1px solid ${color.dot}55`, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, color: color.dot, cursor: "pointer" }}>{u}</span>
              ))}
            </div>
          </div>

          {/* Link */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={draft.link} onChange={e => setDraft(d => ({ ...d, link: e.target.value }))} placeholder="Link URL (optional)" style={{ flex: 2, border: `1.5px solid ${color.accent}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
            <input value={draft.linkLabel} onChange={e => setDraft(d => ({ ...d, linkLabel: e.target.value }))} placeholder="Label" style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addPost} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontWeight: 600, fontSize: 13 }}>Post</button>
            <button onClick={() => { setAdding(false); setDraft({ caption: "", tags: "", link: "", linkLabel: "", mediaSrc: null, mediaType: "image" }); }} style={{ background: color.accent, border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.ink }}>✕</button>
          </div>
        </div>
      )}

      {/* Add post button */}
      {!adding && isOwnDashboard !== false && (
        <button onClick={() => setAdding(true)} style={{ width: "100%", background: color.accent + "66", border: `1.5px dashed ${color.dot}55`, borderRadius: 10, padding: "8px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginTop: posts.length > 0 ? 10 : 0 }}>+ Add post</button>
      )}

      {/* Post detail modal */}
      {activePost && (
        <GalleryPostModal
          post={activePost}
          color={color}
          isOwner={isOwnDashboard !== false}
          onClose={() => setActivePost(null)}
          onUpdate={(updated) => { updatePost(updated); setActivePost(updated); }}
          onDelete={(id) => { deletePost(id); setActivePost(null); }}
        />
      )}
    </div>
  );
};

const BLOG_SEED = [
  {
    id: "bl1", title: "On designing for slowness", category: "Design", tags: ["design", "process", "reflection"],
    body: `There's a particular kind of product that asks nothing of you. It doesn't pull, doesn't ping, doesn't reward you for coming back faster than yesterday. It simply waits.\n\nI've been thinking about this a lot lately — about what it means to design for people who are tired. Not tired of technology exactly, but tired of the pace it assumes.\n\nMost interfaces are built on an implicit contract: your attention for our content. We'll make it easy. We'll make it fast. We'll make it feel like nothing. The friction has been sanded away so thoroughly that using the thing barely registers as a choice.\n\nBut what if friction is sometimes the point? What if the slight resistance of a physical notebook — the weight of the pen, the permanence of ink — is not a bug to be engineered out, but a feature worth preserving in some form?\n\nI don't have an answer yet. But I think the question is worth sitting with.`,
    coverColor: "#C9B8F0", ts: Date.now() - 86400000 * 4, readTime: 3, published: true,
  },
  {
    id: "bl2", title: "A short story: The last train to Wicklow", category: "Fiction", tags: ["fiction", "short story", "ireland"],
    body: `The 22:47 was never on time, and tonight was no exception.\n\nMaura stood under the single working light at Bray station, her coat pulled tight against a wind that seemed to arrive from somewhere personal. She had missed the last bus, and her phone was at 4%, which felt appropriate.\n\nThe platform was empty except for a man at the far end reading a paperback with the focused calm of someone who had given up expecting things to go to plan. She recognised the posture. She'd worn it herself for most of her twenties.\n\nThe train, when it came, was almost empty. She sat in the second carriage, watched the dark coast pass in the window, and allowed herself — for the first time in weeks — to think about nothing at all.`,
    coverColor: "#B4E8D8", ts: Date.now() - 86400000 * 12, readTime: 2, published: true,
  },
  {
    id: "bl3", title: "Notes on colour", category: "Notes", tags: ["colour", "design", "process"],
    body: `Rough notes from this week — unpolished, may turn into something longer.\n\n— Warm neutrals are having a moment but I think it's less trend and more correction. We overcorrected into cool greys for a decade and now the pendulum swings.\n\n— The most interesting palettes I've seen lately all have one note that's slightly wrong. A green that's almost yellow. A blue that could be a shadow. The dissonance is what makes them memorable.\n\n— There's no such thing as a neutral. Every background colour is a choice about mood.\n\n— I keep coming back to the idea that colour is mostly about relationship. None of these can be evaluated alone.`,
    coverColor: "#F8CEBA", ts: Date.now() - 86400000 * 1, readTime: 1, published: false,
  },
];

const BLOG_CATEGORIES = ["Essay", "Design", "Fiction", "Notes", "Personal", "Technical", "Travel", "Other"];

const BlogPostModal = ({ post, onClose, onSave, onDelete, isOwner, color }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: post.title, body: post.body, category: post.category, tags: post.tags.join(", "), coverColor: post.coverColor, published: post.published });
  const [copied, setCopied] = useState(false);
  const wordCount = post.body.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const save = () => {
    const tags = draft.tags.split(/[,\s]+/).map(t => t.trim().replace(/^#/, "")).filter(Boolean);
    onSave({ ...post, ...draft, tags, readTime: Math.max(1, Math.ceil(draft.body.trim().split(/\s+/).filter(Boolean).length / 200)) });
    setEditing(false);
  };

  const inp = (extra = {}) => ({ border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", width: "100%", boxSizing: "border-box", ...extra });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,24,48,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, width: "100%", maxWidth: 680, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(30,24,48,0.3)", animation: "popIn 0.2s ease", overflow: "hidden" }}>

        {/* Cover strip */}
        {!editing && (
          <div style={{ height: 8, background: post.coverColor, flexShrink: 0 }} />
        )}

        {/* Header */}
        <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${P.lavender}33`, flexShrink: 0, display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Post title…" style={{ ...inp(), fontFamily: FF_D, fontSize: 22, background: "transparent", border: "none", borderBottom: `2px solid ${P.lavender}`, borderRadius: 0, padding: "4px 0", marginBottom: 0 }} />
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ background: color.accent, color: color.dot, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>{post.category}</span>
                  <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{readTime} min read · {new Date(post.ts).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {!post.published && <span style={{ background: P.butter, color: "#C8A830", borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>Draft</span>}
                </div>
                <h2 style={{ fontFamily: FF_D, fontSize: 24, color: P.ink, margin: 0, fontWeight: 400, lineHeight: 1.3 }}>{post.title}</h2>
              </>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: P.inkFaint, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Category</label>
                  <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={{ ...inp(), cursor: "pointer" }}>
                    {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Tags <span style={{ fontWeight: 400 }}>(comma separated)</span></label>
                  <input value={draft.tags} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} placeholder="design, process, notes" style={inp()} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Cover colour</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["#C9B8F0","#B4E8D8","#F8CEBA","#B8D8F0","#F0B8C8","#F5E8B0"].map(c => (
                    <div key={c} onClick={() => setDraft(d => ({ ...d, coverColor: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: draft.coverColor === c ? `3px solid ${P.ink}` : "3px solid transparent", transition: "border 0.15s" }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Content</label>
                <textarea
                  autoFocus
                  value={draft.body}
                  onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                  placeholder="Start writing…"
                  style={{ ...inp({ borderRadius: 14, padding: "14px 16px", resize: "vertical", lineHeight: 1.85, fontSize: 14, minHeight: 280, fontFamily: FF_S }) }}
                />
                <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 4, textAlign: "right" }}>
                  {draft.body.trim().split(/\s+/).filter(Boolean).length} words · {Math.max(1, Math.ceil(draft.body.trim().split(/\s+/).filter(Boolean).length / 200))} min read
                </div>
              </div>
            </div>
          ) : (
            <>
              {post.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                  {post.tags.map(t => <span key={t} style={{ background: P.lavenderLight, borderRadius: 20, padding: "3px 12px", fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>#{t}</span>)}
                </div>
              )}
              <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                {post.body}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 28px", borderTop: `1px solid ${P.lavender}33`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          {editing ? (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginRight: "auto" }}>
                <div onClick={() => setDraft(d => ({ ...d, published: !d.published }))} style={{ width: 36, height: 20, borderRadius: 10, background: draft.published ? color.dot : P.lavender + "66", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: draft.published ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
                {draft.published ? "Published" : "Draft"}
              </label>
              <button onClick={save} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 12, padding: "9px 20px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ background: P.lavenderLight, border: "none", borderRadius: 12, padding: "9px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? P.mintLight : P.lavenderLight, border: `1.5px solid ${copied ? P.mint : P.lavender}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: copied ? "#3BAA80" : "#9B85D8", transition: "all 0.2s" }}>
                {copied ? "✓ Copied!" : "↗ Share post"}
              </button>
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} style={{ background: P.lavenderLight, border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.inkLight }}>Edit ✎</button>
                  <button onClick={() => { onDelete(post.id); onClose(); }} style={{ background: "#F0B8C833", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: "#D8708A", marginLeft: "auto" }}>Delete</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const BlogWidget = ({ data, color, isOwnDashboard }) => {
  const [posts, setPosts] = useState(() => data.posts?.length > 0 ? data.posts : BLOG_SEED);
  const [activePost, setActivePost] = useState(null);
  const [creating, setCreating] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");

  const savePost = (updated) => setPosts(ps => ps.map(p => p.id === updated.id ? updated : p));
  const deletePost = (id) => setPosts(ps => ps.filter(p => p.id !== id));
  const createPost = () => {
    const newPost = { id: `bl${Date.now()}`, title: "Untitled", category: "Notes", tags: [], body: "", coverColor: "#C9B8F0", ts: Date.now(), readTime: 1, published: false };
    setPosts(ps => [newPost, ...ps]);
    setActivePost(newPost);
    setCreating(false);
  };

  const visiblePosts = posts
    .filter(p => isOwnDashboard !== false ? true : p.published)
    .filter(p => filterCat === "All" || p.category === filterCat)
    .filter(p => !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) || p.tags.some(t => t.includes(searchQ.toLowerCase())));

  const usedCats = ["All", ...Array.from(new Set(posts.map(p => p.category)))];
  const pubCount = posts.filter(p => p.published).length;
  const draftCount = posts.filter(p => !p.published).length;

  return (
    <div>
      {/* Stats + controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          <div style={{ background: color.accent + "55", borderRadius: 10, padding: "6px 14px", fontFamily: FF_S, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: color.dot }}>{pubCount}</span> <span style={{ color: P.inkFaint }}>published</span>
          </div>
          {isOwnDashboard !== false && draftCount > 0 && (
            <div style={{ background: P.butterLight, borderRadius: 10, padding: "6px 14px", fontFamily: FF_S, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: "#C8A830" }}>{draftCount}</span> <span style={{ color: P.inkFaint }}>draft{draftCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: P.inkFaint, pointerEvents: "none" }}>🔍</span>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…" style={{ border: `1.5px solid ${color.accent}`, borderRadius: 10, padding: "6px 10px 6px 28px", fontFamily: FF_S, fontSize: 12, background: color.bg, color: P.ink, outline: "none", width: 130 }} />
        </div>
        {isOwnDashboard !== false && (
          <button onClick={createPost} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>+ New post</button>
        )}
      </div>

      {/* Category filter tabs */}
      {usedCats.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {usedCats.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{ background: filterCat === cat ? color.dot : color.accent + "66", color: filterCat === cat ? "#fff" : P.inkLight, border: "none", borderRadius: 20, padding: "4px 13px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: filterCat === cat ? 600 : 400, transition: "all 0.15s" }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Post list */}
      {visiblePosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 0", color: P.inkFaint }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✍</div>
          <p style={{ fontFamily: FF_S, fontSize: 13, margin: 0 }}>{searchQ ? `No posts matching "${searchQ}"` : "No posts yet"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visiblePosts.map(p => {
            const words = p.body.trim().split(/\s+/).filter(Boolean).length;
            const rt = Math.max(1, Math.ceil(words / 200));
            const preview = p.body.replace(/\n+/g, " ").trim().slice(0, 120);
            return (
              <div key={p.id} onClick={() => setActivePost(p)} style={{ background: color.accent + "33", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", display: "flex" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(61,53,80,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                {/* Colour spine */}
                <div style={{ width: 5, background: p.coverColor, flexShrink: 0 }} />
                <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ background: p.coverColor + "88", borderRadius: 20, padding: "2px 9px", fontFamily: FF_S, fontSize: 10, fontWeight: 600, color: P.ink }}>{p.category}</span>
                    <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{rt} min read</span>
                    {!p.published && isOwnDashboard !== false && <span style={{ background: P.butterLight, color: "#C8A830", borderRadius: 20, padding: "2px 9px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>Draft</span>}
                    <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginLeft: "auto" }}>{new Date(p.ts).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</span>
                  </div>
                  <h4 style={{ fontFamily: FF_D, fontSize: 15, color: P.ink, margin: "0 0 5px", fontWeight: 400, lineHeight: 1.3 }}>{p.title}</h4>
                  {preview && <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}{p.body.length > 120 ? "…" : ""}</p>}
                  {p.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 7 }}>
                      {p.tags.slice(0, 4).map(t => <span key={t} style={{ fontFamily: FF_S, fontSize: 10, color: color.dot, opacity: 0.7 }}>#{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post modal */}
      {activePost && (
        <BlogPostModal
          post={activePost}
          color={color}
          isOwner={isOwnDashboard !== false}
          onClose={() => setActivePost(null)}
          onSave={(updated) => { savePost(updated); setActivePost(updated); }}
          onDelete={(id) => { deletePost(id); setActivePost(null); }}
        />
      )}
    </div>
  );
};

const BOOKMARKS_SEED = {
  daily: [
    { id: "bm1", title: "Gmail",          url: "https://mail.google.com",          emoji: "📧", color: "#F8CEBA" },
    { id: "bm2", title: "Notion",         url: "https://notion.so",                emoji: "🗒", color: "#C9B8F0" },
    { id: "bm3", title: "Figma",          url: "https://figma.com",                emoji: "🎨", color: "#B4E8D8" },
    { id: "bm4", title: "Linear",         url: "https://linear.app",               emoji: "⚡", color: "#B8D8F0" },
  ],
  frequent: [
    { id: "bm5", title: "Are.na",         url: "https://are.na",                   emoji: "🔲", color: "#F0B8C8" },
    { id: "bm6", title: "Behance",        url: "https://behance.net",              emoji: "✦", color: "#F5E8B0" },
    { id: "bm7", title: "GitHub",         url: "https://github.com",               emoji: "🐙", color: "#C9B8F0" },
    { id: "bm8", title: "Dribbble",       url: "https://dribbble.com",             emoji: "🏀", color: "#F0B8C8" },
    { id: "bm9", title: "Read.cv",        url: "https://read.cv",                  emoji: "📄", color: "#B4E8D8" },
    { id: "bm10", title: "The Browser",   url: "https://thebrowser.com",           emoji: "🌐", color: "#B8D8F0" },
  ],
};

const BOOKMARK_COLORS = ["#C9B8F0","#B4E8D8","#F8CEBA","#B8D8F0","#F0B8C8","#F5E8B0"];

const getFavicon = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
};

const BookmarkTile = ({ bm, onEdit, onDelete, isOwner, compact }) => {
  const [imgOk, setImgOk] = useState(true);
  const favicon = getFavicon(bm.url);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "stretch", gap: compact ? 8 : 0 }}>
      <a
        href={bm.url}
        target="_blank"
        rel="noreferrer"
        style={{ display: "flex", flexDirection: compact ? "row" : "column", alignItems: "center", gap: compact ? 8 : 6, background: bm.color + (compact ? "55" : "88"), borderRadius: compact ? 10 : 14, padding: compact ? "7px 12px" : "14px 10px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s", flex: 1, minWidth: 0 }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(61,53,80,0.13)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        title={bm.url}
      >
        {/* Icon */}
        <div style={{ width: compact ? 22 : 32, height: compact ? 22 : 32, borderRadius: compact ? 6 : 9, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {favicon && imgOk
            ? <img src={favicon} alt="" width={compact ? 14 : 18} height={compact ? 14 : 18} onError={() => setImgOk(false)} style={{ display: "block" }} />
            : <span style={{ fontSize: compact ? 12 : 16 }}>{bm.emoji}</span>
          }
        </div>
        {/* Title */}
        <span style={{ fontFamily: FF_S, fontSize: compact ? 12 : 11, fontWeight: 600, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: compact ? "none" : 72, textAlign: compact ? "left" : "center" }}>{bm.title}</span>
      </a>
      {/* Edit/delete on hover — owner only */}
      {isOwner && (
        <div style={{ position: "absolute", top: -6, right: -6, display: "flex", gap: 3, opacity: 0, transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
          <button onClick={e => { e.preventDefault(); onEdit(); }} style={{ width: 18, height: 18, borderRadius: "50%", background: P.lavender, border: "none", cursor: "pointer", fontSize: 9, color: P.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✎</button>
          <button onClick={e => { e.preventDefault(); onDelete(); }} style={{ width: 18, height: 18, borderRadius: "50%", background: P.rose, border: "none", cursor: "pointer", fontSize: 10, color: P.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
        </div>
      )}
    </div>
  );
};

const BookmarkEditModal = ({ bm, onSave, onClose }) => {
  const [draft, setDraft] = useState({ title: bm.title, url: bm.url, emoji: bm.emoji, color: bm.color });
  const inp = { border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", width: "100%", boxSizing: "border-box" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,24,48,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 20, padding: "28px 32px", width: "100%", maxWidth: 380, boxShadow: "0 16px 48px rgba(30,24,48,0.2)", animation: "popIn 0.18s ease" }}>
        <h4 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: "0 0 20px", fontWeight: 400 }}>Edit bookmark</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Title</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>URL</label>
            <input value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://…" style={inp} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Emoji fallback</label>
              <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} style={{ ...inp, textAlign: "center", fontSize: 18 }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Tile colour</label>
              <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                {BOOKMARK_COLORS.map(c => (
                  <div key={c} onClick={() => setDraft(d => ({ ...d, color: c }))} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: draft.color === c ? `3px solid ${P.ink}` : "3px solid transparent", transition: "border 0.15s" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          <button onClick={() => onSave(draft)} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
          <button onClick={onClose} style={{ background: P.lavenderLight, border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const BookmarksWidget = ({ data, color, isOwnDashboard }) => {
  const init = data.bookmarks || BOOKMARKS_SEED;
  const [daily, setDaily]       = useState(init.daily    || []);
  const [frequent, setFrequent] = useState(init.frequent || []);
  const [editTarget, setEditTarget] = useState(null);   // { section, id }
  const [addTarget, setAddTarget]   = useState(null);   // "daily" | "frequent"
  const [view, setView] = useState("grid");             // "grid" | "list"
  const isOwner = isOwnDashboard !== false;

  const updateBm = (section, id, patch) => {
    const setter = section === "daily" ? setDaily : setFrequent;
    setter(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
  };
  const deleteBm = (section, id) => {
    const setter = section === "daily" ? setDaily : setFrequent;
    setter(bs => bs.filter(b => b.id !== id));
  };
  const addBm = (section, draft) => {
    const newBm = { id: `bm${Date.now()}`, title: draft.title || "New link", url: draft.url || "#", emoji: draft.emoji || "🔗", color: draft.color || BOOKMARK_COLORS[0] };
    if (section === "daily") setDaily(bs => [...bs, newBm]);
    else setFrequent(bs => [...bs, newBm]);
    setAddTarget(null);
  };

  const SectionLabel = ({ label, section, count }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontFamily: FF_S, fontSize: 10, fontWeight: 700, color: P.inkFaint, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontFamily: FF_S, fontSize: 10, color: color.dot, background: color.accent + "66", borderRadius: 20, padding: "1px 7px" }}>{count}</span>
      {isOwner && <button onClick={() => setAddTarget(section)} style={{ background: "none", border: `1px dashed ${color.dot}66`, borderRadius: 20, padding: "1px 8px", cursor: "pointer", fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginLeft: "auto" }}>+ Add</button>}
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ display: "flex", background: color.accent + "55", borderRadius: 10, padding: 3, gap: 2 }}>
          {[["grid","⊞"],["list","≡"]].map(([v, icon]) => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? color.dot : "none", color: view === v ? "#fff" : P.inkFaint, border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Daily section */}
      <SectionLabel label="Daily use" section="daily" count={daily.length} />
      {daily.length === 0 && isOwner && (
        <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: "0 0 16px", fontStyle: "italic" }}>No daily bookmarks yet — add your first!</p>
      )}
      <div style={{ display: view === "grid" ? "grid" : "flex", gridTemplateColumns: view === "grid" ? "repeat(auto-fill, minmax(88px, 1fr))" : undefined, flexDirection: view === "list" ? "column" : undefined, gap: view === "grid" ? 10 : 6, marginBottom: 22 }}>
        {daily.map(bm => (
          <div key={bm.id} style={{ position: "relative" }}
            onMouseEnter={e => { const btns = e.currentTarget.querySelectorAll(".bm-action"); btns.forEach(b => b.style.opacity = "1"); }}
            onMouseLeave={e => { const btns = e.currentTarget.querySelectorAll(".bm-action"); btns.forEach(b => b.style.opacity = "0"); }}>
            <a href={bm.url} target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: view === "grid" ? "column" : "row", alignItems: "center", gap: view === "grid" ? 6 : 10, background: bm.color + (view === "grid" ? "88" : "55"), borderRadius: view === "grid" ? 14 : 10, padding: view === "grid" ? "14px 10px" : "8px 12px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(61,53,80,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <FaviconIcon url={bm.url} emoji={bm.emoji} size={view === "grid" ? 32 : 22} iconSize={view === "grid" ? 18 : 14} />
              <span style={{ fontFamily: FF_S, fontSize: view === "grid" ? 11 : 12, fontWeight: 600, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: view === "grid" ? 72 : "none", textAlign: view === "grid" ? "center" : "left", flex: view === "list" ? 1 : undefined }}>{bm.title}</span>
              {view === "list" && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{bm.url}</span>}
            </a>
            {isOwner && (
              <div style={{ position: "absolute", top: -5, right: -5, display: "flex", gap: 2 }}>
                <button className="bm-action" onClick={() => setEditTarget({ section: "daily", bm })} style={{ width: 18, height: 18, borderRadius: "50%", background: P.lavender, border: "none", cursor: "pointer", fontSize: 9, color: P.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: 0, transition: "opacity 0.15s" }}>✎</button>
                <button className="bm-action" onClick={() => deleteBm("daily", bm.id)} style={{ width: 18, height: 18, borderRadius: "50%", background: P.rose, border: "none", cursor: "pointer", fontSize: 11, color: P.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: 0, transition: "opacity 0.15s" }}>×</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: color.accent, marginBottom: 18 }} />

      {/* Frequent section */}
      <SectionLabel label="Frequent" section="frequent" count={frequent.length} />
      {frequent.length === 0 && isOwner && (
        <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: "0 0 16px", fontStyle: "italic" }}>No frequent bookmarks yet.</p>
      )}
      <div style={{ display: view === "grid" ? "grid" : "flex", gridTemplateColumns: view === "grid" ? "repeat(auto-fill, minmax(88px, 1fr))" : undefined, flexDirection: view === "list" ? "column" : undefined, gap: view === "grid" ? 10 : 6 }}>
        {frequent.map(bm => (
          <div key={bm.id} style={{ position: "relative" }}
            onMouseEnter={e => { const btns = e.currentTarget.querySelectorAll(".bm-action"); btns.forEach(b => b.style.opacity = "1"); }}
            onMouseLeave={e => { const btns = e.currentTarget.querySelectorAll(".bm-action"); btns.forEach(b => b.style.opacity = "0"); }}>
            <a href={bm.url} target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: view === "grid" ? "column" : "row", alignItems: "center", gap: view === "grid" ? 6 : 10, background: bm.color + (view === "grid" ? "88" : "55"), borderRadius: view === "grid" ? 14 : 10, padding: view === "grid" ? "14px 10px" : "8px 12px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(61,53,80,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <FaviconIcon url={bm.url} emoji={bm.emoji} size={view === "grid" ? 32 : 22} iconSize={view === "grid" ? 18 : 14} />
              <span style={{ fontFamily: FF_S, fontSize: view === "grid" ? 11 : 12, fontWeight: 600, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: view === "grid" ? 72 : "none", textAlign: view === "grid" ? "center" : "left", flex: view === "list" ? 1 : undefined }}>{bm.title}</span>
              {view === "list" && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{bm.url}</span>}
            </a>
            {isOwner && (
              <div style={{ position: "absolute", top: -5, right: -5, display: "flex", gap: 2 }}>
                <button className="bm-action" onClick={() => setEditTarget({ section: "frequent", bm })} style={{ width: 18, height: 18, borderRadius: "50%", background: P.lavender, border: "none", cursor: "pointer", fontSize: 9, color: P.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: 0, transition: "opacity 0.15s" }}>✎</button>
                <button className="bm-action" onClick={() => deleteBm("frequent", bm.id)} style={{ width: 18, height: 18, borderRadius: "50%", background: P.rose, border: "none", cursor: "pointer", fontSize: 11, color: P.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: 0, transition: "opacity 0.15s" }}>×</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <BookmarkEditModal
          bm={editTarget.bm}
          onClose={() => setEditTarget(null)}
          onSave={patch => { updateBm(editTarget.section, editTarget.bm.id, patch); setEditTarget(null); }}
        />
      )}

      {/* Add modal */}
      {addTarget && (
        <BookmarkEditModal
          bm={{ title: "", url: "", emoji: "🔗", color: BOOKMARK_COLORS[0] }}
          onClose={() => setAddTarget(null)}
          onSave={draft => addBm(addTarget, draft)}
        />
      )}
    </div>
  );
};

// Favicon with fallback helper (used by BookmarksWidget)
const FaviconIcon = ({ url, emoji, size, iconSize }) => {
  const [ok, setOk] = useState(true);
  const favicon = (() => { try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return null; } })();
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
      {favicon && ok
        ? <img src={favicon} alt="" width={iconSize} height={iconSize} onError={() => setOk(false)} style={{ display: "block" }} />
        : <span style={{ fontSize: iconSize }}>{emoji}</span>}
    </div>
  );
};

const WIDGET_RENDERERS = {
  todo: TodoWidget, goals: GoalsWidget, reading: ReadingWidget, mood: MoodWidget,
  links: LinksWidget, gratitude: GratitudeWidget, sobriety: SobrietyWidget,
  habitstreak: HabitStreakWidget, instagram: InstagramWidget,
  sports: SportsWidget, hobbies: HobbiesWidget,
  linkedin: LinkedInWidget, twitter: TwitterWidget,
  projects: ProjectsWidget, podcast: PodcastWidget,
  travel: TravelWidget, articles: ArticlesWidget,
  exercise: ExerciseWidget, archive: ArchiveWidget, gallery: GalleryWidget, blog: BlogWidget,
  bookmarks: BookmarksWidget,
};

const ShareWidgetModal = ({ widget, onClose }) => {
  const [sent, setSent]       = useState([]);   // user ids already sent to
  const [search, setSearch]   = useState("");
  const [justSent, setJustSent] = useState(null); // id of last-sent user (for flash)
  const color                 = WIDGET_COLORS[widget.colorIdx];

  // In future this would be real connections from Supabase
  const connections = [];
  const filtered = connections.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.handle.toLowerCase().includes(search.toLowerCase())
  );

  const send = (userId) => {
    setSent(s => [...s, userId]);
    setJustSent(userId);
    setTimeout(() => setJustSent(null), 1800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 26, width: 400, boxShadow: "0 24px 64px rgba(61,53,80,0.22)", border: `1.5px solid ${P.lavender}55`, overflow: "hidden", animation: "popIn 0.2s ease" }}>

        {/* Header */}
        <div style={{ background: color.bg, padding: "22px 24px 18px", borderBottom: `1px solid ${color.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: color.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{widget.icon}</div>
              <div>
                <div style={{ fontFamily: FF_D, fontSize: 17, color: P.ink }}>{widget.title}</div>
                <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkLight, marginTop: 2 }}>Share this widget with others</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: color.accent, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: P.inkLight }}>×</button>
          </div>
        </div>

        <div style={{ padding: "18px 24px 24px" }}>
          {/* Copy link row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1, background: P.lavenderLight, borderRadius: 10, padding: "9px 12px", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              nook.app/{ME_BASE.handle}/{widget.id}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(`nook.app/${ME_BASE.handle}/${widget.id}`); }}
              style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.ink, flexShrink: 0 }}>
              Copy link
            </button>
          </div>

          {/* Search users */}
          <div style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.inkLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Send to a friend</div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.inkFaint, pointerEvents: "none" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or @handle…"
              style={{ width: "100%", border: `1.5px solid ${P.lavender}55`, borderRadius: 12, padding: "8px 12px 8px 30px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>
                {search ? "No users found" : "No connections yet — copy the link above to share"}
              </div>
            )}
            {filtered.map(u => {
              const alreadySent = sent.includes(u.id);
              const isFlash     = justSent === u.id;
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 12, marginBottom: 4, background: isFlash ? P.mintLight : "transparent", transition: "background 0.3s" }}>
                  <UserAvatar user={u} size={36} showStatus />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FF_S, fontSize: 13.5, fontWeight: 600, color: P.ink }}>{u.name}</div>
                    <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>{u.handle}</div>
                  </div>
                  <button
                    onClick={() => !alreadySent && send(u.id)}
                    style={{
                      background: alreadySent ? P.mintLight : P.lavender,
                      color: alreadySent ? "#3BAA80" : P.ink,
                      border: "none", borderRadius: 10, padding: "6px 14px", cursor: alreadySent ? "default" : "pointer",
                      fontFamily: FF_S, fontSize: 12, fontWeight: 600,
                      transition: "all 0.25s", flexShrink: 0,
                    }}>
                    {isFlash ? "Sent ✓" : alreadySent ? "Sent ✓" : "Send"}
                  </button>
                </div>
              );
            })}
          </div>

          {sent.length > 0 && (
            <div style={{ marginTop: 14, background: P.mintLight, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 12, color: "#3BAA80", fontWeight: 600 }}>
              ✓ Shared with {sent.length} person{sent.length !== 1 ? "s" : ""} — they'll see it in their messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WidgetCard = ({ widget, onTogglePublic, isOwnDashboard, dragHandleProps, onToggleExpand, isExpanded, liveData }) => {
  const color = WIDGET_COLORS[widget.colorIdx];
  const Renderer = WIDGET_RENDERERS[widget.id];
  const [showShare, setShowShare] = useState(false);
  return (
    <>
    <div style={{ background: color.bg, borderRadius: 20, padding: "22px 24px", border: `1.5px solid ${color.accent}`, boxShadow: `0 4px 20px ${color.dot}18`, display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isOwnDashboard && dragHandleProps && (
            <div {...dragHandleProps} style={{ cursor: "grab", color: P.inkFaint, fontSize: 14, padding: "0 2px", userSelect: "none", lineHeight: 1 }} title="Drag to reorder">⠿</div>
          )}
          <div style={{ width: 34, height: 34, borderRadius: 10, background: color.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{widget.icon}</div>
          <span style={{ fontFamily: FF_D, fontSize: 17, color: P.ink, fontWeight: 400 }}>{widget.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Expand/collapse button */}
          {isOwnDashboard && onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={isExpanded ? "Collapse widget" : "Expand widget"}
              style={{ background: isExpanded ? color.accent : "none", border: `1px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: P.inkLight, fontSize: 12, lineHeight: 1, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 3 }}
              onMouseEnter={e => { e.currentTarget.style.background = color.accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = isExpanded ? color.accent : "none"; }}>
              {isExpanded ? "⊟ Collapse" : "⊞ Expand"}
            </button>
          )}
          {/* Share button */}
          {(isOwnDashboard || widget.isPublic) && (
            <button onClick={() => setShowShare(true)} title="Share widget" style={{ background: "none", border: `1px solid ${color.accent}`, borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkLight, display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = color.accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              ↗ Share
            </button>
          )}
          {isOwnDashboard && (
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkLight }}>{widget.isPublic ? "Public" : "Private"}</span>
              <Toggle on={widget.isPublic} onChange={onTogglePublic} small />
            </div>
          )}
          {!isOwnDashboard && !widget.isPublic && (
            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkLight, background: "#EDE8FB", borderRadius: 20, padding: "3px 9px" }}>Private</span>
          )}
        </div>
      </div>
      <Renderer data={widget.data} color={color} isOwnDashboard={isOwnDashboard} {...(liveData || {})} />
    </div>
    {showShare && <ShareWidgetModal widget={widget} onClose={() => setShowShare(false)} />}
    </>
  );
};

const NewConvoModal = ({ onClose, onStart }) => {
  const [tab, setTab] = useState("dm");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  // In future: real connections from Supabase
  const connections = [];
  const filtered = connections.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.handle.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id) => { if (tab === "dm") setSelected([id]); else setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); };
  const canStart = tab === "dm" ? selected.length === 1 : selected.length >= 2 && groupName.trim();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, width: 420, maxHeight: "80vh", boxShadow: "0 20px 60px rgba(61,53,80,0.2)", border: `1.5px solid ${P.lavender}55`, display: "flex", flexDirection: "column", overflow: "hidden", animation: "popIn 0.2s ease" }}>
        <div style={{ padding: "22px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: 0, fontWeight: 400 }}>New conversation</h3>
            <button onClick={onClose} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: P.inkLight }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[["dm","Direct message"],["group","Group chat"]].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setSelected([]); }} style={{ background: tab === t ? P.lavender : P.lavenderLight, border: "none", borderRadius: 10, padding: "7px 16px", fontFamily: FF_S, fontSize: 13, fontWeight: tab === t ? 600 : 400, color: P.ink, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
          {tab === "group" && (
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name…"
              style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "9px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
          )}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.inkFaint }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or @handle…"
              style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "9px 14px 9px 34px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
          </div>
          {tab === "group" && selected.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {selected.map(id => { const u = getUser(id); return (
                <span key={id} style={{ background: P.lavender, borderRadius: 20, padding: "3px 10px 3px 8px", fontFamily: FF_S, fontSize: 12, color: P.ink, display: "flex", alignItems: "center", gap: 5 }}>
                  {u.name.split(" ")[0]} <span onClick={() => toggle(id)} style={{ cursor: "pointer", opacity: 0.6 }}>×</span>
                </span>
              );})}
            </div>
          )}
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 12px 12px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "28px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>
              {search ? "No users found" : "No connections yet — connect with people from the Feed"}
            </div>
          )}
          {filtered.map(u => (
            <div key={u.id} onClick={() => toggle(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, cursor: "pointer", background: selected.includes(u.id) ? P.lavenderLight : "transparent", transition: "background 0.15s" }}>
              <UserAvatar user={u} size={40} showStatus />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 500, color: P.ink }}>{u.name}</div>
                <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>{u.handle}</div>
              </div>
              {selected.includes(u.id) && <div style={{ width: 20, height: 20, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: P.ink, fontWeight: 700 }}>✓</div>}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 24px 22px", borderTop: `1px solid ${P.lavenderLight}` }}>
          <button onClick={() => canStart && onStart({ tab, selected, groupName })} style={{ width: "100%", background: canStart ? P.lavender : P.lavenderLight, border: "none", borderRadius: 14, padding: "12px", fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: canStart ? P.ink : P.inkFaint, cursor: canStart ? "pointer" : "default", transition: "all 0.2s" }}>
            {tab === "dm" ? "Open conversation →" : `Create group${selected.length >= 2 ? ` (${selected.length})` : ""} →`}
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestCard = ({ req, onAccept, onDecline }) => {
  const user = getUser(req.from);
  return (
    <div style={{ background: P.white, border: `1.5px solid ${P.lavender}55`, borderRadius: 18, padding: "18px 20px", marginBottom: 10, animation: "fadeUp 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <UserAvatar user={user} size={44} showStatus />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{user.name}</span>
              <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginLeft: 6 }}>{user.handle}</span>
            </div>
            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{fmtTime(req.ts)}</span>
          </div>
          <p style={{ fontFamily: FF_S, fontSize: 13.5, color: P.inkLight, margin: "0 0 14px", lineHeight: 1.5 }}>"{req.preview}"</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onAccept(req)} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "7px 18px", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, cursor: "pointer" }}>Accept</button>
            <button onClick={() => onDecline(req.id)} style={{ background: P.roseLight, border: `1px solid ${P.rose}`, borderRadius: 10, padding: "7px 18px", fontFamily: FF_S, fontSize: 13, color: P.ink, cursor: "pointer" }}>Decline</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConvoItem = ({ convo, isActive, onClick, currentUserId }) => {
  const isGroup = convo.isGroup;
  const lastMsg = convo.lastMessage;
  const unread = convo.unreadCount || 0;
  const displayUser = convo.displayAvatar;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 16, cursor: "pointer", background: isActive ? P.lavenderLight : "transparent", border: `1.5px solid ${isActive ? P.lavender : "transparent"}`, transition: "all 0.15s", marginBottom: 3 }}>
      {isGroup
        ? <div style={{ width: 44, height: 44, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👥</div>
        : <UserAvatar user={displayUser} size={44} showStatus />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: unread > 0 ? 700 : 500, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {convo.displayName}
          </span>
          {lastMsg && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, flexShrink: 0, marginLeft: 8 }}>{fmtTime(new Date(lastMsg.created_at).getTime())}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FF_S, fontSize: 12.5, color: unread > 0 ? P.ink : P.inkFaint, fontWeight: unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {lastMsg
              ? `${lastMsg.sender_id === currentUserId ? "You: " : isGroup ? `${lastMsg.profiles?.name?.split(" ")[0]}: ` : ""}${lastMsg.content}`
              : "No messages yet"}
          </span>
          {unread > 0 && <div style={{ width: 18, height: 18, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_S, fontSize: 10, fontWeight: 700, color: P.ink, flexShrink: 0, marginLeft: 8 }}>{unread}</div>}
        </div>
      </div>
    </div>
  );
};

const ConversationView = ({ convo, messages, messagesLoading, sendMessage, setTyping, typingUsers, currentUserId }) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const isGroup = convo.isGroup;
  const other = convo.displayAvatar;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setTyping(false);
    await sendMessage(text);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const ts = new Date(msg.created_at).getTime();
    const prevTs = prev ? new Date(prev.created_at).getTime() : 0;
    acc.push({ ...msg, isFirst: !prev || prev.sender_id !== msg.sender_id || (ts - prevTs) > 300000 });
    return acc;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: P.white, borderBottom: `1px solid ${P.lavender}44`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        {isGroup
          ? <div style={{ width: 40, height: 40, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👥</div>
          : <UserAvatar user={other} size={40} showStatus />}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FF_D, fontSize: 17, color: P.ink }}>{convo.displayName}</div>
          <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginTop: 1 }}>
            {isGroup ? `${convo.conversation_members?.length || 0} members` : other?.handle || ""}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 2, background: P.bg }}>
        {messagesLoading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>Loading messages…</div>
        )}
        {!messagesLoading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: P.inkFaint }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👋</div>
            <p style={{ fontFamily: FF_S, fontSize: 14, margin: 0 }}>Say hello! Start the conversation.</p>
          </div>
        )}
        {grouped.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const sender = msg.profiles;
          const isLast = !grouped[i + 1] || grouped[i + 1].sender_id !== msg.sender_id;
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginTop: msg.isFirst ? 14 : 2, animation: "fadeUp 0.2s ease both" }}>
              {!isMe && <div style={{ width: 28, flexShrink: 0 }}>{isLast && <UserAvatar user={sender} size={28} />}</div>}
              <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {msg.isFirst && !isMe && isGroup && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 3, marginLeft: 4 }}>{sender?.name?.split(" ")[0]}</span>}
                <div style={{ background: isMe ? P.lavender : P.white, border: isMe ? "none" : `1.5px solid ${P.lavender}44`, borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "9px 14px", fontFamily: FF_S, fontSize: 14, color: P.ink, lineHeight: 1.5, boxShadow: isMe ? `0 2px 12px ${P.lavender}50` : "0 1px 4px rgba(61,53,80,0.06)" }}>{msg.content}</div>
                {isLast && <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 3 }}>{fmtTime(new Date(msg.created_at).getTime())}</span>}
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 14, animation: "fadeUp 0.2s ease" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: P.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              {typingUsers[0]?.name?.[0] || "?"}
            </div>
            <div style={{ background: P.white, border: `1.5px solid ${P.lavender}44`, borderRadius: "4px 16px 16px 16px", padding: "10px 16px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: P.lavender, animation: "bounce 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "14px 20px", background: P.white, borderTop: `1px solid ${P.lavender}44`, display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
        <textarea value={input} onChange={handleInputChange} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message… (Enter to send)" rows={1}
          style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 14, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", resize: "none", lineHeight: 1.5 }} />
        <button onClick={send} style={{ background: input.trim() ? P.lavender : P.lavenderLight, border: "none", borderRadius: 12, width: 42, height: 42, cursor: input.trim() ? "pointer" : "default", fontSize: 18, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
      </div>
    </div>
  );
};

const HomePage = ({ onNavigate, profilePic }) => {
  const demoWidgets = INITIAL_WIDGETS.filter(w => w.enabled && w.isPublic).slice(0, 3);
  return (
    <div style={{ background: P.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(40px, 8vw, 90px) clamp(16px, 4vw, 32px) 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: P.lavenderLight, border: `1px solid ${P.lavender}`, borderRadius: 20, padding: "6px 18px", marginBottom: 28, fontFamily: FF_S, fontSize: 13, color: "#9B85D8" }}>✦ Your personal corner of the internet</div>
        <h1 style={{ fontFamily: FF_D, fontSize: "clamp(40px, 6vw, 68px)", color: P.ink, lineHeight: 1.15, margin: "0 0 24px", fontWeight: 400 }}>
          A dashboard that's<br /><em style={{ color: "#9B85D8" }}>beautifully yours</em>
        </h1>
        <p style={{ fontSize: 17, color: P.inkLight, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Nook gives you a personal space to track your goals, to-dos, reading list, and more — showcase your projects, share what you want, keep the rest private.
        </p>
        <button onClick={() => onNavigate("signup")} style={{ background: P.lavender, border: "none", borderRadius: 14, padding: "14px 36px", cursor: "pointer", fontSize: 16, fontWeight: 600, color: P.ink, boxShadow: `0 4px 20px ${P.lavender}80` }}>Get your Nook →</button>
      </div>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px) 60px" }}>
        <div style={{ background: P.white, borderRadius: 24, padding: "28px 32px", border: `1.5px solid ${P.lavender}55`, boxShadow: "0 8px 40px rgba(201,184,240,0.2)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <UserAvatar user={ME_BASE} size={60} photoPic={profilePic} />
            <div>
              <h2 style={{ fontFamily: FF_D, fontSize: 24, margin: "0 0 2px", color: P.ink, fontWeight: 400 }}>{ME_BASE.name}</h2>
              <p style={{ margin: "0 0 8px", color: P.inkLight, fontSize: 13 }}>{ME_BASE.handle}</p>
              <p style={{ margin: 0, color: P.inkLight, fontSize: 14, lineHeight: 1.6 }}>Designer & dreamer 🌿 Collecting good books, quiet mornings, and ambitious to-do lists.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {demoWidgets.map(w => <WidgetCard key={w.id} widget={w} isOwnDashboard={false} />)}
        </div>
        <p style={{ textAlign: "center", color: P.inkLight, fontSize: 13, marginTop: 20 }}>
          👆 This is what a public Nook looks like.{" "}
          <span style={{ color: "#9B85D8", cursor: "pointer" }} onClick={() => onNavigate("signup")}>Create yours free →</span>
        </p>
      </div>
    </div>
  );
};

const AuthPage = ({ mode, onSwitch, onEnter }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  const handleSubmit = async () => {
    setErr("");
    if (!form.email || !form.password) { setErr("Please fill in all fields."); return; }
    setSubmitting(true);
    const result = await onEnter({ email: form.email, password: form.password, name: form.name });
    if (result?.error) setErr(result.error);
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 61px)", background: P.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: P.white, borderRadius: 24, padding: "44px", border: `1.5px solid ${P.lavender}55`, boxShadow: "0 8px 40px rgba(201,184,240,0.2)", width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontFamily: FF_D, fontSize: 28, color: P.ink, margin: "0 0 6px", fontWeight: 400 }}>{isLogin ? "Welcome back" : "Create your Nook"}</h2>
        <p style={{ color: P.inkLight, fontSize: 14, margin: "0 0 28px" }}>{isLogin ? "Sign in to your personal dashboard" : "Your cosy corner of the internet awaits"}</p>
        {!isLogin && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginBottom: 5 }}>Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Margot Ellison"
              style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginBottom: 5 }}>Email</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="hello@example.com" type="email"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginBottom: 5 }}>Password</label>
          <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" type="password"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
        </div>
        {err && <div style={{ background: "#FDF0F0", border: "1.5px solid #F0B8C8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontFamily: FF_S, fontSize: 13, color: "#C04060" }}>{err}</div>}
        <button onClick={handleSubmit} disabled={submitting} style={{ width: "100%", background: submitting ? P.lavenderLight : P.lavender, border: "none", borderRadius: 14, padding: "13px", cursor: submitting ? "default" : "pointer", fontSize: 15, fontWeight: 600, color: P.ink, boxShadow: `0 4px 16px ${P.lavender}80` }}>
          {submitting ? "Please wait…" : isLogin ? "Sign in →" : "Create my Nook →"}
        </button>
        <p style={{ textAlign: "center", color: P.inkLight, fontSize: 13, marginTop: 20 }}>
          {isLogin ? "Don't have a Nook?" : "Already have a Nook?"}{" "}
          <span style={{ color: "#9B85D8", cursor: "pointer", fontWeight: 600 }} onClick={onSwitch}>{isLogin ? "Sign up" : "Log in"}</span>
        </p>
      </div>
    </div>
  );
};

const WidgetToggleCard = ({ w, onToggle }) => {
  const color = WIDGET_COLORS[w.colorIdx];
  return (
    <div style={{ background: w.enabled ? color.bg : P.white, border: `1.5px solid ${w.enabled ? color.accent : "#E0DCF0"}`, borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, transition: "all 0.25s" }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: w.enabled ? color.accent : "#EDE8FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "all 0.25s" }}>{w.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{w.title}</div>
        <div style={{ fontFamily: FF_S, fontSize: 11, color: w.enabled ? color.dot : P.inkFaint, marginTop: 2, fontWeight: w.enabled ? 600 : 400 }}>
          {w.enabled ? (w.isPublic ? "● Public" : "◐ Private") : "Off"}
        </div>
      </div>
      <Toggle on={w.enabled} onChange={onToggle} small />
    </div>
  );
};

const DashboardPage = ({ view, onNavigate, profilePic, setProfilePic, widgetRequests, setWidgetRequests, following, toggleFollow, initialWidgets }) => {
  const { user, profile } = useAuth();

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Your Nook';
  const displayHandle = profile?.handle || '@you';

  const STORAGE_KEY = user ? `nook_widgets_${user.id}` : null;
  const ORDER_KEY   = user ? `nook_widget_order_${user.id}` : null;

  const startingWidgets = (() => {
    if (STORAGE_KEY) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialWidgets || INITIAL_WIDGETS.map(w => ({ ...w, enabled: false, isPublic: false }));
  })();

  const [widgets, setWidgets] = useState(startingWidgets);
  const [widgetOrder, setWidgetOrder] = useState(() => {
    if (ORDER_KEY) {
      try {
        const saved = localStorage.getItem(ORDER_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return startingWidgets.map(w => w.id);
  });
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [bioLinks, setBioLinks] = useState([]);
  const [bioEmail, setBioEmail] = useState("");
  const [editBioLink, setEditBioLink] = useState(false);
  const [draftBioLinks, setDraftBioLinks] = useState(bioLinks);
  const [draftBioEmail, setDraftBioEmail] = useState(bioEmail);
  const [expandedWidgets, setExpandedWidgets] = useState(new Set(["gallery", "blog"]));
  const [widgetSearch, setWidgetSearch] = useState("");
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showPublic, setShowPublic] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const toggleExpand = (id) => setExpandedWidgets(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const fileInputRef = useRef(null);

  // Persist widget state whenever it changes
  useEffect(() => {
    if (STORAGE_KEY && widgets.length > 0) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch {}
    }
  }, [widgets, STORAGE_KEY]);

  useEffect(() => {
    if (ORDER_KEY && widgetOrder.length > 0) {
      try { localStorage.setItem(ORDER_KEY, JSON.stringify(widgetOrder)); } catch {}
    }
  }, [widgetOrder, ORDER_KEY]);

  // ── Lifted widget data (shared with ArchiveWidget) ────────────────────────
  const initReading = INITIAL_WIDGETS.find(w => w.id === "reading").data.items;
  const initGoals   = INITIAL_WIDGETS.find(w => w.id === "goals").data.items;
  const initHabits  = INITIAL_WIDGETS.find(w => w.id === "habitstreak").data.habits.map(h => ({ ...h, history: [] }));
  const initPods    = INITIAL_WIDGETS.find(w => w.id === "podcast").data.pods;

  const [readingItems, setReadingItems] = useState(initReading);
  const [goals, setGoals]               = useState(initGoals);
  const [habits, setHabits]             = useState(initHabits);
  const [pods, setPods]                 = useState(initPods);
  const [exerciseChecked, setExerciseChecked] = useState(() => new Set());
  const togglePublic = (id) => setWidgets(w => w.map(x => x.id === id ? { ...x, isPublic: !x.isPublic } : x));
  const toggleEnabled = (id) => {
    setWidgets(w => w.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    setWidgetOrder(order => {
      const w = widgets.find(x => x.id === id);
      if (w && !w.enabled) return order.includes(id) ? order : [...order, id];
      return order;
    });
  };

  // Drag and drop
  const onDragStart = (id) => setDragId(id);
  const onDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    setWidgetOrder(order => {
      const arr = [...order];
      const from = arr.indexOf(dragId), to = arr.indexOf(targetId);
      if (from === -1 || to === -1) return arr;
      arr.splice(from, 1); arr.splice(to, 0, dragId);
      return arr;
    });
    setDragId(null); setDragOverId(null);
  };
  const onDragEnd = () => { setDragId(null); setDragOverId(null); };

  const orderedWidgets = (list) => {
    const indexed = widgetOrder.reduce((m, id, i) => { m[id] = i; return m; }, {});
    return [...list].sort((a, b) => (indexed[a.id] ?? 999) - (indexed[b.id] ?? 999));
  };

  const enabledWidgets = orderedWidgets(widgets.filter(w => w.enabled));
  const publicWidgets = enabledWidgets.filter(w => w.isPublic);

  // Map widget id → live state props to spread into that renderer
  const getLiveData = (id) => {
    if (id === "reading")     return { items: readingItems, setItems: setReadingItems };
    if (id === "goals")       return { items: goals, setItems: setGoals };
    if (id === "habitstreak") return { habits, setHabits };
    if (id === "podcast")     return { pods, setPods };
    if (id === "exercise")    return { checked: exerciseChecked, setChecked: setExerciseChecked };
    return {};
  };

  // Compute this year's live summary for the archive
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const yearStart = new Date(currentYear, 0, 1);
  const dayOfYear = Math.floor((today - yearStart) / 86400000) + 1;
  const todayStr = today.toISOString().slice(0, 10);
  const yearStartStr = yearStart.toISOString().slice(0, 10);

  const liveThisYear = {
    year: currentYear,
    isLive: true,
    books: readingItems.filter(b => b.status === "done"),
    exerciseDays: [...exerciseChecked].filter(d => d >= yearStartStr && d <= todayStr).length,
    totalDays: dayOfYear,
    goalsCompleted: goals.filter(g => Number(g.progress) >= Number(g.total)).length,
    goalsTotal: goals.length,
    podcastsListened: pods.filter(p => p.status === "done").length,
    habitBestStreak: habits.length > 0 ? Math.max(...habits.map(h => {
      // compute best streak from history
      if (!h.history?.length) return 0;
      const sorted = [...h.history].sort();
      let best = 1, cur = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i-1]);
        const curr = new Date(sorted[i]);
        const diff = (curr - prev) / 86400000;
        cur = diff === 1 ? cur + 1 : 1;
        if (cur > best) best = cur;
      }
      return best;
    })) : 0,
    reflection: "",
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ background: P.bg, minHeight: "calc(100vh - 61px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
        {/* Profile */}
        <div style={{ background: P.white, borderRadius: 24, padding: "28px 32px", border: `1.5px solid ${P.lavender}55`, boxShadow: "0 4px 24px rgba(201,184,240,0.15)", marginBottom: 32, display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {/* Clickable avatar with upload overlay */}
          <div style={{ position: "relative", flexShrink: 0, cursor: showPublic ? "default" : "pointer" }} onClick={() => !showPublic && fileInputRef.current?.click()}>
            <UserAvatar user={{ ...profile, color: profile?.avatar_color }} size={80} photoPic={profilePic} />
            {!showPublic && <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(61,53,80,0.45)", display: "flex", alignItems: "center",
              justifyContent: "center", opacity: 0, transition: "opacity 0.2s",
              fontSize: 18,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              📷
            </div>}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontFamily: FF_D, fontSize: 26, margin: 0, color: P.ink, fontWeight: 400 }}>{displayName}</h2>
              <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, background: P.lavenderLight, borderRadius: 20, padding: "2px 10px" }}>{displayHandle}</span>
            </div>
            {editBio ? (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", resize: "none" }} />
                <button onClick={() => setEditBio(false)} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "0 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>Save</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <p style={{ margin: 0, color: P.inkLight, fontSize: 14, lineHeight: 1.65, maxWidth: 500 }}>{bio}</p>
                {!showPublic && <button onClick={() => setEditBio(true)} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkLight, flexShrink: 0, marginTop: 2 }}>Edit ✎</button>}
              </div>
            )}
            {/* Bio links + email */}
            <div style={{ marginTop: 10 }}>
              {editBioLink ? (
                <div style={{ background: P.lavenderLight, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Email */}
                  <div>
                    <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Email <span style={{ fontWeight: 400 }}>(optional)</span></label>
                    <input value={draftBioEmail} onChange={e => setDraftBioEmail(e.target.value)} placeholder="hello@yourdomain.com" style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 8, padding: "6px 10px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  {/* Links */}
                  <div>
                    <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 6 }}>Links</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {draftBioLinks.map((lnk, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input value={lnk.label} onChange={e => setDraftBioLinks(ls => ls.map((l, j) => j === i ? { ...l, label: e.target.value } : l))} placeholder="Label" style={{ width: 110, border: `1.5px solid ${P.lavender}`, borderRadius: 8, padding: "6px 10px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", flexShrink: 0 }} />
                          <input value={lnk.url} onChange={e => setDraftBioLinks(ls => ls.map((l, j) => j === i ? { ...l, url: e.target.value } : l))} placeholder="https://…" style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 8, padding: "6px 10px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", minWidth: 0 }} />
                          <button onClick={() => setDraftBioLinks(ls => ls.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16, flexShrink: 0, lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                      <button onClick={() => setDraftBioLinks(ls => [...ls, { label: "", url: "" }])} style={{ alignSelf: "flex-start", background: "none", border: `1px dashed ${P.lavender}`, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>+ Add link</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setBioLinks(draftBioLinks.filter(l => l.url.trim())); setBioEmail(draftBioEmail); setEditBioLink(false); }} style={{ background: P.lavender, border: "none", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: P.ink }}>Save</button>
                    <button onClick={() => { setDraftBioLinks(bioLinks); setDraftBioEmail(bioEmail); setEditBioLink(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: P.inkFaint }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {/* Email pill */}
                  {bioEmail && (
                    <a href={`mailto:${bioEmail}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FF_S, fontSize: 12, color: P.inkLight, textDecoration: "none", background: P.lavenderLight, borderRadius: 20, padding: "3px 11px" }}>
                      ✉ {bioEmail}
                    </a>
                  )}
                  {/* Link pills */}
                  {bioLinks.filter(l => l.url).map((lnk, i) => (
                    <a key={i} href={lnk.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FF_S, fontSize: 12, color: "#9B85D8", textDecoration: "none", fontWeight: 500, background: P.lavenderLight, borderRadius: 20, padding: "3px 11px" }}>
                      🔗 {lnk.label || lnk.url}
                    </a>
                  ))}
                  {!showPublic && (
                    <button onClick={() => { setDraftBioLinks(bioLinks.length ? bioLinks : [{ label: "", url: "" }]); setDraftBioEmail(bioEmail); setEditBioLink(true); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint }}>
                      {bioLinks.length === 0 && !bioEmail ? "+ Add email / links" : "✎"}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <p style={{ margin: 0, color: P.inkLight, fontSize: 12 }}>Member since March 2025 · {publicWidgets.length} public widget{publicWidgets.length !== 1 ? "s" : ""} · <span style={{ color: "#9B85D8", fontWeight: 600 }}>{following?.length || 0} following</span></p>
              {!showPublic && <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, padding: 0 }}>Change photo ✎</button>}
            </div>
          </div>
        </div>

        {view === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: 0, fontWeight: 400 }}>
                {showPublic ? "Public View" : "My Widgets"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {!showPublic && <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>{enabledWidgets.filter(w => w.id !== "archive").length} active · drag ⠿ to reorder</span>}
                <button
                  onClick={() => setShowPublic(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: showPublic ? P.mint : P.lavenderLight, border: `1.5px solid ${showPublic ? P.mint : P.lavender}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: showPublic ? "#3BAA80" : "#9B85D8", transition: "all 0.2s" }}>
                  <span>{showPublic ? "👁" : "👁"}</span>
                  {showPublic ? "Back to my dashboard" : "Preview public view"}
                </button>
              </div>
            </div>

            {/* Public view preview */}
            {showPublic && (
              <>
                <div style={{ background: P.mintLight, border: `1px solid ${P.mint}`, borderRadius: 14, padding: "12px 18px", marginBottom: 24, fontFamily: FF_S, fontSize: 13, color: "#3BAA80" }}>
                  👁 This is how others see your Nook — only public widgets are shown
                </div>
                {(() => {
                  const pubGrid = publicWidgets.filter(w => w.id !== "archive");
                  const pubArchive = publicWidgets.find(w => w.id === "archive");
                  return (
                    <>
                      {pubGrid.length === 0 && !pubArchive
                        ? <div style={{ textAlign: "center", padding: "60px 0", color: P.inkLight }}><p style={{ fontSize: 32, margin: "0 0 12px" }}>🔒</p><p>All your widgets are private — toggle some to public in Customise.</p></div>
                        : <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                            {pubGrid.map(w => (
                              <div key={w.id} style={{ gridColumn: expandedWidgets.has(w.id) ? "1 / -1" : "auto" }}>
                                <WidgetCard widget={w} isOwnDashboard={false} />
                              </div>
                            ))}
                          </div>
                      }
                      {pubArchive && (
                        <div style={{ marginTop: pubGrid.length > 0 ? 20 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{ flex: 1, height: 1, background: P.lavender + "44" }} />
                            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>Year in Review</span>
                            <div style={{ flex: 1, height: 1, background: P.lavender + "44" }} />
                          </div>
                          <WidgetCard widget={pubArchive} isOwnDashboard={false} />
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* Normal dashboard view */}
            {!showPublic && (() => {
              const gridWidgets = enabledWidgets.filter(w => w.id !== "archive");
              const archiveWidget = enabledWidgets.find(w => w.id === "archive");
              return (
                <>
                  {gridWidgets.length === 0 && !archiveWidget
                    ? <div style={{ textAlign: "center", padding: "60px 0", color: P.inkLight }}><p style={{ fontSize: 32, margin: "0 0 12px" }}>🌿</p><p>No widgets yet — head to Customise to add some!</p></div>
                    : <div className="nook-dash-grid">
                        {gridWidgets.map(w => (
                          <div key={w.id}
                            draggable
                            onDragStart={() => onDragStart(w.id)}
                            onDragOver={(e) => onDragOver(e, w.id)}
                            onDrop={(e) => onDrop(e, w.id)}
                            onDragEnd={onDragEnd}
                            style={{ gridColumn: expandedWidgets.has(w.id) ? "1 / -1" : "auto", opacity: dragId === w.id ? 0.45 : 1, outline: dragOverId === w.id && dragId !== w.id ? `2px dashed ${P.lavender}` : "none", borderRadius: 22, transition: "opacity 0.15s" }}>
                            <WidgetCard widget={w} onTogglePublic={() => togglePublic(w.id)} isOwnDashboard onToggleExpand={() => toggleExpand(w.id)} isExpanded={expandedWidgets.has(w.id)} dragHandleProps={{ draggable: false }} liveData={getLiveData(w.id)} />
                          </div>
                        ))}
                      </div>
                  }
                  {/* Archive — always pinned full-width at the bottom */}
                  {archiveWidget && (
                    <div style={{ marginTop: gridWidgets.length > 0 ? 20 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1, height: 1, background: P.lavender + "44" }} />
                        <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>Year in Review</span>
                        <div style={{ flex: 1, height: 1, background: P.lavender + "44" }} />
                      </div>
                      <WidgetCard widget={archiveWidget} onTogglePublic={() => togglePublic("archive")} isOwnDashboard liveData={{ liveThisYear }} />
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {view === "customize" && (() => {
          const CATEGORIES = [
            { id: "productivity",     label: "Productivity",      emoji: "⚡", ids: ["todo", "goals", "links", "bookmarks"] },
            { id: "lifestyle",        label: "Lifestyle",          emoji: "🌿", ids: ["habitstreak", "sobriety", "mood", "gratitude", "hobbies", "archive"] },
            { id: "sports",           label: "Sports",             emoji: "🏃", ids: ["sports", "exercise"] },
            { id: "culture",          label: "Culture",            emoji: "📚", ids: ["reading", "podcast", "articles", "blog"] },
            { id: "social",           label: "Social Media",       emoji: "✨", ids: ["instagram", "linkedin", "twitter", "gallery"] },
            { id: "entrepreneurship", label: "Entrepreneurship",   emoji: "🚀", ids: ["projects"] },
            { id: "lifestyle2",       label: "Life & Travel",      emoji: "✈",  ids: ["travel"] },
          ];
          const q = widgetSearch.toLowerCase().trim();
          const matchedIds = q ? widgets.filter(w => w.title.toLowerCase().includes(q) || w.id.includes(q)).map(w => w.id) : null;
          const enabledCount = widgets.filter(w => w.enabled).length;

          return (
            <>
              {/* Profile section label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: 0, fontWeight: 400 }}>Your profile</h3>
                <div style={{ flex: 1, height: 1, background: P.lavender + "55", marginLeft: 4 }} />
                <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>Edit bio, photo and link above</span>
              </div>
              <div style={{ background: P.lavenderLight, borderRadius: 14, padding: "12px 16px", marginBottom: 32, fontFamily: FF_S, fontSize: 13, color: P.inkLight, display: "flex", alignItems: "center", gap: 10 }}>
                <span>✏️</span>
                <span>Click your <strong style={{ color: P.ink }}>name, bio or link</strong> above to edit them, and tap your <strong style={{ color: P.ink }}>avatar</strong> to update your photo — changes show live on your public Nook.</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>Choose your widgets</h3>
                  <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: 0 }}>{enabledCount} of {widgets.length} active</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={() => setShowRequestModal(true)} style={{ background: P.lavenderLight, border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: "#9B85D8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    ✦ Request a widget
                  </button>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.inkFaint, pointerEvents: "none" }}>🔍</span>
                    <input value={widgetSearch} onChange={e => setWidgetSearch(e.target.value)} placeholder="Search widgets…"
                      style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 14px 8px 32px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", width: 200 }} />
                  </div>
                </div>
              </div>

              {matchedIds ? (
                matchedIds.length === 0
                  ? <p style={{ textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 14, padding: "40px 0" }}>No widgets match "{widgetSearch}"</p>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                      {widgets.filter(w => matchedIds.includes(w.id)).map(w => <WidgetToggleCard key={w.id} w={w} onToggle={() => toggleEnabled(w.id)} />)}
                    </div>
              ) : (
                CATEGORIES.map(cat => {
                  const catWidgets = widgets.filter(w => cat.ids.includes(w.id));
                  return (
                    <div key={cat.id} style={{ marginBottom: 32 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: 0, fontWeight: 400 }}>{cat.label}</h4>
                        <div style={{ flex: 1, height: 1, background: P.lavender + "55", marginLeft: 4 }} />
                        <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{catWidgets.filter(w => w.enabled).length}/{catWidgets.length} on</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                        {catWidgets.map(w => <WidgetToggleCard key={w.id} w={w} onToggle={() => toggleEnabled(w.id)} />)}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          );
        })()}

        {/* Widget request modal */}
        {showRequestModal && (
          <WidgetRequestModal
            onClose={() => setShowRequestModal(false)}
            onSubmit={(req) => { setWidgetRequests(rs => [req, ...rs]); }}
          />
        )}
      </div>
    </div>
  );
};

const MessagesPage = ({ requests, setRequests }) => {
  const { user } = useAuth();
  const {
    conversations, activeConversation, messages, loading, messagesLoading,
    selectConversation, sendMessage, startDM, startGroupChat,
    typingUsers, setTyping, totalUnread,
  } = useMessages();

  const [msgTab, setMsgTab] = useState("messages");
  const [searchConvos, setSearchConvos] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleSelect = (id) => {
    selectConversation(id);
    setShowChat(true);
  };

  const startConvo = async ({ tab, selected, groupName }) => {
    if (tab === "dm") {
      const { conversationId, error } = await startDM(selected[0]);
      if (!error && conversationId) handleSelect(conversationId);
    } else {
      const { conversationId, error } = await startGroupChat(selected, groupName);
      if (!error && conversationId) handleSelect(conversationId);
    }
    setShowNew(false);
    setMsgTab("messages");
  };

  const acceptRequest = (req) => {
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setMsgTab("messages");
  };

  const filtered = conversations.filter(c => {
    if (!searchConvos.trim()) return true;
    const q = searchConvos.toLowerCase();
    return c.displayName?.toLowerCase().includes(q);
  });

  return (
    <div className="nook-msg-layout">
      {/* Sidebar */}
      <div className={`nook-msg-sidebar${showChat ? " nook-msg-hidden" : ""}`} style={{ background: P.white, borderRight: `1px solid ${P.lavender}44`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 16px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: FF_D, fontSize: 22, color: P.ink, margin: 0, fontWeight: 400 }}>Messages</h2>
            <button onClick={() => setShowNew(true)} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>+ New</button>
          </div>
          <div style={{ display: "flex", gap: 4, background: P.lavenderLight, borderRadius: 12, padding: 4, marginBottom: 14 }}>
            {[["messages","Chats"],["requests","Requests"]].map(([t, label]) => (
              <button key={t} onClick={() => setMsgTab(t)} style={{ flex: 1, background: msgTab === t ? P.white : "transparent", border: "none", borderRadius: 9, padding: "7px", fontFamily: FF_S, fontSize: 13, fontWeight: msgTab === t ? 600 : 400, color: P.ink, cursor: "pointer", boxShadow: msgTab === t ? "0 1px 4px rgba(61,53,80,0.08)" : "none", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {label}
                {t === "requests" && requests.length > 0 && <span style={{ background: P.rose, borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{requests.length}</span>}
              </button>
            ))}
          </div>
          {msgTab === "messages" && (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.inkFaint }}>🔍</span>
              <input value={searchConvos} onChange={e => setSearchConvos(e.target.value)} placeholder="Search conversations…"
                style={{ width: "100%", border: `1.5px solid ${P.lavender}55`, borderRadius: 12, padding: "8px 12px 8px 30px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {msgTab === "messages" && (
            loading
              ? <p style={{ textAlign: "center", color: P.inkFaint, fontSize: 13, padding: "30px 16px" }}>Loading…</p>
              : filtered.length === 0
                ? <div style={{ textAlign: "center", padding: "48px 16px", color: P.inkFaint }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
                    <p style={{ fontFamily: FF_S, fontSize: 13, margin: 0 }}>No conversations yet</p>
                    <p style={{ fontFamily: FF_S, fontSize: 12, margin: "6px 0 0", color: P.inkFaint }}>Start one with the + New button</p>
                  </div>
                : filtered.map(c => <ConvoItem key={c.id} convo={c} isActive={activeConversation?.id === c.id} onClick={() => handleSelect(c.id)} currentUserId={user?.id} />)
          )}
          {msgTab === "requests" && (
            requests.length === 0
              ? <div style={{ textAlign: "center", padding: "40px 16px", color: P.inkFaint }}><div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div><p style={{ fontSize: 13, margin: 0 }}>No pending requests</p></div>
              : <div style={{ padding: "0 8px" }}>{requests.map(r => <RequestCard key={r.id} req={r} onAccept={acceptRequest} onDecline={(id) => setRequests(p => p.filter(r => r.id !== id))} />)}</div>
          )}
        </div>
        <div style={{ padding: "12px 16px 20px", borderTop: `1px solid ${P.lavender}44` }}>
          <button onClick={() => setShowNew(true)} style={{ width: "100%", background: P.lavenderLight, border: `1.5px dashed ${P.lavender}`, borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>🔍 Find users by @handle</button>
        </div>
      </div>

      {/* Chat area */}
      <div className={`nook-msg-main${!showChat ? " nook-msg-hidden" : ""}`} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <button className="nook-msg-back" onClick={() => setShowChat(false)} style={{ display: "none", alignItems: "center", gap: 8, padding: "12px 16px", background: P.white, border: "none", borderBottom: `1px solid ${P.lavender}33`, cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: "#9B85D8", fontWeight: 600 }}>
          ← Back to messages
        </button>
        {activeConversation
          ? <ConversationView
              key={activeConversation.id}
              convo={activeConversation}
              messages={messages}
              messagesLoading={messagesLoading}
              sendMessage={sendMessage}
              setTyping={setTyping}
              typingUsers={typingUsers}
              currentUserId={user?.id}
            />
          : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: P.inkFaint, background: P.bg }}>
              <div style={{ fontSize: 40 }}>✉️</div>
              <p style={{ fontFamily: FF_D, fontSize: 20, color: P.inkLight, margin: 0 }}>Select a conversation</p>
              <button onClick={() => setShowNew(true)} style={{ background: P.lavender, border: "none", borderRadius: 12, padding: "10px 24px", fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink, cursor: "pointer", marginTop: 8 }}>+ New conversation</button>
            </div>
        }
      </div>

      {showNew && <NewConvoModal onClose={() => setShowNew(false)} onStart={startConvo} />}
    </div>
  );
};

const WORK_SECTIONS = [
  { id: "overview",  label: "Overview",   icon: "▦" },
  { id: "todos",     label: "To-Do",      icon: "✓" },
  { id: "notes",     label: "Notes",      icon: "✎" },
  { id: "reminders", label: "Reminders",  icon: "🔔" },
  { id: "workflow",  label: "Workflow",   icon: "⬡" },
  { id: "focus",     label: "Focus",      icon: "◎" },
  { id: "meetings",  label: "Meetings",   icon: "📅" },
];

const INIT_MASTER_TODOS = [];
const INIT_DAILY_TODOS = [];
const INIT_NOTES = [];
const INIT_REMINDERS = [];
const INIT_WORKFLOW_COLS = [
  { id: "wc1", title: "Backlog",     color: "#EDE8FB", dot: "#9B85D8", cards: [] },
  { id: "wc2", title: "In Progress", color: "#E4F8F2", dot: "#5DCAAA", cards: [] },
  { id: "wc3", title: "Review",      color: "#FEF0EA", dot: "#E8956A", cards: [] },
  { id: "wc4", title: "Done",        color: "#E8F3FC", dot: "#5AAADE", cards: [] },
];
const INIT_MEETINGS = [];

// Reusable work-page input style
const wi = (extra = {}) => ({
  border: `1.5px solid ${P.lavender}55`, borderRadius: 10, padding: "8px 12px",
  fontFamily: FF_S, fontSize: 13, background: P.lavenderLight,
  color: P.ink, outline: "none", ...extra,
});

const PRIORITY_STYLE = {
  high:   { label: "High",   bg: "#F0B8C822", text: "#D8708A", dot: "#D8708A" },
  medium: { label: "Medium", bg: "#F5E8B022", text: "#C8A830", dot: "#C8A830" },
  low:    { label: "Low",    bg: "#B4E8D822", text: "#5DCAAA", dot: "#5DCAAA" },
};

const WorkTodoList = ({ items, setItems, placeholder = "Add a task…", showDate = false }) => {
  const [input, setInput]     = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate]  = useState("");
  const [filter, setFilter]    = useState("all");
  const PRIORITIES = ["high", "medium", "low"];

  const add = () => {
    if (!input.trim()) return;
    setItems(it => [...it, { id: `t${Date.now()}`, text: input.trim(), done: false, priority, dueDate }]);
    setInput(""); setDueDate("");
  };
  const toggle   = (id) => setItems(it => it.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove   = (id) => setItems(it => it.filter(t => t.id !== id));
  const cyclePri = (id) => setItems(it => it.map(t => t.id === id ? { ...t, priority: PRIORITIES[(PRIORITIES.indexOf(t.priority) + 1) % 3] } : t));

  const visible = filter === "all" ? items : filter === "done" ? items.filter(t => t.done) : items.filter(t => !t.done);
  const byPri = (a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
  const sorted = [...visible].sort((a, b) => a.done !== b.done ? (a.done ? 1 : -1) : byPri(a, b));

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[["all","All"],["active","Active"],["done","Done"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? P.lavender : P.lavenderLight, border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: filter === v ? 600 : 400, color: P.ink }}>
            {l} {v === "all" ? `(${items.length})` : v === "done" ? `(${items.filter(t => t.done).length})` : `(${items.filter(t => !t.done).length})`}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, alignSelf: "center" }}>
          {items.filter(t => t.done).length}/{items.length} done
        </span>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div style={{ height: 4, borderRadius: 4, background: P.lavenderLight, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ height: "100%", width: `${(items.filter(t => t.done).length / items.length) * 100}%`, background: `linear-gradient(90deg, ${P.lavender}, #9B85D8)`, borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
      )}

      {sorted.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 12, marginBottom: 5, background: t.done ? P.lavenderLight + "88" : P.white, border: `1px solid ${P.lavender}44`, transition: "all 0.2s" }}>
          <div onClick={() => toggle(t.id)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: t.done ? P.lavender : "transparent", border: `2px solid ${t.done ? P.lavender : P.inkFaint}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
            {t.done && <span style={{ color: P.ink, fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: FF_S, fontSize: 13.5, color: t.done ? P.inkFaint : P.ink, textDecoration: t.done ? "line-through" : "none", lineHeight: 1.4 }}>{t.text}</span>
            {t.dueDate && <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>📅 {t.dueDate}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span onClick={() => cyclePri(t.id)} title="Click to change priority" style={{ background: PRIORITY_STYLE[t.priority].bg, color: PRIORITY_STYLE[t.priority].text, borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>{PRIORITY_STYLE[t.priority].label}</span>
            <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15, padding: 0 }}>×</button>
          </div>
        </div>
      ))}

      {/* Add row */}
      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={placeholder}
          style={{ ...wi({ flex: 1, minWidth: 160 }) }} />
        {showDate && <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={wi({ width: 130 })} />}
        <div style={{ display: "flex", gap: 4 }}>
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{ background: priority === p ? PRIORITY_STYLE[p].dot : P.lavenderLight, color: priority === p ? "#fff" : P.inkLight, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{PRIORITY_STYLE[p].label}</button>
          ))}
        </div>
        <button onClick={add} style={{ background: P.lavender, color: P.ink, border: "none", borderRadius: 10, padding: "6px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>+</button>
      </div>
    </div>
  );
};

const NOTE_COLORS = [
  { bg: P.lavenderLight, border: P.lavender,  dot: "#9B85D8" },
  { bg: P.mintLight,     border: P.mint,      dot: "#5DCAAA" },
  { bg: P.peachLight,    border: P.peach,     dot: "#E8956A" },
  { bg: P.skyLight,      border: P.sky,       dot: "#5AAADE" },
  { bg: P.butterLight,   border: P.butter,    dot: "#C8A830" },
  { bg: P.roseLight,     border: P.rose,      dot: "#D8708A" },
];

const WorkNotes = ({ notes, setNotes }) => {
  const [active, setActive]         = useState(notes[0]?.id ?? null);
  const [search, setSearch]         = useState("");
  const [creating, setCreating]     = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const textareaRef                 = useRef(null);

  const activeNote = notes.find(n => n.id === active);
  const filtered   = notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()));
  const pinned     = filtered.filter(n => n.pinned);
  const unpinned   = filtered.filter(n => !n.pinned);

  const createNote = () => {
    if (!newTitle.trim()) return;
    const note = { id: `n${Date.now()}`, title: newTitle.trim(), body: "", pinned: false, color: Math.floor(Math.random() * NOTE_COLORS.length), ts: Date.now() };
    setNotes(ns => [note, ...ns]); setActive(note.id); setNewTitle(""); setCreating(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };
  const updateNote = (id, field, val) => setNotes(ns => ns.map(n => n.id === id ? { ...n, [field]: val, ts: Date.now() } : n));
  const deleteNote = (id) => { setNotes(ns => ns.filter(n => n.id !== id)); setActive(notes.find(n => n.id !== id)?.id ?? null); };
  const togglePin  = (id) => setNotes(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const NoteItem = ({ note }) => {
    const c = NOTE_COLORS[note.color];
    return (
      <div onClick={() => setActive(note.id)} style={{ padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: active === note.id ? c.bg : P.white, border: `1.5px solid ${active === note.id ? c.border : P.lavender + "44"}`, cursor: "pointer", transition: "all 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{note.title || "Untitled"}</span>
          <span onClick={e => { e.stopPropagation(); togglePin(note.id); }} style={{ fontSize: 13, cursor: "pointer", marginLeft: 6, opacity: note.pinned ? 1 : 0.3 }}>📌</span>
        </div>
        <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkFaint, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.body || "No content yet"}</div>
        <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 4 }}>{new Date(note.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 20, height: 580 }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: P.inkFaint }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" style={{ ...wi({ paddingLeft: 28, width: "100%", boxSizing: "border-box", fontSize: 12 }) }} />
          </div>
          <button onClick={() => setCreating(true)} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "0 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 18, color: P.ink, fontWeight: 300 }}>+</button>
        </div>
        {creating && (
          <div style={{ display: "flex", gap: 5 }}>
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && createNote()} placeholder="Note title…" style={wi({ flex: 1, fontSize: 12 })} />
            <button onClick={createNote} style={{ background: P.lavender, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: P.ink }}>✓</button>
            <button onClick={() => setCreating(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15 }}>✕</button>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {pinned.length > 0 && <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Pinned</div>}
          {pinned.map(n => <NoteItem key={n.id} note={n} />)}
          {unpinned.length > 0 && pinned.length > 0 && <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, fontWeight: 700, letterSpacing: 1, margin: "10px 0 6px", textTransform: "uppercase" }}>Notes</div>}
          {unpinned.map(n => <NoteItem key={n.id} note={n} />)}
          {filtered.length === 0 && <p style={{ color: P.inkFaint, fontSize: 12, textAlign: "center", marginTop: 20 }}>No notes found</p>}
        </div>
      </div>

      {/* Editor */}
      {activeNote ? (() => {
        const c = NOTE_COLORS[activeNote.color];
        return (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: c.bg, borderRadius: 18, border: `1.5px solid ${c.border}`, padding: "20px 24px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <input value={activeNote.title} onChange={e => updateNote(activeNote.id, "title", e.target.value)} style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: FF_D, fontSize: 22, color: P.ink, fontWeight: 400 }} placeholder="Note title" />
              {/* Color picker */}
              <div style={{ display: "flex", gap: 4 }}>
                {NOTE_COLORS.map((nc, i) => (
                  <div key={i} onClick={() => updateNote(activeNote.id, "color", i)} style={{ width: 14, height: 14, borderRadius: "50%", background: nc.dot, cursor: "pointer", border: activeNote.color === i ? `2px solid ${P.ink}` : "2px solid transparent", transition: "border 0.15s" }} />
                ))}
              </div>
              <span onClick={() => togglePin(activeNote.id)} style={{ fontSize: 15, cursor: "pointer", opacity: activeNote.pinned ? 1 : 0.3 }}>📌</span>
              <button onClick={() => deleteNote(activeNote.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16 }}>🗑</button>
            </div>
            <div style={{ width: "100%", height: 1, background: c.border + "88", marginBottom: 14 }} />
            <textarea ref={textareaRef} value={activeNote.body} onChange={e => updateNote(activeNote.id, "body", e.target.value)} placeholder="Start writing…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: FF_S, fontSize: 14, color: P.ink, resize: "none", lineHeight: 1.75, overflowY: "auto" }} />
            <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 8 }}>
              {activeNote.body.split(/\s+/).filter(Boolean).length} words · edited {new Date(activeNote.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      })() : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: P.inkFaint, background: P.lavenderLight, borderRadius: 18, border: `1.5px dashed ${P.lavender}` }}>
          <span style={{ fontSize: 36 }}>✎</span>
          <p style={{ fontFamily: FF_D, fontSize: 18, margin: 0, color: P.inkLight }}>Select a note to edit</p>
          <button onClick={() => setCreating(true)} style={{ background: P.lavender, border: "none", borderRadius: 12, padding: "8px 20px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, marginTop: 4 }}>+ New note</button>
        </div>
      )}
    </div>
  );
};

const WorkReminders = ({ reminders, setReminders }) => {
  const [adding, setAdding]       = useState(false);
  const [draft, setDraft]         = useState({ text: "", date: "", time: "", priority: "medium" });

  const toggle = (id) => setReminders(rs => rs.map(r => r.id === id ? { ...r, done: !r.done } : r));
  const remove = (id) => setReminders(rs => rs.filter(r => r.id !== id));
  const add    = () => {
    if (!draft.text.trim()) return;
    setReminders(rs => [...rs, { id: `r${Date.now()}`, ...draft, done: false }]);
    setDraft({ text: "", date: "", time: "", priority: "medium" }); setAdding(false);
  };

  const upcoming = reminders.filter(r => !r.done).sort((a, b) => a.date.localeCompare(b.date));
  const done     = reminders.filter(r => r.done);
  const today    = new Date().toISOString().slice(0, 10);
  const isOverdue = (r) => !r.done && r.date && r.date < today;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>{upcoming.length} upcoming · {done.length} done</span>
        <button onClick={() => setAdding(v => !v)} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>+ Reminder</button>
      </div>

      {adding && (
        <div style={{ background: P.lavenderLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1.5px solid ${P.lavender}55` }}>
          <input value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && add()} placeholder="What do you need to remember?" style={{ ...wi({ width: "100%", marginBottom: 8, boxSizing: "border-box" }) }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} style={wi({ flex: 1 })} />
            <input type="time" value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} style={wi({ width: 100 })} />
            {["high","medium","low"].map(p => (
              <button key={p} onClick={() => setDraft(d => ({ ...d, priority: p }))} style={{ background: draft.priority === p ? PRIORITY_STYLE[p].dot : P.lavenderLight, color: draft.priority === p ? "#fff" : P.inkLight, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{PRIORITY_STYLE[p].label}</button>
            ))}
            <button onClick={add} style={{ background: P.lavender, color: P.ink, border: "none", borderRadius: 10, padding: "6px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15 }}>✕</button>
          </div>
        </div>
      )}

      {upcoming.map(r => (
        <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 14, marginBottom: 8, background: isOverdue(r) ? P.roseLight : P.white, border: `1.5px solid ${isOverdue(r) ? P.rose : P.lavender + "44"}`, transition: "all 0.2s" }}>
          <div onClick={() => toggle(r.id)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2, background: "transparent", border: `2px solid ${isOverdue(r) ? "#D8708A" : P.lavender}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FF_S, fontSize: 13.5, color: P.ink, fontWeight: 500 }}>{r.text}</div>
            <div style={{ fontFamily: FF_S, fontSize: 11.5, color: isOverdue(r) ? "#D8708A" : P.inkFaint, marginTop: 3 }}>
              {isOverdue(r) ? "⚠ Overdue · " : "📅 "}{r.date}{r.time ? ` at ${r.time}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ background: PRIORITY_STYLE[r.priority].bg, color: PRIORITY_STYLE[r.priority].text, borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>{PRIORITY_STYLE[r.priority].label}</span>
            <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15, padding: 0 }}>×</button>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 700, letterSpacing: 1, margin: "16px 0 8px", textTransform: "uppercase" }}>Completed</div>
          {done.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", borderRadius: 12, marginBottom: 6, background: P.lavenderLight, opacity: 0.7 }}>
              <div onClick={() => toggle(r.id)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: P.lavender, border: `2px solid ${P.lavender}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ color: P.ink, fontSize: 11, fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, textDecoration: "line-through", flex: 1 }}>{r.text}</span>
              <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14, padding: 0 }}>×</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const WorkTodos = ({ masterTodos, setMasterTodos, dailyTodos, setDailyTodos }) => (
  <div className="nook-work-grid">
    <div style={{ background: P.white, borderRadius: 20, padding: "24px 26px", border: `1.5px solid ${P.lavender}44`, boxShadow: "0 4px 20px rgba(201,184,240,0.08)" }}>
      <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: "0 0 18px", fontWeight: 400 }}>📋 Master List</h3>
      <WorkTodoList items={masterTodos} setItems={setMasterTodos} placeholder="Add to master list…" showDate />
    </div>
    <div style={{ background: P.white, borderRadius: 20, padding: "24px 26px", border: `1.5px solid ${P.lavender}44`, boxShadow: "0 4px 20px rgba(201,184,240,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: 0, fontWeight: 400 }}>☀ Today</h3>
        <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</span>
      </div>
      <WorkTodoList items={dailyTodos} setItems={setDailyTodos} placeholder="Add for today…" />
    </div>
  </div>
);

const WorkFocus = () => (
  <div style={{ background: P.white, borderRadius: 20, padding: "32px 36px", border: `1.5px solid ${P.lavender}44`, maxWidth: 560, boxShadow: "0 4px 20px rgba(201,184,240,0.08)" }}>
    <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: "0 0 24px" }}>Pomodoro-style timer to protect your deep work</p>
    <FocusTimer />
  </div>
);

const WorkflowKanban = ({ cols: init }) => {
  const [cols, setCols]         = useState(init);
  const [dragCard, setDragCard] = useState(null); // { cardId, fromCol }
  const [dragCol, setDragCol]   = useState(null);
  const [addingIn, setAddingIn] = useState(null);
  const [newCard, setNewCard]   = useState({ text: "", tag: "" });
  const [addingCol, setAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [editColId, setEditColId] = useState(null);

  const onCardDragStart = (cardId, fromCol) => setDragCard({ cardId, fromCol });
  const onColDragOver   = (e, colId)        => { e.preventDefault(); setDragCol(colId); };
  const onColDrop       = (e, toColId)      => {
    e.preventDefault();
    if (!dragCard) return;
    const { cardId, fromCol } = dragCard;
    if (fromCol === toColId) { setDragCard(null); setDragCol(null); return; }
    setCols(cs => {
      const card = cs.find(c => c.id === fromCol)?.cards.find(c => c.id === cardId);
      if (!card) return cs;
      return cs.map(c => {
        if (c.id === fromCol) return { ...c, cards: c.cards.filter(x => x.id !== cardId) };
        if (c.id === toColId) return { ...c, cards: [...c.cards, card] };
        return c;
      });
    });
    setDragCard(null); setDragCol(null);
  };

  const addCardTo = (colId) => {
    if (!newCard.text.trim()) return;
    setCols(cs => cs.map(c => c.id === colId ? { ...c, cards: [...c.cards, { id: `w${Date.now()}`, text: newCard.text.trim(), tag: newCard.tag.trim() }] } : c));
    setNewCard({ text: "", tag: "" }); setAddingIn(null);
  };
  const removeCard = (colId, cardId) => setCols(cs => cs.map(c => c.id === colId ? { ...c, cards: c.cards.filter(x => x.id !== cardId) } : c));
  const addCol = () => {
    if (!newColTitle.trim()) return;
    const DOTS = ["#9B85D8","#5DCAAA","#E8956A","#5AAADE","#C8A830","#D8708A"];
    const BG   = [P.lavenderLight, P.mintLight, P.peachLight, P.skyLight, P.butterLight, P.roseLight];
    const i    = cols.length % DOTS.length;
    setCols(cs => [...cs, { id: `wc${Date.now()}`, title: newColTitle.trim(), color: BG[i], dot: DOTS[i], cards: [] }]);
    setNewColTitle(""); setAddingCol(false);
  };
  const removeCol   = (id) => setCols(cs => cs.filter(c => c.id !== id));
  const renameCol   = (id, title) => setCols(cs => cs.map(c => c.id === id ? { ...c, title } : c));

  return (
    <div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
        {cols.map(col => (
          <div key={col.id}
            onDragOver={e => onColDragOver(e, col.id)}
            onDrop={e => onColDrop(e, col.id)}
            style={{ width: 220, flexShrink: 0, background: dragCol === col.id && dragCard?.fromCol !== col.id ? col.color + "dd" : col.color, borderRadius: 18, padding: "14px 14px 10px", border: `1.5px solid ${col.dot}44`, transition: "background 0.15s", minHeight: 140 }}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, flexShrink: 0 }} />
              {editColId === col.id ? (
                <input autoFocus defaultValue={col.title} onBlur={e => { renameCol(col.id, e.target.value); setEditColId(null); }} onKeyDown={e => { if (e.key === "Enter") { renameCol(col.id, e.target.value); setEditColId(null); } }} style={{ flex: 1, background: "none", border: `1px solid ${col.dot}`, borderRadius: 6, padding: "2px 6px", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, outline: "none" }} />
              ) : (
                <span onDoubleClick={() => setEditColId(col.id)} style={{ flex: 1, fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, cursor: "default" }}>{col.title}</span>
              )}
              <span style={{ fontFamily: FF_S, fontSize: 10, background: col.dot + "22", color: col.dot, borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>{col.cards.length}</span>
              <button onClick={() => removeCol(col.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 13, padding: 0, opacity: 0.5 }}>×</button>
            </div>

            {/* Cards */}
            {col.cards.map(card => (
              <div key={card.id} draggable onDragStart={() => onCardDragStart(card.id, col.id)}
                style={{ background: P.white, borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: `1px solid ${col.dot}33`, cursor: "grab", boxShadow: "0 2px 8px rgba(61,53,80,0.07)", opacity: dragCard?.cardId === card.id ? 0.4 : 1, transition: "opacity 0.15s" }}>
                <div style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, lineHeight: 1.4 }}>{card.text}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  {card.tag && <span style={{ background: col.dot + "22", color: col.dot, borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>{card.tag}</span>}
                  <button onClick={() => removeCard(col.id, card.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 13, padding: 0, marginLeft: "auto" }}>×</button>
                </div>
              </div>
            ))}

            {/* Add card */}
            {addingIn === col.id ? (
              <div>
                <input autoFocus value={newCard.text} onChange={e => setNewCard(d => ({ ...d, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && addCardTo(col.id)} placeholder="Card title…"
                  style={{ width: "100%", border: `1.5px solid ${col.dot}66`, borderRadius: 9, padding: "7px 10px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 5 }} />
                <input value={newCard.tag} onChange={e => setNewCard(d => ({ ...d, tag: e.target.value }))} placeholder="Tag (optional)"
                  style={{ width: "100%", border: `1.5px solid ${col.dot}44`, borderRadius: 9, padding: "5px 10px", fontFamily: FF_S, fontSize: 11, background: P.white, color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 7 }} />
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => addCardTo(col.id)} style={{ flex: 1, background: col.dot, color: "#fff", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add</button>
                  <button onClick={() => { setAddingIn(null); setNewCard({ text: "", tag: "" }); }} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, color: P.ink }}>✕</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingIn(col.id)} style={{ width: "100%", background: "none", border: `1.5px dashed ${col.dot}55`, borderRadius: 9, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>+ Add card</button>
            )}
          </div>
        ))}

        {/* Add column */}
        <div style={{ width: 200, flexShrink: 0 }}>
          {addingCol ? (
            <div style={{ background: P.lavenderLight, borderRadius: 18, padding: "14px", border: `1.5px dashed ${P.lavender}` }}>
              <input autoFocus value={newColTitle} onChange={e => setNewColTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addCol()} placeholder="Column name…" style={{ ...wi({ width: "100%", boxSizing: "border-box", marginBottom: 8 }) }} />
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={addCol} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add</button>
                <button onClick={() => setAddingCol(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15 }}>✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingCol(true)} style={{ width: "100%", height: 80, background: P.lavenderLight, border: `1.5px dashed ${P.lavender}`, borderRadius: 18, cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              + Add column
            </button>
          )}
        </div>
      </div>
      <p style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, margin: "8px 0 0", textAlign: "center" }}>Drag cards between columns · Double-click a column name to rename</p>
    </div>
  );
};

const WorkKanban = () => {
  const COLS_INIT = [
    { id: "wc1", title: "Backlog",     color: "#EDE8FB", dot: "#9B85D8", cards: [] },
    { id: "wc2", title: "In Progress", color: "#E4F8F2", dot: "#5DCAAA", cards: [] },
    { id: "wc3", title: "Review",      color: "#FEF0EA", dot: "#E8956A", cards: [] },
    { id: "wc4", title: "Done",        color: "#E8F3FC", dot: "#5AAADE", cards: [] },
  ];
  const [cols, setCols] = useState(COLS_INIT);
  const [dragCard, setDragCard] = useState(null);
  const [dragCol, setDragCol] = useState(null);
  const [addingIn, setAddingIn] = useState(null);
  const [newCard, setNewCard] = useState({ text: "", tag: "" });
  const [addingCol, setAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [editColId, setEditColId] = useState(null);

  const onColDragOver = (e, colId) => { e.preventDefault(); setDragCol(colId); };
  const onColDrop = (e, toColId) => {
    e.preventDefault();
    if (!dragCard) return;
    const { cardId, fromCol } = dragCard;
    if (fromCol === toColId) { setDragCard(null); setDragCol(null); return; }
    setCols(cs => {
      const card = cs.find(c => c.id === fromCol)?.cards.find(c => c.id === cardId);
      if (!card) return cs;
      return cs.map(c => {
        if (c.id === fromCol) return { ...c, cards: c.cards.filter(x => x.id !== cardId) };
        if (c.id === toColId) return { ...c, cards: [...c.cards, card] };
        return c;
      });
    });
    setDragCard(null); setDragCol(null);
  };
  const addCardTo = (colId) => {
    if (!newCard.text.trim()) return;
    setCols(cs => cs.map(c => c.id === colId ? { ...c, cards: [...c.cards, { id: `w${Date.now()}`, text: newCard.text.trim(), tag: newCard.tag.trim() }] } : c));
    setNewCard({ text: "", tag: "" }); setAddingIn(null);
  };
  const removeCard = (colId, cardId) => setCols(cs => cs.map(c => c.id === colId ? { ...c, cards: c.cards.filter(x => x.id !== cardId) } : c));
  const addCol = () => {
    if (!newColTitle.trim()) return;
    const DOTS = ["#9B85D8","#5DCAAA","#E8956A","#5AAADE","#C8A830","#D8708A"];
    const BGS  = ["#EDE8FB","#E4F8F2","#FEF0EA","#E8F3FC","#FDFAE8","#FDE8EF"];
    const i = cols.length % DOTS.length;
    setCols(cs => [...cs, { id: `wc${Date.now()}`, title: newColTitle.trim(), color: BGS[i], dot: DOTS[i], cards: [] }]);
    setNewColTitle(""); setAddingCol(false);
  };
  const removeCol = (id) => setCols(cs => cs.filter(c => c.id !== id));
  const renameCol = (id, title) => setCols(cs => cs.map(c => c.id === id ? { ...c, title } : c));

  return (
    <div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
        {cols.map(col => (
          <div key={col.id} onDragOver={e => onColDragOver(e, col.id)} onDrop={e => onColDrop(e, col.id)}
            style={{ width: 220, flexShrink: 0, background: col.color, borderRadius: 18, padding: "14px 14px 10px", border: `1.5px solid ${col.dot}44`, minHeight: 140 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, flexShrink: 0 }} />
              {editColId === col.id
                ? <input autoFocus defaultValue={col.title} onBlur={e => { renameCol(col.id, e.target.value); setEditColId(null); }} onKeyDown={e => e.key === "Enter" && (renameCol(col.id, e.target.value), setEditColId(null))} style={{ flex: 1, background: "none", border: `1px solid ${col.dot}`, borderRadius: 6, padding: "2px 6px", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, outline: "none" }} />
                : <span onDoubleClick={() => setEditColId(col.id)} style={{ flex: 1, fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{col.title}</span>
              }
              <span style={{ fontFamily: FF_S, fontSize: 10, background: col.dot + "22", color: col.dot, borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>{col.cards.length}</span>
              <button onClick={() => removeCol(col.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: 0 }}>×</button>
            </div>
            {col.cards.map(card => (
              <div key={card.id} draggable onDragStart={() => setDragCard({ cardId: card.id, fromCol: col.id })}
                style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: `1px solid ${col.dot}33`, cursor: "grab", boxShadow: "0 2px 8px rgba(61,53,80,0.07)" }}>
                <div style={{ fontFamily: FF_S, fontSize: 13, color: P.ink }}>{card.text}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  {card.tag && <span style={{ background: col.dot + "22", color: col.dot, borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>{card.tag}</span>}
                  <button onClick={() => removeCard(col.id, card.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: 0, marginLeft: "auto" }}>×</button>
                </div>
              </div>
            ))}
            {addingIn === col.id ? (
              <div>
                <input autoFocus value={newCard.text} onChange={e => setNewCard(d => ({ ...d, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && addCardTo(col.id)} placeholder="Card title…"
                  style={{ width: "100%", border: `1.5px solid ${col.dot}66`, borderRadius: 9, padding: "7px 10px", fontFamily: FF_S, fontSize: 12, background: "#fff", color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 5 }} />
                <input value={newCard.tag} onChange={e => setNewCard(d => ({ ...d, tag: e.target.value }))} placeholder="Tag (optional)"
                  style={{ width: "100%", border: `1.5px solid ${col.dot}44`, borderRadius: 9, padding: "5px 10px", fontFamily: FF_S, fontSize: 11, background: "#fff", color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 7 }} />
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => addCardTo(col.id)} style={{ flex: 1, background: col.dot, color: "#fff", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add</button>
                  <button onClick={() => { setAddingIn(null); setNewCard({ text: "", tag: "" }); }} style={{ background: "#EDE8FB", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, color: P.ink }}>✕</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingIn(col.id)} style={{ width: "100%", background: "none", border: `1.5px dashed ${col.dot}55`, borderRadius: 9, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: "#999" }}>+ Add card</button>
            )}
          </div>
        ))}
        <div style={{ width: 200, flexShrink: 0 }}>
          {addingCol ? (
            <div style={{ background: "#EDE8FB", borderRadius: 18, padding: "14px", border: "1.5px dashed #C9B8F0" }}>
              <input autoFocus value={newColTitle} onChange={e => setNewColTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addCol()} placeholder="Column name…"
                style={{ width: "100%", border: "1.5px solid #C9B8F055", borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: "#EDE8FB", color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={addCol} style={{ flex: 1, background: "#C9B8F0", color: P.ink, border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add</button>
                <button onClick={() => setAddingCol(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 15 }}>✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingCol(true)} style={{ width: "100%", height: 80, background: "#EDE8FB", border: "1.5px dashed #C9B8F0", borderRadius: 18, cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: "#aaa", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              + Add column
            </button>
          )}
        </div>
      </div>
      <p style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, margin: "8px 0 0", textAlign: "center" }}>Drag cards between columns · Double-click a column name to rename</p>
    </div>
  );
};

const FocusTimer = () => {
  const PRESETS = [{ label: "25 min", secs: 1500 }, { label: "50 min", secs: 3000 }, { label: "15 min", secs: 900 }, { label: "5 min break", secs: 300 }];
  const [total, setTotal]     = useState(1500);
  const [left, setLeft]       = useState(1500);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [task, setTask]       = useState("Deep work");
  const intervalRef           = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setLeft(l => { if (l <= 1) { clearInterval(intervalRef.current); setRunning(false); setSessions(s => s + 1); return 0; } return l - 1; });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset  = (secs) => { clearInterval(intervalRef.current); setRunning(false); setTotal(secs); setLeft(secs); };
  const mm     = String(Math.floor(left / 60)).padStart(2, "0");
  const ss     = String(left % 60).padStart(2, "0");
  const pct    = ((total - left) / total) * 100;
  const radius = 70, circ = 2 * Math.PI * radius;

  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Circle timer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={90} cy={90} r={radius} fill="none" stroke={P.lavenderLight} strokeWidth={10} />
            <circle cx={90} cy={90} r={radius} fill="none" stroke={P.lavender} strokeWidth={10}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: FF_D, fontSize: 36, color: P.ink, lineHeight: 1 }}>{mm}:{ss}</span>
            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 4 }}>{running ? "Focusing…" : left === 0 ? "Done! 🎉" : "Paused"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setRunning(r => !r)} style={{ background: P.lavender, border: "none", borderRadius: 12, padding: "10px 24px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink, minWidth: 80 }}>
            {running ? "⏸ Pause" : left === 0 ? "↺ Done" : "▶ Start"}
          </button>
          <button onClick={() => reset(total)} style={{ background: P.lavenderLight, border: `1.5px solid ${P.lavender}55`, borderRadius: 12, padding: "10px 18px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>↺</button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, display: "block", marginBottom: 5 }}>Current task</label>
          <input value={task} onChange={e => setTask(e.target.value)} style={wi({ width: "100%", boxSizing: "border-box", fontSize: 14 })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, display: "block", marginBottom: 8 }}>Presets</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => reset(p.secs)} style={{ background: total === p.secs ? P.lavender : P.lavenderLight, border: `1.5px solid ${total === p.secs ? P.lavender : P.lavender + "44"}`, borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: total === p.secs ? 600 : 400, color: P.ink }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div style={{ background: P.lavenderLight, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginBottom: 6 }}>Today's sessions</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: i < sessions ? P.lavender : P.white, border: `1.5px solid ${P.lavender}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{i < sessions ? "🍅" : ""}</div>
            ))}
          </div>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 6 }}>{sessions} session{sessions !== 1 ? "s" : ""} completed</div>
        </div>
      </div>
    </div>
  );
};

const WorkMeetings = ({ meetings: init }) => {
  const [meetings, setMeetings] = useState(init);
  const [adding, setAdding]     = useState(false);
  const [draft, setDraft]       = useState({ title: "", date: "", time: "", attendees: "", notes: "" });
  const [expandId, setExpandId] = useState(null);

  const toggle  = (id) => setMeetings(ms => ms.map(m => m.id === id ? { ...m, done: !m.done } : m));
  const remove  = (id) => setMeetings(ms => ms.filter(m => m.id !== id));
  const update  = (id, field, val) => setMeetings(ms => ms.map(m => m.id === id ? { ...m, [field]: val } : m));
  const add     = () => { if (!draft.title.trim()) return; setMeetings(ms => [...ms, { id: `me${Date.now()}`, ...draft, done: false }]); setDraft({ title: "", date: "", time: "", attendees: "", notes: "" }); setAdding(false); };
  const today   = new Date().toISOString().slice(0, 10);
  const sorted  = [...meetings].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setAdding(v => !v)} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>+ Meeting</button>
      </div>

      {adding && (
        <div style={{ background: P.lavenderLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1.5px solid ${P.lavender}55` }}>
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Meeting title" style={{ ...wi({ width: "100%", marginBottom: 8, boxSizing: "border-box" }) }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} style={wi({ flex: 1 })} />
            <input type="time" value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} style={wi({ width: 100 })} />
          </div>
          <input value={draft.attendees} onChange={e => setDraft(d => ({ ...d, attendees: e.target.value }))} placeholder="Attendees" style={{ ...wi({ width: "100%", marginBottom: 8, boxSizing: "border-box" }) }} />
          <textarea value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Agenda / notes…" rows={2} style={{ ...wi({ width: "100%", resize: "none", marginBottom: 8, boxSizing: "border-box" }) }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={add} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 10, padding: "7px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15 }}>✕</button>
          </div>
        </div>
      )}

      {sorted.map(m => {
        const isToday = m.date === today;
        const isPast  = m.date < today && !m.done;
        return (
          <div key={m.id} style={{ marginBottom: 10, borderRadius: 14, border: `1.5px solid ${isToday ? P.lavender : P.lavender + "44"}`, background: isToday ? P.lavenderLight : P.white, overflow: "hidden", opacity: m.done ? 0.6 : 1, transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpandId(expandId === m.id ? null : m.id)}>
              <div onClick={e => { e.stopPropagation(); toggle(m.id); }} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: m.done ? P.lavender : "transparent", border: `2px solid ${P.lavender}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.done && <span style={{ fontSize: 11, fontWeight: 700, color: P.ink }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink, textDecoration: m.done ? "line-through" : "none" }}>{m.title}</div>
                <div style={{ fontFamily: FF_S, fontSize: 11.5, color: isPast ? "#D8708A" : P.inkFaint, marginTop: 2 }}>
                  {isPast ? "⚠ Past · " : isToday ? "📅 Today · " : "📅 "}{m.date}{m.time ? ` ${m.time}` : ""}{m.attendees ? ` · ${m.attendees}` : ""}
                </div>
              </div>
              <span style={{ color: P.inkFaint, fontSize: 12 }}>{expandId === m.id ? "▲" : "▼"}</span>
              <button onClick={e => { e.stopPropagation(); remove(m.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14, padding: 0 }}>×</button>
            </div>
            {expandId === m.id && (
              <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${P.lavender}33` }}>
                <textarea value={m.notes} onChange={e => update(m.id, "notes", e.target.value)} placeholder="Agenda / notes…" rows={3}
                  style={{ ...wi({ width: "100%", resize: "none", marginTop: 10, boxSizing: "border-box", fontSize: 13 }) }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const WorkOverview = ({ masterTodos, dailyTodos, reminders, meetings, onGoTo }) => {
  const today        = new Date().toISOString().slice(0, 10);
  const dailyDone    = dailyTodos.filter(t => t.done).length;
  const masterActive = masterTodos.filter(t => !t.done).length;
  const overdueRem   = reminders.filter(r => !r.done && r.date < today).length;
  const todayMtgs    = meetings.filter(m => m.date === today && !m.done);
  const upNextRem    = reminders.filter(r => !r.done && r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const highPri      = masterTodos.filter(t => !t.done && t.priority === "high").slice(0, 3);

  const StatCard = ({ icon, label, value, sub, color, onClick }) => (
    <div onClick={onClick} style={{ background: P.white, borderRadius: 16, padding: "18px 20px", border: `1.5px solid ${color}44`, cursor: "pointer", flex: 1, minWidth: 130, transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: FF_D, fontSize: 28, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.ink, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Stat row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard icon="✓"  label="Daily tasks"    value={`${dailyDone}/${dailyTodos.length}`} sub="done today"          color="#9B85D8" onClick={() => onGoTo("todos")} />
        <StatCard icon="★"  label="Open tasks"     value={masterActive}                        sub="in master list"      color="#5DCAAA" onClick={() => onGoTo("todos")} />
        <StatCard icon="🔔" label="Overdue"         value={overdueRem}                          sub="reminders"           color={overdueRem > 0 ? "#D8708A" : "#5DCAAA"} onClick={() => onGoTo("reminders")} />
        <StatCard icon="📅" label="Meetings today"  value={todayMtgs.length}                    sub={todayMtgs[0]?.time ?? "—"} color="#5AAADE" onClick={() => onGoTo("meetings")} />
      </div>

      <div className="nook-admin-grid2" style={{ marginBottom: 20 }}>
        <div style={{ background: P.white, borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${P.lavender}44` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: 0, fontWeight: 400 }}>High priority</h4>
            <button onClick={() => onGoTo("todos")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>See all →</button>
          </div>
          {highPri.length === 0 ? <p style={{ color: P.inkFaint, fontSize: 13, margin: 0 }}>All clear! 🎉</p> : highPri.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${P.lavender}33` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D8708A", flexShrink: 0 }} />
              <span style={{ fontFamily: FF_S, fontSize: 13, color: P.ink }}>{t.text}</span>
            </div>
          ))}
        </div>

        {/* Upcoming reminders */}
        <div style={{ background: P.white, borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${P.lavender}44` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: 0, fontWeight: 400 }}>Upcoming</h4>
            <button onClick={() => onGoTo("reminders")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>See all →</button>
          </div>
          {upNextRem.length === 0 ? <p style={{ color: P.inkFaint, fontSize: 13, margin: 0 }}>Nothing coming up</p> : upNextRem.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: `1px solid ${P.lavender}33` }}>
              <span style={{ fontSize: 13 }}>🔔</span>
              <div>
                <div style={{ fontFamily: FF_S, fontSize: 13, color: P.ink }}>{r.text}</div>
                <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{r.date}{r.time ? ` · ${r.time}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's meetings */}
      {todayMtgs.length > 0 && (
        <div style={{ marginTop: 20, background: P.lavenderLight, borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${P.lavender}` }}>
          <h4 style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, margin: "0 0 12px", fontWeight: 400 }}>📅 Today's meetings</h4>
          {todayMtgs.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "7px 0" }}>
              <span style={{ fontFamily: FF_S, fontSize: 13, color: "#9B85D8", fontWeight: 600, width: 44 }}>{m.time}</span>
              <span style={{ fontFamily: FF_S, fontSize: 13, color: P.ink }}>{m.title}</span>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{m.attendees}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WorkPage = () => {
  const { user, profile } = useAuth();
  const [section, setSection]       = useState("overview");
  const [masterTodos, setMasterTodos] = useState(INIT_MASTER_TODOS);
  const [dailyTodos, setDailyTodos]   = useState(INIT_DAILY_TODOS);
  const [reminders, setReminders]     = useState(INIT_REMINDERS);
  const [meetings]                    = useState(INIT_MEETINGS);
  const [notes, setNotes]             = useState(INIT_NOTES);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'there';
  const goTo = (s) => setSection(s);
  const active = WORK_SECTIONS.find(s => s.id === section);

  return (
    <div className="nook-sidebar-layout" style={{ background: P.bg, minHeight: "calc(100vh - 61px)" }}>
      {/* Sidebar nav */}
      <div className="nook-sidebar" style={{ background: P.white, borderRight: `1px solid ${P.lavender}22` }}>
        <div className="nook-sidebar-title" style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 14px 6px", paddingLeft: "22px" }}>
          <span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink }}>Work</span>
          <span style={{ fontFamily: FF_S, fontSize: 9, background: P.lavender, color: "#9B85D8", borderRadius: 20, padding: "2px 8px", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Private</span>
        </div>
        <p className="nook-sidebar-footer" style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, margin: "0 0 12px", paddingLeft: 22, lineHeight: 1.5 }}>Only visible to you</p>
        <div className="nook-sidebar-nav-inner" style={{ padding: "0 10px 16px" }}>
          {WORK_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: section === s.id ? P.lavenderLight : "transparent", border: `1.5px solid ${section === s.id ? P.lavender : "transparent"}`, borderRadius: 12, cursor: "pointer", marginBottom: 3, textAlign: "left", transition: "all 0.15s" }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{s.icon}</span>
              <span style={{ fontFamily: FF_S, fontSize: 13.5, fontWeight: section === s.id ? 600 : 400, color: section === s.id ? P.ink : P.inkLight }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="nook-sidebar-content">
        <div className="nook-work-header" style={{ background: P.white, borderBottom: `1px solid ${P.lavender}22`, padding: "18px 32px", display: "flex", alignItems: "baseline", gap: 12, position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20 }}>{active?.icon}</span>
          <h2 style={{ fontFamily: FF_D, fontSize: 22, color: P.ink, margin: 0, fontWeight: 400 }}>
            {section === "overview" ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${displayName.split(" ")[0]}` : active?.label}
          </h2>
          {section === "overview" && <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>}
        </div>
        <div className="nook-page-pad">
          {section === "overview"  && <WorkOverview masterTodos={masterTodos} dailyTodos={dailyTodos} reminders={reminders} meetings={meetings} onGoTo={goTo} />}
          {section === "todos"     && <WorkTodos masterTodos={masterTodos} setMasterTodos={setMasterTodos} dailyTodos={dailyTodos} setDailyTodos={setDailyTodos} />}
          {section === "notes"     && <WorkNotes notes={notes} setNotes={setNotes} />}
          {section === "reminders" && <WorkReminders reminders={reminders} setReminders={setReminders} />}
          {section === "kanban" || section === "workflow" ? <WorkKanban /> : null}
          {section === "focus"     && <WorkFocus />}
          {section === "meetings"  && <WorkMeetings meetings={meetings} />}
        </div>
      </div>
    </div>
  );
};
const WidgetRequestModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ id: `wr${Date.now()}`, name: name.trim(), desc: desc.trim(), user: ME_BASE.handle, ts: Date.now(), status: "new" });
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, padding: "32px 36px", width: "100%", maxWidth: 440, boxShadow: "0 12px 48px rgba(61,53,80,0.2)", animation: "popIn 0.2s ease" }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
            <h3 style={{ fontFamily: FF_D, fontSize: 22, color: P.ink, margin: "0 0 8px", fontWeight: 400 }}>Request sent!</h3>
            <p style={{ fontFamily: FF_S, color: P.inkLight, fontSize: 14, margin: 0 }}>We'll review your idea and get back to you.</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: FF_D, fontSize: 22, color: P.ink, margin: "0 0 6px", fontWeight: 400 }}>Request a widget</h3>
            <p style={{ fontFamily: FF_S, color: P.inkLight, fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>Got an idea for a widget you'd love to see on Nook? Let us know and we'll consider it for a future release.</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginBottom: 5, fontWeight: 600 }}>Widget name *</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spotify now playing, Finance tracker…" style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginBottom: 5, fontWeight: 600 }}>Tell us more <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What would it show? How would you use it?" rows={3} style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={submit} disabled={!name.trim()} style={{ flex: 1, background: name.trim() ? P.lavender : P.lavender + "55", color: P.ink, border: "none", borderRadius: 12, padding: "12px", cursor: name.trim() ? "pointer" : "default", fontFamily: FF_S, fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}>Send request</button>
              <button onClick={onClose} style={{ background: P.lavenderLight, border: "none", borderRadius: 12, padding: "12px 18px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.inkLight }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ADMIN_USERS = [
  { id: "u1", name: "Cleo Hartwell",  handle: "@cleo",  color: P.mint,    status: "active",    joined: "2025-01-14", lastSeen: "today",     widgets: 8,  posts: 12, flagged: false, suspended: false },
  { id: "u2", name: "Soren Vale",     handle: "@soren", color: P.sky,     status: "active",    joined: "2025-02-03", lastSeen: "today",     widgets: 6,  posts: 7,  flagged: false, suspended: false },
  { id: "u3", name: "Iris Nakamura",  handle: "@iris",  color: P.rose,    status: "active",    joined: "2025-02-21", lastSeen: "2 days ago",widgets: 10, posts: 5,  flagged: false, suspended: false },
  { id: "u4", name: "Felix Oduya",    handle: "@felix", color: P.peach,   status: "inactive",  joined: "2025-03-08", lastSeen: "12 days ago",widgets: 3, posts: 1,  flagged: false, suspended: false },
  { id: "u5", name: "Ada Kowalski",   handle: "@ada",   color: P.butter,  status: "active",    joined: "2025-03-15", lastSeen: "today",     widgets: 7,  posts: 9,  flagged: true,  suspended: false },
  { id: "u6", name: "Theo Marsh",     handle: "@theo",  color: P.lavender,status: "inactive",  joined: "2025-04-02", lastSeen: "8 days ago",widgets: 5,  posts: 3,  flagged: false, suspended: false },
  { id: "me", name: "Margot Ellison", handle: "@margot",color: P.lavender,status: "active",    joined: "2025-01-01", lastSeen: "now",       widgets: 12, posts: 14, flagged: false, suspended: false },
];

const DAU_DATA = [
  { day: "Mon", visitors: 84,  signups: 3  },
  { day: "Tue", visitors: 112, signups: 7  },
  { day: "Wed", visitors: 97,  signups: 4  },
  { day: "Thu", visitors: 143, signups: 11 },
  { day: "Fri", visitors: 168, signups: 9  },
  { day: "Sat", visitors: 201, signups: 14 },
  { day: "Sun", visitors: 188, signups: 12 },
];

const WIDGET_POPULARITY = [
  { id: "todo",       title: "To-Do List",      icon: "✓",  count: 7, pct: 100 },
  { id: "reading",    title: "Reading List",     icon: "📖", count: 6, pct: 86 },
  { id: "goals",      title: "Goals",            icon: "★",  count: 6, pct: 86 },
  { id: "mood",       title: "Mood Tracker",     icon: "☀", count: 5, pct: 71 },
  { id: "gallery",    title: "Gallery",          icon: "🖼", count: 5, pct: 71 },
  { id: "blog",       title: "Blog",             icon: "✍", count: 4, pct: 57 },
  { id: "habitstreak",title: "Habit Tracker",    icon: "🔥", count: 4, pct: 57 },
  { id: "bookmarks",  title: "Bookmarks",        icon: "🔖", count: 3, pct: 43 },
  { id: "exercise",   title: "Exercise Log",     icon: "🏃", count: 3, pct: 43 },
  { id: "projects",   title: "Projects",         icon: "🚀", count: 2, pct: 29 },
];

const FLAGGED_CONTENT = [];
const FEEDBACK_SEED = [];
const ANNOUNCEMENTS_SEED = [];

const AdminPage = ({ widgetRequests, setWidgetRequests }) => {
  const { user } = useAuth();
  const {
    users: adminUsers, setUsers: setAdminUsers,
    signupsByDay, loading: adminLoading, error: adminError,
    totalUsers, activeUsers, weekSignups, todayVisitors, todaySignups,
    suspendUser, deleteUser, refresh,
  } = useAdminData();

  const [section, setSection] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_SEED);
  const [newAnn, setNewAnn] = useState({ title: "", body: "" });
  const [annSent, setAnnSent] = useState(false);
  const [wqFilter, setWqFilter] = useState("all");

  const STATUS_CFG = {
    new:        { label: "New",       bg: P.lavenderLight, text: "#9B85D8", dot: "#9B85D8" },
    reviewing:  { label: "Reviewing", bg: "#F5E8B055",     text: "#B8943A", dot: "#B8943A" },
    planned:    { label: "Planned ✓", bg: "#B4E8D855",     text: "#3BAA80", dot: "#3BAA80" },
    declined:   { label: "Declined",  bg: "#F0B8C833",     text: "#D8708A", dot: "#D8708A" },
  };

  const openFlags    = flagged.filter(f => f.status === "open").length;
  const openFeedback = feedback.filter(f => f.status === "open").length;

  const navItems = [
    { id: "overview",      icon: "◈",  label: "Overview"       },
    { id: "analytics",     icon: "↗",  label: "Analytics"      },
    { id: "users",         icon: "⊙",  label: "Users"          },
    { id: "widgets",       icon: "⊞",  label: "Widget Usage"   },
    { id: "requests",      icon: "✦",  label: "Widget Requests", badge: widgetRequests.filter(r => r.status === "new").length },
    { id: "moderation",    icon: "⚑",  label: "Moderation",    badge: openFlags },
    { id: "feedback",      icon: "✉",  label: "Feedback",      badge: openFeedback },
    { id: "announcements", icon: "📢", label: "Announcements"  },
  ];

  const card = (children, extra = {}) => (
    <div style={{ background: P.white, borderRadius: 20, padding: "22px 24px", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${P.lavender}22`, ...extra }}>
      {children}
    </div>
  );

  const sectionHead = (title, sub) => (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>{title}</h2>
      {sub && <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: 0 }}>{sub}</p>}
    </div>
  );

  const StatCard = ({ value, label, sub, color, icon }) => (
    <div style={{ background: P.white, borderRadius: 18, padding: "20px 22px", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1.5px solid ${color}44` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontFamily: FF_D, fontSize: 36, color, lineHeight: 1 }}>{value}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{label}</div>
      {sub && <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  // ── Mini bar chart ──
  const MiniBar = ({ data, valueKey, labelKey, color, height = 80 }) => {
    const max = Math.max(...data.map(d => d[valueKey]));
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", background: color + "33", borderRadius: "4px 4px 0 0", height: Math.max(4, (d[valueKey] / max) * (height - 20)), position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: color, borderRadius: "4px 4px 0 0", height: "100%", opacity: 0.85 }} />
            </div>
            <span style={{ fontFamily: FF_S, fontSize: 9, color: P.inkFaint }}>{d[labelKey]}</span>
          </div>
        ))}
      </div>
    );
  };

  // ── Sections ──────────────────────────────────────────────────────────────

  const OverviewSection = () => (
    <div>
      {sectionHead("Overview", "Platform health at a glance")}
      <div className="nook-admin-grid3" style={{ marginBottom: 24 }}>
        <StatCard value={totalUsers}    label="Total users"         sub={`${activeUsers} not suspended`}          color="#9B85D8" icon="⊙" />
        <StatCard value={todaySignups}  label="Signups today"       sub="New accounts today"                      color="#5DCAAA" icon="↗" />
        <StatCard value={weekSignups}   label="Signups this week"   sub="Last 7 days"                             color="#5AAADE" icon="✦" />
        <StatCard value={activeUsers}   label="Active users"        sub={totalUsers > 0 ? `${Math.round(activeUsers/totalUsers*100)}% of total` : "—"} color="#E8956A" icon="◈" />
        <StatCard value={openFlags}     label="Open flags"          sub="Needs moderation review"                 color="#D8708A" icon="⚑" />
        <StatCard value={openFeedback}  label="Open feedback"       sub={`${feedback.length} total submissions`}  color="#C8A830" icon="✉" />
      </div>

      <div className="nook-admin-grid2">
        {card(
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: FF_D, fontSize: 16, color: P.ink }}>New signups (7d)</span>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{weekSignups} total</span>
            </div>
            <MiniBar data={signupsByDay} valueKey="signups" labelKey="day" color="#9B85D8" height={90} />
          </>
        )}
        {card(
          <>
            <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 14 }}>Recent signups</div>
            {adminLoading ? (
              <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>Loading…</p>
            ) : adminUsers.length === 0 ? (
              <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>No users yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {adminUsers.slice(0, 5).map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <UserAvatar user={{ ...u, color: u.avatar_color }} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{u.name || u.email?.split('@')[0]} <span style={{ color: P.inkFaint, fontWeight: 400 }}>{u.handle}</span></div>
                    </div>
                    <span style={{ background: u.suspended ? "#F0B8C833" : P.lavenderLight, color: u.suspended ? "#D8708A" : "#3BAA80", borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>{u.suspended ? "suspended" : "active"}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const AnalyticsSection = () => (
    <div>
      {sectionHead("Analytics", "Traffic, growth, and engagement metrics")}

      <div className="nook-admin-grid4" style={{ marginBottom: 24 }}>
        <StatCard value={totalUsers}  label="Total accounts"   sub="All registered users"     color="#5DCAAA" icon="⊞" />
        <StatCard value={weekSignups} label="Signups this week" sub="Last 7 days"              color="#5AAADE" icon="↗" />
        <StatCard value={activeUsers} label="Active accounts"  sub="Not suspended"             color="#E8956A" icon="👁" />
      </div>

      <div className="nook-admin-grid2" style={{ marginBottom: 20 }}>
        {card(
          <>
            <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 4 }}>Signups this week</div>
            <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginBottom: 16 }}>New accounts created per day</div>
            <MiniBar data={signupsByDay} valueKey="signups" labelKey="day" color="#9B85D8" height={100} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>Peak: {signupsByDay.length ? Math.max(...signupsByDay.map(d=>d.signups)) : 0} signups in a day</span>
              <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>Total: {weekSignups} this week</span>
            </div>
          </>
        )}
        {card(
          <>
            <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 4 }}>Total users</div>
            <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginBottom: 16 }}>All registered accounts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
              {[
                { label: "Total accounts", value: totalUsers, color: "#9B85D8" },
                { label: "Active (not suspended)", value: activeUsers, color: "#5DCAAA" },
                { label: "Suspended", value: adminUsers.filter(u=>u.suspended).length, color: "#D8708A" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>{s.label}</span>
                  <span style={{ fontFamily: FF_D, fontSize: 20, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 16 }}>User status breakdown</div>
          <div className="nook-admin-grid3">
            {[
              { label: "Active",         value: activeUsers,              color: "#5DCAAA", sub: "Not suspended" },
              { label: "Suspended",      value: adminUsers.filter(u=>u.suspended).length, color: "#D8708A", sub: "Access restricted" },
            ].map(item => (
              <div key={item.label} style={{ background: item.color + "15", borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${item.color}33` }}>
                <div style={{ fontFamily: FF_D, fontSize: 28, color: item.color, lineHeight: 1, marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{item.label}</div>
                <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const UsersSection = () => {
    const filtered = adminUsers
      .filter(u => {
        if (userFilter === "suspended") return u.suspended;
        return true;
      })
      .filter(u => !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.handle?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()));

    return (
      <div>
        {sectionHead("Users", `${totalUsers} total · ${activeUsers} active`)}

        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"],["suspended","Suspended ⊘"]].map(([v,l]) => (
              <button key={v} onClick={() => setUserFilter(v)} style={{ background: userFilter === v ? P.lavender : P.white, border: `1.5px solid ${userFilter === v ? P.lavender : P.lavender + "55"}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.ink, fontWeight: userFilter === v ? 600 : 400, transition: "all 0.15s" }}>{l}</button>
            ))}
          </div>
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: P.inkFaint, pointerEvents: "none" }}>🔍</span>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users…" style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "7px 12px 7px 28px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", width: 180 }} />
          </div>
        </div>

        {adminError && (
          <div style={{ marginBottom: 16, padding: "16px 18px", background: "#F0B8C822", borderRadius: 14, border: "1.5px solid #D8708A44", fontFamily: FF_S, fontSize: 13, color: P.ink, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "#D8708A", marginBottom: 6 }}>⚠ {adminError ? `Query error: ${adminError}` : "No users returned — likely a Supabase RLS policy issue."}</div>
            Run this in <strong>Supabase → SQL Editor</strong>:
            <pre style={{ fontSize: 11, background: "#F5F2FC", padding: "10px 12px", borderRadius: 8, marginTop: 8, overflowX: "auto", color: "#3D3550", lineHeight: 1.6 }}>{`CREATE POLICY "Read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);`}</pre>
          </div>
        )}
        {adminLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 14 }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 14 }}>No users found</div>
        ) : card(
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 120px", gap: 10, padding: "0 4px 10px", borderBottom: `1px solid ${P.lavender}33`, marginBottom: 12 }}>
              {["User","Email","Actions"].map(h => (
                <span key={h} style={{ fontFamily: FF_S, fontSize: 11, fontWeight: 700, color: P.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>
            {filtered.map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 120px", gap: 10, padding: "10px 4px", borderBottom: `1px solid ${P.lavender}11`, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <UserAvatar user={{ ...u, color: u.avatar_color }} size={32} />
                  <div>
                    <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, display: "flex", alignItems: "center", gap: 6 }}>
                      {u.name || u.email?.split('@')[0] || 'Unknown'}
                      {u.suspended && <span style={{ background: "#F0B8C888", color: "#D8708A", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>suspended</span>}
                    </div>
                    <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{u.handle || ''}</div>
                  </div>
                </div>
                <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email || '—'}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => suspendUser(u.id, !u.suspended)} style={{ background: u.suspended ? "#F0B8C888" : P.lavenderLight, border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontFamily: FF_S, fontSize: 10, color: u.suspended ? "#D8708A" : P.inkFaint, fontWeight: 600 }} title={u.suspended ? "Unsuspend" : "Suspend"}>{u.suspended ? "↩ Restore" : "⊘ Suspend"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const WidgetUsageSection = () => (
    <div>
      {sectionHead("Widget Usage", "Which widgets are most popular across all users")}
      {card(
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>{totalUsers} registered users</span>
          </div>
          <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: "0 0 20px", padding: "12px 16px", background: P.lavenderLight, borderRadius: 12 }}>
            Widget usage analytics will populate as users enable widgets on their dashboards.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {INITIAL_WIDGETS.slice(0, 10).map((w, i) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 22, fontFamily: FF_S, fontSize: 12, color: P.inkFaint, textAlign: "right", flexShrink: 0 }}>#{i+1}</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: WIDGET_COLORS[i % WIDGET_COLORS.length].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{w.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{w.title}</span>
                    <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>—</span>
                  </div>
                  <div style={{ background: P.lavenderLight, borderRadius: 20, height: 7, overflow: "hidden" }}>
                    <div style={{ width: `0%`, height: "100%", background: WIDGET_COLORS[i % WIDGET_COLORS.length].dot, borderRadius: 20 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const RequestsSection = () => {
    const statuses = ["all","new","reviewing","planned","declined"];
    const counts = statuses.reduce((acc, s) => { acc[s] = s === "all" ? widgetRequests.length : widgetRequests.filter(r => r.status === s).length; return acc; }, {});
    const filtered = wqFilter === "all" ? widgetRequests : widgetRequests.filter(r => r.status === wqFilter);
    const updateStatus = (id, status) => setWidgetRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    const deleteReq = (id) => setWidgetRequests(rs => rs.filter(r => r.id !== id));

    return (
      <div>
        {sectionHead("Widget Requests", "Feature requests submitted by users")}
        <div className="nook-admin-grid4" style={{ marginBottom: 24 }}>
          {["new","reviewing","planned","declined"].map(s => (
            <div key={s} style={{ background: P.white, border: `1.5px solid ${STATUS_CFG[s].dot}33`, borderRadius: 16, padding: "16px 18px", cursor: "pointer" }} onClick={() => setWqFilter(s)}>
              <div style={{ fontFamily: FF_D, fontSize: 28, color: STATUS_CFG[s].dot, lineHeight: 1 }}>{counts[s]}</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginTop: 4 }}>{STATUS_CFG[s].label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setWqFilter(s)} style={{ background: wqFilter === s ? P.lavender : P.white, border: `1.5px solid ${wqFilter === s ? P.lavender : P.lavender + "55"}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.ink, fontWeight: wqFilter === s ? 600 : 400 }}>
              {s === "all" ? "All" : STATUS_CFG[s].label} ({counts[s]})
            </button>
          ))}
        </div>
        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "48px 0", color: P.inkFaint }}><p style={{ fontSize: 28 }}>📭</p><p style={{ fontFamily: FF_S }}>No requests here.</p></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(r => (
                <div key={r.id} style={{ background: P.white, border: `1.5px solid ${P.lavender}33`, borderRadius: 18, padding: "18px 22px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: FF_D, fontSize: 17, color: P.ink }}>{r.name}</span>
                      <span style={{ background: STATUS_CFG[r.status].bg, color: STATUS_CFG[r.status].text, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>{STATUS_CFG[r.status].label}</span>
                    </div>
                    {r.desc && <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: "0 0 8px", lineHeight: 1.6 }}>{r.desc}</p>}
                    <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>from <span style={{ color: "#9B85D8", fontWeight: 600 }}>{r.user}</span> · {new Date(r.ts).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "6px 10px", fontFamily: FF_S, fontSize: 12, background: P.lavenderLight, color: P.ink, outline: "none", cursor: "pointer" }}>
                      {["new","reviewing","planned","declined"].map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                    </select>
                    <button onClick={() => deleteReq(r.id)} style={{ background: "#F0B8C833", border: "none", borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: "#D8708A" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    );
  };

  const ModerationSection = () => {
    const resolve = (id) => setFlagged(fs => fs.map(f => f.id === id ? { ...f, status: "resolved" } : f));
    const dismiss = (id) => setFlagged(fs => fs.filter(f => f.id !== id));
    return (
      <div>
        {sectionHead("Moderation", `${openFlags} item${openFlags !== 1 ? "s" : ""} need attention`)}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {[["open","Open","#D8708A"],["resolved","Resolved","#5DCAAA"]].map(([s,l,c]) => (
            <div key={s} style={{ background: P.white, borderRadius: 16, padding: "16px 22px", border: `1.5px solid ${c}33`, flex: 1 }}>
              <div style={{ fontFamily: FF_D, fontSize: 28, color: c }}>{flagged.filter(f => f.status === s).length}</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginTop: 4 }}>{l} reports</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {flagged.map(f => (
            <div key={f.id} style={{ background: P.white, borderRadius: 18, padding: "18px 22px", border: `1.5px solid ${f.status === "open" ? "#D8708A44" : P.lavender + "22"}`, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: f.type === "post" ? P.lavenderLight : P.peachLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.type === "post" ? "✍" : "⊙"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{f.title}</span>
                  <span style={{ background: f.type === "post" ? P.lavenderLight : P.peachLight, color: P.inkFaint, borderRadius: 20, padding: "1px 9px", fontFamily: FF_S, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{f.type}</span>
                  <span style={{ background: f.status === "open" ? "#F0B8C833" : "#B4E8D855", color: f.status === "open" ? "#D8708A" : "#3BAA80", borderRadius: 20, padding: "1px 9px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>{f.status}</span>
                </div>
                <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>
                  Reported: <span style={{ fontWeight: 600, color: "#9B85D8" }}>{f.reason}</span> · from {f.user} · {timeAgo(f.ts)}
                </div>
              </div>
              {f.status === "open" && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => resolve(f.id)} style={{ background: "#B4E8D855", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: "#3BAA80", fontWeight: 600 }}>Resolve ✓</button>
                  <button onClick={() => dismiss(f.id)} style={{ background: P.lavenderLight, border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FeedbackSection = () => {
    const TYPES = { bug: { label: "Bug", color: "#D8708A", bg: "#F0B8C833" }, feature: { label: "Feature request", color: "#9B85D8", bg: P.lavenderLight }, feedback: { label: "Feedback", color: "#5DCAAA", bg: "#B4E8D833" } };
    const STATUS = { open: { label: "Open", color: "#D8708A" }, noted: { label: "Noted", color: "#C8A830" }, closed: { label: "Closed", color: "#5DCAAA" } };
    const updateFb = (id, status) => setFeedback(fs => fs.map(f => f.id === id ? { ...f, status } : f));
    return (
      <div>
        {sectionHead("Feedback & Support", `${openFeedback} open · ${feedback.length} total`)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[["open","#D8708A"],["noted","#C8A830"],["closed","#5DCAAA"]].map(([s,c]) => (
            <div key={s} style={{ background: P.white, borderRadius: 16, padding: "16px 18px", border: `1.5px solid ${c}33` }}>
              <div style={{ fontFamily: FF_D, fontSize: 28, color: c }}>{feedback.filter(f=>f.status===s).length}</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, marginTop: 4, textTransform: "capitalize" }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {feedback.map(f => {
            const t = TYPES[f.type]; const st = STATUS[f.status];
            return (
              <div key={f.id} style={{ background: P.white, borderRadius: 18, padding: "18px 22px", border: `1.5px solid ${P.lavender}22`, display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ background: t.bg, color: t.color, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>{t.label}</span>
                    <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{f.subject}</span>
                  </div>
                  <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: "0 0 8px", lineHeight: 1.6 }}>{f.body}</p>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>from <span style={{ color: "#9B85D8", fontWeight: 600 }}>{f.user}</span> · {timeAgo(f.ts)}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <select value={f.status} onChange={e => updateFb(f.id, e.target.value)} style={{ border: `1.5px solid ${st.color}66`, borderRadius: 10, padding: "6px 10px", fontFamily: FF_S, fontSize: 12, background: P.white, color: st.color, outline: "none", cursor: "pointer", fontWeight: 600 }}>
                    {["open","noted","closed"].map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const AnnouncementsSection = () => {
    const sendAnn = () => {
      if (!newAnn.title.trim()) return;
      setAnnouncements(as => [{ id: `an${Date.now()}`, ...newAnn, sent: Date.now(), status: "sent" }, ...as]);
      setNewAnn({ title: "", body: "" });
      setAnnSent(true);
      setTimeout(() => setAnnSent(false), 3000);
    };
    return (
      <div>
        {sectionHead("Announcements", "Push messages to all Nook users")}
        {card(
          <div>
            <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 14 }}>New announcement</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={newAnn.title} onChange={e => setNewAnn(a => ({ ...a, title: e.target.value }))} placeholder="Title" style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_D, fontSize: 16, background: P.lavenderLight, color: P.ink, outline: "none" }} />
              <textarea value={newAnn.body} onChange={e => setNewAnn(a => ({ ...a, body: e.target.value }))} placeholder="Write your announcement…" rows={3} style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", resize: "vertical", lineHeight: 1.7 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={sendAnn} style={{ background: P.lavender, border: "none", borderRadius: 12, padding: "10px 24px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>📢 Send to all users</button>
                {annSent && <span style={{ fontFamily: FF_S, fontSize: 13, color: "#5DCAAA", fontWeight: 600, animation: "fadeUp 0.2s ease" }}>✓ Announcement sent!</span>}
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 700, color: P.inkFaint, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Previous announcements</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.map(a => (
              <div key={a.id} style={{ background: P.white, borderRadius: 18, padding: "18px 22px", border: `1.5px solid ${P.lavender}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: FF_D, fontSize: 16, color: P.ink }}>{a.title}</span>
                  <span style={{ background: P.mintLight, color: "#5DCAAA", borderRadius: 20, padding: "1px 9px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>✓ Sent</span>
                  <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginLeft: "auto" }}>{timeAgo(a.sent)}</span>
                </div>
                {a.body && <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: 0, lineHeight: 1.6 }}>{a.body}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SECTIONS = { overview: OverviewSection, analytics: AnalyticsSection, users: UsersSection, widgets: WidgetUsageSection, requests: RequestsSection, moderation: ModerationSection, feedback: FeedbackSection, announcements: AnnouncementsSection };
  const ActiveSection = SECTIONS[section] || OverviewSection;

  return (
    <div className="nook-sidebar-layout" style={{ background: P.bg, minHeight: "calc(100vh - 61px)" }}>
      {/* Sidebar */}
      <div className="nook-sidebar" style={{ background: P.white, borderRight: `1px solid ${P.lavender}33` }}>
        <div className="nook-sidebar-title" style={{ padding: "20px 16px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 16, borderBottom: `1px solid ${P.lavender}22`, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙</div>
            <span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink }}>Admin</span>
          </div>
        </div>
        <div className="nook-sidebar-nav-inner" style={{ padding: "0 10px 16px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: section === item.id ? P.lavenderLight : "transparent", border: "none", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%", marginBottom: 2 }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center", color: section === item.id ? "#9B85D8" : P.inkFaint }}>{item.icon}</span>
              <span style={{ fontFamily: FF_S, fontSize: 13, color: section === item.id ? P.ink : P.inkLight, fontWeight: section === item.id ? 600 : 400, flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: section === item.id ? "#9B85D8" : P.rose, color: section === item.id ? P.white : P.ink, borderRadius: 20, padding: "1px 7px", fontFamily: FF_S, fontSize: 10, fontWeight: 700 }}>{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="nook-sidebar-content nook-page-pad">
        <ActiveSection />
      </div>
    </div>
  );
};

const FEED_SEED = [];

const MOOD_EMOJIS = { "☀": "Sunny", "🌙": "Reflective", "🌧": "Heavy", "⚡": "Energised", "🌿": "Calm", "🔥": "Motivated", "💫": "Creative", "😴": "Tired" };

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(ts).toLocaleDateString("en-IE", { day: "numeric", month: "short" });
};

const COMMENT_SEED = {};

const FeedCard = ({ item, user, following, toggleFollow, onViewUser }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(Math.floor(Math.random() * 18) + 2);
  const [comments, setComments] = useState(COMMENT_SEED[item.id] || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef();
  const color = WIDGET_COLORS[Math.abs(user.id?.split('').reduce((a,c) => a + c.charCodeAt(0), 0) || 0) % WIDGET_COLORS.length];

  const typeConfig = {
    blog:    { icon: "✍", label: "wrote a post",    accent: P.lavenderLight,  dot: "#9B85D8" },
    photo:   { icon: "📸", label: "shared a photo",  accent: P.skyLight,       dot: "#5AAADE" },
    reading: { icon: "📖", label: "finished a book", accent: P.mintLight,      dot: "#5DCAAA" },
    goal:    { icon: "★",  label: "updated a goal",  accent: P.butterLight,    dot: "#C8A830" },
    mood:    { icon: "☀", label: "checked in",       accent: P.peachLight,     dot: "#E8956A" },
  };
  const cfg = typeConfig[item.type] || typeConfig.blog;
  const isFollowing = following.includes(user.id);

  const submitComment = () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setComments(cs => [...cs, { id: `c${Date.now()}`, uid: "me", text: commentText.trim(), ts: Date.now() }]);
      setCommentText("");
      setSubmitting(false);
    }, 300);
  };

  return (
    <div style={{ background: P.white, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", animation: "fadeUp 0.3s ease", border: `1px solid ${P.lavender}22` }}>
      {/* Card header */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ cursor: "pointer" }} onClick={() => onViewUser?.(user.id)}>
          <UserAvatar user={user} size={40} showStatus />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span onClick={() => onViewUser?.(user.id)} style={{ fontFamily: FF_S, fontWeight: 700, fontSize: 14, color: P.ink, cursor: "pointer" }}>{user.name}</span>
            <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>{user.handle}</span>
            <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>·</span>
            <span style={{ background: cfg.accent, borderRadius: 20, padding: "1px 8px", fontFamily: FF_S, fontSize: 11, color: cfg.dot, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{timeAgo(item.ts)}</span>
        </div>
        <button onClick={() => toggleFollow(user.id)} style={{ background: isFollowing ? P.lavenderLight : P.lavender, border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: 600, color: isFollowing ? P.inkFaint : P.ink, transition: "all 0.2s", flexShrink: 0 }}>
          {isFollowing ? "Following" : "+ Follow"}
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: "0 20px 16px" }}>
        {item.type === "blog" && (
          <div style={{ background: `linear-gradient(135deg, ${P.lavenderLight}, ${P.white})`, borderRadius: 14, padding: "18px 20px", border: `1px solid ${P.lavender}33` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ background: P.lavender, color: "#9B85D8", borderRadius: 20, padding: "2px 9px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>{item.category}</span>
              <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{item.readTime} min read</span>
            </div>
            <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: "0 0 10px", fontWeight: 400, lineHeight: 1.3 }}>{item.title}</h3>
            <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: 0, lineHeight: 1.7 }}>{item.preview}</p>
            <button style={{ marginTop: 12, background: "none", border: "none", fontFamily: FF_S, fontSize: 12, color: "#9B85D8", fontWeight: 600, cursor: "pointer", padding: 0 }}>Read more →</button>
          </div>
        )}
        {item.type === "photo" && (
          <div>
            <div style={{ background: item.color, borderRadius: 14, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 48 }}>📸</div>
            <p style={{ fontFamily: FF_D, fontSize: 14, color: P.ink, margin: "0 0 6px", fontStyle: "italic", lineHeight: 1.5 }}>"{item.caption}"</p>
            {item.tags?.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{item.tags.map(t => <span key={t} style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>#{t}</span>)}</div>}
          </div>
        )}
        {item.type === "reading" && (
          <div style={{ display: "flex", gap: 14, background: P.mintLight, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ width: 48, height: 64, borderRadius: 8, background: P.mint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_D, fontSize: 15, color: P.ink, fontWeight: 400, marginBottom: 2 }}>{item.book}</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginBottom: 6 }}>by {item.author}</div>
              <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 13, color: i <= item.rating ? "#C8A830" : P.lavender }}>★</span>)}</div>
              {item.note && <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>"{item.note}"</p>}
            </div>
          </div>
        )}
        {item.type === "goal" && (
          <div style={{ background: P.butterLight, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{item.goal}</span>
              <span style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 700, color: "#C8A830" }}>{item.progress}%</span>
            </div>
            <div style={{ background: P.butter + "66", borderRadius: 20, height: 8, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${item.progress}%`, height: "100%", background: `linear-gradient(90deg, #C8A830, #F5E8B0)`, borderRadius: 20 }} />
            </div>
            {item.note && <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, margin: 0, lineHeight: 1.6 }}>{item.note}</p>}
          </div>
        )}
        {item.type === "mood" && (
          <div style={{ background: P.peachLight, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 40 }}>{item.mood}</div>
            <div>
              <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, marginBottom: 4 }}>Feeling {item.label}</div>
              {item.note && <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, margin: 0, lineHeight: 1.6 }}>{item.note}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Card footer — likes + comment toggle */}
      <div style={{ padding: "10px 20px 0", borderTop: `1px solid ${P.lavender}22`, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => setLiked(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: liked ? "#D8708A" : P.inkFaint, fontWeight: liked ? 600 : 400, transition: "all 0.15s", padding: "6px 0" }}>
          <span style={{ fontSize: 16, transition: "transform 0.15s", transform: liked ? "scale(1.2)" : "scale(1)" }}>{liked ? "♥" : "♡"}</span>
          {likeCount + (liked ? 1 : 0)}
        </button>
        <button onClick={() => { setShowComments(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: showComments ? "#9B85D8" : P.inkFaint, fontWeight: showComments ? 600 : 400, transition: "all 0.15s", padding: "6px 0" }}>
          <span style={{ fontSize: 15 }}>💬</span>
          {comments.length > 0 ? comments.length : "Comment"}
        </button>
        <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginLeft: "auto" }}>{user.bio}</span>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${P.lavender}11` }}>
          {/* Existing comments */}
          {comments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {comments.map(c => {
                const cu = c.uid === "me" ? ME_BASE : USERS.find(u => u.id === c.uid);
                return (
                  <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, cursor: c.uid !== "me" ? "pointer" : "default" }} onClick={() => c.uid !== "me" && onViewUser?.(c.uid)}>
                      <UserAvatar user={cu} size={28} />
                    </div>
                    <div style={{ flex: 1, background: P.lavenderLight, borderRadius: 12, padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 700, color: P.ink }}>{cu?.name}</span>
                        <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{timeAgo(c.ts)}</span>
                      </div>
                      <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New comment input */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <UserAvatar user={ME_BASE} size={28} />
            <div style={{ flex: 1, display: "flex", gap: 6 }}>
              <input
                ref={inputRef}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && submitComment()}
                placeholder="Write a comment…"
                style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "7px 14px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none" }}
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim() || submitting}
                style={{ background: commentText.trim() ? P.lavender : P.lavenderLight, border: "none", borderRadius: 20, padding: "7px 14px", cursor: commentText.trim() ? "pointer" : "default", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: commentText.trim() ? P.ink : P.inkFaint, transition: "all 0.15s", flexShrink: 0 }}>
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RealFeedCard = ({ item, currentUserId, onLike, onComment, onDelete, onViewUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isOwn = item.user_id === currentUserId;
  const poster = item.profiles;

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    await onComment(commentText.trim());
    setCommentText("");
    setSubmitting(false);
  };

  return (
    <div style={{ background: P.white, borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${P.lavender}22` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div onClick={() => onViewUser?.(poster)} style={{ cursor: "pointer" }}>
          <UserAvatar user={poster} size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{poster?.name}</span>
              <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginLeft: 8 }}>{poster?.handle}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{fmtTime(new Date(item.created_at).getTime())}</span>
              {isOwn && <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: P.inkFaint, padding: "2px 6px", borderRadius: 8 }}>✕</button>}
            </div>
          </div>
          {item.content && <p style={{ fontFamily: FF_S, fontSize: 14, color: P.ink, margin: "8px 0 0", lineHeight: 1.6 }}>{item.content}</p>}
          {item.image_url && <img src={item.image_url} alt="" style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 320, objectFit: "cover" }} />}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, paddingTop: 12, borderTop: `1px solid ${P.lavender}22` }}>
        <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: item.isLiked ? "#D8708A" : P.inkFaint, display: "flex", alignItems: "center", gap: 5, fontWeight: item.isLiked ? 600 : 400 }}>
          {item.isLiked ? "♥" : "♡"} {item.likeCount}
        </button>
        <button onClick={() => setShowComments(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkFaint, display: "flex", alignItems: "center", gap: 5 }}>
          💬 {item.commentCount}
        </button>
      </div>
      {showComments && (
        <div style={{ marginTop: 14 }}>
          {(item.comments || []).map(c => (
            <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <UserAvatar user={c.profiles} size={28} />
              <div style={{ background: P.lavenderLight, borderRadius: 12, padding: "8px 12px", flex: 1 }}>
                <span style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.ink }}>{c.profiles?.name} </span>
                <span style={{ fontFamily: FF_S, fontSize: 13, color: P.ink }}>{c.body}</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment()} placeholder="Write a comment…"
              style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "7px 14px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none" }} />
            <button onClick={submitComment} disabled={!commentText.trim() || submitting}
              style={{ background: commentText.trim() ? P.lavender : P.lavenderLight, border: "none", borderRadius: 20, padding: "7px 16px", cursor: commentText.trim() ? "pointer" : "default", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedPage = ({ onNavigate, onViewUser }) => {
  const { user } = useAuth();
  const {
    posts, loading, error, hasMore,
    createPost, deletePost, toggleLike, addComment, deleteComment,
    toggleFollow, isFollowing, loadMore, refresh,
    feedFilter, setFeedFilter,
  } = useFeed();

  const [search, setSearch] = useState("");
  const [newPostText, setNewPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const filtered = posts.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.profiles?.name?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q)
    );
  });

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    setPosting(true);
    await createPost(newPostText);
    setNewPostText("");
    setShowCompose(false);
    setPosting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: P.bg, padding: "32px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }} className="nook-feed-layout">

        {/* Main feed column */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: FF_D, fontSize: 32, color: P.ink, margin: "0 0 6px", fontWeight: 400 }}>Your Feed</h1>
            <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: 0 }}>What's happening in your community</p>
          </div>

          {/* Compose */}
          <div style={{ background: P.white, borderRadius: 20, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${P.lavender}33` }}>
            {showCompose ? (
              <>
                <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="What's on your mind?" rows={3} autoFocus
                  style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                  <button onClick={() => { setShowCompose(false); setNewPostText(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>Cancel</button>
                  <button onClick={handlePost} disabled={posting || !newPostText.trim()} style={{ background: newPostText.trim() ? P.lavender : P.lavenderLight, border: "none", borderRadius: 12, padding: "8px 20px", cursor: newPostText.trim() ? "pointer" : "default", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </>
            ) : (
              <div onClick={() => setShowCompose(true)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "text" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✦</div>
                <div style={{ flex: 1, border: `1.5px solid ${P.lavender}44`, borderRadius: 20, padding: "9px 16px", fontFamily: FF_S, fontSize: 14, color: P.inkFaint, background: P.lavenderLight }}>Share something with your community…</div>
              </div>
            )}
          </div>

          {/* Filter bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
              {[["all","All"],["following","Following"]].map(([v, label]) => (
                <button key={v} onClick={() => setFeedFilter(v)} style={{ background: feedFilter === v ? P.lavender : P.white, border: `1.5px solid ${feedFilter === v ? P.lavender : P.lavender + "55"}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: feedFilter === v ? 600 : 400, color: P.ink, transition: "all 0.15s" }}>{label}</button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: P.inkFaint, pointerEvents: "none" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search feed…" style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "7px 12px 7px 28px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", width: 160 }} />
            </div>
          </div>

          {/* Feed */}
          {loading && posts.length === 0 ? (
            <div style={{ background: P.white, borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
              <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkFaint }}>Loading feed…</p>
            </div>
          ) : error ? (
            <div style={{ background: P.white, borderRadius: 20, padding: "40px", textAlign: "center" }}>
              <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkFaint }}>Couldn't load feed. <button onClick={refresh} style={{ background: "none", border: "none", color: "#9B85D8", cursor: "pointer", fontFamily: FF_S, fontSize: 14 }}>Try again</button></p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: P.white, borderRadius: 20, padding: "60px 40px", textAlign: "center", boxShadow: "0 2px 16px rgba(61,53,80,0.06)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
              <h3 style={{ fontFamily: FF_D, fontSize: 22, color: P.ink, fontWeight: 400, margin: "0 0 10px" }}>Nothing here yet</h3>
              <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 20px" }}>Be the first to post, or switch to "All" to see everyone.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map(item => (
                <RealFeedCard
                  key={item.id}
                  item={item}
                  currentUserId={user?.id}
                  onLike={() => toggleLike(item.id)}
                  onComment={(body) => addComment(item.id, body)}
                  onDelete={() => deletePost(item.id)}
                  onViewUser={onViewUser}
                />
              ))}
              {hasMore && (
                <button onClick={loadMore} style={{ background: P.white, border: `1.5px solid ${P.lavender}`, borderRadius: 16, padding: "12px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight, fontWeight: 600 }}>
                  Load more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 96 }}>
          <div style={{ background: `linear-gradient(135deg, ${P.lavenderLight}, ${P.white})`, borderRadius: 20, padding: "20px", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${P.lavender}44` }}>
            <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: "0 0 10px" }}>Your Nook</p>
            <p style={{ fontFamily: FF_D, fontSize: 15, color: P.ink, margin: "0 0 14px", lineHeight: 1.4 }}>Share your own updates — keep your widgets fresh!</p>
            <button onClick={() => onNavigate("dashboard")} style={{ width: "100%", background: P.lavender, border: "none", borderRadius: 12, padding: "9px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>Go to my dashboard →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NOTIF_SEED = [];

const NOTIF_ICONS = { follow: "👤", like: "♥", comment: "💬", mention: "✦" };
const NOTIF_COLORS = { follow: P.lavender, like: "#F0B8C8", comment: P.sky, mention: P.butter };

const NotificationsDropdown = ({ notifs, onMarkRead, onMarkAllRead, onNavigate, onClose }) => {
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 340, background: P.white, borderRadius: 20, boxShadow: "0 8px 40px rgba(61,53,80,0.18)", border: `1px solid ${P.lavender}44`, zIndex: 300, overflow: "hidden", animation: "popIn 0.15s ease" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${P.lavender}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FF_D, fontSize: 17, color: P.ink }}>Notifications {unread > 0 && <span style={{ fontFamily: FF_S, fontSize: 12, background: P.rose, borderRadius: 20, padding: "1px 8px", color: P.ink, fontWeight: 700, marginLeft: 4 }}>{unread}</span>}</span>
        {unread > 0 && <button onClick={onMarkAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: "#9B85D8", fontWeight: 600 }}>Mark all read</button>}
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>All caught up ✦</div>
        ) : notifs.map(n => {
          const user = USERS.find(u => u.id === n.uid);
          return (
            <div key={n.id} onClick={() => { onMarkRead(n.id); onClose(); }} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 20px", background: n.read ? "transparent" : P.lavenderLight, cursor: "pointer", borderBottom: `1px solid ${P.lavender}11`, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = P.lavenderLight}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : P.lavenderLight}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <UserAvatar user={user} size={36} />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: NOTIF_COLORS[n.type], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, border: `2px solid ${P.white}` }}>{NOTIF_ICONS[n.type]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, margin: "0 0 2px", lineHeight: 1.4 }}>{n.text}</p>
                <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{timeAgo(n.ts)}</span>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9B85D8", flexShrink: 0, marginTop: 4 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const USER_PROFILE_WIDGETS = {
  u1: [
    { id: "reading", title: "Reading List", icon: "📖", colorIdx: 2, data: { items: [{ id: "r1", title: "Piranesi", author: "Susanna Clarke", status: "read", rating: 5 }, { id: "r2", title: "The Secret History", author: "Donna Tartt", status: "reading", rating: 4 }, { id: "r3", title: "Tomorrow & Tomorrow", author: "Tom Sweterlitsch", status: "want", rating: 0 }] } },
    { id: "goals",   title: "Goals",        icon: "★",  colorIdx: 1, data: { items: [{ id: "g1", text: "Finish illustrated alphabet project", done: false }, { id: "g2", text: "Write 3 zines this year", done: false }, { id: "g3", text: "Learn risograph printing", done: true }] } },
  ],
  u2: [
    { id: "travel",  title: "Travel",       icon: "✈",  colorIdx: 2, data: { trips: [{ id: "t1", place: "Kyoto, Japan", date: "March 2025", note: "Cherry blossoms were breathtaking", emoji: "🌸", photo: null }, { id: "t2", place: "Lisbon, Portugal", date: "October 2024", note: "Best pastéis de nata of my life", emoji: "🇵🇹", photo: null }] } },
    { id: "goals",   title: "Goals",        icon: "★",  colorIdx: 3, data: { items: [{ id: "g1", text: "Shoot one roll of film per week", done: false }, { id: "g2", text: "Solo exhibition by end of year", done: false }] } },
  ],
  u3: [
    { id: "reading", title: "Reading List", icon: "📖", colorIdx: 4, data: { items: [{ id: "r1", title: "Convenience Store Woman", author: "Sayaka Murata", status: "read", rating: 5 }, { id: "r2", title: "The Dispossessed", author: "Ursula K. Le Guin", status: "reading", rating: 0 }] } },
    { id: "hobbies", title: "Hobbies",      icon: "🎨", colorIdx: 0, data: { hobbies: [{ id: "h1", name: "Ceramics", emoji: "🏺", note: "Taking a Tuesday evening class", level: 3 }, { id: "h2", name: "Embroidery", emoji: "🧵", note: "Just starting out!", level: 2 }] } },
  ],
  u4: [
    { id: "hobbies", title: "Hobbies",      icon: "🎨", colorIdx: 2, data: { hobbies: [{ id: "h1", name: "Guitar", emoji: "🎸", note: "15 years and counting", level: 5 }, { id: "h2", name: "Coffee brewing", emoji: "☕", note: "V60 obsessive", level: 4 }] } },
  ],
  u5: [
    { id: "goals",   title: "Goals",        icon: "★",  colorIdx: 1, data: { items: [{ id: "g1", text: "Run a half marathon", done: false }, { id: "g2", text: "Bake every recipe in Tartine", done: false }, { id: "g3", text: "Ship side project v1", done: true }] } },
  ],
  u6: [
    { id: "reading", title: "Reading List", icon: "📖", colorIdx: 5, data: { items: [{ id: "r1", title: "Middlemarch", author: "George Eliot", status: "reading", rating: 0 }, { id: "r2", title: "Ways of Seeing", author: "John Berger", status: "read", rating: 5 }] } },
    { id: "travel",  title: "Travel",       icon: "✈",  colorIdx: 3, data: { trips: [{ id: "t1", place: "Edinburgh, Scotland", date: "August 2024", note: "Fringe Festival was wild", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", photo: null }] } },
  ],
};

const UserProfileModal = ({ user, following, toggleFollow, onClose, onMessage }) => {
  const isFollowing = following.includes(user.id);
  const userWidgets = USER_PROFILE_WIDGETS[user.id] || [];
  const followerCount = Math.floor(Math.random() * 80) + 12;
  const followingCount = Math.floor(Math.random() * 40) + 5;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,24,48,0.6)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.bg, borderRadius: 28, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(30,24,48,0.3)", animation: "popIn 0.2s ease" }}>
        {/* Header strip */}
        <div style={{ height: 6, background: user.color, borderRadius: "28px 28px 0 0" }} />

        {/* Profile header */}
        <div style={{ padding: "28px 32px 20px", background: P.white }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <UserAvatar user={user} size={72} showStatus />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 2px", fontWeight: 400 }}>{user.name}</h2>
              <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: "0 0 8px" }}>{user.handle}</p>
              <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 14px", lineHeight: 1.6 }}>{user.bio}</p>
              <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: FF_D, fontSize: 20, color: P.ink }}>{followerCount}</div>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>followers</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: FF_D, fontSize: 20, color: P.ink }}>{followingCount}</div>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>following</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: FF_D, fontSize: 20, color: P.ink }}>{userWidgets.length}</div>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>public widgets</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleFollow(user.id)} style={{ background: isFollowing ? P.lavenderLight : P.lavender, border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 22px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: isFollowing ? P.inkFaint : P.ink, transition: "all 0.2s" }}>
                  {isFollowing ? "✓ Following" : "+ Follow"}
                </button>
                <button onClick={onMessage} style={{ background: P.white, border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 18px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight, transition: "all 0.2s" }}>
                  ✉ Message
                </button>
                <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 22, color: P.inkFaint, lineHeight: 1 }}>×</button>
              </div>
            </div>
          </div>
        </div>

        {/* Widgets */}
        <div style={{ padding: "24px 32px 32px" }}>
          <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: "0 0 16px", fontWeight: 400 }}>Their Nook</h3>
          {userWidgets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>This user hasn't made any widgets public yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {userWidgets.map(w => (
                <WidgetCard key={w.id} widget={w} isOwnDashboard={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = ({ profilePic, setProfilePic, onLogout }) => {
  const { user, profile, updateProfile } = useAuth();
  const [section, setSection] = useState("account");
  const [name, setName]       = useState(profile?.name || "");
  const [email, setEmail]     = useState(user?.email || "");
  const [handle, setHandle]   = useState(profile?.handle || "");
  const [saved, setSaved]     = useState(false);
  const [accent, setAccent]   = useState("#C9B8F0");
  const [notifPrefs, setNotifPrefs] = useState({ follows: true, likes: true, comments: true, mentions: true, announcements: false });
  const [privPrefs, setPrivPrefs]   = useState({ defaultPublic: false, showOnline: true, allowMessages: true });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const fileRef = useRef();

  const save = async () => {
    try { await updateProfile({ name, handle }); } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const ACCENTS = ["#C9B8F0","#B4E8D8","#F8CEBA","#B8D8F0","#F0B8C8","#F5E8B0","#A8D8A8","#F0D0A8"];

  const navItems = [
    { id: "account",       icon: "⊙", label: "Account"        },
    { id: "appearance",    icon: "◈", label: "Appearance"     },
    { id: "notifications", icon: "🔔", label: "Notifications"  },
    { id: "privacy",       icon: "🔒", label: "Privacy"        },
    { id: "danger",        icon: "⚠", label: "Danger zone"    },
  ];

  const ToggleRow = ({ label, sub, on, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${P.lavender}22` }}>
      <div>
        <div style={{ fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} small />
    </div>
  );

  const inp = { border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div className="nook-settings-layout" style={{ background: P.bg, minHeight: "calc(100vh - 61px)" }}>
      {/* Sidebar */}
      <div className="nook-settings-sidebar" style={{ background: P.white, borderRight: `1px solid ${P.lavender}33`, padding: "28px 16px" }}>
        <div className="nook-settings-title" style={{ padding: "0 8px 20px", borderBottom: `1px solid ${P.lavender}22`, marginBottom: 8 }}>
          <span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink }}>Settings</span>
        </div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: section === item.id ? P.lavenderLight : "transparent", border: "none", borderRadius: 12, padding: "10px 12px", cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s", marginBottom: 2 }}>
            <span style={{ fontSize: 15, width: 20, textAlign: "center", color: section === item.id ? "#9B85D8" : P.inkFaint }}>{item.icon}</span>
            <span style={{ fontFamily: FF_S, fontSize: 13, color: section === item.id ? P.ink : P.inkLight, fontWeight: section === item.id ? 600 : 400 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="nook-settings-content">
        {section === "account" && (
          <div>
            <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>Account</h2>
            <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 32px" }}>Manage your profile and login details</p>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                <UserAvatar user={ME_BASE} size={72} photoPic={profilePic} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(61,53,80,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <span style={{ fontSize: 20 }}>📷</span>
                </div>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setProfilePic(ev.target.result); r.readAsDataURL(f); }} />
              </div>
              <div>
                <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>Profile photo</div>
                <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginTop: 2 }}>Click to upload a new photo</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              {[["Display name", name, setName], ["Handle", handle, setHandle], ["Email", email, setEmail]].map(([label, val, setter]) => (
                <div key={label}>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} style={inp} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</label>
                <input type="password" placeholder="••••••••" style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={save} style={{ background: P.lavender, border: "none", borderRadius: 12, padding: "10px 28px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>Save changes</button>
              {saved && <span style={{ fontFamily: FF_S, fontSize: 13, color: "#5DCAAA", fontWeight: 600, animation: "fadeUp 0.2s ease" }}>✓ Saved!</span>}
            </div>
          </div>
        )}

        {section === "appearance" && (
          <div>
            <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>Appearance</h2>
            <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 32px" }}>Personalise the look of your Nook</p>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Accent colour</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ACCENTS.map(c => (
                  <div key={c} onClick={() => setAccent(c)} style={{ width: 40, height: 40, borderRadius: 12, background: c, cursor: "pointer", border: accent === c ? `3px solid ${P.ink}` : "3px solid transparent", transition: "all 0.15s", boxShadow: accent === c ? "0 2px 12px rgba(61,53,80,0.2)" : "none" }} />
                ))}
              </div>
              <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginTop: 10 }}>Full theme customisation coming soon ✦</p>
            </div>
            <div style={{ background: P.white, borderRadius: 16, padding: "20px 22px", border: `1px solid ${P.lavender}33` }}>
              <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, marginBottom: 4 }}>Dark mode</div>
              <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>Dark mode is on our roadmap — coming in a future update.</div>
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div>
            <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>Notifications</h2>
            <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 32px" }}>Choose what you want to be notified about</p>
            <div style={{ background: P.white, borderRadius: 16, padding: "4px 22px", border: `1px solid ${P.lavender}33` }}>
              <ToggleRow label="New followers" sub="When someone starts following you" on={notifPrefs.follows} onChange={() => setNotifPrefs(p => ({ ...p, follows: !p.follows }))} />
              <ToggleRow label="Likes" sub="When someone likes your content" on={notifPrefs.likes} onChange={() => setNotifPrefs(p => ({ ...p, likes: !p.likes }))} />
              <ToggleRow label="Comments" sub="When someone comments on your widgets" on={notifPrefs.comments} onChange={() => setNotifPrefs(p => ({ ...p, comments: !p.comments }))} />
              <ToggleRow label="Mentions" sub="When you're mentioned in a message or post" on={notifPrefs.mentions} onChange={() => setNotifPrefs(p => ({ ...p, mentions: !p.mentions }))} />
              <ToggleRow label="Announcements" sub="Platform news and updates from Nook" on={notifPrefs.announcements} onChange={() => setNotifPrefs(p => ({ ...p, announcements: !p.announcements }))} />
            </div>
          </div>
        )}

        {section === "privacy" && (
          <div>
            <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>Privacy</h2>
            <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 32px" }}>Control who can see and interact with you</p>
            <div style={{ background: P.white, borderRadius: 16, padding: "4px 22px", border: `1px solid ${P.lavender}33` }}>
              <ToggleRow label="Default widgets to public" sub="New widgets will be public unless you set them private" on={privPrefs.defaultPublic} onChange={() => setPrivPrefs(p => ({ ...p, defaultPublic: !p.defaultPublic }))} />
              <ToggleRow label="Show online status" sub="Let others see when you're active" on={privPrefs.showOnline} onChange={() => setPrivPrefs(p => ({ ...p, showOnline: !p.showOnline }))} />
              <ToggleRow label="Allow direct messages" sub="Let other Nook users message you" on={privPrefs.allowMessages} onChange={() => setPrivPrefs(p => ({ ...p, allowMessages: !p.allowMessages }))} />
            </div>
          </div>
        )}

        {section === "danger" && (
          <div>
            <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>Danger zone</h2>
            <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 32px" }}>Irreversible actions — please be careful</p>
            <div style={{ background: "#FDE8EF", border: `1.5px solid ${P.rose}`, borderRadius: 18, padding: "24px 26px", marginBottom: 16 }}>
              <h3 style={{ fontFamily: FF_S, fontSize: 15, color: "#D8708A", margin: "0 0 6px", fontWeight: 700 }}>Delete account</h3>
              <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: "0 0 16px", lineHeight: 1.6 }}>This will permanently delete your Nook, all your widgets, posts, and data. This cannot be undone.</p>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={`Type "delete my nook" to confirm`} style={{ ...inp, background: P.white, borderColor: P.rose, marginBottom: 12 }} />
              <button disabled={deleteConfirm !== "delete my nook"} onClick={onLogout} style={{ background: deleteConfirm === "delete my nook" ? "#D8708A" : P.rose + "55", border: "none", borderRadius: 12, padding: "10px 22px", cursor: deleteConfirm === "delete my nook" ? "pointer" : "default", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: deleteConfirm === "delete my nook" ? "#fff" : P.inkFaint, transition: "all 0.2s" }}>Delete my Nook</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OnboardingWizard = ({ onComplete, profilePic, setProfilePic }) => {
  const [step, setStep]     = useState(0);
  const [name, setName]     = useState("");
  const [bio, setBio]       = useState("");
  const [chosen, setChosen] = useState([]);
  const fileRef = useRef();

  const SUGGESTED_WIDGETS = [
    { id: "todo",       icon: "✓",  label: "To-Do List",    desc: "Track daily tasks"       },
    { id: "goals",      icon: "★",  label: "Goals",         desc: "Your big ambitions"      },
    { id: "reading",    icon: "📖", label: "Reading List",   desc: "Books you love"          },
    { id: "mood",       icon: "☀", label: "Mood Tracker",   desc: "Check in daily"          },
    { id: "habitstreak",icon: "🔥", label: "Habit Tracker",  desc: "Build streaks"           },
    { id: "gallery",    icon: "🖼", label: "Gallery",        desc: "Share your photos"       },
    { id: "blog",       icon: "✍", label: "Blog",           desc: "Write & publish"         },
    { id: "projects",   icon: "🚀", label: "Projects",       desc: "Showcase your work"      },
    { id: "travel",     icon: "✈", label: "Travel",         desc: "Log your adventures"     },
    { id: "bookmarks",  icon: "🔖", label: "Bookmarks",      desc: "Quick-launch links"      },
  ];

  const STEPS = [
    { title: "Welcome to Nook ✦", sub: "Let's set up your personal corner of the internet. This takes about a minute." },
    { title: "Tell us a bit about you", sub: "This appears on your public profile." },
    { title: "Pick your widgets", sub: "Choose what you want on your dashboard. You can always change these later." },
    { title: "You're all set! 🌿", sub: "Your Nook is ready. Let's go." },
  ];

  const toggle = (id) => setChosen(cs => cs.includes(id) ? cs.filter(c => c !== id) : [...cs, id]);
  const next = () => step < 3 ? setStep(s => s + 1) : onComplete(name, bio, chosen);

  const progressPct = (step / 3) * 100;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,24,48,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: P.white, borderRadius: 28, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(30,24,48,0.3)", overflow: "hidden", animation: "popIn 0.2s ease" }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: P.lavenderLight }}>
          <div style={{ height: "100%", background: P.lavender, width: `${progressPct}%`, transition: "width 0.4s ease", borderRadius: "0 4px 4px 0" }} />
        </div>

        <div style={{ padding: "36px 40px 32px" }}>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Step {step + 1} of 4</div>
          <h2 style={{ fontFamily: FF_D, fontSize: 28, color: P.ink, margin: "0 0 8px", fontWeight: 400 }}>{STEPS[step].title}</h2>
          <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 28px", lineHeight: 1.6 }}>{STEPS[step].sub}</p>

          {step === 0 && (
            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✦</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[["Track everything", "📋"], ["Share what you want", "👁"], ["Connect with others", "🌿"]].map(([l, e]) => (
                  <div key={l} style={{ background: P.lavenderLight, borderRadius: 14, padding: "14px 10px" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{e}</div>
                    <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 4 }}>
                <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: P.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `2px dashed ${P.lavender}` }}>
                    {profilePic ? <img src={profilePic} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ fontSize: 28 }}>📷</span>}
                  </div>
                  <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setProfilePic(ev.target.result); r.readAsDataURL(f); }} />
                </div>
                <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>Click to upload a profile photo <span style={{ color: P.inkFaint }}>(optional)</span></div>
              </div>
              {[["Your name", name, setName, "Margot Ellison"], ["A short bio", bio, setBio, "Designer & dreamer 🌿"]].map(([label, val, setter, ph]) => (
                <div key={label}>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontWeight: 600, marginBottom: 6 }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "10px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxHeight: 320, overflowY: "auto" }}>
              {SUGGESTED_WIDGETS.map(w => {
                const on = chosen.includes(w.id);
                return (
                  <div key={w.id} onClick={() => toggle(w.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: on ? P.lavenderLight : P.bg, border: `1.5px solid ${on ? P.lavender : P.lavender + "44"}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 22 }}>{w.icon}</span>
                    <div>
                      <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{w.label}</div>
                      <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{w.desc}</div>
                    </div>
                    {on && <span style={{ marginLeft: "auto", color: "#9B85D8", fontSize: 14 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
              <p style={{ fontFamily: FF_S, fontSize: 14, color: P.inkLight, margin: "0 0 8px", lineHeight: 1.7 }}>
                {name ? `Welcome, ${name.split(" ")[0]}!` : "Welcome!"} Your dashboard has{" "}
                {chosen.length > 0 ? `${chosen.length} widget${chosen.length !== 1 ? "s" : ""} ready to go.` : "been set up."}
              </p>
              <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: 0 }}>Head to Customise anytime to add more widgets.</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            {step > 0
              ? <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>← Back</button>
              : <div />
            }
            <button onClick={next} style={{ background: P.lavender, border: "none", borderRadius: 14, padding: "11px 32px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink, boxShadow: `0 4px 16px ${P.lavender}80` }}>
              {step === 3 ? "Go to my Nook →" : step === 2 ? (chosen.length > 0 ? `Add ${chosen.length} widget${chosen.length !== 1 ? "s" : ""} →` : "Skip →") : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePageNew = ({ onNavigate, profilePic }) => {
  const demoWidgets = INITIAL_WIDGETS.filter(w => w.enabled && w.isPublic).slice(0, 3);
  const FEATURES = [
    { icon: "⊞", title: "20+ widgets", desc: "From reading lists to mood trackers, goals, blog, gallery, bookmarks and more — all in one place." },
    { icon: "👁", title: "Share selectively", desc: "Every widget is independently public or private. Show off what you want, keep the rest for yourself." },
    { icon: "✦", title: "Follow people", desc: "See updates from the people you follow in a beautiful, personalised feed." },
    { icon: "🔒", title: "Built-in workspace", desc: "A private Work section with to-dos, notes, reminders, focus timer, and meeting notes." },
    { icon: "✍", title: "Write & publish", desc: "A built-in blog for essays, fiction, notes — anything you want to put into words." },
    { icon: "🌿", title: "Quietly yours", desc: "No algorithm, no ads. Just a calm, personal space that works the way you think." },
  ];
  return (
    <div style={{ background: P.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "90px 32px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: P.lavenderLight, border: `1px solid ${P.lavender}`, borderRadius: 20, padding: "6px 18px", marginBottom: 28, fontFamily: FF_S, fontSize: 13, color: "#9B85D8" }}>✦ Your personal corner of the internet</div>
        <h1 style={{ fontFamily: FF_D, fontSize: "clamp(40px, 6vw, 68px)", color: P.ink, lineHeight: 1.15, margin: "0 0 24px", fontWeight: 400 }}>
          A dashboard that's<br /><em style={{ color: "#9B85D8" }}>beautifully yours</em>
        </h1>
        <p style={{ fontSize: 17, color: P.inkLight, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7, fontFamily: FF_S }}>
          Nook gives you a personal space to track your goals, to-dos, reading list, and more — showcase your projects, share what you want, keep the rest private.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => onNavigate("signup")} style={{ background: P.lavender, border: "none", borderRadius: 14, padding: "14px 36px", cursor: "pointer", fontSize: 16, fontWeight: 600, color: P.ink, boxShadow: `0 4px 20px ${P.lavender}80`, fontFamily: FF_S }}>Get your Nook →</button>
          <button onClick={() => onNavigate("login")} style={{ background: "transparent", border: `1.5px solid ${P.lavender}`, borderRadius: 14, padding: "14px 28px", cursor: "pointer", fontSize: 16, color: P.inkLight, fontFamily: FF_S }}>Sign in</button>
        </div>
        <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, marginTop: 14 }}>Free to use · No credit card needed</p>
      </div>

      {/* Demo profile */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px) 60px" }}>
        <div style={{ background: P.white, borderRadius: 24, padding: "28px 32px", border: `1.5px solid ${P.lavender}55`, boxShadow: "0 8px 40px rgba(201,184,240,0.2)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <UserAvatar user={ME_BASE} size={60} photoPic={profilePic} />
            <div>
              <h2 style={{ fontFamily: FF_D, fontSize: 24, margin: "0 0 2px", color: P.ink, fontWeight: 400 }}>{ME_BASE.name}</h2>
              <p style={{ margin: "0 0 8px", color: P.inkLight, fontSize: 13, fontFamily: FF_S }}>{ME_BASE.handle}</p>
              <p style={{ margin: 0, color: P.inkLight, fontSize: 14, lineHeight: 1.6, fontFamily: FF_S }}>Designer & dreamer 🌿 Collecting good books, quiet mornings, and ambitious to-do lists.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {demoWidgets.map(w => <WidgetCard key={w.id} widget={w} isOwnDashboard={false} />)}
        </div>
        <p style={{ textAlign: "center", color: P.inkLight, fontSize: 13, marginTop: 20, fontFamily: FF_S }}>
          👆 This is what a public Nook looks like.{" "}
          <span style={{ color: "#9B85D8", cursor: "pointer", fontWeight: 600 }} onClick={() => onNavigate("signup")}>Create yours →</span>
        </p>
      </div>

      {/* Features grid */}
      <div style={{ background: P.white, padding: "72px 32px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: FF_D, fontSize: 38, color: P.ink, margin: "0 0 12px", fontWeight: 400 }}>Everything you need,<br /><em style={{ color: "#9B85D8" }}>nothing you don't</em></h2>
          </div>
          <div className="nook-home-features">
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: "24px 20px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: P.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: "0 0 8px", fontWeight: 400 }}>{f.title}</h3>
                <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, margin: 0, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community strip */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "72px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontFamily: FF_D, fontSize: 32, color: P.ink, margin: "0 0 10px", fontWeight: 400 }}>Your space, your way</h2>
          <p style={{ fontFamily: FF_S, fontSize: 15, color: P.inkLight, margin: 0 }}>Everything in one calm, personal dashboard.</p>
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
          {[
            { initials: "A", color: P.lavender, name: "Reading & Goals" },
            { initials: "B", color: P.mint,     name: "Travel & Hobbies" },
            { initials: "C", color: P.peach,    name: "Mood & Habits" },
            { initials: "D", color: P.sky,      name: "Projects & Blog" },
            { initials: "E", color: P.rose,     name: "Feed & Messages" },
            { initials: "F", color: P.butter,   name: "Work & Notes" },
          ].map(u => (
            <div key={u.initials} style={{ background: P.white, borderRadius: 18, padding: "18px 20px", width: 160, border: `1.5px solid ${P.lavender}33`, boxShadow: "0 2px 12px rgba(201,184,240,0.1)", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_D, fontSize: 16, color: P.ink, margin: "0 auto 10px" }}>{u.initials}</div>
              <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>{u.name}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="nook-home-testimonials" style={{ marginBottom: 48 }}>
          {[
            { initials: "S", color: P.lavender, name: "Sarah M.",    handle: "@sarah",  quote: "Nook replaced about five different apps for me. It's the first personal dashboard I've actually kept up with." },
            { initials: "J", color: P.mint,     name: "James K.",    handle: "@james",  quote: "I love how I can share my reading list and travel widget publicly without exposing everything. The control is just right." },
            { initials: "L", color: P.peach,    name: "Laura P.",    handle: "@laura",  quote: "The blog widget finally gave me a place to write that doesn't feel like shouting into a void. It's calm and mine." },
          ].map(({ initials, color, name, handle, quote }) => (
            <div key={handle} style={{ background: P.white, borderRadius: 18, padding: "22px", border: `1px solid ${P.lavender}33` }}>
              <p style={{ fontFamily: FF_D, fontSize: 14, color: P.ink, margin: "0 0 16px", lineHeight: 1.7, fontStyle: "italic" }}>"{quote}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_D, fontSize: 12, color: P.ink, flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{name}</div>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{handle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={() => onNavigate("signup")} style={{ background: P.lavender, border: "none", borderRadius: 14, padding: "15px 44px", cursor: "pointer", fontSize: 16, fontWeight: 600, color: P.ink, boxShadow: `0 4px 20px ${P.lavender}80`, fontFamily: FF_S }}>Start your Nook — it's free</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${P.lavender}33`, padding: "28px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
          <span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink }}>Nook</span>
        </div>
        <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: 0 }}>Your personal corner of the internet · Made with ♡</p>
      </div>
    </div>
  );
};

export default function App() {
  const { user, profile, loading: authLoading, profileLoading, signIn, signUp, signOut } = useAuth();
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem("nook_page") || "home"; } catch { return "home"; }
  });
  const [convos, setConvos] = useState(INITIAL_CONVOS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [profilePic, setProfilePic] = useState(null);
  const [following, setFollowing] = useState([]);
  const [notifications, setNotifications] = useState(NOTIF_SEED);
  const [showNotifs, setShowNotifs] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [widgetRequests, setWidgetRequests] = useState([
    { id: "wr1", name: "Spotify now playing", desc: "Show my current or recently played Spotify track on my profile.", user: "@cleo", ts: Date.now() - 86400000 * 3, status: "reviewing" },
    { id: "wr2", name: "Finance tracker", desc: "Simple budget widget — income vs expenses for the month.", user: "@soren", ts: Date.now() - 86400000 * 7, status: "new" },
    { id: "wr3", name: "Recipe box", desc: "A place to save and share my favourite recipes.", user: "@iris", ts: Date.now() - 86400000 * 1, status: "new" },
  ]);

  // Ensure mobile viewport is set
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  }, []);

  // Persist key state in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nook_state");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.following) setFollowing(s.following);
        if (s.profilePic) setProfilePic(s.profilePic);
        if (s.hasOnboarded) setHasOnboarded(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("nook_state", JSON.stringify({ following, profilePic, hasOnboarded })); } catch {}
  }, [following, profilePic, hasOnboarded]);

  useEffect(() => {
    try { sessionStorage.setItem("nook_page", page); } catch {}
  }, [page]);

  const toggleFollow = (uid) => {
    const isNowFollowing = !following.includes(uid);
    setFollowing(fs => isNowFollowing ? [...fs, uid] : fs.filter(id => id !== uid));
    if (isNowFollowing) {
      const user = USERS.find(u => u.id === uid);
      if (user) {
        const notif = { id: `n${Date.now()}`, type: "follow", uid: "me", ts: Date.now(), read: false, text: `You are now following ${user.name}` };
        setNotifications(ns => [notif, ...ns]);
      }
    }
  };

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const totalUnread = convos.reduce((a, c) => a + c.messages.filter(m => m.from !== "me" && !m.read).length, 0);
  const isLoggedIn = !!user;
  const ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID;
  const isAdmin = !!user && !!ADMIN_ID && user.id === ADMIN_ID;

  const navigate = (p) => {
    // Guard: redirect to login if not authenticated and trying to access protected pages
    const publicPages = ["home", "login", "signup"];
    if (!user && !publicPages.includes(p)) { setPage("login"); return; }
    setPage(p);
    setShowNotifs(false);
  };

  const logout = async () => {
    await signOut();
    try { sessionStorage.removeItem("nook_page"); } catch {}
    setPage("home");
    setHasOnboarded(false);
  };

  const [pendingEmail, setPendingEmail] = useState(null);

  const handleLogin = async ({ email, password }) => {
    try { sessionStorage.removeItem("nook_pending_email"); } catch {}
    const { error } = await signIn({ email, password });
    if (!error) navigate("dashboard");
    return { error };
  };

  const [justSignedUp, setJustSignedUp] = useState(false);

  const handleSignup = async ({ email, password, name }) => {
    const { error } = await signUp({ email, password, name });
    if (!error) {
      setJustSignedUp(true);
      setPendingEmail(email);
    }
    return { error };
  };
  const [initialWidgets, setInitialWidgets] = useState(null);

  const completeOnboarding = async (name, bio, chosenIds) => {
    try {
      const { supabase } = await import('./lib/supabase');
      if (user && (name || bio)) {
        await supabase.from('profiles').update({ name, bio }).eq('id', user.id);
      }
    } catch {}
    // Mark this specific user as onboarded in localStorage
    try { localStorage.setItem(`nook_onboarded_${user?.id}`, "1"); } catch {}
    const widgets = INITIAL_WIDGETS.map(w => ({
      ...w,
      enabled: chosenIds.includes(w.id),
      isPublic: chosenIds.includes(w.id),
    }));
    setInitialWidgets(widgets);
    setHasOnboarded(true);
    setShowOnboarding(false);
    setPage("dashboard");
  };

  const openUserProfile = (uid) => { const u = USERS.find(u => u.id === uid); if (u) setViewingUser(u); };

  // Redirect unauthenticated users away from protected pages
  // Only trigger onboarding for brand new signups
  useEffect(() => {
    if (justSignedUp && user) {
      setJustSignedUp(false);
      setShowOnboarding(true);
    }
  }, [justSignedUp, user]);

  const protectedPages = ["dashboard","customize","messages","feed","work","admin","settings"];
  useEffect(() => {
    if (authLoading) return;
    if (showOnboarding) return;
    if (!user && protectedPages.includes(page)) { setPage("login"); return; }
    if (user && ["login","signup","home"].includes(page)) {
      setPage("dashboard"); return;
    }
    if (page === "admin" && !isAdmin) { setPage("dashboard"); }
  }, [user, authLoading, page, showOnboarding, isAdmin]);

  // Show nothing while Supabase checks session — prevents flash of login page
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#F5F2FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#C9B8F0" }}>✦ Nook</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${P.lavender}; border-radius: 4px; }

        /* ── Responsive layout helpers ── */
        .nook-nav-links { display: flex; gap: 6px; align-items: center; }
        .nook-nav-mobile-menu { display: none; }
        .nook-mobile-menu-open { display: flex; }

        .nook-sidebar-layout { display: flex; }
        .nook-sidebar { width: 220px; flex-shrink: 0; }
        .nook-sidebar-content { flex: 1; min-width: 0; overflow-y: auto; }

        .nook-msg-layout { display: flex; height: calc(100vh - 61px); overflow: hidden; }
        .nook-msg-sidebar { width: 310px; flex-shrink: 0; }
        .nook-msg-main { flex: 1; min-width: 0; }
        .nook-msg-back { display: none; }

        .nook-feed-layout { display: grid; grid-template-columns: 1fr 300px; gap: 32px; }
        .nook-feed-sidebar { display: block; }

        .nook-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .nook-work-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .nook-admin-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .nook-admin-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .nook-admin-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .nook-home-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .nook-home-users { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .nook-home-testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .nook-settings-layout { display: flex; }
        .nook-settings-sidebar { width: 220px; flex-shrink: 0; }
        .nook-settings-content { flex: 1; padding: 40px 48px; max-width: 640px; }

        .nook-page-pad { padding: 36px 40px; }
        .nook-hero-pad { padding: 90px 32px 60px; }
        .nook-section-pad { padding: 72px 32px; }
        .nook-card-pad { padding: 28px 32px; }

        /* ── Tablet (≤ 900px) ── */
        @media (max-width: 900px) {
          .nook-feed-layout { grid-template-columns: 1fr; }
          .nook-feed-sidebar { display: none; }
          .nook-home-features { grid-template-columns: repeat(2, 1fr); }
          .nook-home-testimonials { grid-template-columns: 1fr 1fr; }
          .nook-admin-grid3 { grid-template-columns: 1fr 1fr; }
          .nook-admin-grid4 { grid-template-columns: 1fr 1fr; }
          .nook-settings-content { padding: 32px 28px; }
          .nook-hero-pad { padding: 60px 24px 40px; }
          .nook-section-pad { padding: 48px 24px; }
        }

        /* ── Mobile (≤ 640px) ── */
        @media (max-width: 640px) {
          /* Nav */
          .nook-nav-links { display: none; }
          .nook-nav-mobile-menu { display: flex; align-items: center; gap: 8px; }

          /* Sidebar layouts → stack vertically */
          .nook-sidebar-layout { flex-direction: column; }
          .nook-sidebar {
            width: 100% !important;
            height: auto !important;
            position: relative !important;
            top: auto !important;
            border-right: none !important;
            border-bottom: 1px solid ${P.lavender}33;
            flex-shrink: unset;
            overflow: visible;
          }
          .nook-sidebar-nav-inner { display: flex; flex-wrap: nowrap; overflow-x: auto; padding: 8px 12px; gap: 6px; }
          .nook-sidebar-nav-inner button { flex-shrink: 0; }
          .nook-sidebar-title { padding: 14px 16px 0 !important; }
          .nook-sidebar-footer { display: none; }

          /* Messages */
          .nook-msg-layout { flex-direction: column; }
          .nook-msg-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid ${P.lavender}33; }
          .nook-msg-sidebar.nook-msg-hidden { display: none; }
          .nook-msg-main.nook-msg-hidden { display: none; }
          .nook-msg-back { display: flex !important; }

          /* Grids → single column */
          .nook-dash-grid { grid-template-columns: 1fr !important; }
          .nook-work-grid { grid-template-columns: 1fr !important; }
          .nook-admin-grid2 { grid-template-columns: 1fr !important; }
          .nook-admin-grid3 { grid-template-columns: 1fr !important; }
          .nook-admin-grid4 { grid-template-columns: 1fr 1fr !important; }
          .nook-home-features { grid-template-columns: 1fr !important; }
          .nook-home-users { gap: 10px; }
          .nook-home-testimonials { grid-template-columns: 1fr !important; }

          /* Settings */
          .nook-settings-layout { flex-direction: column; }
          .nook-settings-sidebar {
            width: 100% !important;
            height: auto !important;
            position: relative !important;
            border-right: none !important;
            border-bottom: 1px solid ${P.lavender}33;
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding: 8px 12px;
            gap: 4px;
          }
          .nook-settings-sidebar button { flex-shrink: 0; }
          .nook-settings-sidebar .nook-settings-title { display: none; }
          .nook-settings-content { padding: 24px 18px; }

          /* Padding reductions */
          .nook-page-pad { padding: 20px 16px !important; }
          .nook-hero-pad { padding: 48px 18px 32px !important; }
          .nook-section-pad { padding: 36px 18px !important; }
          .nook-card-pad { padding: 18px 18px !important; }

          /* Feed layout */
          .nook-feed-layout { grid-template-columns: 1fr; gap: 16px; padding: 0 16px; }

          /* Kanban → scroll horizontally */
          .nook-kanban-cols { overflow-x: auto !important; }

          /* Admin table → hide less important cols */
          .nook-admin-col-hide { display: none !important; }

          /* Work section header */
          .nook-work-header { padding: 14px 18px !important; }
        }
      `}</style>

      <Nav page={page} onNavigate={navigate} onLogout={logout} unreadCount={totalUnread} isLoggedIn={isLoggedIn} isAdmin={isAdmin} me={profile || ME_BASE} profilePic={profilePic} following={following}
        unreadNotifs={unreadNotifs} showNotifs={showNotifs} setShowNotifs={setShowNotifs}
        notifications={notifications}
        onMarkRead={(id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))}
        onMarkAllRead={() => setNotifications(ns => ns.map(n => ({ ...n, read: true })))}
      />

      {page === "home"    && <HomePageNew onNavigate={navigate} profilePic={profilePic} />}
      {page === "login"   && !user && <AuthPage mode="login"  onSwitch={() => navigate("signup")} onEnter={handleLogin} />}
      {page === "signup"  && !user && !pendingEmail && <AuthPage mode="signup" onSwitch={() => navigate("login")}  onEnter={handleSignup} />}
      {pendingEmail && !user && (
        <div style={{ minHeight: "calc(100vh - 61px)", background: P.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: P.white, borderRadius: 28, padding: "48px 44px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(61,53,80,0.10)", border: `1.5px solid ${P.lavender}44` }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✉️</div>
            <h2 style={{ fontFamily: FF_D, fontSize: 26, color: P.ink, margin: "0 0 12px", fontWeight: 400 }}>Check your email</h2>
            <p style={{ fontFamily: FF_S, fontSize: 15, color: P.inkLight, lineHeight: 1.6, margin: "0 0 8px" }}>
              We sent a confirmation link to
            </p>
            <p style={{ fontFamily: FF_S, fontSize: 15, color: P.ink, fontWeight: 600, margin: "0 0 24px" }}>{pendingEmail}</p>
            <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, lineHeight: 1.6, margin: "0 0 28px" }}>
              Click the link in the email to verify your account. Once confirmed, you'll be taken through a short setup and then straight to your Nook.
            </p>
            <button onClick={() => { setPendingEmail(null); navigate("login"); }} style={{ background: P.lavenderLight, border: `1.5px solid ${P.lavender}`, borderRadius: 14, padding: "11px 28px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: 600 }}>
              Back to login
            </button>
          </div>
        </div>
      )}

      {["dashboard","customize"].includes(page) && user && (
        <DashboardPage view={page} onNavigate={navigate} profilePic={profilePic} setProfilePic={setProfilePic} widgetRequests={widgetRequests} setWidgetRequests={setWidgetRequests} following={following} toggleFollow={toggleFollow} onViewUser={openUserProfile} initialWidgets={initialWidgets} />
      )}
      {page === "messages" && user && <MessagesPage requests={requests} setRequests={setRequests} />}
      {page === "feed"     && user && <FeedPage onNavigate={navigate} onViewUser={openUserProfile} />}
      {page === "work"     && user && <WorkPage />}
      {page === "admin"    && isAdmin && <AdminPage widgetRequests={widgetRequests} setWidgetRequests={setWidgetRequests} />}
      {page === "settings" && user && <SettingsPage profilePic={profilePic} setProfilePic={setProfilePic} onLogout={logout} />}

      {/* User profile modal */}
      {viewingUser && (
        <UserProfileModal
          user={viewingUser}
          following={following}
          toggleFollow={toggleFollow}
          onClose={() => setViewingUser(null)}
          onMessage={() => { setViewingUser(null); navigate("messages"); }}
        />
      )}

      {/* Onboarding wizard */}
      {showOnboarding && <OnboardingWizard onComplete={completeOnboarding} profilePic={profilePic} setProfilePic={setProfilePic} />}
    </>
  );
}
