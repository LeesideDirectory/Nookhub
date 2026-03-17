// NOOK BUILD v43 - supabase import fix
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react'
import { useAuth } from './hooks/useAuth'
import { useFeed } from './hooks/useFeed'
import { useMessages } from './hooks/useMessages'
import { useAdminData } from './hooks/useAdminData'
import { supabase } from './lib/supabase'


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

// ─── Profile view context — lets any component open a user profile by handle ─
const ProfileViewContext = createContext(null);

const HandleBadge = ({ handle, style = {} }) => {
  const openProfile = useContext(ProfileViewContext);
  if (!handle) return null;
  if (!openProfile) return <span style={style}>{handle}</span>;
  return (
    <span
      onClick={e => { e.stopPropagation(); openProfile(handle); }}
      style={{ color: "#9B85D8", cursor: "pointer", fontWeight: 600, transition: "opacity 0.15s", ...style }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {handle}
    </span>
  );
};

const Nav = ({ page, onNavigate, onLogout, unreadCount, isLoggedIn, isAdmin, me, profilePic, following, unreadNotifs, showNotifs, setShowNotifs, notifications, onMarkRead, onMarkAllRead, onOpenProfile, onOpenPost, accent = "#C9B8F0" }) => {
  const accentLight = accent + "33";
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <nav style={{ background: P.white, borderBottom: `1px solid ${P.lavender}44`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(201,184,240,0.10)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px" }}>
        {/* Logo */}
        <div onClick={() => { onNavigate(isLoggedIn ? "dashboard" : "home"); close(); }}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <span style={{ fontFamily: FF_D, fontSize: 22, color: P.ink }}>Nook</span>
        </div>

        {/* Desktop links */}
        <div className="nook-nav-links">
          {isLoggedIn ? (
            <>
              {[["dashboard","My Dashboard"],["feed","Feed"],["messages","Messages"],["work","Work 🔒"],["customize","Customise"]].map(([v, label]) => (
                <button key={v} onClick={() => onNavigate(v)} style={{ background: page === v ? accent : "transparent", border: `1.5px solid ${page === v ? accent : accent + "66"}`, borderRadius: 10, padding: "7px 15px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.ink, fontWeight: page === v ? 600 : 400, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
                  {label}
                  {v === "messages" && unreadCount > 0 && <span style={{ background: P.rose, borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700, color: P.ink }}>{unreadCount}</span>}
                </button>
              ))}
              <div style={{ width: 1, height: 22, background: P.lavender + "55", margin: "0 4px" }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowNotifs(v => !v)} style={{ position: "relative", background: showNotifs ? accentLight : "transparent", border: `1.5px solid ${showNotifs ? accent : accent + "44"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 16, lineHeight: 1, transition: "all 0.2s" }}>
                  🔔
                  {unreadNotifs > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: P.rose, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_S, fontSize: 9, fontWeight: 700, color: P.ink, border: `2px solid ${P.white}` }}>{unreadNotifs}</span>}
                </button>
                {showNotifs && <NotificationsDropdown notifs={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} onNavigate={onNavigate} onOpenProfile={onOpenProfile} onOpenPost={onOpenPost} onClose={() => setShowNotifs(false)} />}
              </div>
              <UserAvatar user={me} size={32} showStatus photoPic={profilePic} />
              <button onClick={() => onNavigate("settings")} title="Settings" style={{ background: page === "settings" ? accent : "transparent", border: `1.5px solid ${page === "settings" ? accent : accent + "44"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: P.inkLight, lineHeight: 1, transition: "all 0.2s" }}>⚙</button>
              {isAdmin && <button onClick={() => onNavigate("admin")} title="Admin panel" style={{ background: page === "admin" ? accent : "transparent", border: `1.5px solid ${page === "admin" ? accent : accent + "44"}`, borderRadius: 10, padding: "6px 8px", cursor: "pointer", fontSize: 11, color: P.inkFaint, lineHeight: 1, transition: "all 0.2s", fontFamily: FF_S, fontWeight: 600 }}>ADMIN</button>}
              <button onClick={onLogout} style={{ background: "transparent", border: `1.5px solid ${P.rose}55`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate("login")} style={{ background: "transparent", border: `1.5px solid ${accent}`, borderRadius: 12, padding: "8px 22px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink }}>Log in</button>
              <button onClick={() => onNavigate("signup")} style={{ background: accent, border: "none", borderRadius: 12, padding: "8px 22px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: 600 }}>Sign up</button>
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
                {showNotifs && <NotificationsDropdown notifs={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} onNavigate={onNavigate} onOpenProfile={onOpenProfile} onOpenPost={onOpenPost} onClose={() => setShowNotifs(false)} />}
              </div>
              <UserAvatar user={me} size={28} photoPic={profilePic} />
            </>
          )}
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: menuOpen ? accentLight : "transparent", border: `1.5px solid ${accent}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>
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
                <button key={v} onClick={() => { onNavigate(v); close(); }} style={{ background: page === v ? accentLight : "transparent", border: `1px solid ${page === v ? accent : "transparent"}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: page === v ? 600 : 400, textAlign: "left", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
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

const TodoWidget = ({ data, color, onDataChange }) => {
  // Support both old flat list and new grouped format
  const initGroups = () => {
    if (data.groups && data.groups.length > 0) return data.groups;
    // Migrate old flat items into a default group
    return [{ id: "default", name: "My Tasks", items: data.items || [] }];
  };
  const [groups, setGroups] = useState(initGroups);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupInputs, setGroupInputs] = useState({});

  const save = (nextGroups) => {
    setGroups(nextGroups);
    onDataChange?.({ groups: nextGroups, items: nextGroups.flatMap(g => g.items) });
  };

  const toggleItem = (groupId, itemIdx) => {
    save(groups.map(g => g.id === groupId
      ? { ...g, items: g.items.map((it, i) => i === itemIdx ? { ...it, done: !it.done } : it) }
      : g));
  };
  const removeItem = (groupId, itemIdx) => {
    save(groups.map(g => g.id === groupId
      ? { ...g, items: g.items.filter((_, i) => i !== itemIdx) }
      : g));
  };
  const addItem = (groupId) => {
    const input = groupInputs[groupId] || "";
    if (!input.trim()) return;
    save(groups.map(g => g.id === groupId
      ? { ...g, items: [...g.items, { text: input.trim(), done: false }] }
      : g));
    setGroupInputs(prev => ({ ...prev, [groupId]: "" }));
  };
  const addGroup = () => {
    if (!newGroupName.trim()) return;
    save([...groups, { id: `grp${Date.now()}`, name: newGroupName.trim(), items: [] }]);
    setNewGroupName(""); setAddingGroup(false);
  };
  const removeGroup = (groupId) => {
    if (groups.length <= 1) return; // keep at least one group
    save(groups.filter(g => g.id !== groupId));
  };
  const renameGroup = (groupId, newName) => {
    save(groups.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };
  const toggleCollapse = (groupId) => {
    setCollapsedGroups(s => { const n = new Set(s); n.has(groupId) ? n.delete(groupId) : n.add(groupId); return n; });
  };

  return (
    <div>
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        const doneCount = group.items.filter(it => it.done).length;
        return (
          <div key={group.id} style={{ marginBottom: 14 }}>
            {/* Group header */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <button onClick={() => toggleCollapse(group.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: P.inkFaint, padding: "0 2px", lineHeight: 1 }}>
                {isCollapsed ? "▶" : "▼"}
              </button>
              <input
                value={group.name}
                onChange={e => renameGroup(group.id, e.target.value)}
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: FF_S, fontSize: 12, fontWeight: 700, color: color.dot, textTransform: "uppercase", letterSpacing: 0.5, cursor: "text", padding: 0 }}
              />
              <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>{doneCount}/{group.items.length}</span>
              {groups.length > 1 && (
                <button onClick={() => removeGroup(group.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 13, padding: "0 2px", lineHeight: 1, opacity: 0.5 }}>×</button>
              )}
            </div>
            {/* Group items */}
            {!isCollapsed && (
              <>
                {group.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 6px 16px", borderBottom: `1px solid ${color.accent}55` }}>
                    <div onClick={() => toggleItem(group.id, i)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: it.done ? color.dot : "transparent", border: `2px solid ${it.done ? color.dot : color.dot + "80"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}>
                      {it.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontFamily: FF_S, fontSize: 13.5, color: P.ink, textDecoration: it.done ? "line-through" : "none", opacity: it.done ? 0.5 : 1, transition: "all 0.2s" }}>{it.text}</span>
                    <button onClick={() => removeItem(group.id, i)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14, padding: "0 2px", opacity: 0, transition: "opacity 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}>×</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: 16 }}>
                  <input
                    value={groupInputs[group.id] || ""}
                    onChange={e => setGroupInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addItem(group.id)}
                    placeholder="Add a task…"
                    style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }}
                  />
                  <button onClick={() => addItem(group.id)} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>+</button>
                </div>
              </>
            )}
          </div>
        );
      })}
      {/* Add new group */}
      {addingGroup ? (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addGroup(); if (e.key === "Escape") setAddingGroup(false); }} placeholder="Group name…"
            style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 10px", fontFamily: FF_S, fontSize: 12, background: color.bg, color: P.ink, outline: "none" }} />
          <button onClick={addGroup} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add</button>
          <button onClick={() => setAddingGroup(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14 }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setAddingGroup(true)} style={{ marginTop: 8, background: "none", border: `1.5px dashed ${color.dot}55`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, width: "100%" }}>+ Add group</button>
      )}
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

const MoodWidget = ({ data, color, onDataChange }) => {
  const EMOJIS   = ["", "😞", "😕", "😐", "🙂", "😊"];
  const LABELS   = ["", "Rough", "Low", "Okay", "Good", "Great"];
  const COLORS   = ["", "#D8708A", "#E8956A", "#C8A830", "#5DCAAA", "#9B85D8"];

  const buildHistory = () => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const history = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      history.push({ date: d.toISOString().slice(0,10), day: label, mood: 0, note: "" });
    }
    return history;
  };

  const [history, setHistory] = useState(() => data.history || buildHistory());
  const [tab, setTab]         = useState("week");
  const [editIdx, setEditIdx] = useState(null);
  const [noteVal, setNoteVal] = useState("");

  const week  = history.slice(-7);
  const month = history.slice(-30);
  const today = history[history.length - 1];

  const setMood = (dateStr, mood) => {
    const next = history.map(d => d.date === dateStr ? { ...d, mood } : d);
    setHistory(next); onDataChange?.({ history: next });
  };
  const saveNote = (dateStr) => {
    const next = history.map(d => d.date === dateStr ? { ...d, note: noteVal } : d);
    setHistory(next); setEditIdx(null); onDataChange?.({ history: next });
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

const ensureHttps = (url) => {
  if (!url || url === '#') return url;
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
};

const LinksWidget = ({ data, color, onDataChange }) => {
  const [items, setItems] = useState(data.items || []);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const remove = (i) => { const next = items.filter((_, idx) => idx !== i); setItems(next); onDataChange?.({ items: next }); };
  const add = () => {
    if (!draftTitle.trim()) return;
    const url = ensureHttps(draftUrl.trim()) || "#";
    const next = [...items, { title: draftTitle.trim(), url }];
    setItems(next); setDraftTitle(""); setDraftUrl(""); onDataChange?.({ items: next });
  };
  return (
    <div>
      {items.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, marginBottom: 6, background: color.accent + "55" }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🔗</span>
          <a href={ensureHttps(l.url)} target="_blank" rel="noreferrer" style={{ flex: 1, fontFamily: FF_S, fontSize: 13.5, color: P.ink, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</a>
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

const GratitudeWidget = ({ data, color, onDataChange }) => {
  const [entries, setEntries] = useState(data.entries || []);
  const [input, setInput] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const add = () => { if (!input.trim()) return; const next = [input.trim(), ...entries]; setEntries(next); setInput(""); onDataChange?.({ entries: next }); };
  const remove = (i) => { const next = entries.filter((_, idx) => idx !== i); setEntries(next); onDataChange?.({ entries: next }); };
  const startEdit = (i) => { setEditIdx(i); setEditVal(entries[i]); };
  const saveEdit = () => { const next = entries.map((x, i) => i === editIdx ? editVal : x); setEntries(next); setEditIdx(null); onDataChange?.({ entries: next }); };

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

const SobrietyWidget = ({ data, color, onDataChange }) => {
  const [startDate, setStartDate] = useState(data.startDate || new Date().toISOString().slice(0,10));
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
          <button onClick={() => { setStartDate(draft); setEditing(false); onDataChange?.({ startDate: draft }); }} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
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

const InstagramWidget = ({ data, color, onDataChange }) => {
  const [draft, setDraft]   = useState(data.username || "");
  const [step, setStep]     = useState(data.username ? "done" : "idle");
  const igGradient = "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
  const isVerified = data.verified === true;

  const openAndVerify = () => {
    if (!draft.trim()) return;
    window.open(`https://instagram.com/${draft.trim().replace(/^@/, "")}`, "_blank");
    setStep("verifying");
  };
  const confirm = () => {
    const u = draft.trim().replace(/^@/, "");
    onDataChange?.({ username: u, verified: true });
    setStep("done");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${color.accent}55` }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: igGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📸</div>
        <div style={{ flex: 1 }}>
          {step === "idle" && (
            <button onClick={() => setStep("entering")}
              style={{ background: igGradient, color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 700 }}>
              Connect your Instagram →
            </button>
          )}
          {step === "entering" && (
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
                <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, flexShrink: 0 }}>@</span>
                <input value={draft} onChange={e => setDraft(e.target.value.replace(/^@/, ""))}
                  placeholder="your_username" autoFocus onKeyDown={e => e.key === "Enter" && openAndVerify()}
                  style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={openAndVerify} disabled={!draft.trim()}
                  style={{ flex: 1, background: igGradient, color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5, fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>
                  Open instagram.com/{draft || "…"} →
                </button>
                <button onClick={() => setStep(data.username ? "done" : "idle")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16, padding: "0 4px" }}>×</button>
              </div>
            </div>
          )}
          {step === "verifying" && (
            <div>
              <p style={{ fontFamily: FF_S, fontSize: 12, color: P.ink, margin: "0 0 8px", lineHeight: 1.5 }}>
                Does <strong>instagram.com/{draft}</strong> look like your profile?
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={confirm}
                  style={{ flex: 1, background: igGradient, color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: 700 }}>
                  ✓ Yes, that's my account
                </button>
                <button onClick={() => setStep("entering")}
                  style={{ background: P.lavenderLight, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkLight }}>
                  ← Back
                </button>
              </div>
            </div>
          )}
          {step === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>@{data.username}</span>
              {isVerified
                ? <span style={{ background: igGradient, borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 700, color: "#fff" }}>✓ Connected</span>
                : <span title="Click ✎ to verify this is your account" style={{ background: "#E8956A22", borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, color: "#E8956A", border: "1px solid #E8956A55" }}>⚠ Unverified</span>
              }
              <button onClick={() => { setDraft(data.username || ""); setStep("entering"); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint, padding: 0 }}>✎</button>
            </div>
          )}
        </div>
      </div>

      {/* Profile link card or empty state */}
      {data.username ? (
        <a href={`https://instagram.com/${data.username}`} target="_blank" rel="noreferrer"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 16px", background: "linear-gradient(160deg, #fff5f0 0%, #fce4f3 100%)", borderRadius: 18, textDecoration: "none", border: "1.5px solid #f7c5e0", transition: "transform 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(188,24,136,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: igGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 4px 14px rgba(220,39,67,0.3)" }}>📸</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FF_S, fontSize: 16, fontWeight: 700, color: "#3d3550", marginBottom: 3 }}>@{data.username}</div>
            <div style={{ fontFamily: FF_S, fontSize: 12, color: "#9b7aaa" }}>instagram.com/{data.username}</div>
          </div>
          <div style={{ background: igGradient, color: "#fff", borderRadius: 22, padding: "9px 24px", fontFamily: FF_S, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
            View on Instagram →
          </div>
        </a>
      ) : (
        <div style={{ textAlign: "center", padding: "36px 16px", color: P.inkFaint, fontFamily: FF_S, fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
          Connect your Instagram account above to add a link to your profile
        </div>
      )}
    </div>
  );
};

const SPORT_EMOJIS = ["🏃","🚴","🏊","🏋️","⚽","🏀","🎾","🏈","⚾","🏒","🥊","🤸","🧘","🏄","🚵","🎿","🏇","🤾","🏌️","🥋","🤼","🎯","🏹","🧗","🚣","🤽","🏑","🏓","🏸","🥅","🎱","🛹"];

const SportsWidget = ({ data, color, onDataChange }) => {
  const [activities, setActivities] = useState(data.activities || []);
  const [activeId, setActiveId] = useState(data.activities[0]?.id);
  const [adding, setAdding] = useState(false);
  const [newSession, setNewSession] = useState({ date: new Date().toISOString().slice(0, 10), time: "", value: "", note: "", location: "" });
  const [newActivity, setNewActivity] = useState({ type: "", icon: "🏃", unit: "km" });
  const [addingActivity, setAddingActivity] = useState(false);
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);
  // Edit sport state
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editDraft, setEditDraft] = useState({ type: "", icon: "🏃", unit: "km" });
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  const active = activities.find(a => a.id === activeId);
  const isSurfing = active?.type?.toLowerCase() === "surfing";
  const total = active ? active.sessions.reduce((s, r) => s + Number(r.value), 0) : 0;

  const addSession = () => {
    if (!newSession.value) return;
    const next = activities.map(a => a.id === activeId
      ? { ...a, sessions: [...a.sessions, { ...newSession, value: Number(newSession.value) }] }
      : a);
    setActivities(next); onDataChange?.({ activities: next });
    setNewSession({ date: new Date().toISOString().slice(0, 10), time: "", value: "", note: "", location: "" });
    setAdding(false);
  };
  const removeSession = (idx) => { const next = activities.map(a => a.id === activeId ? { ...a, sessions: a.sessions.filter((_, i) => i !== idx) } : a); setActivities(next); onDataChange?.({ activities: next }); };
  const addActivity = () => {
    if (!newActivity.type.trim()) return;
    const id = `s${Date.now()}`;
    const next = [...activities, { id, ...newActivity, sessions: [] }];
    setActivities(next); setActiveId(id); onDataChange?.({ activities: next });
    setNewActivity({ type: "", icon: "🏃", unit: "km" });
    setAddingActivity(false);
    setShowNewEmojiPicker(false);
  };
  const startEditActivity = (a) => {
    setEditingActivityId(a.id);
    setEditDraft({ type: a.type, icon: a.icon, unit: a.unit });
    setShowEditEmojiPicker(false);
  };
  const saveEditActivity = () => {
    if (!editDraft.type.trim()) return;
    const next = activities.map(a => a.id === editingActivityId ? { ...a, ...editDraft } : a);
    setActivities(next); onDataChange?.({ activities: next });
    setEditingActivityId(null);
    setShowEditEmojiPicker(false);
  };
  const deleteActivity = (id) => {
    const next = activities.filter(a => a.id !== id);
    setActivities(next);
    if (activeId === id) setActiveId(next[0]?.id);
    onDataChange?.({ activities: next });
    setEditingActivityId(null);
  };

  const inpS = { border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "5px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" };

  return (
    <div>
      {/* Activity tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {activities.map(a => (
          <div key={a.id} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button onClick={() => { setActiveId(a.id); setEditingActivityId(null); }} style={{ background: activeId === a.id ? color.dot : color.accent, color: activeId === a.id ? "#fff" : P.ink, border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: activeId === a.id ? 600 : 400 }}>
              {a.icon} {a.type}
            </button>
            <button onClick={e => { e.stopPropagation(); startEditActivity(a); setActiveId(a.id); }} title="Edit sport" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: activeId === a.id ? "#fff" : P.inkFaint, padding: "0 4px 0 0", marginLeft: -4, lineHeight: 1 }}>✎</button>
          </div>
        ))}
        <button onClick={() => setAddingActivity(v => !v)} style={{ background: "none", border: `1.5px dashed ${color.dot}66`, borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: P.inkFaint }}>+</button>
      </div>

      {/* Edit existing activity form */}
      {editingActivityId && (
        <div style={{ background: color.accent + "55", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowEditEmojiPicker(v => !v)} style={{ ...inpS, width: 40, textAlign: "center", fontSize: 16, cursor: "pointer", padding: "5px" }}>{editDraft.icon}</button>
              {showEditEmojiPicker && (
                <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: P.white, border: `1.5px solid ${color.accent}`, borderRadius: 12, padding: 8, display: "flex", flexWrap: "wrap", gap: 4, width: 220, boxShadow: "0 4px 16px rgba(61,53,80,0.15)" }}>
                  {SPORT_EMOJIS.map(em => <span key={em} onClick={() => { setEditDraft(d => ({ ...d, icon: em })); setShowEditEmojiPicker(false); }} style={{ fontSize: 18, cursor: "pointer", padding: 3, borderRadius: 6, background: editDraft.icon === em ? color.accent : "transparent" }}>{em}</span>)}
                </div>
              )}
            </div>
            <input value={editDraft.type} onChange={e => setEditDraft(d => ({ ...d, type: e.target.value }))} placeholder="Activity name" style={{ ...inpS, flex: 1 }} />
            <input value={editDraft.unit} onChange={e => setEditDraft(d => ({ ...d, unit: e.target.value }))} placeholder="unit" style={{ ...inpS, width: 48 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={saveEditActivity} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
            <button onClick={() => deleteActivity(editingActivityId)} style={{ background: "#F0B8C844", color: "#D8708A", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete sport</button>
            <button onClick={() => { setEditingActivityId(null); setShowEditEmojiPicker(false); }} style={{ background: color.accent, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        </div>
      )}

      {addingActivity && (
        <div style={{ background: color.accent + "55", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNewEmojiPicker(v => !v)} style={{ ...inpS, width: 40, textAlign: "center", fontSize: 16, cursor: "pointer", padding: "5px" }}>{newActivity.icon}</button>
              {showNewEmojiPicker && (
                <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: P.white, border: `1.5px solid ${color.accent}`, borderRadius: 12, padding: 8, display: "flex", flexWrap: "wrap", gap: 4, width: 220, boxShadow: "0 4px 16px rgba(61,53,80,0.15)" }}>
                  {SPORT_EMOJIS.map(em => <span key={em} onClick={() => { setNewActivity(a => ({ ...a, icon: em })); setShowNewEmojiPicker(false); }} style={{ fontSize: 18, cursor: "pointer", padding: 3, borderRadius: 6, background: newActivity.icon === em ? color.accent : "transparent" }}>{em}</span>)}
                </div>
              )}
            </div>
            <input value={newActivity.type} onChange={e => setNewActivity(a => ({ ...a, type: e.target.value }))} placeholder="Activity name" style={{ ...inpS, flex: 1 }} />
            <input value={newActivity.unit} onChange={e => setNewActivity(a => ({ ...a, unit: e.target.value }))} placeholder="unit" style={{ ...inpS, width: 48 }} />
          </div>
          <button onClick={addActivity} style={{ background: color.dot, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add sport</button>
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

const HobbiesWidget = ({ data, color, onDataChange }) => {
  const [hobbies, setHobbies] = useState(data.hobbies || []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", emoji: "🎨", note: "", level: 1 });
  const LEVELS = ["Curious", "Beginner", "Developing", "Skilled", "Passionate"];
  const update = (next) => { setHobbies(next); onDataChange?.({ hobbies: next }); };
  const remove = (id) => update(hobbies.filter(h => h.id !== id));
  const updateNote = (id, note) => update(hobbies.map(h => h.id === id ? { ...h, note } : h));
  const updateLevel = (id, level) => update(hobbies.map(h => h.id === id ? { ...h, level } : h));
  const add = () => { if (!draft.name.trim()) return; update([...hobbies, { id: `h${Date.now()}`, ...draft }]); setDraft({ name: "", emoji: "🎨", note: "", level: 1 }); setAdding(false); };
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

const LinkedInWidget = ({ data, color, onDataChange }) => {
  const [draft, setDraft] = useState(data.username || "");
  const [step, setStep]   = useState(data.username ? "done" : "idle");
  const isVerified = data.verified === true;

  const liInStyle = { color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "sans-serif" };

  const openAndVerify = () => {
    if (!draft.trim()) return;
    window.open(`https://linkedin.com/in/${draft.trim()}`, "_blank");
    setStep("verifying");
  };
  const confirm = () => {
    const u = draft.trim();
    onDataChange?.({ username: u, verified: true });
    setStep("done");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${color.accent}55` }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#0077B5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={liInStyle}>in</span>
        </div>
        <div style={{ flex: 1 }}>
          {step === "idle" && (
            <button onClick={() => setStep("entering")}
              style={{ background: "#0077B5", color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 700 }}>
              Connect your LinkedIn →
            </button>
          )}
          {step === "entering" && (
            <div>
              <div style={{ marginBottom: 6 }}>
                <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="your-profile-slug"
                  autoFocus onKeyDown={e => e.key === "Enter" && openAndVerify()}
                  style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", boxSizing: "border-box" }} />
                <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 2 }}>linkedin.com/in/<strong>{draft || "your-slug"}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={openAndVerify} disabled={!draft.trim()}
                  style={{ flex: 1, background: "#0077B5", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5, fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>
                  Open my LinkedIn profile →
                </button>
                <button onClick={() => setStep(data.username ? "done" : "idle")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16, padding: "0 4px" }}>×</button>
              </div>
            </div>
          )}
          {step === "verifying" && (
            <div>
              <p style={{ fontFamily: FF_S, fontSize: 12, color: P.ink, margin: "0 0 8px", lineHeight: 1.5 }}>
                Does <strong>linkedin.com/in/{draft}</strong> look like your profile?
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={confirm}
                  style={{ flex: 1, background: "#0077B5", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: 700 }}>
                  ✓ Yes, that's my profile
                </button>
                <button onClick={() => setStep("entering")}
                  style={{ background: P.lavenderLight, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkLight }}>
                  ← Back
                </button>
              </div>
            </div>
          )}
          {step === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{data.username}</span>
              {isVerified
                ? <span style={{ background: "#0077B5", borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 700, color: "#fff" }}>✓ Connected</span>
                : <span title="Click ✎ to verify this is your profile" style={{ background: "#E8956A22", borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, color: "#E8956A", border: "1px solid #E8956A55" }}>⚠ Unverified</span>
              }
              <button onClick={() => { setDraft(data.username || ""); setStep("entering"); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint, padding: 0 }}>✎</button>
            </div>
          )}
        </div>
      </div>

      {/* Profile link card or empty state */}
      {data.username ? (
        <a href={`https://linkedin.com/in/${data.username}`} target="_blank" rel="noreferrer"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 16px", background: "linear-gradient(160deg, #EBF5FB 0%, #D6EAF8 100%)", borderRadius: 18, textDecoration: "none", border: "1.5px solid #BDE0F5", transition: "transform 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,119,181,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#0077B5", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,119,181,0.3)" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 36, fontFamily: "sans-serif", lineHeight: 1 }}>in</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FF_S, fontSize: 16, fontWeight: 700, color: "#3d3550", marginBottom: 3 }}>{data.username}</div>
            <div style={{ fontFamily: FF_S, fontSize: 12, color: "#5a7a9a" }}>linkedin.com/in/{data.username}</div>
          </div>
          <div style={{ background: "#0077B5", color: "#fff", borderRadius: 22, padding: "9px 24px", fontFamily: FF_S, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
            View on LinkedIn →
          </div>
        </a>
      ) : (
        <div style={{ textAlign: "center", padding: "36px 16px", color: P.inkFaint, fontFamily: FF_S, fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0077B5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, fontFamily: "sans-serif" }}>in</span>
          </div>
          Connect your LinkedIn profile above to add a link to your dashboard
        </div>
      )}
    </div>
  );
};

const TwitterWidget = ({ data, color, onDataChange }) => {
  const [draft, setDraft] = useState(data.username || "");
  const [step, setStep]   = useState(data.username ? "done" : "idle");
  const embedRef = useRef(null);
  const isVerified = data.verified === true;

  // Load the real Twitter/X timeline embed when confirmed username changes
  useEffect(() => {
    if (!data.username || !embedRef.current) return;
    embedRef.current.innerHTML = "";
    const anchor = document.createElement("a");
    anchor.className = "twitter-timeline";
    anchor.href = `https://twitter.com/${data.username}`;
    anchor.setAttribute("data-height", "420");
    anchor.setAttribute("data-chrome", "noheader nofooter noborders transparent");
    anchor.setAttribute("data-theme", "light");
    anchor.textContent = `Tweets by @${data.username}`;
    embedRef.current.appendChild(anchor);
    if (window.twttr?.widgets) {
      window.twttr.widgets.load(embedRef.current);
    } else {
      if (!document.getElementById("twitter-widgets-js")) {
        const script = document.createElement("script");
        script.id = "twitter-widgets-js";
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true; script.charset = "utf-8";
        document.head.appendChild(script);
        script.onload = () => { if (window.twttr && embedRef.current) window.twttr.widgets.load(embedRef.current); };
      }
    }
  }, [data.username]);

  const openAndVerify = () => {
    if (!draft.trim()) return;
    window.open(`https://x.com/${draft.trim().replace(/^@/, "")}`, "_blank");
    setStep("verifying");
  };
  const confirm = () => {
    const u = draft.trim().replace(/^@/, "");
    onDataChange?.({ ...data, username: u, verified: true });
    setStep("done");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${color.accent}55` }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, fontFamily: "sans-serif" }}>✕</span>
        </div>
        <div style={{ flex: 1 }}>
          {step === "idle" && (
            <button onClick={() => setStep("entering")}
              style={{ background: "#000", color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 700 }}>
              Connect your X account →
            </button>
          )}
          {step === "entering" && (
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
                <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, flexShrink: 0 }}>@</span>
                <input value={draft} onChange={e => setDraft(e.target.value.replace(/^@/, ""))}
                  placeholder="your_username" autoFocus onKeyDown={e => e.key === "Enter" && openAndVerify()}
                  style={{ flex: 1, border: `1.5px solid ${color.accent}`, borderRadius: 8, padding: "4px 8px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={openAndVerify} disabled={!draft.trim()}
                  style={{ flex: 1, background: "#000", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5, fontFamily: FF_S, fontSize: 11, fontWeight: 600 }}>
                  Open x.com/{draft || "…"} →
                </button>
                <button onClick={() => setStep(data.username ? "done" : "idle")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16, padding: "0 4px" }}>×</button>
              </div>
            </div>
          )}
          {step === "verifying" && (
            <div>
              <p style={{ fontFamily: FF_S, fontSize: 12, color: P.ink, margin: "0 0 8px", lineHeight: 1.5 }}>
                Does <strong>x.com/{draft}</strong> look like your profile?
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={confirm}
                  style={{ flex: 1, background: "#000", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: 700 }}>
                  ✓ Yes, that's my account
                </button>
                <button onClick={() => setStep("entering")}
                  style={{ background: P.lavenderLight, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkLight }}>
                  ← Back
                </button>
              </div>
            </div>
          )}
          {step === "done" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>@{data.username}</span>
                {isVerified
                  ? <span style={{ background: "#000", borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 700, color: "#fff" }}>✓ Connected</span>
                  : <span title="Click ✎ to verify this is your account" style={{ background: "#E8956A22", borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, color: "#E8956A", border: "1px solid #E8956A55" }}>⚠ Unverified</span>
                }
                <button onClick={() => { setDraft(data.username || ""); setStep("entering"); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: P.inkFaint, padding: 0 }}>✎</button>
              </div>
              {data.username && <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkLight, marginTop: 2 }}>Live timeline from X</div>}
            </div>
          )}
        </div>
      </div>

      {/* Live embed */}
      {data.username ? (
        <div ref={embedRef} style={{ minHeight: 200, borderRadius: 14, overflow: "hidden" }} />
      ) : (
        <div style={{ textAlign: "center", padding: "36px 16px", color: P.inkFaint, fontFamily: FF_S, fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✕</div>
          Connect your X account above to show your live timeline
        </div>
      )}
      {data.username && (
        <a href={`https://x.com/${data.username}`} target="_blank" rel="noreferrer"
          style={{ display: "block", textAlign: "center", marginTop: 10, fontFamily: FF_S, fontSize: 12, color: color.dot, textDecoration: "none", fontWeight: 600 }}>
          View on X →
        </a>
      )}
    </div>
  );
};

const ProjectsWidget = ({ data, color, onDataChange }) => {
  const [projects, setProjects] = useState(data.projects || []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", desc: "", url: "", status: "building", emoji: "🚀", logo: null });
  const logoRefs = useRef({});
  const STATUS = { building: { label: "Building", bg: color.dot + "22", text: color.dot }, beta: { label: "Beta", bg: "#5DCAAA22", text: "#3BAA80" }, live: { label: "Live 🟢", bg: "#C9B8F022", text: "#9B85D8" }, paused: { label: "Paused", bg: "#F0B8C822", text: "#D8708A" } };
  const save = (next) => { setProjects(next); onDataChange?.({ projects: next }); };
  const cycleStatus = (id) => {
    const order = ["building", "beta", "live", "paused"];
    save(projects.map(p => p.id === id ? { ...p, status: order[(order.indexOf(p.status) + 1) % order.length] } : p));
  };
  const remove = (id) => save(projects.filter(p => p.id !== id));
  const update = (id, field, val) => save(projects.map(p => p.id === id ? { ...p, [field]: val } : p));
  const add = () => { if (!draft.name.trim()) return; save([...projects, { id: `p${Date.now()}`, ...draft }]); setDraft({ name: "", desc: "", url: "", status: "building", emoji: "🚀", logo: null }); setAdding(false); };
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
            {p.url && p.url !== "#" && <a href={/^https?:\/\//i.test(p.url) ? p.url : `https://${p.url}`} target="_blank" rel="noreferrer" style={{ fontFamily: FF_S, fontSize: 11, color: color.dot, textDecoration: "none" }} onClick={e => e.stopPropagation()}>↗</a>}
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

const TravelWidget = ({ data, color, onDataChange }) => {
  const [trips, setTrips] = useState(data.trips || []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ place: "", date: "", note: "", photo: null, emoji: "✈" });
  const fileRefs = useRef({});
  const save = (next) => { setTrips(next); onDataChange?.({ trips: next }); };
  const remove = (id) => save(trips.filter(t => t.id !== id));
  const updateNote = (id, note) => save(trips.map(t => t.id === id ? { ...t, note } : t));
  const handlePhoto = (id, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => save(trips.map(t => t.id === id ? { ...t, photo: ev.target.result } : t));
    reader.readAsDataURL(file);
  };
  const handleNewPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setDraft(d => ({ ...d, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };
  const addTrip = () => { if (!draft.place.trim()) return; save([{ id: `t${Date.now()}`, ...draft }, ...trips]); setDraft({ place: "", date: "", note: "", photo: null, emoji: "✈" }); setAdding(false); };
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

const ArticlesWidget = ({ data, color, onDataChange }) => {
  const TYPES = ["written", "reading"];
  const tStyle = { written: { label: "Written ✍", bg: color.dot + "22", text: color.dot }, reading: { label: "Interesting", bg: "#C9B8F022", text: "#9B85D8" } };
  const [articles, setArticles] = useState(data.articles || []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", url: "", type: "reading", date: "", note: "" });
  const save = (next) => { setArticles(next); onDataChange?.({ articles: next }); };
  const remove = (id) => save(articles.filter(a => a.id !== id));
  const cycleType = (id) => save(articles.map(a => a.id === id ? { ...a, type: TYPES[(TYPES.indexOf(a.type) + 1) % TYPES.length] } : a));
  const add = () => { if (!draft.title.trim()) return; save([{ id: `a${Date.now()}`, ...draft }, ...articles]); setDraft({ title: "", url: "", type: "reading", date: "", note: "" }); setAdding(false); };
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
    // data.checked is the key used by saveToDb (cross-device save).
    // data.days is the legacy key from the original INITIAL_WIDGETS default.
    const savedDays = data?.checked ?? data?.days ?? [];
    return new Set(savedDays);
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
                          : isToday
                            ? color.accent + "cc"
                            : color.accent + "88",
                      cursor: isFuture ? "default" : "pointer",
                      boxShadow: isToday && !isDone ? `0 0 0 1px rgba(0,0,0,0.25)` : "none",
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

const GalleryPostModal = ({ post, onClose, onUpdate, onDelete, isOwner, color, authorName, allUserHandles = [] }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ caption: post.caption, tags: (post.tags || []).join(" ") });
  const [copied, setCopied] = useState(false);

  const save = () => {
    const tags = draft.tags.split(/[\s,]+/).filter(t => t.startsWith("@") && t.length > 1);
    onUpdate({ ...post, caption: draft.caption, tags });
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
              <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{authorName || ME_BASE.name}</div>
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
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, marginBottom: 4 }}>Tag users <span style={{ fontWeight: 400 }}>(space-separated @handles)</span></label>
                  <input value={draft.tags} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} placeholder="@username @another" style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
                  {allUserHandles.length > 0 && (() => {
                    const currentWord = draft.tags.split(/\s+/).filter(Boolean).pop() || '';
                    const searchFilter = currentWord.replace(/^@/, '').toLowerCase();
                    const alreadyAdded = (draft.tags.match(/@[\w.]+/g) || []).map(t => t.toLowerCase());
                    const suggestions = allUserHandles
                      .filter(u => !alreadyAdded.includes(u.toLowerCase()))
                      .filter(u => !searchFilter || u.toLowerCase().includes(searchFilter))
                      .slice(0, 12);
                    return suggestions.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        {suggestions.map(u => (
                          <span key={u} onClick={() => {
                            const base = draft.tags.replace(/\S*$/, '').trimEnd();
                            setDraft(d => ({ ...d, tags: (base + (base ? ' ' : '') + u).trim() }));
                          }} style={{ background: P.lavenderLight, border: `1px solid ${P.lavender}`, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, color: "#9B85D8", cursor: "pointer" }}>{u}</span>
                        ))}
                      </div>
                    ) : null;
                  })()}
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

                {/* Tags — clickable to visit profile */}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {post.tags.map(t => (
                      <span key={t} style={{ background: P.lavenderLight, borderRadius: 20, padding: "3px 12px", fontFamily: FF_S, fontSize: 12, fontWeight: 600 }}>
                        <HandleBadge handle={t} />
                      </span>
                    ))}
                  </div>
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

const GalleryWidget = ({ data, color, isOwnDashboard, onDataChange, authorName }) => {
  const [posts, setPosts] = useState(data.posts || []);
  const [activePost, setActivePost] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ caption: "", tags: "", mediaSrc: null, mediaType: "image" });
  const fileRef = useRef(null);
  const [realUsers, setRealUsers] = useState([]);
  // Load real user handles for tagging
  useEffect(() => {
    supabase.from('profiles').select('id, name, handle').then(({ data: profiles }) => {
      if (profiles) {
        setRealUsers(profiles.map(p => {
          const h = p.handle || ('@' + (p.name || '').toLowerCase().replace(/\s+/g, ''));
          return { id: p.id, handle: h.startsWith('@') ? h : '@' + h };
        }).filter(u => u.handle.length > 1));
      }
    });
  }, []);
  const allUserHandles = realUsers.map(u => u.handle);
  const savePosts = (next) => { setPosts(next); onDataChange?.({ posts: next }); };
  const updatePost = (updated) => savePosts(posts.map(p => p.id === updated.id ? updated : p));
  const deletePost = (id) => savePosts(posts.filter(p => p.id !== id));

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
    savePosts([{ id: `g${Date.now()}`, mediaType: draft.mediaType, mediaSrc: draft.mediaSrc, caption: draft.caption, tags, ts: Date.now(), color: COLORS[posts.length % COLORS.length] }, ...posts]);
    setDraft({ caption: "", tags: "", mediaSrc: null, mediaType: "image" });
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
            <input value={draft.tags} onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))} placeholder="Tag people  e.g. @username" style={{ width: "100%", border: `1.5px solid ${color.accent}`, borderRadius: 10, padding: "8px 12px", fontFamily: FF_S, fontSize: 13, background: color.bg, color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
            {(() => {
              const currentWord = draft.tags.split(/\s+/).filter(Boolean).pop() || '';
              const searchFilter = currentWord.replace(/^@/, '').toLowerCase();
              const alreadyAdded = (draft.tags.match(/@[\w.]+/g) || []).map(t => t.toLowerCase());
              const suggestions = allUserHandles
                .filter(u => !alreadyAdded.includes(u.toLowerCase()))
                .filter(u => !searchFilter || u.toLowerCase().includes(searchFilter))
                .slice(0, 12);
              return suggestions.length > 0 ? (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {suggestions.map(u => (
                    <span key={u} onClick={() => {
                      const base = draft.tags.replace(/\S*$/, '').trimEnd();
                      setDraft(d => ({ ...d, tags: (base + (base ? ' ' : '') + u).trim() }));
                    }} style={{ background: color.bg, border: `1px solid ${color.dot}55`, borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, color: color.dot, cursor: "pointer" }}>{u}</span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addPost} style={{ flex: 1, background: color.dot, color: "#fff", border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontWeight: 600, fontSize: 13 }}>Post</button>
            <button onClick={() => { setAdding(false); setDraft({ caption: "", tags: "", mediaSrc: null, mediaType: "image" }); }} style={{ background: color.accent, border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.ink }}>✕</button>
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
          authorName={authorName}
          allUserHandles={allUserHandles}
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
                  {!post.published ? (
                    <button onClick={() => onSave({ ...post, published: true })} style={{ background: "#5DCAAA22", border: "1.5px solid #5DCAAA", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: "#3BAA80" }}>✓ Publish</button>
                  ) : (
                    <button onClick={() => onSave({ ...post, published: false })} style={{ background: P.butterLight, border: `1.5px solid #C8A830`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: "#C8A830" }}>← Unpublish</button>
                  )}
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

const BlogWidget = ({ data, color, isOwnDashboard, onDataChange }) => {
  const [posts, setPosts] = useState(() => data.posts?.length > 0 ? data.posts : BLOG_SEED);
  const [activePost, setActivePost] = useState(null);
  const [creating, setCreating] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");

  const savePosts = (next) => { setPosts(next); onDataChange?.({ posts: next }); };
  const savePost = (updated) => savePosts(posts.map(p => p.id === updated.id ? updated : p));
  const deletePost = (id) => savePosts(posts.filter(p => p.id !== id));
  const createPost = () => {
    const newPost = { id: `bl${Date.now()}`, title: "Untitled", category: "Notes", tags: [], body: "", coverColor: "#C9B8F0", ts: Date.now(), readTime: 1, published: false };
    savePosts([newPost, ...posts]);
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
        href={ensureHttps(bm.url)}
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
          <button onClick={() => onSave({ ...draft, url: ensureHttps(draft.url) || "#" })} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
          <button onClick={onClose} style={{ background: P.lavenderLight, border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const BookmarksWidget = ({ data, color, isOwnDashboard, onDataChange }) => {
  const init = data.bookmarks || BOOKMARKS_SEED;
  const [daily, setDaily]       = useState(init.daily    || []);
  const [frequent, setFrequent] = useState(init.frequent || []);
  const [editTarget, setEditTarget] = useState(null);
  const [addTarget, setAddTarget]   = useState(null);
  const [view, setView] = useState("grid");
  const isOwner = isOwnDashboard !== false;
  const saveAll = (newDaily, newFrequent) => { onDataChange?.({ bookmarks: { daily: newDaily, frequent: newFrequent } }); };

  const updateBm = (section, id, patch) => {
    if (section === "daily") { const next = daily.map(b => b.id === id ? { ...b, ...patch } : b); setDaily(next); saveAll(next, frequent); }
    else { const next = frequent.map(b => b.id === id ? { ...b, ...patch } : b); setFrequent(next); saveAll(daily, next); }
  };
  const deleteBm = (section, id) => {
    if (section === "daily") { const next = daily.filter(b => b.id !== id); setDaily(next); saveAll(next, frequent); }
    else { const next = frequent.filter(b => b.id !== id); setFrequent(next); saveAll(daily, next); }
  };
  const addBm = (section, draft) => {
    const newBm = { id: `bm${Date.now()}`, title: draft.title || "New link", url: ensureHttps(draft.url) || "#", emoji: draft.emoji || "🔗", color: draft.color || BOOKMARK_COLORS[0] };
    if (section === "daily") { const next = [...daily, newBm]; setDaily(next); saveAll(next, frequent); }
    else { const next = [...frequent, newBm]; setFrequent(next); saveAll(daily, next); }
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
            <a href={ensureHttps(bm.url)} target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: view === "grid" ? "column" : "row", alignItems: "center", gap: view === "grid" ? 6 : 10, background: bm.color + (view === "grid" ? "88" : "55"), borderRadius: view === "grid" ? 14 : 10, padding: view === "grid" ? "14px 10px" : "8px 12px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}
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
            <a href={ensureHttps(bm.url)} target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: view === "grid" ? "column" : "row", alignItems: "center", gap: view === "grid" ? 6 : 10, background: bm.color + (view === "grid" ? "88" : "55"), borderRadius: view === "grid" ? 14 : 10, padding: view === "grid" ? "14px 10px" : "8px 12px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}
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

const ShareWidgetModal = ({ widget, onClose, handle }) => {
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
              nook.app/{handle || ME_BASE.handle}/{widget.id}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(`nook.app/${handle || ME_BASE.handle}/${widget.id}`); }}
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

const WidgetCard = ({ widget, onTogglePublic, isOwnDashboard, dragHandleProps, onToggleExpand, isExpanded, liveData, onDataChange, handle }) => {
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
      <Renderer data={widget.data} color={color} isOwnDashboard={isOwnDashboard} onDataChange={onDataChange} {...(liveData || {})} />
    </div>
    {showShare && <ShareWidgetModal widget={widget} onClose={() => setShowShare(false)} handle={handle} />}
    </>
  );
};

const NewConvoModal = ({ onClose, onStart, currentUserId }) => {
  const [tab, setTab] = useState("dm");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Debounced real search against profiles table
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
                const q = search.trim().replace(/^@/, "");
        const { data } = await supabase
          .from('profiles')
          .select('id, name, handle, avatar_color, bio')
          .neq('id', currentUserId || '')
          .or(`name.ilike.%${q}%,handle.ilike.%${q}%`)
          .limit(10);
        setResults(data || []);
      } catch { setResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, currentUserId]);

  const norm = (u) => ({ ...u, color: u.avatar_color || P.lavender, initials: (u.name || u.handle || "?").slice(0, 2).toUpperCase() });

  const toggle = (u) => {
    if (tab === "dm") {
      setSelected([u.id]);
      setSelectedProfiles([u]);
    } else {
      if (selected.includes(u.id)) {
        setSelected(s => s.filter(x => x !== u.id));
        setSelectedProfiles(ps => ps.filter(p => p.id !== u.id));
      } else {
        setSelected(s => [...s, u.id]);
        setSelectedProfiles(ps => [...ps, u]);
      }
    }
  };

  const canStart = tab === "dm" ? selected.length === 1 : selected.length >= 1;

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
              <button key={t} onClick={() => { setTab(t); setSelected([]); setSelectedProfiles([]); }} style={{ background: tab === t ? P.lavender : P.lavenderLight, border: "none", borderRadius: 10, padding: "7px 16px", fontFamily: FF_S, fontSize: 13, fontWeight: tab === t ? 600 : 400, color: P.ink, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
          {tab === "group" && (
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name…"
              style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "9px 14px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
          )}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.inkFaint }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or @handle…" autoFocus
              style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "9px 14px 9px 34px", fontFamily: FF_S, fontSize: 14, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
          </div>
          {tab === "group" && selectedProfiles.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {selectedProfiles.map(u => (
                <span key={u.id} style={{ background: P.lavender, borderRadius: 20, padding: "3px 10px 3px 8px", fontFamily: FF_S, fontSize: 12, color: P.ink, display: "flex", alignItems: "center", gap: 5 }}>
                  {(u.name || u.handle || "").split(" ")[0]}
                  <span onClick={() => toggle(u)} style={{ cursor: "pointer", opacity: 0.6 }}>×</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 12px 12px" }}>
          {searching ? (
            <div style={{ padding: "28px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>Searching…</div>
          ) : search.trim() && results.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>No users found for "{search}"</div>
          ) : !search.trim() ? (
            <div style={{ padding: "28px", textAlign: "center", color: P.inkFaint, fontFamily: FF_S, fontSize: 13 }}>Start typing to find someone</div>
          ) : results.map(u => {
            const nu = norm(u);
            return (
              <div key={u.id} onClick={() => toggle(nu)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, cursor: "pointer", background: selected.includes(u.id) ? P.lavenderLight : "transparent", transition: "background 0.15s" }}>
                <UserAvatar user={nu} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 500, color: P.ink }}>{u.name || u.handle}</div>
                  <HandleBadge handle={u.handle} style={{ fontSize: 12, fontWeight: 400, color: P.inkFaint }} />
                </div>
                {selected.includes(u.id) && <div style={{ width: 20, height: 20, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: P.ink, fontWeight: 700 }}>✓</div>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 24px 22px", borderTop: `1px solid ${P.lavenderLight}` }}>
          <button onClick={() => { if (canStart) onStart({ tab, selected, groupName }); }} disabled={!canStart} style={{ width: "100%", background: canStart ? P.lavender : P.lavenderLight, border: "none", borderRadius: 14, padding: "12px", fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: canStart ? P.ink : P.inkFaint, cursor: canStart ? "pointer" : "default", transition: "all 0.2s", opacity: canStart ? 1 : 0.6 }}>
            {tab === "dm" ? "Open conversation →" : selected.length >= 1 ? `Create group (${selected.length + 1} people) →` : "Select people to add →"}
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

const ConvoItem = ({ convo, isActive, onClick, onDelete, currentUserId }) => {
  const [hovered, setHovered] = useState(false);
  const isGroup = convo.isGroup;
  const lastMsg = convo.lastMessage;
  const unread = convo.unreadCount || 0;
  const displayUser = convo.displayAvatar;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 16, cursor: "pointer", background: isActive ? P.lavenderLight : hovered ? `${P.lavenderLight}88` : "transparent", border: `1.5px solid ${isActive ? P.lavender : "transparent"}`, transition: "all 0.15s", marginBottom: 3, position: "relative" }}>
      {isGroup
        ? <div style={{ width: 44, height: 44, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👥</div>
        : <UserAvatar user={displayUser} size={44} showStatus />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: unread > 0 ? 700 : 500, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {convo.displayName}
          </span>
          {!hovered && lastMsg && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, flexShrink: 0, marginLeft: 8 }}>{fmtTime(new Date(lastMsg.created_at).getTime())}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FF_S, fontSize: 12.5, color: unread > 0 ? P.ink : P.inkFaint, fontWeight: unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {lastMsg
              ? `${lastMsg.sender_id === currentUserId ? "You: " : isGroup ? `${lastMsg.profiles?.name?.split(" ")[0]}: ` : ""}${lastMsg.content}`
              : "No messages yet"}
          </span>
          {!hovered && unread > 0 && <div style={{ width: 18, height: 18, borderRadius: "50%", background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_S, fontSize: 10, fontWeight: 700, color: P.ink, flexShrink: 0, marginLeft: 8 }}>{unread}</div>}
        </div>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(convo.id); }}
          title="Delete conversation"
          style={{ background: P.white, border: `1px solid ${P.lavender}66`, borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: P.inkLight, flexShrink: 0, boxShadow: "0 1px 4px rgba(61,53,80,0.1)" }}
        >
          🗑
        </button>
      )}
    </div>
  );
};

const ConversationView = ({ convo, messages, messagesLoading, sendMessage, deleteMessage, setTyping, typingUsers, currentUserId }) => {
  const [input, setInput] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
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
            {isGroup ? `${(convo.otherMembers?.length || 0) + 1} members` : other?.handle || ""}
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
          const isHovered = hoveredMsgId === msg.id;
          return (
            <div key={msg.id}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "center", gap: 6, marginTop: msg.isFirst ? 14 : 2, animation: "fadeUp 0.2s ease both" }}>
              {!isMe && <div style={{ width: 28, flexShrink: 0, alignSelf: "flex-end" }}>{isLast && <UserAvatar user={sender} size={28} />}</div>}
              <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {msg.isFirst && !isMe && isGroup && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 3, marginLeft: 4 }}>{sender?.name?.split(" ")[0]}</span>}
                <div style={{ background: isMe ? P.lavender : P.white, border: isMe ? "none" : `1.5px solid ${P.lavender}44`, borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "9px 14px", fontFamily: FF_S, fontSize: 14, color: P.ink, lineHeight: 1.5, boxShadow: isMe ? `0 2px 12px ${P.lavender}50` : "0 1px 4px rgba(61,53,80,0.06)" }}>{msg.content}</div>
                {isLast && <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 3 }}>{fmtTime(new Date(msg.created_at).getTime())}</span>}
              </div>
              {isMe && (
                <button
                  onClick={() => deleteMessage && deleteMessage(msg.id)}
                  title="Delete message"
                  style={{ background: P.white, border: `1px solid ${P.lavender}66`, borderRadius: 8, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: P.inkLight, flexShrink: 0, opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? "auto" : "none", transition: "opacity 0.15s" }}
                >
                  🗑
                </button>
              )}
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

const DashboardPage = ({ user: userProp, view, onNavigate, profilePic, setProfilePic, widgetRequests, setWidgetRequests, following, toggleFollow, widgetReloadKey = 0}) => {
  const { user: authUser, profile, updateProfile } = useAuth();
  const user = userProp || authUser;

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Your Nook';
  const rawHandle = profile?.handle || '';
  const displayHandle = rawHandle
    ? (rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle)
    : user?.email
      ? '@' + user.email.split('@')[0]
      : '@you';

  const STORAGE_KEY = user ? `nook_widgets_${user.id}` : null;
  const ORDER_KEY   = user ? `nook_widget_order_${user.id}` : null;
  const DATA_KEY    = user ? `nook_widget_data_${user.id}` : null;

  // Load saved widget content (todos, links etc) from localStorage
  const savedWidgetData = (() => {
    if (DATA_KEY) {
      try { const s = localStorage.getItem(DATA_KEY); if (s) return JSON.parse(s); } catch {}
    }
    return {};
  })();

  // Initialize from localStorage immediately so widgets show without waiting for Supabase.
  // The load effect below will then override with the authoritative Supabase data.
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
  const [widgetOrder, setWidgetOrder] = useState(() =>
    INITIAL_WIDGETS.map(w => w.id)
  );
  // true once we've finished loading from Supabase (prevents saving before load)
  const loadedRef = useRef(false);

  // ── Lifted widget data — declared here so load effect can update them ────
  const [readingItems, setReadingItems] = useState(
    savedWidgetData.reading?.items ?? INITIAL_WIDGETS.find(w => w.id === "reading").data.items
  );
  const [goals, setGoals] = useState(
    savedWidgetData.goals?.items ?? INITIAL_WIDGETS.find(w => w.id === "goals").data.items
  );
  const [habits, setHabits] = useState(
    savedWidgetData.habitstreak?.habits ?? INITIAL_WIDGETS.find(w => w.id === "habitstreak").data.habits.map(h => ({ ...h, history: [] }))
  );
  const [pods, setPods] = useState(
    savedWidgetData.podcast?.pods ?? INITIAL_WIDGETS.find(w => w.id === "podcast").data.pods
  );
  const [exerciseChecked, setExerciseChecked] = useState(
    () => new Set(savedWidgetData.exercise?.checked ?? [])
  );

  // Load widget config: Supabase first, fall back to localStorage
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      console.log('[Nook] Loading widgets for user:', user.id);
      try {
        const { data, error } = await supabase
          .from('widget_configs')
          .select('widget_id, enabled, public, color_idx, sort_order, data')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });

        console.log('[Nook] widget_configs result:', { count: data?.length, error });

        if (data && data.length > 0) {
          console.log('[Nook] Found', data.length, 'widgets in Supabase, enabled:', data.filter(r=>r.enabled).map(r=>r.widget_id));
          // Supabase is the source of truth — it wins over localStorage so data is
          // consistent across devices and sessions.
          const dbDataMap = Object.fromEntries(data.filter(r => r.data).map(r => [r.widget_id, r.data]));
          const mergedData = { ...savedWidgetData, ...dbDataMap }; // Supabase overrides localStorage
          // Build config from Supabase
          const configMap = Object.fromEntries(data.map(r => [r.widget_id, r]));
          const merged = INITIAL_WIDGETS.map(w => ({
            ...w,
            enabled: configMap[w.id]?.enabled ?? false,
            isPublic: configMap[w.id]?.public ?? false,
            colorIdx: configMap[w.id]?.color_idx ?? w.colorIdx ?? 0,
            data: mergedData[w.id] ? { ...w.data, ...mergedData[w.id] } : w.data,
          }));
          const ordered = [...merged].sort((a, b) => {
            const ai = data.findIndex(r => r.widget_id === a.id);
            const bi = data.findIndex(r => r.widget_id === b.id);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
          // Also restore widgetData state from DB so widgets render with their content
          setWidgetData(mergedData);
          // Update lifted state variables that don't react to widgetData changes
          if (mergedData.reading?.items)     setReadingItems(mergedData.reading.items);
          if (mergedData.goals?.items)       setGoals(mergedData.goals.items);
          if (mergedData.habitstreak?.habits) setHabits(mergedData.habitstreak.habits);
          if (mergedData.podcast?.pods)      setPods(mergedData.podcast.pods);
          if (mergedData.exercise?.checked)  setExerciseChecked(new Set(mergedData.exercise.checked));
          console.log('[Nook] Setting widgets, enabled:', ordered.filter(w=>w.enabled).map(w=>w.id));
          setWidgets(ordered);
          setWidgetOrder(ordered.map(w => w.id));
        } else {
          console.log('[Nook] No Supabase data, trying localStorage. STORAGE_KEY:', STORAGE_KEY);
          const lsData = STORAGE_KEY ? localStorage.getItem(STORAGE_KEY) : null;
          console.log('[Nook] localStorage data exists:', !!lsData);
          // No Supabase data — try localStorage
          if (STORAGE_KEY && lsData) {
            try {
              const ws = JSON.parse(lsData);
              console.log('[Nook] localStorage widgets, enabled:', ws.filter(w=>w.enabled).map(w=>w.id));
              const merged = ws.map(w => savedWidgetData[w.id] ? { ...w, data: { ...w.data, ...savedWidgetData[w.id] } } : w);
              setWidgets(merged);
              // Auto-save to widget_configs so public profiles can show these widgets.
              // This runs once when widget_configs is empty (first time or new account).
              if (user?.id) {
                const orderSaved = ORDER_KEY ? localStorage.getItem(ORDER_KEY) : null;
                const ord = orderSaved ? JSON.parse(orderSaved) : merged.map(w => w.id);
                const rows = merged.map((w, i) => ({
                  user_id: user.id,
                  widget_id: w.id,
                  enabled: !!w.enabled,
                  public: !!w.isPublic,
                  color_idx: w.colorIdx ?? 0,
                  sort_order: ord.indexOf(w.id) >= 0 ? ord.indexOf(w.id) : i,
                }));
                supabase.from('widget_configs')
                  .upsert(rows, { onConflict: 'user_id,widget_id' })
                  .then(({ error }) => {
                    if (error) console.log('[Nook] Auto-save widget_configs error:', error);
                    else console.log('[Nook] Auto-saved', rows.length, 'widget_configs rows from localStorage');
                  });
              }
            } catch(e) { console.log('[Nook] localStorage parse error:', e); }
          }
          if (ORDER_KEY) {
            try {
              const saved = localStorage.getItem(ORDER_KEY);
              if (saved) setWidgetOrder(JSON.parse(saved));
            } catch {}
          }
        }
      } catch(e) {
        console.log('[Nook] Load error:', e);
        // Supabase failed — fall back to localStorage
        if (STORAGE_KEY) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const ws = JSON.parse(saved);
              setWidgets(ws.map(w => savedWidgetData[w.id] ? { ...w, data: { ...w.data, ...savedWidgetData[w.id] } } : w));
            }
          } catch {}
        }
        if (ORDER_KEY) {
          try { const saved = localStorage.getItem(ORDER_KEY); if (saved) setWidgetOrder(JSON.parse(saved)); } catch {}
        }
      }
      loadedRef.current = true;
    };
    load();
  }, [user?.id, widgetReloadKey]); // eslint-disable-line
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  // Sync bio when profile loads asynchronously (same pattern as name/handle in SettingsPage)
  useEffect(() => { if (profile?.bio !== undefined) setBio(profile.bio || ""); }, [profile?.bio]);
  const [bioLinks, setBioLinks] = useState([]);
  const [bioEmail, setBioEmail] = useState("");
  const [editBioLink, setEditBioLink] = useState(false);
  const [draftBioLinks, setDraftBioLinks] = useState(bioLinks);
  const [draftBioEmail, setDraftBioEmail] = useState(bioEmail);

  // Load bio links + widget expanded state from Supabase user_data table
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('user_data').select('key, value').eq('user_id', user.id).in('key', ['bio_links', 'widget_expanded'])
      .then(({ data }) => {
        if (!data) return;
        data.forEach(row => {
          if (row.key === 'bio_links' && row.value) {
            if (row.value.links) setBioLinks(row.value.links);
            if (row.value.email !== undefined) setBioEmail(row.value.email);
          }
          if (row.key === 'widget_expanded' && Array.isArray(row.value)) {
            const expanded = new Set(row.value);
            setExpandedWidgets(expanded);
            if (EXPAND_KEY) try { localStorage.setItem(EXPAND_KEY, JSON.stringify(row.value)); } catch {}
          }
        });
      });
  }, [user?.id]); // eslint-disable-line
  const EXPAND_KEY = user ? `nook_expanded_${user.id}` : null;
  const [expandedWidgets, setExpandedWidgets] = useState(() => {
    if (EXPAND_KEY) {
      try {
        const s = localStorage.getItem(EXPAND_KEY);
        if (s) return new Set(JSON.parse(s));
      } catch {}
    }
    return new Set(["gallery", "blog"]);
  });
  const [widgetSearch, setWidgetSearch] = useState("");
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showPublic, setShowPublic] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id)
      .then(({ count }) => { if (count !== null) setFollowerCount(count); });
  }, [user?.id]); // eslint-disable-line
  const toggleExpand = (id) => {
    // Compute new set outside the setter so side-effects can run cleanly
    const n = new Set(expandedWidgets);
    n.has(id) ? n.delete(id) : n.add(id);
    const arr = [...n];
    setExpandedWidgets(n);
    // Side-effects must live OUTSIDE the state-setter (React 18 StrictMode double-invokes
    // state-setter functions to detect impurity, causing duplicate writes and crashes)
    if (EXPAND_KEY) try { localStorage.setItem(EXPAND_KEY, JSON.stringify(arr)); } catch {}
    if (user?.id) {
      supabase.from('user_data')
        .upsert({ user_id: user.id, key: 'widget_expanded', value: arr }, { onConflict: 'user_id,key' })
        .catch(() => {});
    }
  };
  const fileInputRef = useRef(null);

  const [widgetData, setWidgetData] = useState(savedWidgetData);

  useEffect(() => {
    if (DATA_KEY) {
      try { localStorage.setItem(DATA_KEY, JSON.stringify(widgetData)); } catch {}
    }
  }, [widgetData, DATA_KEY]);

  // Stable ref so onDataChange can read old widget data without re-creating on every data update
  const widgetDataRef = useRef(savedWidgetData);
  useEffect(() => { widgetDataRef.current = widgetData; }, [widgetData]);

  // Publish a feed event (post) to Supabase when a meaningful widget update happens
  const publishFeedEvent = useCallback(async (type, payload, contentText) => {
    if (!user?.id) return;
    // Store content inside payload.text so it works even if the content column doesn't exist yet
    const fullPayload = { ...(payload || {}), text: contentText || null };
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      type,
      payload: fullPayload,
      is_public: true,
    });
    if (error) console.warn('[Nook] feed publish error', type, error.message);
  }, [user?.id]);

  const onDataChange = useCallback((widgetId, newData) => {
    const oldData = widgetDataRef.current[widgetId] || {};

    // ── Feed event detection — publish meaningful changes ──────────────────
    if (widgetId === 'mood') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const oldToday = (oldData.history || []).find(d => d.date === todayStr);
      const newToday = (newData.history || []).find(d => d.date === todayStr);
      if (newToday?.mood > 0 && (!oldToday || oldToday.mood === 0)) {
        const MOOD_LABELS = ["", "Rough", "Low", "Okay", "Good", "Great"];
        const MOOD_EMOJIS = ["", "😞", "😕", "😐", "🙂", "😊"];
        publishFeedEvent('mood',
          { mood: newToday.mood, note: newToday.note || null, date: todayStr },
          `Feeling ${MOOD_LABELS[newToday.mood]} today ${MOOD_EMOJIS[newToday.mood]}`);
      }
    }
    if (widgetId === 'blog') {
      const justPublished = (newData.posts || []).find(p => {
        const old = (oldData.posts || []).find(op => op.id === p.id);
        return p.published && (!old || !old.published);
      });
      if (justPublished) {
        publishFeedEvent('blog', {
          post: {
            id: justPublished.id,
            title: justPublished.title,
            body: (justPublished.body || '').slice(0, 300),
            category: justPublished.category,
            tags: justPublished.tags || [],
            coverColor: justPublished.coverColor,
            readTime: justPublished.readTime,
          }
        }, `Published: ${justPublished.title}`);
      }
    }
    if (widgetId === 'sports') {
      for (const newAct of (newData.activities || [])) {
        const oldAct = (oldData.activities || []).find(a => a.id === newAct.id);
        if (oldAct && (newAct.sessions || []).length > (oldAct.sessions || []).length) {
          const newSess = newAct.sessions[newAct.sessions.length - 1];
          publishFeedEvent('sports', {
            activity: { type: newAct.type, icon: newAct.icon, unit: newAct.unit },
            session: newSess,
          }, `Logged a ${newAct.type} session: ${newSess.value} ${newAct.unit}`);
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    setWidgetData(prev => ({ ...prev, [widgetId]: newData }));
    // Also keep widgets array in sync so widget.data stays fresh if the
    // component ever remounts — the useState initializer will pick up the
    // correct data instead of stale data from the last Supabase fetch.
    setWidgets(prev => prev.map(w =>
      w.id === widgetId ? { ...w, data: { ...w.data, ...newData } } : w
    ));
    // Persist to Supabase immediately (source of truth for all widget data)
    if (!user?.id) return;
    supabase.from('widget_configs')
      .upsert(
        { user_id: user.id, widget_id: widgetId, data: newData, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,widget_id', ignoreDuplicates: false }
      )
      .then(({ error }) => {
        if (error) console.warn('[Nook] widget data save error for', widgetId, error);
      });
  }, [user?.id, publishFeedEvent]);

  // Save widget config explicitly (called after user actions, not reactively)
  const saveWidgetConfig = useCallback(async (updatedWidgets, updatedOrder) => {
    const ws = updatedWidgets || widgets;
    const ord = updatedOrder || widgetOrder;
    // Save to localStorage immediately
    if (STORAGE_KEY) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ws)); } catch {}
    }
    if (ORDER_KEY) {
      try { localStorage.setItem(ORDER_KEY, JSON.stringify(ord)); } catch {}
    }
    // Save to Supabase
    if (!user?.id) return;
    try {
      const rows = ws.map((w, i) => ({
        user_id: user.id,
        widget_id: w.id,
        enabled: !!w.enabled,
        public: !!w.isPublic,
        color_idx: w.colorIdx ?? 0,
        sort_order: ord.indexOf(w.id) >= 0 ? ord.indexOf(w.id) : i,
      }));
      const { error } = await supabase.from('widget_configs').upsert(rows, { onConflict: 'user_id,widget_id' });
      if (error) console.log('[Nook] config save error:', error);
    } catch(e) { console.log('[Nook] Save error:', e); }
  }, [widgets, widgetOrder, STORAGE_KEY, ORDER_KEY, user?.id]);

  // widgetOrder is saved explicitly via saveWidgetConfig on user actions

  // Persist lifted state to widgetData whenever it changes
  useEffect(() => { setWidgetData(prev => ({ ...prev, reading:     { items: readingItems } })); }, [readingItems]);
  useEffect(() => { setWidgetData(prev => ({ ...prev, goals:       { items: goals } })); }, [goals]);
  useEffect(() => { setWidgetData(prev => ({ ...prev, habitstreak: { habits } })); }, [habits]);
  useEffect(() => { setWidgetData(prev => ({ ...prev, podcast:     { pods } })); }, [pods]);
  useEffect(() => { setWidgetData(prev => ({ ...prev, exercise:    { checked: [...exerciseChecked] } })); }, [exerciseChecked]);
  const togglePublic = (id) => {
    const updated = widgets.map(x => x.id === id ? { ...x, isPublic: !x.isPublic } : x);
    setWidgets(updated);
    saveWidgetConfig(updated, widgetOrder);
  };
  const toggleEnabled = (id) => {
    const updated = widgets.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x);
    const w = widgets.find(x => x.id === id);
    const updatedOrder = (w && !w.enabled)
      ? (widgetOrder.includes(id) ? widgetOrder : [...widgetOrder, id])
      : widgetOrder;
    setWidgets(updated);
    setWidgetOrder(updatedOrder);
    saveWidgetConfig(updated, updatedOrder);
  };

  // Drag and drop
  const onDragStart = (id) => setDragId(id);
  const onDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const arr = [...widgetOrder];
    const from = arr.indexOf(dragId), to = arr.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      arr.splice(from, 1); arr.splice(to, 0, dragId);
      setWidgetOrder(arr);
      saveWidgetConfig(widgets, arr);
    }
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
    // Helper: upsert widget data to Supabase so lifted-state widgets persist cross-device
    const saveToDb = (widgetId, data) => {
      if (!user?.id) return;
      supabase.from('widget_configs')
        .upsert(
          { user_id: user.id, widget_id: widgetId, data, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,widget_id', ignoreDuplicates: false }
        )
        .then(({ error }) => { if (error) console.warn('[Nook] lifted-state save error', widgetId, error); });
    };
    if (id === "reading") return {
      items: readingItems,
      setItems: (next) => {
        const resolved = typeof next === 'function' ? next(readingItems) : next;
        // Detect new book added (array grew)
        if (resolved.length > readingItems.length) {
          const newBook = resolved.find(b => !readingItems.some(r => r.title === b.title && r.author === b.author));
          if (newBook) publishFeedEvent('reading',
            { book: newBook, action: 'added' },
            `Added "${newBook.title}"${newBook.author ? ` by ${newBook.author}` : ''} to reading list`);
        }
        // Detect book just marked as finished
        const justFinished = resolved.find(b => {
          const prev = readingItems.find(r => r.title === b.title && r.author === b.author);
          return prev && prev.status !== 'done' && b.status === 'done';
        });
        if (justFinished) publishFeedEvent('reading',
          { book: justFinished, action: 'finished' },
          `Finished reading "${justFinished.title}"${justFinished.author ? ` by ${justFinished.author}` : ''} 📖`);
        setReadingItems(resolved);
        saveToDb('reading', { items: resolved });
      }
    };
    if (id === "goals") return {
      items: goals,
      setItems: (next) => {
        const resolved = typeof next === 'function' ? next(goals) : next;
        // Detect goals just completed
        resolved.forEach(g => {
          const prev = goals.find(old => old.id === g.id);
          if (prev && Number(g.progress) >= Number(g.total) && Number(prev.progress) < Number(prev.total)) {
            publishFeedEvent('goal',
              { goal: { id: g.id, name: g.name, total: g.total } },
              `Completed goal: ${g.name} 🎉`);
          }
        });
        setGoals(resolved);
        saveToDb('goals', { items: resolved });
      }
    };
    if (id === "habitstreak") return {
      habits,
      setHabits: (next) => {
        const resolved = typeof next === 'function' ? next(habits) : next;
        setHabits(resolved);
        saveToDb('habitstreak', { habits: resolved });
      }
    };
    if (id === "podcast") return {
      pods,
      setPods: (next) => {
        const resolved = typeof next === 'function' ? next(pods) : next;
        setPods(resolved);
        saveToDb('podcast', { pods: resolved });
      }
    };
    if (id === "exercise") return {
      checked: exerciseChecked,
      setChecked: (next) => {
        const resolved = typeof next === 'function' ? next(exerciseChecked) : next;
        // Detect newly checked days
        const newDays = [...resolved].filter(d => !exerciseChecked.has(d));
        if (newDays.length > 0) {
          try {
            const d = new Date(newDays[0] + 'T12:00:00');
            const dayStr = d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'short' });
            publishFeedEvent('exercise',
              { date: newDays[0] },
              `Logged exercise on ${dayStr} 💪`);
          } catch {}
        }
        setExerciseChecked(resolved);
        saveToDb('exercise', { checked: [...resolved] });
      }
    };
    if (id === "gallery")     return { authorName: profile?.name || user?.email?.split('@')[0] };
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
                <button onClick={async () => { setEditBio(false); try { await updateProfile({ bio }); } catch {} }} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "0 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>Save</button>
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
                    <button onClick={async () => {
                      const cleanLinks = draftBioLinks.filter(l => l.url.trim());
                      setBioLinks(cleanLinks);
                      setBioEmail(draftBioEmail);
                      setEditBioLink(false);
                      if (user?.id) {
                        await supabase.from('user_data').upsert(
                          { user_id: user.id, key: 'bio_links', value: { email: draftBioEmail, links: cleanLinks } },
                          { onConflict: 'user_id,key' }
                        );
                      }
                    }} style={{ background: P.lavender, border: "none", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: P.ink }}>Save</button>
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
                    <a key={i} href={ensureHttps(lnk.url)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FF_S, fontSize: 12, color: "#9B85D8", textDecoration: "none", fontWeight: 500, background: P.lavenderLight, borderRadius: 20, padding: "3px 11px" }}>
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
              <p style={{ margin: 0, color: P.inkLight, fontSize: 12 }}>Member since March 2025 · {publicWidgets.length} public widget{publicWidgets.length !== 1 ? "s" : ""} · <span style={{ color: "#9B85D8", fontWeight: 600 }}>{following?.length || 0} following</span> · <span style={{ color: "#9B85D8", fontWeight: 600 }}>{followerCount} follower{followerCount !== 1 ? "s" : ""}</span></p>
              {!showPublic && <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, padding: 0 }}>Change photo ✎</button>}
            </div>
          </div>
        </div>

        <div style={{ display: view === "dashboard" ? "block" : "none" }}>
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
                                <WidgetCard widget={w} isOwnDashboard={false} liveData={getLiveData(w.id)} />
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
                            <WidgetCard widget={w} onTogglePublic={() => togglePublic(w.id)} isOwnDashboard onToggleExpand={() => toggleExpand(w.id)} isExpanded={expandedWidgets.has(w.id)} dragHandleProps={{ draggable: false }} liveData={getLiveData(w.id)} onDataChange={(newData) => onDataChange(w.id, newData)} handle={profile?.handle} />
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
        </div>

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
            handle={displayHandle}
          />
        )}
      </div>
    </div>
  );
};

const MessagesPage = ({ requests, setRequests, pendingDmUserId, onPendingDmHandled }) => {
  const { user } = useAuth();
  const {
    conversations, activeConversation, messages, loading, messagesLoading,
    selectConversation, sendMessage, deleteMessage, deleteConversation, startDM, startGroupChat, refresh,
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

  // Auto-open or start a DM when arriving from the profile page Message button.
  // We wait until loading=false so conversations[] is populated before checking for an existing DM.
  useEffect(() => {
    if (!pendingDmUserId || loading) return;
    onPendingDmHandled?.();
    const existing = conversations.find(c => !c.isGroup && c.otherMembers?.some(m => m?.id === pendingDmUserId));
    if (existing) {
      handleSelect(existing.id);
    } else {
      startDM(pendingDmUserId).then(({ conversationId, error }) => {
        if (!error && conversationId) { handleSelect(conversationId); refresh(); }
      });
    }
  }, [pendingDmUserId, loading]); // eslint-disable-line

  const startConvo = async ({ tab, selected, groupName }) => {
    if (tab === "dm") {
      const { conversationId, error } = await startDM(selected[0]);
      if (!error && conversationId) handleSelect(conversationId);
    } else {
      const { conversationId, error } = await startGroupChat(selected, groupName);
      if (conversationId) {
        // Call handleSelect directly — selectConversation only needs the ID to open the chat,
        // it doesn't require the conversation to already be in the conversations list.
        // refresh() then updates the sidebar in the background.
        handleSelect(conversationId);
        refresh();
      }
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
                : filtered.map(c => <ConvoItem key={c.id} convo={c} isActive={activeConversation?.id === c.id} onClick={() => handleSelect(c.id)} onDelete={deleteConversation} currentUserId={user?.id} />)
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
              deleteMessage={deleteMessage}
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

      {showNew && <NewConvoModal onClose={() => setShowNew(false)} onStart={startConvo} currentUserId={user?.id} />}
    </div>
  );
};

const WORK_SECTIONS = [
  { id: "overview",  label: "Overview",   icon: "▦" },
  { id: "todos",     label: "To-Do",      icon: "✓" },
  { id: "notes",     label: "Notes",      icon: "✎" },
  { id: "calendar",  label: "Calendar",   icon: "📆" },
  { id: "reminders", label: "Reminders",  icon: "🔔" },
  { id: "workflow",  label: "Workflow",   icon: "⬡" },
  { id: "focus",     label: "Focus",      icon: "◎" },
  { id: "meetings",  label: "Meetings",   icon: "📅" },
];

const INIT_MASTER_TODOS = [];
const INIT_DAILY_TODOS = [];
const INIT_NOTES = [];
const INIT_REMINDERS = [
  { id: "r_ex1", text: "Add your first reminder here", date: "", done: false, _example: true },
];
const INIT_WORKFLOW_COLS = [
  { id: "wc1", title: "Backlog",     color: "#EDE8FB", dot: "#9B85D8", cards: [] },
  { id: "wc2", title: "In Progress", color: "#E4F8F2", dot: "#5DCAAA", cards: [] },
  { id: "wc3", title: "Review",      color: "#FEF0EA", dot: "#E8956A", cards: [] },
  { id: "wc4", title: "Done",        color: "#E8F3FC", dot: "#5AAADE", cards: [] },
];
const INIT_MEETINGS = [
  { id: "m_ex1", title: "Add your first meeting here", date: "", time: "", attendees: "", notes: "", done: false, _example: true },
];

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
  const [draftBody, setDraftBody]   = useState("");
  const [unsaved, setUnsaved]       = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const textareaRef      = useRef(null);
  const newTitleInputRef = useRef(null); // uncontrolled — value read/cleared via DOM
  // editorKey: incrementing on note creation forces React to unmount+remount the editor
  // panel, so the browser's native autoFocus fires fresh — bypassing StrictMode entirely.
  const [editorKey, setEditorKey] = useState(0);

  const activeNote = notes.find(n => n.id === active);
  const filtered   = notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()));
  const pinned     = filtered.filter(n => n.pinned);
  const unpinned   = filtered.filter(n => !n.pinned);

  // When active note changes, load its body into draft
  useEffect(() => {
    if (activeNote) { setDraftBody(activeNote.body); setUnsaved(false); }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // createNote: uses editorKey to force a full remount of the editor panel so the
  // browser's native autoFocus fires. This bypasses React.StrictMode (which
  // double-invokes effects/layout-effects and broke every timing-based approach).
  const createNote = (e) => {
    if (e) e.preventDefault();
    const title = newTitleInputRef.current?.value?.trim();
    if (!title) return;
    if (newTitleInputRef.current) newTitleInputRef.current.value = "";
    const note = { id: `n${Date.now()}`, title, body: "", pinned: false, color: Math.floor(Math.random() * NOTE_COLORS.length), ts: Date.now() };
    setNotes(ns => [note, ...ns]);
    setActive(note.id);
    setDraftBody("");
    setUnsaved(false);
    setCreating(false);
    setEditorKey(k => k + 1); // triggers editor remount → native autoFocus fires
  };
  const updateNote = (id, field, val) => setNotes(ns => ns.map(n => n.id === id ? { ...n, [field]: val, ts: Date.now() } : n));
  const saveBody = () => {
    if (!activeNote) return;
    updateNote(activeNote.id, "body", draftBody);
    setUnsaved(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };
  const deleteNote = (id) => { setNotes(ns => ns.filter(n => n.id !== id)); setActive(notes.find(n => n.id !== id)?.id ?? null); setUnsaved(false); };
  const togglePin  = (id) => setNotes(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const switchNote = (id) => {
    if (unsaved && activeNote) {
      // Auto-save draft before switching
      setNotes(ns => ns.map(n => n.id === activeNote.id ? { ...n, body: draftBody, ts: Date.now() } : n));
    }
    setActive(id); setUnsaved(false);
  };

  const [hoveredNoteId, setHoveredNoteId] = useState(null);

  const NoteItem = ({ note }) => {
    const c = NOTE_COLORS[note.color];
    const isHovered = hoveredNoteId === note.id;
    return (
      <div
        onClick={() => switchNote(note.id)}
        onMouseEnter={() => setHoveredNoteId(note.id)}
        onMouseLeave={() => setHoveredNoteId(null)}
        style={{ padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: active === note.id ? c.bg : P.white, border: `1.5px solid ${active === note.id ? c.border : P.lavender + "44"}`, cursor: "pointer", transition: "all 0.15s", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 20 }}>{note.title || "Untitled"}</span>
          {/* Pin — hidden behind delete on hover */}
          {!isHovered && (
            <span onClick={e => { e.stopPropagation(); togglePin(note.id); }} style={{ fontSize: 12, cursor: "pointer", marginLeft: 4, opacity: note.pinned ? 1 : 0.25, flexShrink: 0 }}>📌</span>
          )}
          {/* Delete button — visible on hover */}
          {isHovered && (
            <button
              onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
              title="Delete note"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#D8708A", fontSize: 14, padding: 0, flexShrink: 0, lineHeight: 1 }}>
              🗑
            </button>
          )}
        </div>
        <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkFaint, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.body || "No content yet"}</div>
        <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, marginTop: 4 }}>{new Date(note.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
      </div>
    );
  };

  // Auto-grow the textarea to fit its content
  const autoGrow = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  // Re-run auto-grow whenever the active note or its body changes
  useEffect(() => {
    if (textareaRef.current) autoGrow(textareaRef.current);
  }, [active, draftBody]);

  return (
    <div style={{ display: "flex", gap: 20, minHeight: 480 }}>
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
            <input ref={newTitleInputRef} autoFocus defaultValue="" onKeyDown={e => { if (e.key === "Enter") createNote(e); }} placeholder="Note title…" style={wi({ flex: 1, fontSize: 12 })} />
            <button onMouseDown={(e) => e.preventDefault()} onClick={createNote} style={{ background: P.lavender, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: P.ink }}>✓</button>
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
          <div key={editorKey} style={{ flex: 1, display: "flex", flexDirection: "column", background: c.bg, borderRadius: 18, border: `1.5px solid ${unsaved ? c.dot + "88" : c.border}`, padding: "20px 24px", transition: "border-color 0.2s" }}>
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
            <textarea ref={textareaRef} value={draftBody}
              onChange={e => { setDraftBody(e.target.value); setUnsaved(true); autoGrow(e.target); }}
              placeholder="Start writing…"
              autoFocus={editorKey > 0}
              style={{ width: "100%", background: "none", border: "none", outline: "none", fontFamily: FF_S, fontSize: 14, color: P.ink, resize: "none", lineHeight: 1.75, overflow: "hidden", minHeight: 160, boxSizing: "border-box" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>
                {draftBody.split(/\s+/).filter(Boolean).length} words · edited {new Date(activeNote.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                onClick={saveBody}
                style={{
                  background: savedFlash ? P.mint : unsaved ? c.dot : c.dot + "44",
                  color: savedFlash ? "#2A8A6A" : unsaved ? "#fff" : P.inkFaint,
                  border: "none", borderRadius: 10, padding: "6px 16px",
                  cursor: unsaved ? "pointer" : "default",
                  fontFamily: FF_S, fontSize: 12, fontWeight: 600,
                  transition: "all 0.25s",
                }}>
                {savedFlash ? "✓ Saved" : unsaved ? "Save" : "Saved"}
              </button>
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
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ text: "", date: "", time: "", priority: "medium" });

  const toggle = (id) => setReminders(rs => rs.map(r => r.id === id ? { ...r, done: !r.done } : r));
  const remove = (id) => { if (editingId === id) setEditingId(null); setReminders(rs => rs.filter(r => r.id !== id)); };
  const add    = () => {
    if (!draft.text.trim()) return;
    setReminders(rs => [...rs, { id: `r${Date.now()}`, ...draft, done: false }]);
    setDraft({ text: "", date: "", time: "", priority: "medium" }); setAdding(false);
  };
  const startEdit = (r) => { setEditingId(r.id); setEditDraft({ text: r.text, date: r.date || "", time: r.time || "", priority: r.priority || "medium" }); setAdding(false); };
  const saveEdit  = () => {
    if (!editDraft.text.trim()) return;
    setReminders(rs => rs.map(r => r.id === editingId ? { ...r, ...editDraft } : r));
    setEditingId(null);
  };

  const upcoming = reminders.filter(r => !r.done && !r._example).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const done     = reminders.filter(r => r.done && !r._example);
  const examples = reminders.filter(r => r._example);
  const today    = new Date().toISOString().slice(0, 10);
  const isOverdue = (r) => !r.done && r.date && r.date < today;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>{upcoming.length} upcoming · {done.length} done</span>
        <button onClick={() => { setAdding(v => !v); setEditingId(null); }} style={{ background: P.lavender, border: "none", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>+ Reminder</button>
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

      {upcoming.length === 0 && !adding && examples.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0 20px", color: P.inkFaint }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
          <div style={{ fontFamily: FF_S, fontSize: 13 }}>No reminders yet — add one above</div>
        </div>
      )}
      {/* Show placeholder example reminders when no real reminders exist */}
      {upcoming.length === 0 && examples.map(r => (
        <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 14, marginBottom: 8, background: P.bg, border: `1.5px dashed ${P.lavender}55`, opacity: 0.65 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2, background: "transparent", border: `2px dashed ${P.inkFaint}`, display: "flex", alignItems: "center", justifyContent: "center" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, fontStyle: "italic" }}>{r.text}</div>
            <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>placeholder — click + Reminder to add yours</div>
          </div>
        </div>
      ))}
      {upcoming.map(r => (
        <div key={r.id} style={{ marginBottom: 8 }}>
          {editingId === r.id ? (
            <div style={{ background: P.lavenderLight, borderRadius: 14, padding: "14px 16px", border: `1.5px solid ${P.lavender}88` }}>
              <input value={editDraft.text} onChange={e => setEditDraft(d => ({ ...d, text: e.target.value }))} onKeyDown={e => e.key === "Enter" && saveEdit()} placeholder="Reminder text" style={{ ...wi({ width: "100%", marginBottom: 8, boxSizing: "border-box" }) }} autoFocus />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input type="date" value={editDraft.date} onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))} style={wi({ flex: 1 })} />
                <input type="time" value={editDraft.time} onChange={e => setEditDraft(d => ({ ...d, time: e.target.value }))} style={wi({ width: 100 })} />
                {["high","medium","low"].map(p => (
                  <button key={p} onClick={() => setEditDraft(d => ({ ...d, priority: p }))} style={{ background: editDraft.priority === p ? PRIORITY_STYLE[p].dot : P.lavenderLight, color: editDraft.priority === p ? "#fff" : P.inkLight, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{PRIORITY_STYLE[p].label}</button>
                ))}
                <button onClick={saveEdit} style={{ background: P.lavender, color: P.ink, border: "none", borderRadius: 10, padding: "6px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Save</button>
                <button onClick={() => remove(r.id)} style={{ background: "#F0B8C8", color: "#D8708A", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600 }}>Delete</button>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15 }}>✕</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 14, background: r._example ? P.bg : isOverdue(r) ? P.roseLight : P.white, border: `1.5px solid ${r._example ? P.lavender + "33" : isOverdue(r) ? P.rose : P.lavender + "44"}`, transition: "all 0.2s", opacity: r._example ? 0.6 : 1 }}>
              <div onClick={() => !r._example && toggle(r.id)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2, background: "transparent", border: `2px dashed ${r._example ? P.inkFaint : isOverdue(r) ? "#D8708A" : P.lavender}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: r._example ? "default" : "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FF_S, fontSize: 13.5, color: r._example ? P.inkFaint : P.ink, fontWeight: 400, fontStyle: r._example ? "italic" : "normal" }}>{r.text}</div>
                {!r._example && <div style={{ fontFamily: FF_S, fontSize: 11.5, color: isOverdue(r) ? "#D8708A" : P.inkFaint, marginTop: 3 }}>
                  {isOverdue(r) ? "⚠ Overdue · " : "📅 "}{r.date}{r.time ? ` at ${r.time}` : ""}
                </div>}
                {r._example && <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginTop: 2 }}>example — click + Reminder to add yours</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                {!r._example && <span style={{ background: PRIORITY_STYLE[r.priority]?.bg, color: PRIORITY_STYLE[r.priority]?.text, borderRadius: 20, padding: "2px 8px", fontFamily: FF_S, fontSize: 10, fontWeight: 600 }}>{PRIORITY_STYLE[r.priority]?.label}</span>}
                {!r._example && <button onClick={() => startEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 13, padding: "0 2px" }} title="Edit">✎</button>}
                <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: r._example ? P.lavender + "88" : P.inkFaint, fontSize: 15, padding: 0 }}>×</button>
              </div>
            </div>
          )}
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

const WorkTodos = ({ masterTodos, setMasterTodos, dailyTodos, setDailyTodos, customLists, setCustomLists }) => {
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName]   = useState("");

  const addList = () => {
    if (!newListName.trim()) return;
    const newList = { id: `cl${Date.now()}`, name: newListName.trim(), items: [] };
    setCustomLists(prev => [...prev, newList]);
    setNewListName(""); setCreatingList(false);
  };
  const removeList = (id) => setCustomLists(prev => prev.filter(l => l.id !== id));
  const renameList = (id, name) => setCustomLists(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  const setListItems = (id, itemsOrFn) => setCustomLists(prev => prev.map(l => {
    if (l.id !== id) return l;
    const next = typeof itemsOrFn === "function" ? itemsOrFn(l.items) : itemsOrFn;
    return { ...l, items: next };
  }));

  return (
    <div>
      <div className="nook-work-grid">
        {/* Master list */}
        <div style={{ background: P.white, borderRadius: 20, padding: "24px 26px", border: `1.5px solid ${P.lavender}44`, boxShadow: "0 4px 20px rgba(201,184,240,0.08)" }}>
          <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: "0 0 18px", fontWeight: 400 }}>📋 Master List</h3>
          <WorkTodoList items={masterTodos} setItems={setMasterTodos} placeholder="Add to master list…" showDate />
        </div>
        {/* Today list */}
        <div style={{ background: P.white, borderRadius: 20, padding: "24px 26px", border: `1.5px solid ${P.lavender}44`, boxShadow: "0 4px 20px rgba(201,184,240,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, margin: 0, fontWeight: 400 }}>☀ Today</h3>
            <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</span>
          </div>
          <WorkTodoList items={dailyTodos} setItems={setDailyTodos} placeholder="Add for today…" />
        </div>
        {/* Custom lists */}
        {(customLists || []).map(list => (
          <div key={list.id} style={{ background: P.white, borderRadius: 20, padding: "24px 26px", border: `1.5px solid ${P.lavender}44`, boxShadow: "0 4px 20px rgba(201,184,240,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <input
                value={list.name}
                onChange={e => renameList(list.id, e.target.value)}
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: FF_D, fontSize: 18, color: P.ink, fontWeight: 400 }}
              />
              <button onClick={() => removeList(list.id)} title="Delete list" style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 15, padding: "0 2px", opacity: 0.5 }}>🗑</button>
            </div>
            <WorkTodoList items={list.items} setItems={(val) => setListItems(list.id, val)} placeholder={`Add to ${list.name}…`} />
          </div>
        ))}
      </div>

      {/* Add new list */}
      <div style={{ marginTop: 18 }}>
        {creatingList ? (
          <div style={{ display: "flex", gap: 8, maxWidth: 400 }}>
            <input autoFocus value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addList(); if (e.key === "Escape") setCreatingList(false); }} placeholder="List name…"
              style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "9px 14px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none" }} />
            <button onClick={addList} style={{ background: P.lavender, color: P.ink, border: "none", borderRadius: 12, padding: "9px 16px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600 }}>Create</button>
            <button onClick={() => setCreatingList(false)} style={{ background: "none", border: `1.5px solid ${P.lavender}44`, borderRadius: 12, padding: "9px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setCreatingList(true)} style={{ background: P.lavenderLight, border: `1.5px dashed ${P.lavender}`, borderRadius: 14, padding: "10px 18px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: "#9B85D8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            + New list
          </button>
        )}
      </div>
    </div>
  );
};

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

const WorkMeetings = ({ meetings, setMeetings }) => {
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

      {sorted.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "32px 0 20px", color: P.inkFaint }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
          <div style={{ fontFamily: FF_S, fontSize: 13 }}>No meetings yet — add one above</div>
        </div>
      )}
      {sorted.map(m => {
        const isToday = m.date === today;
        const isPast  = !m._example && m.date && m.date < today && !m.done;
        return (
          <div key={m.id} style={{ marginBottom: 10, borderRadius: 14, border: `1.5px solid ${m._example ? P.lavender + "33" : isToday ? P.lavender : P.lavender + "44"}`, background: m._example ? P.bg : isToday ? P.lavenderLight : P.white, overflow: "hidden", opacity: m._example ? 0.6 : m.done ? 0.6 : 1, transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: m._example ? "default" : "pointer" }} onClick={() => !m._example && setExpandId(expandId === m.id ? null : m.id)}>
              <div onClick={e => { e.stopPropagation(); if (!m._example) toggle(m.id); }} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: m.done ? P.lavender : "transparent", border: `2px ${m._example ? "dashed" : "solid"} ${m._example ? P.inkFaint : P.lavender}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: m._example ? "default" : "pointer" }}>
                {m.done && <span style={{ fontSize: 11, fontWeight: 700, color: P.ink }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: m._example ? 400 : 600, color: m._example ? P.inkFaint : P.ink, fontStyle: m._example ? "italic" : "normal", textDecoration: m.done ? "line-through" : "none" }}>{m.title}</div>
                <div style={{ fontFamily: FF_S, fontSize: 11.5, color: P.inkFaint, marginTop: 2 }}>
                  {m._example ? `example · ${m.time}${m.attendees ? ` · ${m.attendees}` : ""}` : `${isPast ? "⚠ Past · " : isToday ? "📅 Today · " : "📅 "}${m.date}${m.time ? ` ${m.time}` : ""}${m.attendees ? ` · ${m.attendees}` : ""}`}
                </div>
              </div>
              {!m._example && <span style={{ color: P.inkFaint, fontSize: 12 }}>{expandId === m.id ? "▲" : "▼"}</span>}
              <button onClick={e => { e.stopPropagation(); remove(m.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: m._example ? P.lavender + "88" : P.inkFaint, fontSize: 14, padding: 0 }}>×</button>
            </div>
            {expandId === m.id && !m._example && (
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
  const realTodos    = dailyTodos.filter(t => !t._example);
  const realMaster   = masterTodos.filter(t => !t._example);
  const realRems     = reminders.filter(r => !r._example);
  const realMtgs     = meetings.filter(m => !m._example);
  const dailyDone    = realTodos.filter(t => t.done).length;
  const masterActive = realMaster.filter(t => !t.done).length;
  const overdueRem   = realRems.filter(r => !r.done && r.date && r.date < today).length;
  const todayMtgs    = realMtgs.filter(m => m.date === today && !m.done);
  const upNextRem    = realRems.filter(r => !r.done && r.date && r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
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
        <StatCard icon="✓"  label="Daily tasks"    value={`${dailyDone}/${realTodos.length}`} sub="done today"          color="#9B85D8" onClick={() => onGoTo("todos")} />
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

// ─────────────────────────────────────────────────────────────────────────────
// WorkCalendar — full calendar with categories + user sharing
// ─────────────────────────────────────────────────────────────────────────────

const INIT_CAL_CATEGORIES = [
  { id: "work",     name: "Work",     color: "#9B85D8", shared: [] },
  { id: "personal", name: "Personal", color: "#5DCAAA", shared: [] },
  { id: "home",     name: "Home",     color: "#E8956A", shared: [] },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─────────────────────────────────────────────────────────────────────────────
// CalEventModal — defined OUTSIDE WorkCalendar so its reference is stable.
// Stable reference = React can correctly unmount it when showEventModal→false.
// ─────────────────────────────────────────────────────────────────────────────
const CAL_COLOR_PALETTE = ["#9B85D8","#5DCAAA","#E8956A","#5AAADE","#E88A8A","#F5C842","#B8D8F0","#F0B8C8"];

const CalEventModal = ({ ev, defaultDate, defaultCategoryId, categories, upsertEvent, deleteEvent, onAddCategory, sharedCalendarLabel, onClose }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [title,      setTitle]      = useState(ev?.title      || "");
  const [date,       setDate]       = useState(ev?.date       || defaultDate || todayStr);
  const [endDate,    setEndDate]    = useState(ev?.endDate    || "");
  const [time,       setTime]       = useState(ev?.time       || "");
  const [endTime,    setEndTime]    = useState(ev?.endTime    || "");
  const [categoryId, setCategoryId] = useState(ev?.categoryId || defaultCategoryId || categories[0]?.id || "");
  const [note,       setNote]       = useState(ev?.note       || "");
  const [showNewCal,    setShowNewCal]    = useState(false);
  const [newCalName,    setNewCalName]    = useState("");
  const [newCalColor,   setNewCalColor]   = useState(CAL_COLOR_PALETTE[0]);

  const inp = { border: `1.5px solid ${P.lavender}`, borderRadius: 10, padding: "7px 12px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", width: "100%", boxSizing: "border-box" };

  const submit = () => {
    if (!title.trim() || !date) return;
    const evData = { id: ev?.id, title: title.trim(), date, endDate, time, endTime, categoryId, note };
    onClose();
    upsertEvent(evData);
  };

  const confirmNewCal = () => {
    if (!newCalName.trim()) return;
    const id = `cat${Date.now()}`;
    onAddCategory(id, newCalName.trim(), newCalColor);
    setCategoryId(id);
    setNewCalName("");
    setShowNewCal(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.35)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, padding: "28px 28px", width: "100%", maxWidth: 420, boxShadow: "0 12px 48px rgba(61,53,80,0.2)", animation: "popIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sharedCalendarLabel ? 6 : 18 }}>
          <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: 0, fontWeight: 400 }}>{ev ? "Edit event" : "New event"}</h3>
          <button onClick={onClose} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: P.inkLight }}>×</button>
        </div>
        {sharedCalendarLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "5px 10px", background: "#5DCAAA18", borderRadius: 8, border: "1px solid #5DCAAA44" }}>
            <span style={{ fontSize: 12 }}>↗</span>
            <span style={{ fontFamily: FF_S, fontSize: 12, color: "#3a9a7a", fontWeight: 600 }}>{sharedCalendarLabel}</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" autoFocus style={inp} />
          {!sharedCalendarLabel && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {categories.map(c => (
                <button key={c.id} onClick={() => setCategoryId(c.id)} style={{ background: categoryId === c.id ? c.color : c.color + "33", color: categoryId === c.id ? "#fff" : P.ink, border: "none", borderRadius: 20, padding: "4px 13px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>{c.name}</button>
              ))}
              <button onClick={() => setShowNewCal(v => !v)} title="Create new calendar" style={{ background: showNewCal ? P.lavender : P.lavenderLight, border: `1.5px dashed ${P.lavender}`, borderRadius: 20, padding: "3px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontWeight: 600 }}>+ New</button>
            </div>
          )}
          {showNewCal && !sharedCalendarLabel && (
            <div style={{ background: P.lavenderLight, borderRadius: 12, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newCalName} onChange={e => setNewCalName(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmNewCal()} placeholder="Calendar name…" autoFocus style={{ ...inp, padding: "5px 10px", fontSize: 12 }} />
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {CAL_COLOR_PALETTE.map(col => (
                  <div key={col} onClick={() => setNewCalColor(col)} style={{ width: 18, height: 18, borderRadius: "50%", background: col, cursor: "pointer", border: newCalColor === col ? `2.5px solid ${P.ink}` : "2px solid transparent", flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={confirmNewCal} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 8, padding: "5px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600 }}>Create</button>
                <button onClick={() => { setShowNewCal(false); setNewCalName(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14, padding: "5px 8px" }}>✕</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 3 }}>Start date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 3 }}>End date (opt.)</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 3 }}>Start time (opt.)</div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, marginBottom: 3 }}>End time (opt.)</div>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} />
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Notes (optional)…" rows={2}
            style={{ ...inp, resize: "none", lineHeight: 1.6 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={submit} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, fontWeight: 600 }}>
              {ev ? "Save changes" : "Add event"}
            </button>
            {ev && (
              <button onClick={() => { const id = ev.id; onClose(); deleteEvent(id); }} style={{ background: "#F0B8C811", color: "#D8708A", border: "1.5px solid #F0B8C855", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13 }}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CalShareModal — defined OUTSIDE WorkCalendar for the same reason.
// ─────────────────────────────────────────────────────────────────────────────
const CalShareModal = ({ cat, currentUserId, events, updateCatShared, onClose }) => {
  const [search,         setSearch]         = useState("");
  const [results,        setResults]        = useState([]);
  const [shared,         setShared]         = useState(cat.shared || []);
  const [sharedProfiles, setSharedProfiles] = useState([]);

  useEffect(() => {
    if (!shared.length) return;
    supabase.from("profiles").select("id, name, handle, avatar_color").in("id", shared)
      .then(({ data }) => { if (data) setSharedProfiles(data); });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const q = search.replace(/^@/, "");
      const { data } = await supabase.from("profiles").select("id, name, handle, avatar_color")
        .neq("id", currentUserId || "").or(`name.ilike.%${q}%,handle.ilike.%${q}%`).limit(8);
      setResults(data || []);
    }, 280);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const addUser = (u) => {
    if (shared.includes(u.id)) return;
    setShared(s => [...s, u.id]);
    setSharedProfiles(ps => [...ps, u]);
    setSearch(""); setResults([]);
  };
  const removeUser = (id) => {
    setShared(s => s.filter(x => x !== id));
    setSharedProfiles(ps => ps.filter(p => p.id !== id));
  };
  const save = () => {
    onClose();
    updateCatShared(cat.id, shared);
    if (currentUserId) {
      const catEvents = events.filter(e => e.categoryId === cat.id);
      const prevShared = cat.shared || [];
      const removedIds = prevShared.filter(id => !shared.includes(id));
      if (removedIds.length) {
        supabase.from('calendar_shares').delete()
          .eq('from_user_id', currentUserId).eq('cat_id', cat.id)
          .in('to_user_id', removedIds).then(() => {}).catch(() => {});
      }
      for (const toId of shared) {
        supabase.from('calendar_shares').upsert({
          from_user_id: currentUserId, to_user_id: toId, cat_id: cat.id,
          cat_name: cat.name, cat_color: cat.color, events: catEvents,
          updated_at: new Date().toISOString()
        }, { onConflict: 'from_user_id,to_user_id,cat_id' }).then(() => {}).catch(() => {});
      }
    }
  };

  const avatarStyle = (u) => ({ width: 30, height: 30, borderRadius: "50%", background: u.avatar_color || P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_S, fontSize: 12, fontWeight: 700, color: P.ink, flexShrink: 0 });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.35)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, padding: "28px 28px", width: "100%", maxWidth: 400, boxShadow: "0 12px 48px rgba(61,53,80,0.2)", animation: "popIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontFamily: FF_D, fontSize: 19, color: P.ink, margin: 0, fontWeight: 400 }}>Share <span style={{ color: cat.color, fontWeight: 600 }}>{cat.name}</span> calendar</h3>
          <button onClick={onClose} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: P.inkLight }}>×</button>
        </div>
        <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: "0 0 14px" }}>People you share with can view events in this calendar on your public profile.</p>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: P.inkFaint }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or @handle…"
            style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 12px 8px 30px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box" }} />
        </div>
        {results.length > 0 && (
          <div style={{ background: P.white, border: `1px solid ${P.lavender}33`, borderRadius: 12, marginBottom: 10, maxHeight: 160, overflowY: "auto" }}>
            {results.map(u => (
              <div key={u.id} onClick={() => addUser(u)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${P.lavender}22` }}
                onMouseEnter={e => e.currentTarget.style.background = P.lavenderLight}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={avatarStyle(u)}>{(u.name || u.handle || "?")[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{u.name}</div>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>@{u.handle}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {sharedProfiles.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Shared with</div>
            {sharedProfiles.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${P.lavender}22` }}>
                <div style={avatarStyle(u)}>{(u.name || u.handle || "?")[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{u.name}</div>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>@{u.handle}</div>
                </div>
                <button onClick={() => removeUser(u.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        )}
        {sharedProfiles.length === 0 && (
          <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>Not shared with anyone yet</p>
        )}
        <button onClick={save} style={{ width: "100%", background: P.lavender, color: P.ink, border: "none", borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: FF_S, fontSize: 14, fontWeight: 600 }}>
          Save sharing settings
        </button>
      </div>
    </div>
  );
};

const WorkCalendar = ({ calendarData, setCalendarData, currentUserId }) => {
  const data = calendarData || { events: [], categories: INIT_CAL_CATEGORIES };
  const events     = data.events     || [];
  const categories = data.categories || INIT_CAL_CATEGORIES;

  const save = (patch) => setCalendarData({ ...data, ...patch });
  const saveEvents     = (evs)  => save({ events: evs });
  const saveCategories = (cats) => save({ categories: cats });

  const today  = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [view, setView] = useState("month"); // "month" | "week"
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null); // category id
  const [activeCatFilter, setActiveCatFilter] = useState("all");

  // ── Shared-with-me state ─────────────────────────────────────────────────
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [sharedProfiles, setSharedProfiles] = useState({});
  const [viewingSharedEvent, setViewingSharedEvent] = useState(null);
  const syncCalSharesTimerRef = useRef(null);

  // Load calendars that others have shared with me
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from('calendar_shares').select('*').eq('to_user_id', currentUserId)
      .then(async ({ data: rows }) => {
        if (!rows?.length) return;
        setSharedWithMe(rows);
        const ids = [...new Set(rows.map(r => r.from_user_id))];
        const { data: profs } = await supabase.from('profiles').select('id, name, handle').in('id', ids);
        if (profs) setSharedProfiles(Object.fromEntries(profs.map(p => [p.id, p])));
      });
  }, [currentUserId]); // eslint-disable-line

  // Keep shared categories synced → calendar_shares table (debounced 2.5 s)
  useEffect(() => {
    if (!currentUserId) return;
    const sharedCats = categories.filter(c => c.shared?.length > 0);
    if (!sharedCats.length) return;
    clearTimeout(syncCalSharesTimerRef.current);
    syncCalSharesTimerRef.current = setTimeout(() => {
      for (const cat of sharedCats) {
        const catEvents = events.filter(e => e.categoryId === cat.id);
        for (const toId of cat.shared) {
          supabase.from('calendar_shares').upsert({
            from_user_id: currentUserId, to_user_id: toId, cat_id: cat.id,
            cat_name: cat.name, cat_color: cat.color, events: catEvents,
            updated_at: new Date().toISOString()
          }, { onConflict: 'from_user_id,to_user_id,cat_id' }).catch(() => {});
        }
      }
    }, 2500);
    return () => clearTimeout(syncCalSharesTimerRef.current);
  }, [events, categories, currentUserId]); // eslint-disable-line

  // ── helpers ─────────────────────────────────────────────────────────────
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const todayStr = today.toISOString().slice(0, 10);

  // Build a contrib event object tagged with display metadata
  const _tagContrib = (c, color, fromId, catId) => ({
    ...c.event_data,
    _isOwn: false,
    _isContribution: true,
    _isMine: c.contributor_id === currentUserId,
    _contribDbId: c.id,
    _contribUserId: c.contributor_id,
    _swmColor: color,
    _swmFromId: fromId,
    _swmCatId: catId,
  });

  const eventsForDay = (dateStr) => {
    const isSwmFilter = activeCatFilter.startsWith("swm::");

    // ── Own events (user's calendarData) ────────────────────────────────────
    const own = !isSwmFilter
      ? events.filter(e => e.date === dateStr && (activeCatFilter === "all" || e.categoryId === activeCatFilter))
              .map(e => ({ ...e, _isOwn: true, _isContribution: false }))
      : [];

    // ── Contributions to MY OWN calendars (I am the sharer) ─────────────────
    // These show up when a recipient adds events and I view my own calendar.
    const ownCalContribs = !isSwmFilter
      ? contributions
          .filter(c => c.calendar_owner_id === currentUserId &&
            c.event_data.date === dateStr &&
            (activeCatFilter === "all" || c.cat_id === activeCatFilter))
          .map(c => _tagContrib(c, catById[c.cat_id]?.color || P.lavender, currentUserId, c.cat_id))
      : [];

    // ── Shared-with-me: sharer's events + ALL participants' contributions ────
    const contribsForShare = (s) =>
      contributions
        .filter(c => c.calendar_owner_id === s.from_user_id && c.cat_id === s.cat_id && c.event_data.date === dateStr)
        .map(c => _tagContrib(c, s.cat_color, s.from_user_id, s.cat_id));

    const swmEventsFromRow = (s) => [
      ...(s.events || []).filter(e => e.date === dateStr)
        .map(e => ({ ...e, _isOwn: false, _isContribution: false, _swmColor: s.cat_color, _swmFromId: s.from_user_id, _swmCatId: s.cat_id })),
      ...contribsForShare(s),
    ];

    const swm = isSwmFilter
      ? sharedWithMe
          .filter(s => activeCatFilter === `swm::${s.from_user_id}::${s.cat_id}`)
          .flatMap(swmEventsFromRow)
      : activeCatFilter === "all"
        ? sharedWithMe.flatMap(swmEventsFromRow)
        : [];

    return [...own, ...ownCalContribs, ...swm];
  };

  // ── Event CRUD ──────────────────────────────────────────────────────────
  const deleteEvent = (id) => saveEvents(events.filter(e => e.id !== id));
  const upsertEvent = (ev) => {
    const next = ev.id && events.find(e => e.id === ev.id)
      ? events.map(e => e.id === ev.id ? ev : e)
      : [...events, { ...ev, id: `ev${Date.now()}` }];
    saveEvents(next);
  };

  // ── Category CRUD ───────────────────────────────────────────────────────
  const addCategory = (name, color) => {
    const id = `cat${Date.now()}`;
    saveCategories([...categories, { id, name, color, shared: [] }]);
  };
  const deleteCategory = (id) => {
    saveCategories(categories.filter(c => c.id !== id));
    saveEvents(events.filter(e => e.categoryId !== id));
  };
  const updateCatShared = (catId, userIds) => {
    saveCategories(categories.map(c => c.id === catId ? { ...c, shared: userIds } : c));
  };
  const onAddCategory = (id, name, color) => {
    saveCategories([...categories, { id, name, color, shared: [] }]);
  };

  // ── Contributions: events added by any participant to a shared calendar ──
  // Stored in calendar_contributions table; RLS ensures ALL participants
  // (calendar owner + every recipient) can read all rows for that calendar.
  const [contributions,     setContributions]     = useState([]);
  const [contributorProfiles, setContributorProfiles] = useState({}); // id → { name, handle }

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from('calendar_contributions').select('*')
      .then(async ({ data }) => {
        if (!data?.length) return;
        setContributions(data);
        // Load profiles for every unique contributor we don't already know
        const ids = [...new Set(data.map(c => c.contributor_id).filter(id => id !== currentUserId))];
        if (!ids.length) return;
        const { data: profs } = await supabase.from('profiles').select('id, name, handle').in('id', ids);
        if (profs) setContributorProfiles(Object.fromEntries(profs.map(p => [p.id, p])));
      });
  }, [currentUserId]); // eslint-disable-line

  const addContribEvent = (ownerId, catId, evData) => {
    const evWithId = { ...evData, id: evData.id || `ev${Date.now()}` };
    const tempId = `tmp_${Date.now()}`;
    const tempRow = { id: tempId, calendar_owner_id: ownerId, cat_id: catId, contributor_id: currentUserId, event_data: evWithId };
    setContributions(prev => [...prev, tempRow]);
    supabase.from('calendar_contributions')
      .insert({ calendar_owner_id: ownerId, cat_id: catId, contributor_id: currentUserId, event_data: evWithId })
      .select('id').single()
      .then(({ data }) => {
        if (data?.id) setContributions(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id } : c));
      })
      .catch(() => setContributions(prev => prev.filter(c => c.id !== tempId)));
  };
  const upsertContribEvent = (contribDbId, ownerId, catId, evData) => {
    setContributions(prev => prev.map(c => c.id === contribDbId ? { ...c, event_data: evData } : c));
    supabase.from('calendar_contributions')
      .update({ event_data: evData, updated_at: new Date().toISOString() })
      .eq('id', contribDbId).then(() => {}).catch(() => {});
  };
  const deleteContribEvent = (contribDbId) => {
    setContributions(prev => prev.filter(c => c.id !== contribDbId));
    supabase.from('calendar_contributions').delete().eq('id', contribDbId).then(() => {}).catch(() => {});
  };

  // ── Month grid ──────────────────────────────────────────────────────────
  const numDays   = daysInMonth(viewYear, viewMonth);
  const startPad  = firstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((startPad + numDays) / 7) * 7;

  const [newCatName, setNewCatName]   = useState("");
  const [newCatColor, setNewCatColor] = useState("#B8D8F0");
  const [showAddCat, setShowAddCat]   = useState(false);
  const [clickedDate, setClickedDate] = useState(null);


  return (
    <div style={{ display: "flex", gap: 20 }}>

      {/* ── Left: Category sidebar ────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Calendars</div>

        {/* All filter */}
        <button onClick={() => setActiveCatFilter("all")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: activeCatFilter === "all" ? P.lavenderLight : "transparent", border: `1.5px solid ${activeCatFilter === "all" ? P.lavender : "transparent"}`, borderRadius: 10, cursor: "pointer", marginBottom: 4, textAlign: "left" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: P.lavender, flexShrink: 0 }} />
          <span style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, flex: 1 }}>All calendars</span>
        </button>

        {categories.map(cat => (
          <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
            <button onClick={() => setActiveCatFilter(cat.id === activeCatFilter ? "all" : cat.id)}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: activeCatFilter === cat.id ? cat.color + "22" : "transparent", border: `1.5px solid ${activeCatFilter === cat.id ? cat.color + "66" : "transparent"}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
              {cat.shared?.length > 0 && <span style={{ fontSize: 10 }} title={`Shared with ${cat.shared.length} person${cat.shared.length > 1 ? "s" : ""}`}>👥</span>}
            </button>
            {/* Share + delete icons */}
            <button onClick={() => setShowShareModal(cat.id)} title="Share calendar" style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 13, padding: "2px 4px" }}>↗</button>
            {!["work","personal","home"].includes(cat.id) && (
              <button onClick={() => deleteCategory(cat.id)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14, padding: "2px 4px" }}>×</button>
            )}
          </div>
        ))}

        {/* Add category */}
        {showAddCat ? (
          <div style={{ marginTop: 8, background: P.lavenderLight, borderRadius: 12, padding: 10 }}>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" autoFocus
              style={{ width: "100%", border: `1.5px solid ${P.lavender}`, borderRadius: 8, padding: "5px 9px", fontFamily: FF_S, fontSize: 12, background: P.white, color: P.ink, outline: "none", boxSizing: "border-box", marginBottom: 7 }} />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 7 }}>
              {CAL_COLOR_PALETTE.map(col => (
                <div key={col} onClick={() => setNewCatColor(col)}
                  style={{ width: 18, height: 18, borderRadius: "50%", background: col, cursor: "pointer", border: newCatColor === col ? "2.5px solid " + P.ink : "2px solid transparent", flexShrink: 0 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => { if (newCatName.trim()) { addCategory(newCatName.trim(), newCatColor); setNewCatName(""); setShowAddCat(false); } }} style={{ flex: 1, background: P.lavender, color: P.ink, border: "none", borderRadius: 8, padding: "5px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600 }}>Add</button>
              <button onClick={() => setShowAddCat(false)} style={{ background: "none", border: "none", cursor: "pointer", color: P.inkFaint, fontSize: 14 }}>✕</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddCat(true)} style={{ width: "100%", marginTop: 8, background: "none", border: `1.5px dashed ${P.lavender}88`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, textAlign: "left" }}>+ New calendar</button>
        )}

        {/* Mini note about sharing */}
        <div style={{ marginTop: 16, padding: "10px", background: P.lavenderLight, borderRadius: 10, fontFamily: FF_S, fontSize: 11, color: P.inkFaint, lineHeight: 1.5 }}>
          💡 Use ↗ to share a calendar with other Nook users. They'll see your events on your profile.
        </div>

        {/* Shared with me section */}
        {sharedWithMe.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${P.lavender}33` }}>
            <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Shared with me</div>
            {sharedWithMe.map(share => {
              const filterId = `swm::${share.from_user_id}::${share.cat_id}`;
              const prof = sharedProfiles[share.from_user_id];
              return (
                <button key={filterId}
                  onClick={() => setActiveCatFilter(activeCatFilter === filterId ? "all" : filterId)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: activeCatFilter === filterId ? share.cat_color + "22" : "transparent", border: `1.5px solid ${activeCatFilter === filterId ? share.cat_color + "66" : "transparent"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: share.cat_color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FF_S, fontSize: 12, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{share.cat_name}</div>
                    <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint }}>from {prof?.name || prof?.handle || "someone"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: Calendar grid ──────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nav header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: P.ink }}>‹</button>
          <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: 0, fontWeight: 400, flex: 1 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button onClick={nextMonth} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: P.ink }}>›</button>
          {/* Today button */}
          <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
            style={{ background: P.lavender, color: P.ink, border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600 }}>Today</button>
          {/* Add event */}
          <button onClick={() => { setEditingEvent(null); setClickedDate(todayStr); setShowEventModal(true); }}
            style={{ background: P.lavender, color: P.ink, border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 12, fontWeight: 600 }}>+ Event</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ fontFamily: FF_S, fontSize: 11, fontWeight: 700, color: P.inkFaint, textAlign: "center", padding: "4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - startPad + 1;
            const isValid = dayNum >= 1 && dayNum <= numDays;
            const dateStr = isValid ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` : null;
            const isToday = dateStr === todayStr;
            const dayEvents = dateStr ? eventsForDay(dateStr) : [];

            return (
              <div key={i}
                onClick={() => { if (!isValid) return; setClickedDate(dateStr); setEditingEvent(null); setShowEventModal(true); }}
                style={{ minHeight: 80, borderRadius: 10, background: isToday ? P.lavenderLight : P.white, border: `1.5px solid ${isToday ? P.lavender : P.lavender + "22"}`, padding: "6px 6px 4px", cursor: isValid ? "pointer" : "default", transition: "background 0.1s", boxSizing: "border-box", opacity: isValid ? 1 : 0.2 }}
                onMouseEnter={e => { if (isValid) e.currentTarget.style.background = P.lavenderLight; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? P.lavenderLight : P.white; }}>
                {isValid && (
                  <>
                    <div style={{ fontFamily: FF_S, fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#9B85D8" : P.ink, textAlign: "right", marginBottom: 3 }}>{dayNum}</div>
                    {dayEvents.slice(0, 3).map(ev => {
                      // _isOwn: from my calendarData  |  _isContribution+_isMine: I contributed it
                      // _isContribution+!_isMine: someone else contributed  |  neither: sharer's event
                      const editable = ev._isOwn || (ev._isContribution && ev._isMine);
                      const dotColor = ev._isOwn ? (catById[ev.categoryId]?.color || P.lavender) : ev._swmColor;
                      const evKey = ev._isOwn ? ev.id : `${ev._isContribution ? 'c' : 's'}_${ev._swmFromId}_${ev._swmCatId}_${ev._contribDbId || ev.id}`;
                      return (
                        <div key={evKey}
                          onClick={e => {
                            e.stopPropagation();
                            if (editable) { setEditingEvent(ev); setClickedDate(ev.date); setShowEventModal(true); }
                            else { setViewingSharedEvent(ev); }
                          }}
                          style={{ background: dotColor + "22", borderLeft: `3px solid ${dotColor}`, borderRadius: 4, padding: "2px 5px", marginBottom: 2, fontFamily: FF_S, fontSize: 10.5, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", opacity: editable ? 1 : 0.85 }}
                          title={ev._isContribution && !ev._isMine ? `Added by ${contributorProfiles[ev._contribUserId]?.name || contributorProfiles[ev._contribUserId]?.handle || "a participant"}` : ev._isOwn ? undefined : `Shared by ${sharedProfiles[ev._swmFromId]?.name || sharedProfiles[ev._swmFromId]?.handle || "someone"}`}>
                          {ev._isContribution && ev._isMine && <span style={{ opacity: 0.7, marginRight: 2, fontSize: 9 }}>✎</span>}
                          {ev._isContribution && !ev._isMine && <span style={{ opacity: 0.6, marginRight: 2, fontSize: 9 }}>+</span>}
                          {!ev._isOwn && !ev._isContribution && <span style={{ opacity: 0.6, marginRight: 2, fontSize: 9 }}>↗</span>}
                          {ev.time && <span style={{ opacity: 0.7, marginRight: 3 }}>{ev.time}</span>}{ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div style={{ fontFamily: FF_S, fontSize: 10, color: P.inkFaint, paddingLeft: 4 }}>+{dayEvents.length - 3} more</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showEventModal && (() => {
        const isSwmActive = activeCatFilter.startsWith("swm::");
        const isEditingContrib = editingEvent?._isContribution;
        // Determine owner/cat for the target shared calendar
        const [, filterFromId, filterCatId] = isSwmActive ? activeCatFilter.split("::") : [];
        const targetOwnerId = isEditingContrib ? editingEvent._swmFromId : filterFromId;
        const targetCatId   = isEditingContrib ? editingEvent._swmCatId  : filterCatId;
        // Is this a shared-calendar operation at all?
        const isSharedOp = !!(targetOwnerId && targetCatId);
        const shareRow = isSharedOp
          ? sharedWithMe.find(s => s.from_user_id === targetOwnerId && s.cat_id === targetCatId)
          : null;
        // Use contribution CRUD when targeting a shared calendar
        const modalUpsert = isSharedOp
          ? (ev) => {
              if (isEditingContrib && editingEvent._contribDbId) {
                upsertContribEvent(editingEvent._contribDbId, targetOwnerId, targetCatId, ev);
              } else {
                addContribEvent(targetOwnerId, targetCatId, ev);
              }
            }
          : upsertEvent;
        const modalDelete = isSharedOp
          ? (id) => deleteContribEvent(editingEvent._contribDbId)
          : deleteEvent;
        const swmProf    = shareRow ? sharedProfiles[shareRow.from_user_id] : null;
        const swmCatName = shareRow?.cat_name;
        // Label: shown when adding/editing in a shared calendar
        const sharedLabel = isSharedOp
          ? `${swmProf?.name || swmProf?.handle || "Shared"} · ${swmCatName || targetCatId}`
          : null;
        return (
          <CalEventModal
            ev={editingEvent}
            defaultDate={clickedDate}
            defaultCategoryId={!isSwmActive && !isEditingContrib && activeCatFilter !== "all" ? activeCatFilter : undefined}
            categories={categories}
            upsertEvent={modalUpsert}
            deleteEvent={modalDelete}
            onAddCategory={onAddCategory}
            sharedCalendarLabel={sharedLabel}
            onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
          />
        );
      })()}
      {showShareModal && (() => {
        const cat = categories.find(c => c.id === showShareModal);
        return cat ? <CalShareModal cat={cat} currentUserId={currentUserId} events={events} updateCatShared={updateCatShared} onClose={() => setShowShareModal(null)} /> : null;
      })()}
      {/* Read-only view for shared-with-me events */}
      {viewingSharedEvent && (() => {
        const ev = viewingSharedEvent;
        const isContrib = ev._isContribution && !ev._isMine;
        const contribProf = isContrib ? contributorProfiles[ev._contribUserId] : null;
        const sharerProf  = sharedProfiles[ev._swmFromId];
        const authorName  = isContrib
          ? (contribProf?.name || contribProf?.handle || "a participant")
          : (sharerProf?.name  || sharerProf?.handle  || "the calendar owner");
        const calendarOwnerName = sharerProf?.name || sharerProf?.handle || "the calendar owner";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.35)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setViewingSharedEvent(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, padding: "28px 28px", width: "100%", maxWidth: 380, boxShadow: "0 12px 48px rgba(61,53,80,0.2)", animation: "popIn 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: "0 0 4px", fontWeight: 400 }}>{ev.title}</h3>
                  <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>
                    {isContrib ? `Added by ${authorName}` : `Shared by ${authorName}`}
                  </div>
                </div>
                <button onClick={() => setViewingSharedEvent(null)} style={{ background: P.lavenderLight, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: P.inkLight, flexShrink: 0, marginLeft: 10 }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FF_S, fontSize: 13, color: P.ink }}>
                <div><span style={{ color: P.inkFaint, marginRight: 8 }}>📅</span>{ev.date}{ev.endDate && ` → ${ev.endDate}`}</div>
                {ev.time && <div><span style={{ color: P.inkFaint, marginRight: 8 }}>🕐</span>{ev.time}{ev.endTime && ` – ${ev.endTime}`}</div>}
                {ev.note && <div style={{ background: P.lavenderLight, borderRadius: 10, padding: "8px 12px", color: P.inkLight, fontStyle: "italic", lineHeight: 1.5 }}>{ev.note}</div>}
              </div>
              <div style={{ marginTop: 14, padding: "8px 12px", background: "#5DCAAA11", borderRadius: 10, border: "1px solid #5DCAAA44", fontFamily: FF_S, fontSize: 11, color: "#3a9a7a" }}>
                {isContrib
                  ? `👀 Read-only · added by ${authorName} to ${calendarOwnerName}'s calendar`
                  : `👀 Read-only · shared by ${authorName}`}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const WorkPage = () => {
  const { user, profile } = useAuth();
  const [section, setSection] = useState(() => {
    try { const s = localStorage.getItem(`nook_work_section`); if (s && WORK_SECTIONS.find(w => w.id === s)) return s; } catch {}
    return "overview";
  });
  const goToSection = (s) => {
    setSection(s);
    try { localStorage.setItem(`nook_work_section`, s); } catch {}
  };

  // ── Persistence keys (localStorage cache) ────────────────────────────────
  const WORK_MASTER_KEY    = user ? `nook_work_master_${user.id}`    : null;
  const WORK_DAILY_KEY     = user ? `nook_work_daily_${user.id}`     : null;
  const WORK_NOTES_KEY     = user ? `nook_work_notes_${user.id}`     : null;
  const WORK_CUSTOM_KEY    = user ? `nook_work_custom_${user.id}`    : null;
  const WORK_CALENDAR_KEY  = user ? `nook_work_calendar_${user.id}`  : null;
  const WORK_REMINDERS_KEY = user ? `nook_work_reminders_${user.id}` : null;
  const WORK_MEETINGS_KEY  = user ? `nook_work_meetings_${user.id}`  : null;

  const loadLS = (key, fallback) => {
    if (!key) return fallback;
    try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch {}
    return fallback;
  };

  // Initialise with defaults only — user.id is null at first render so localStorage
  // keys are also null and can't be read here.  Data loads in the useEffect below.
  const [masterTodos,   setMasterTodosRaw]  = useState(INIT_MASTER_TODOS);
  const [dailyTodos,    setDailyTodosRaw]   = useState(INIT_DAILY_TODOS);
  const [notes,         setNotesRaw]        = useState(INIT_NOTES);
  const [customLists,   setCustomListsRaw]  = useState([]);
  const [reminders,     setRemindersRaw]    = useState(INIT_REMINDERS);
  const [meetings,      setMeetingsRaw]     = useState(INIT_MEETINGS);
  const [calendarData,  setCalendarDataRaw] = useState(null);

  // Refs that mirror state — updated synchronously in each setter so we can compute
  // "next" immediately (without relying on the functional-updater trick, which is
  // unreliable in React 18: updater functions run during the render phase, so the
  // "let next" capture approach leaves next=undefined when saveWorkData is called).
  const notesRef     = useRef(notes);
  const masterRef    = useRef(masterTodos);
  const dailyRef     = useRef(dailyTodos);
  const customRef    = useRef(customLists);
  const calendarRef  = useRef(null);
  const remindersRef = useRef(INIT_REMINDERS);
  const meetingsRef  = useRef(INIT_MEETINGS);

  // ── Save helper ───────────────────────────────────────────────────────────
  const saveWorkData = useCallback((sbKey, lsKey, value) => {
    if (lsKey) try { localStorage.setItem(lsKey, JSON.stringify(value)); } catch {}
    if (user?.id) {
      supabase.from('user_data')
        .upsert({ user_id: user.id, key: sbKey, value }, { onConflict: 'user_id,key' })
        .then(({ error }) => { if (error) console.error('[WorkPage] save error for', sbKey, error); })
        .catch(err => console.error('[WorkPage] save network error for', sbKey, err));
    }
  }, [user?.id]); // eslint-disable-line

  // ── Persistent setters (update state + localStorage + Supabase) ───────────
  // Use a ref to compute next synchronously (avoids the "let next" anti-pattern where
  // React 18 queues functional updaters for the render phase — leaving next=undefined).
  // We update the ref immediately so chained calls within the same event handler
  // always see the latest value without waiting for a re-render.
  const setMasterTodos = useCallback((val) => {
    const next = typeof val === "function" ? val(masterRef.current) : val;
    masterRef.current = next;
    setMasterTodosRaw(next);
    saveWorkData('work_todos_master', WORK_MASTER_KEY, next);
  }, [saveWorkData, WORK_MASTER_KEY]); // eslint-disable-line

  const setDailyTodos = useCallback((val) => {
    const next = typeof val === "function" ? val(dailyRef.current) : val;
    dailyRef.current = next;
    setDailyTodosRaw(next);
    saveWorkData('work_todos_daily', WORK_DAILY_KEY, next);
  }, [saveWorkData, WORK_DAILY_KEY]); // eslint-disable-line

  const setNotes = useCallback((val) => {
    const next = typeof val === "function" ? val(notesRef.current) : val;
    notesRef.current = next;
    setNotesRaw(next);
    saveWorkData('work_notes', WORK_NOTES_KEY, next);
  }, [saveWorkData, WORK_NOTES_KEY]); // eslint-disable-line

  const setCustomLists = useCallback((val) => {
    const next = typeof val === "function" ? val(customRef.current) : val;
    customRef.current = next;
    setCustomListsRaw(next);
    saveWorkData('work_todos_custom', WORK_CUSTOM_KEY, next);
  }, [saveWorkData, WORK_CUSTOM_KEY]); // eslint-disable-line

  const setCalendarData = useCallback((val) => {
    const next = typeof val === "function" ? val(calendarRef.current) : val;
    calendarRef.current = next;
    setCalendarDataRaw(next);
    saveWorkData('work_calendar', WORK_CALENDAR_KEY, next);
  }, [saveWorkData, WORK_CALENDAR_KEY]); // eslint-disable-line

  const setReminders = useCallback((val) => {
    const next = typeof val === "function" ? val(remindersRef.current) : val;
    remindersRef.current = next;
    setRemindersRaw(next);
    saveWorkData('work_reminders', WORK_REMINDERS_KEY, next);
  }, [saveWorkData, WORK_REMINDERS_KEY]); // eslint-disable-line

  const setMeetings = useCallback((val) => {
    const next = typeof val === "function" ? val(meetingsRef.current) : val;
    meetingsRef.current = next;
    setMeetingsRaw(next);
    saveWorkData('work_meetings', WORK_MEETINGS_KEY, next);
  }, [saveWorkData, WORK_MEETINGS_KEY]); // eslint-disable-line

  // ── Load data on login ────────────────────────────────────────────────────
  // Step 1 (sync): pull from localStorage — user.id is now available so keys are valid.
  //   This gives instant data without waiting for the network.
  // Step 2 (async): pull from Supabase — authoritative cross-device source of truth.
  //   Overrides localStorage if the server has newer/different data.
  useEffect(() => {
    if (!user?.id) return;

    // Step 1 — localStorage (instant)
    const lsMaster    = loadLS(WORK_MASTER_KEY,    null);
    const lsDaily     = loadLS(WORK_DAILY_KEY,     null);
    const lsNotes     = loadLS(WORK_NOTES_KEY,     null);
    const lsCustom    = loadLS(WORK_CUSTOM_KEY,    null);
    const lsCalendar  = loadLS(WORK_CALENDAR_KEY,  null);
    const lsReminders = loadLS(WORK_REMINDERS_KEY, null);
    const lsMeetings  = loadLS(WORK_MEETINGS_KEY,  null);
    if (lsMaster)    { masterRef.current    = lsMaster;    setMasterTodosRaw(lsMaster); }
    if (lsDaily)     { dailyRef.current     = lsDaily;     setDailyTodosRaw(lsDaily); }
    if (lsNotes)     { notesRef.current     = lsNotes;     setNotesRaw(lsNotes); }
    if (lsCustom)    { customRef.current    = lsCustom;    setCustomListsRaw(lsCustom); }
    if (lsCalendar)  { calendarRef.current  = lsCalendar;  setCalendarDataRaw(lsCalendar); }
    if (lsReminders) { remindersRef.current = lsReminders; setRemindersRaw(lsReminders); }
    if (lsMeetings)  { meetingsRef.current  = lsMeetings;  setMeetingsRaw(lsMeetings); }

    // Step 2 — Supabase (authoritative, async)
    const sbKeys = ['work_notes', 'work_todos_master', 'work_todos_daily', 'work_todos_custom', 'work_calendar', 'work_reminders', 'work_meetings'];
    // safeParse: handles jsonb objects (returned as-is) and any JSON strings (legacy format)
    const safeParse = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
      return v;
    };
    supabase.from('user_data').select('key, value').eq('user_id', user.id).in('key', sbKeys)
      .then(({ data, error }) => {
        if (error) { console.error('[WorkPage] Supabase load error:', error); return; }
        if (!data) return;
        const map = Object.fromEntries(data.map(d => [d.key, safeParse(d.value)]));
        const keysInDb = new Set(data.map(d => d.key));

        // Apply Supabase data (overrides localStorage — it is the cross-device source of truth)
        if (map.work_todos_master) { masterRef.current    = map.work_todos_master; setMasterTodosRaw(map.work_todos_master);   if (WORK_MASTER_KEY)    try { localStorage.setItem(WORK_MASTER_KEY,    JSON.stringify(map.work_todos_master)); }   catch {} }
        if (map.work_todos_daily)  { dailyRef.current     = map.work_todos_daily;  setDailyTodosRaw(map.work_todos_daily);     if (WORK_DAILY_KEY)     try { localStorage.setItem(WORK_DAILY_KEY,    JSON.stringify(map.work_todos_daily)); }    catch {} }
        if (map.work_notes)        { notesRef.current     = map.work_notes;        setNotesRaw(map.work_notes);               if (WORK_NOTES_KEY)     try { localStorage.setItem(WORK_NOTES_KEY,    JSON.stringify(map.work_notes)); }          catch {} }
        if (map.work_todos_custom) { customRef.current    = map.work_todos_custom; setCustomListsRaw(map.work_todos_custom);   if (WORK_CUSTOM_KEY)    try { localStorage.setItem(WORK_CUSTOM_KEY,   JSON.stringify(map.work_todos_custom)); }   catch {} }
        if (map.work_calendar)     { calendarRef.current  = map.work_calendar;     setCalendarDataRaw(map.work_calendar);     if (WORK_CALENDAR_KEY)  try { localStorage.setItem(WORK_CALENDAR_KEY, JSON.stringify(map.work_calendar)); }       catch {} }
        if (map.work_reminders)    { remindersRef.current = map.work_reminders;    setRemindersRaw(map.work_reminders);       if (WORK_REMINDERS_KEY) try { localStorage.setItem(WORK_REMINDERS_KEY, JSON.stringify(map.work_reminders)); }     catch {} }
        if (map.work_meetings)     { meetingsRef.current  = map.work_meetings;     setMeetingsRaw(map.work_meetings);         if (WORK_MEETINGS_KEY)  try { localStorage.setItem(WORK_MEETINGS_KEY,  JSON.stringify(map.work_meetings)); }      catch {} }

        // Migration: if localStorage has data for a key that doesn't exist in Supabase yet,
        // push it now so it's available from any browser going forward.
        const toMigrate = [
          !keysInDb.has('work_todos_master') && lsMaster    ? { user_id: user.id, key: 'work_todos_master', value: lsMaster }    : null,
          !keysInDb.has('work_todos_daily')  && lsDaily     ? { user_id: user.id, key: 'work_todos_daily',  value: lsDaily }     : null,
          !keysInDb.has('work_notes')        && lsNotes     ? { user_id: user.id, key: 'work_notes',        value: lsNotes }     : null,
          !keysInDb.has('work_todos_custom') && lsCustom    ? { user_id: user.id, key: 'work_todos_custom', value: lsCustom }    : null,
          !keysInDb.has('work_calendar')     && lsCalendar  ? { user_id: user.id, key: 'work_calendar',     value: lsCalendar }  : null,
          !keysInDb.has('work_reminders')    && lsReminders ? { user_id: user.id, key: 'work_reminders',    value: lsReminders } : null,
          !keysInDb.has('work_meetings')     && lsMeetings  ? { user_id: user.id, key: 'work_meetings',     value: lsMeetings }  : null,
        ].filter(Boolean);
        if (toMigrate.length > 0) {
          supabase.from('user_data').upsert(toMigrate, { onConflict: 'user_id,key' })
            .then(({ error: mErr }) => { if (mErr) console.error('[WorkPage] migration error:', mErr); })
            .catch(err => console.error('[WorkPage] migration network error:', err));
        }
      });
  }, [user?.id]); // eslint-disable-line

  const displayName = profile?.name || user?.email?.split('@')[0] || 'there';
  const active = WORK_SECTIONS.find(s => s.id === section);

  return (
    <div className="nook-sidebar-layout" style={{ background: P.bg }}>
      {/* Sidebar nav */}
      <div className="nook-sidebar" style={{ background: P.white, borderRight: `1px solid ${P.lavender}22` }}>
        <div className="nook-sidebar-title" style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 14px 6px", paddingLeft: "22px" }}>
          <span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink }}>Work</span>
          <span style={{ fontFamily: FF_S, fontSize: 9, background: P.lavender, color: "#9B85D8", borderRadius: 20, padding: "2px 8px", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Private</span>
        </div>
        <p className="nook-sidebar-footer" style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, margin: "0 0 12px", paddingLeft: 22, lineHeight: 1.5 }}>Only visible to you</p>
        <div className="nook-sidebar-nav-inner" style={{ padding: "0 10px 16px" }}>
          {WORK_SECTIONS.map(s => (
            <button key={s.id} onClick={() => goToSection(s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: section === s.id ? P.lavenderLight : "transparent", border: `1.5px solid ${section === s.id ? P.lavender : "transparent"}`, borderRadius: 12, cursor: "pointer", marginBottom: 3, textAlign: "left", transition: "all 0.15s" }}>
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
          {section === "overview"  && <WorkOverview masterTodos={masterTodos} dailyTodos={dailyTodos} reminders={reminders} meetings={meetings} onGoTo={goToSection} />}
          {section === "todos"     && <WorkTodos masterTodos={masterTodos} setMasterTodos={setMasterTodos} dailyTodos={dailyTodos} setDailyTodos={setDailyTodos} customLists={customLists} setCustomLists={setCustomLists} />}
          {section === "notes"     && <WorkNotes notes={notes} setNotes={setNotes} />}
          {section === "reminders" && <WorkReminders reminders={reminders} setReminders={setReminders} />}
          {section === "kanban" || section === "workflow" ? <WorkKanban /> : null}
          {section === "focus"     && <WorkFocus />}
          {section === "meetings"  && <WorkMeetings meetings={meetings} setMeetings={setMeetings} />}
          {section === "calendar"  && <WorkCalendar calendarData={calendarData} setCalendarData={setCalendarData} currentUserId={user?.id} />}
        </div>
      </div>
    </div>
  );
};
const WidgetRequestModal = ({ onClose, onSubmit, handle }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ id: `wr${Date.now()}`, name: name.trim(), desc: desc.trim(), user: handle || ME_BASE.handle, ts: Date.now(), status: "new" });
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



const AdminPage = ({ widgetRequests, setWidgetRequests }) => {
  const { user } = useAuth();
  const {
    users: adminUsers, setUsers: setAdminUsers,
    signupsByDay, widgetUsage, loading: adminLoading, error: adminError,
    totalUsers, activeUsers, weekSignups, todayVisitors, todaySignups,
    suspendUser, deleteUser, refresh,
  } = useAdminData();

  const [section, setSection] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: "", body: "" });
  const [annSent, setAnnSent] = useState(false);
  const [wqFilter, setWqFilter] = useState("all");
  // Track which request IDs have been "seen" — persisted to localStorage so badge stays
  // cleared after logout/login (only reappears if new requests arrive)
  const { user: adminUser } = useAuth();
  const SEEN_KEY = adminUser?.id ? `nook_seen_requests_${adminUser.id}` : null;
  const [seenRequestIds, setSeenRequestIds] = useState(new Set());
  // Load from localStorage once adminUser is available (useState initializer runs before
  // useAuth resolves, so SEEN_KEY would be null on first render — useEffect is correct here)
  useEffect(() => {
    if (!SEEN_KEY) return;
    try { const s = localStorage.getItem(SEEN_KEY); if (s) setSeenRequestIds(new Set(JSON.parse(s))); } catch {}
  }, [SEEN_KEY]); // eslint-disable-line

  useEffect(() => {
    if (section === "requests") {
      setSeenRequestIds(prev => {
        const next = new Set(prev);
        widgetRequests.forEach(r => next.add(r.id));
        if (SEEN_KEY) try { localStorage.setItem(SEEN_KEY, JSON.stringify([...next])); } catch {}
        return next;
      });
    }
  }, [section]); // eslint-disable-line

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
    { id: "requests",      icon: "✦",  label: "Widget Requests", badge: widgetRequests.filter(r => r.status === "new" && !seenRequestIds.has(r.id)).length },
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

  const WidgetUsageSection = () => {
    // Sort widgets by enabled count descending, using real widgetUsage data
    const maxCount = Math.max(1, ...Object.values(widgetUsage));
    const sorted = [...INITIAL_WIDGETS]
      .map(w => ({ ...w, count: widgetUsage[w.id] || 0 }))
      .sort((a, b) => b.count - a.count);
    const hasAnyData = Object.keys(widgetUsage).length > 0;
    return (
      <div>
        {sectionHead("Widget Usage", "Which widgets are most popular across all users")}
        {card(
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint }}>{totalUsers} registered users</span>
              {!hasAnyData && <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, background: P.lavenderLight, borderRadius: 20, padding: "3px 12px" }}>No widget data yet</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sorted.slice(0, 12).map((w, i) => {
                const pct = hasAnyData ? Math.round((w.count / maxCount) * 100) : 0;
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 22, fontFamily: FF_S, fontSize: 12, color: P.inkFaint, textAlign: "right", flexShrink: 0 }}>#{i+1}</div>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: WIDGET_COLORS[i % WIDGET_COLORS.length].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{w.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>{w.title}</span>
                        <span style={{ fontFamily: FF_S, fontSize: 12, color: w.count > 0 ? P.ink : P.inkFaint, fontWeight: w.count > 0 ? 600 : 400 }}>
                          {w.count > 0 ? `${w.count} user${w.count !== 1 ? "s" : ""}` : "—"}
                        </span>
                      </div>
                      <div style={{ background: P.lavenderLight, borderRadius: 20, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: WIDGET_COLORS[i % WIDGET_COLORS.length].dot, borderRadius: 20, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

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
                    <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>from <HandleBadge handle={r.user} /> · {new Date(r.ts).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}</div>
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

// Rich inline preview for a widget-type feed card
const FeedWidgetPreview = ({ item }) => {
  const p = item.payload || {};
  const type = item.type;

  if (type === 'reading' && p.book) {
    const isFinished = p.action === 'finished';
    return (
      <div style={{ marginTop: 10, background: P.lavenderLight, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 44, height: 60, borderRadius: 8, background: P.lavender, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 3 }}>
            {isFinished ? "Finished reading" : "Added to reading list"}
          </div>
          <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, fontWeight: 400, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.book.title}</div>
          {p.book.author && <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginTop: 2 }}>{p.book.author}</div>}
          {p.book.rating > 0 && <div style={{ marginTop: 5, fontSize: 12 }}>{"★".repeat(p.book.rating)}{"☆".repeat(5 - p.book.rating)}</div>}
        </div>
        {isFinished && <div style={{ fontSize: 28 }}>✓</div>}
      </div>
    );
  }

  if (type === 'sports' && p.activity && p.session) {
    return (
      <div style={{ marginTop: 10, background: "#5DCAAA15", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", border: "1px solid #5DCAAA33" }}>
        <div style={{ fontSize: 32 }}>{p.activity.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: "#3BAA80", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 3 }}>Session logged</div>
          <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, fontWeight: 400 }}>{p.activity.type}</div>
          <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginTop: 2 }}>
            {p.session.value} {p.activity.unit}
            {p.session.date ? ` · ${new Date(p.session.date + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}` : ''}
          </div>
          {p.session.note && <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginTop: 4, fontStyle: "italic" }}>{p.session.note}</div>}
        </div>
      </div>
    );
  }

  if (type === 'exercise' && p.date) {
    const dateStr = (() => { try { return new Date(p.date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'short' }); } catch { return p.date; } })();
    return (
      <div style={{ marginTop: 10, background: "#E8956A15", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", border: "1px solid #E8956A33" }}>
        <div style={{ fontSize: 32 }}>💪</div>
        <div>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: "#E8956A", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 3 }}>Exercise logged</div>
          <div style={{ fontFamily: FF_S, fontSize: 14, color: P.ink }}>{dateStr}</div>
        </div>
      </div>
    );
  }

  if (type === 'mood' && p.mood) {
    const MOOD_LABELS = ["", "Rough", "Low", "Okay", "Good", "Great"];
    const MOOD_EMOJIS = ["", "😞", "😕", "😐", "🙂", "😊"];
    const MOOD_COLORS = ["", "#D8708A", "#E8956A", "#C8A830", "#5DCAAA", "#9B85D8"];
    return (
      <div style={{ marginTop: 10, background: MOOD_COLORS[p.mood] + "18", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", border: `1px solid ${MOOD_COLORS[p.mood]}33` }}>
        <div style={{ fontSize: 36 }}>{MOOD_EMOJIS[p.mood]}</div>
        <div>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: MOOD_COLORS[p.mood], textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 3 }}>Today's mood</div>
          <div style={{ fontFamily: FF_D, fontSize: 17, color: P.ink, fontWeight: 400 }}>{MOOD_LABELS[p.mood]}</div>
          {p.note && <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, marginTop: 4, fontStyle: "italic" }}>"{p.note}"</div>}
        </div>
      </div>
    );
  }

  if (type === 'blog' && p.post) {
    const excerpt = (p.post.body || '').slice(0, 160) + (p.post.body?.length > 160 ? '…' : '');
    return (
      <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: `1px solid ${P.lavender}44` }}>
        <div style={{ height: 6, background: p.post.coverColor || P.lavender }} />
        <div style={{ padding: "12px 16px", background: P.lavenderLight }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            {p.post.category && <span style={{ background: P.lavender + "55", borderRadius: 20, padding: "2px 10px", fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600 }}>{p.post.category}</span>}
            {p.post.readTime && <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{p.post.readTime} min read</span>}
          </div>
          <div style={{ fontFamily: FF_D, fontSize: 16, color: P.ink, fontWeight: 400, lineHeight: 1.35, marginBottom: 6 }}>{p.post.title}</div>
          {excerpt && <div style={{ fontFamily: FF_S, fontSize: 13, color: P.inkLight, lineHeight: 1.6 }}>{excerpt}</div>}
          {(p.post.tags || []).length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
              {p.post.tags.map(t => <span key={t} style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, background: P.lavender + "33", borderRadius: 20, padding: "2px 9px" }}>#{t}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'goal' && p.goal) {
    return (
      <div style={{ marginTop: 10, background: "#5DCAAA15", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", border: "1px solid #5DCAAA44" }}>
        <div style={{ fontSize: 28 }}>🎉</div>
        <div>
          <div style={{ fontFamily: FF_S, fontSize: 11, color: "#3BAA80", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 3 }}>Goal completed!</div>
          <div style={{ fontFamily: FF_S, fontSize: 14, color: P.ink, fontWeight: 500 }}>{p.goal.name}</div>
        </div>
      </div>
    );
  }

  return null;
};

const RealFeedCard = ({ item, currentUserId, onLike, onComment, onDelete, onViewUser, isHighlighted }) => {
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

  // Derive a clean caption for widget events (hide it when the rich preview covers it)
  const widgetTypes = ['reading','sports','exercise','mood','blog','goal'];
  const isWidgetPost = widgetTypes.includes(item.type);

  return (
    <div id={`feed-post-${item.id}`} style={{ background: P.white, borderRadius: 20, padding: "20px 24px", boxShadow: isHighlighted ? `0 0 0 3px ${P.lavender}, 0 2px 24px rgba(61,53,80,0.14)` : "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${isHighlighted ? P.lavender : P.lavender + "22"}`, transition: "box-shadow 0.4s, border 0.4s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div onClick={() => onViewUser?.(poster)} style={{ cursor: "pointer" }}>
          <UserAvatar user={poster} size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{poster?.name}</span>
              <HandleBadge handle={poster?.handle} style={{ fontSize: 12, marginLeft: 8, fontWeight: 400, color: P.inkFaint }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{fmtTime(new Date(item.created_at).getTime())}</span>
              {isOwn && <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: P.inkFaint, padding: "2px 6px", borderRadius: 8 }}>✕</button>}
            </div>
          </div>
          {/* For plain posts, show the text content; for widget posts, show only if there's extra context */}
          {item.content && !isWidgetPost && <p style={{ fontFamily: FF_S, fontSize: 14, color: P.ink, margin: "8px 0 0", lineHeight: 1.6 }}>{item.content}</p>}
          {item.image_url && <img src={item.image_url} alt="" style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 320, objectFit: "cover" }} />}
          {/* Rich widget preview */}
          <FeedWidgetPreview item={item} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, paddingTop: 12, borderTop: `1px solid ${P.lavender}22` }}>
        <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: item.isLiked ? "#D8708A" : P.inkFaint, display: "flex", alignItems: "center", gap: 5, fontWeight: item.isLiked ? 600 : 400 }}>
          {item.isLiked ? "♥" : "♡"} {item.likeCount}
        </button>
        <button onClick={() => setShowComments(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: showComments ? P.ink : P.inkFaint, display: "flex", alignItems: "center", gap: 5 }}>
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


const FeedSidebar = ({ onNavigate, toggleFollow, following = [], onViewUser, currentUserId }) => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followedProfiles, setFollowedProfiles] = useState([]);
  const [followerProfiles, setFollowerProfiles] = useState([]);
  const [peopleTab, setPeopleTab] = useState("following"); // "following" | "followers"

  // Load suggested users (real profiles from Supabase, excluding self)
  useEffect(() => {
    const load = async () => {
      try {
                const { data } = await supabase
          .from('profiles')
          .select('id, name, handle, avatar_color, bio')
          .neq('id', currentUserId || '')
          .limit(10);
        if (data) setSuggestedUsers(data);
      } catch {}
    };
    load();
  }, [currentUserId]);

  // Load profiles for people we follow
  useEffect(() => {
    if (!following.length) { setFollowedProfiles([]); return; }
    const load = async () => {
      try {
                const { data } = await supabase
          .from('profiles')
          .select('id, name, handle, avatar_color, bio')
          .in('id', following);
        if (data) setFollowedProfiles(data);
      } catch {}
    };
    load();
  }, [following]);

  // Load profiles of people who follow the current user
  useEffect(() => {
    if (!currentUserId) { setFollowerProfiles([]); return; }
    const load = async () => {
      try {
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', currentUserId);
        if (!followData?.length) { setFollowerProfiles([]); return; }
        const { data } = await supabase
          .from('profiles')
          .select('id, name, handle, avatar_color, bio')
          .in('id', followData.map(f => f.follower_id));
        if (data) setFollowerProfiles(data);
      } catch {}
    };
    load();
  }, [currentUserId]);

  // Debounced search against real profiles
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
                const q = query.trim().toLowerCase();
        const { data } = await supabase
          .from('profiles')
          .select('id, name, handle, avatar_color, bio')
          .neq('id', currentUserId || '')
          .or(`name.ilike.%${q}%,handle.ilike.%${q}%`)
          .limit(8);
        setSearchResults(data || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  const notFollowed = suggestedUsers.filter(u => !following.includes(u.id));

  // Normalise a DB profile row to the shape UserRow expects
  const norm = (u) => ({
    ...u,
    color: u.avatar_color || P.lavender,
    initials: (u.name || u.handle || "?").slice(0, 2).toUpperCase(),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 96 }}>
      {/* Find people */}
      <div style={{ background: P.white, borderRadius: 20, padding: "20px", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${P.lavender}44` }}>
        <div style={{ fontFamily: FF_D, fontSize: 17, color: P.ink, marginBottom: 14 }}>Find people</div>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: P.inkFaint, pointerEvents: "none" }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search by name or handle…"
            style={{ width: "100%", border: `1.5px solid ${focused ? P.lavender : P.lavender + "66"}`, borderRadius: 12, padding: "8px 12px 8px 32px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
          />
        </div>

        {/* Search results */}
        {query.trim().length > 0 && (
          searching ? (
            <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: 0, textAlign: "center", padding: "10px 0" }}>Searching…</p>
          ) : searchResults.length === 0 ? (
            <p style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, margin: 0, textAlign: "center", padding: "10px 0" }}>No users found</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {searchResults.map(u => (
                <UserRow key={u.id} u={norm(u)} isFollowing={following.includes(u.id)} onToggle={() => toggleFollow(u.id)} onView={() => onViewUser(norm(u))} />
              ))}
            </div>
          )
        )}

        {/* Following / Followers tabs when not searching */}
        {query.trim().length === 0 && (
          <>
            {(followedProfiles.length > 0 || followerProfiles.length > 0) && (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {[["following", `Following (${followedProfiles.length})`], ["followers", `Followers (${followerProfiles.length})`]].map(([tab, label]) => (
                    <button key={tab} onClick={() => setPeopleTab(tab)} style={{ flex: 1, background: peopleTab === tab ? P.lavender : P.lavenderLight, border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: peopleTab === tab ? 700 : 400, color: P.ink }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {peopleTab === "following" && followedProfiles.map(u => (
                    <UserRow key={u.id} u={norm(u)} isFollowing={true} onToggle={() => toggleFollow(u.id)} onView={() => onViewUser(norm(u))} />
                  ))}
                  {peopleTab === "following" && followedProfiles.length === 0 && (
                    <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: 0, textAlign: "center", padding: "8px 0" }}>You're not following anyone yet</p>
                  )}
                  {peopleTab === "followers" && followerProfiles.map(u => (
                    <UserRow key={u.id} u={norm(u)} isFollowing={following.includes(u.id)} onToggle={() => toggleFollow(u.id)} onView={() => onViewUser(norm(u))} />
                  ))}
                  {peopleTab === "followers" && followerProfiles.length === 0 && (
                    <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, margin: 0, textAlign: "center", padding: "8px 0" }}>No followers yet</p>
                  )}
                </div>
                <div style={{ borderTop: `1px solid ${P.lavender}22`, margin: "14px 0 10px" }} />
              </>
            )}
            {notFollowed.length > 0 && (
              <>
                <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Suggested</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {notFollowed.slice(0, 4).map(u => (
                    <UserRow key={u.id} u={norm(u)} isFollowing={false} onToggle={() => toggleFollow(u.id)} onView={() => onViewUser(norm(u))} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Go to dashboard */}
      <div style={{ background: `linear-gradient(135deg, ${P.lavenderLight}, ${P.white})`, borderRadius: 20, padding: "18px 20px", boxShadow: "0 2px 16px rgba(61,53,80,0.06)", border: `1px solid ${P.lavender}44` }}>
        <p style={{ fontFamily: FF_D, fontSize: 15, color: P.ink, margin: "0 0 12px", lineHeight: 1.4 }}>Keep your Nook fresh ✦</p>
        <button onClick={() => onNavigate("dashboard")} style={{ width: "100%", background: P.lavender, border: "none", borderRadius: 12, padding: "9px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>Go to my dashboard →</button>
      </div>
    </div>
  );
};

const UserRow = ({ u, isFollowing, onToggle, onView }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div onClick={onView} style={{ cursor: "pointer", flexShrink: 0 }}>
      <UserAvatar user={u} size={36} />
    </div>
    <div onClick={onView} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
      <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
      <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{u.handle}</div>
    </div>
    <button
      onClick={onToggle}
      style={{ flexShrink: 0, background: isFollowing ? P.lavenderLight : P.lavender, border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontFamily: FF_S, fontSize: 11, fontWeight: 600, color: isFollowing ? P.inkFaint : P.ink, transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {isFollowing ? "Following" : "Follow"}
    </button>
  </div>
);

const FeedPage = ({ onNavigate, onViewUser, following, toggleFollowApp }) => {
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
        <FeedSidebar onNavigate={onNavigate} following={following} toggleFollow={toggleFollowApp || toggleFollow} onViewUser={onViewUser} currentUserId={user?.id} />
      </div>
    </div>
  );
};

// Modal that shows a single post (owned by the current user) so notification
// clicks on likes/comments can surface the relevant activity without it needing
// to appear in the feed.
const PostDetailModal = ({ postId, onClose }) => {
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    supabase
      .from('posts')
      .select(`
        id, type, content, image_url, payload, is_public, created_at, user_id,
        profiles:user_id ( id, name, handle, avatar_color, avatar_url ),
        likes ( user_id ),
        comments (
          id, body, created_at, user_id,
          profiles:user_id ( id, name, handle, avatar_color, avatar_url )
        )
      `)
      .eq('id', postId)
      .maybeSingle()
      .then(({ data }) => { setPost(data); setLoading(false); });
  }, [postId]);

  const handleLike = async () => {
    if (!user || !post) return;
    const liked = post.likes?.some(l => l.user_id === user.id);
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setPost(p => ({ ...p, likes: p.likes.filter(l => l.user_id !== user.id) }));
    } else {
      await supabase.from('likes').upsert({ post_id: post.id, user_id: user.id }, { onConflict: 'post_id,user_id' });
      setPost(p => ({ ...p, likes: [...(p.likes || []), { user_id: user.id }] }));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user || !post || submitting) return;
    setSubmitting(true);
    const { data: newComment } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: user.id, body: commentText.trim() })
      .select(`id, body, created_at, user_id, profiles:user_id ( id, name, handle, avatar_color, avatar_url )`)
      .maybeSingle();
    if (newComment) setPost(p => ({ ...p, comments: [...(p.comments || []), newComment] }));
    setCommentText("");
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(61,53,80,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: P.white, borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 16px 60px rgba(61,53,80,0.22)", border: `1px solid ${P.lavender}33` }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", borderBottom: `1px solid ${P.lavender}22` }}>
          <span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink }}>Your Post</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.inkFaint, lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FF_S, fontSize: 14, color: P.inkFaint }}>Loading…</div>
          ) : !post ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FF_S, fontSize: 14, color: P.inkFaint }}>Post not found.</div>
          ) : (() => {
            const poster = post.profiles;
            const liked = post.likes?.some(l => l.user_id === user?.id);
            const likeCount = post.likes?.length || 0;
            const comments = post.comments || [];
            return (
              <>
                {/* Post author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <UserAvatar user={poster} size={40} />
                  <div>
                    <div style={{ fontFamily: FF_S, fontSize: 14, fontWeight: 600, color: P.ink }}>{poster?.name}</div>
                    <div style={{ fontFamily: FF_S, fontSize: 11, color: P.inkFaint }}>{poster?.handle ? `@${poster.handle}` : ""} · {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}</div>
                  </div>
                </div>

                {/* Post content */}
                {post.content && (
                  <p style={{ fontFamily: FF_S, fontSize: 14, color: P.ink, lineHeight: 1.6, margin: "0 0 14px" }}>{post.content}</p>
                )}
                {post.image_url && (
                  <img src={post.image_url} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14, objectFit: "cover", maxHeight: 320 }} />
                )}

                {/* Like / comment counts */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <button onClick={handleLike} style={{ background: liked ? "#FDE8EF" : P.lavenderLight, border: `1.5px solid ${liked ? "#F0B8C8" : P.lavender + "44"}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: liked ? "#C0476A" : P.inkLight, display: "flex", alignItems: "center", gap: 5 }}>
                    {liked ? "♥" : "♡"} {likeCount}
                  </button>
                  <span style={{ fontFamily: FF_S, fontSize: 13, color: P.inkFaint, display: "flex", alignItems: "center", gap: 5 }}>
                    💬 {comments.length}
                  </span>
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div style={{ borderTop: `1px solid ${P.lavender}22`, paddingTop: 14, marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ display: "flex", gap: 8 }}>
                        <UserAvatar user={c.profiles} size={28} />
                        <div style={{ background: P.lavenderLight, borderRadius: 12, padding: "7px 12px", flex: 1 }}>
                          <span style={{ fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.ink }}>{c.profiles?.name} </span>
                          <span style={{ fontFamily: FF_S, fontSize: 13, color: P.ink }}>{c.body}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                {user && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
                      placeholder="Add a comment…"
                      style={{ flex: 1, border: `1.5px solid ${P.lavender}`, borderRadius: 20, padding: "8px 14px", fontFamily: FF_S, fontSize: 13, background: P.lavenderLight, color: P.ink, outline: "none" }}
                    />
                    <button onClick={handleComment} disabled={!commentText.trim() || submitting} style={{ background: commentText.trim() ? P.lavender : P.lavenderLight, border: "none", borderRadius: 20, padding: "8px 16px", cursor: commentText.trim() ? "pointer" : "default", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>
                      {submitting ? "…" : "Post"}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

const NOTIF_SEED = [];

const NOTIF_ICONS  = { follow: "👤", like: "♥", comment: "💬", mention: "✦", calendar_share: "📆" };
const NOTIF_COLORS = { follow: P.lavender, like: "#F0B8C8", comment: P.sky, mention: P.butter, calendar_share: "#5DCAAA" };

const NotificationsDropdown = ({ notifs, onMarkRead, onMarkAllRead, onNavigate, onOpenProfile, onOpenPost, onClose }) => {
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
          // For follow notifications, render the name as a clickable link to the follower's profile.
          // n.name holds the display name; n.uid holds the follower's user ID.
          // For like/comment notifications with a source_id, clicking navigates to the post in the feed.
          const textNode = (n.type === 'follow' && n.name && n.uid && onOpenProfile) ? (
            <p style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, margin: "0 0 2px", lineHeight: 1.4 }}>
              <span
                onClick={e => { e.stopPropagation(); onMarkRead(n.id); onClose(); onOpenProfile(n.uid); }}
                style={{ fontWeight: 600, color: "#7C5CDB", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#7C5CDB55" }}>
                {n.name}
              </span>
              {" started following you"}
            </p>
          ) : (
            <p style={{ fontFamily: FF_S, fontSize: 13, color: P.ink, margin: "0 0 2px", lineHeight: 1.4 }}>
              {n.text}
              {(n.type === 'like' || n.type === 'comment') && n.source_id && onOpenPost && (
                <span style={{ display: "block", fontFamily: FF_S, fontSize: 11, color: "#9B85D8", marginTop: 2, fontWeight: 600 }}>Tap to view post ↗</span>
              )}
            </p>
          );
          const handleClick = () => {
            onMarkRead(n.id);
            onClose();
            if ((n.type === 'like' || n.type === 'comment') && n.source_id && onOpenPost) {
              onOpenPost(n.source_id);
            }
          };
          return (
            <div key={n.id} onClick={handleClick} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 20px", background: n.read ? "transparent" : P.lavenderLight, cursor: "pointer", borderBottom: `1px solid ${P.lavender}11`, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = P.lavenderLight}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : P.lavenderLight}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <UserAvatar user={user} size={36} />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: NOTIF_COLORS[n.type], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, border: `2px solid ${P.white}` }}>{NOTIF_ICONS[n.type]}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {textNode}
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

const PublicProfilePage = ({ userId, onBack, following, toggleFollow, onMessage }) => {
  const [profile, setProfile] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [bioEmail, setBioEmail] = useState("");
  const [bioLinks, setBioLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('widget_configs').select('widget_id, color_idx, sort_order, data').eq('user_id', userId).eq('enabled', true).eq('public', true).order('sort_order', { ascending: true }),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('user_data').select('value').eq('user_id', userId).eq('key', 'bio_links').maybeSingle(),
    ]).then(([{ data: prof }, { data: wConfigs }, { count: fCount }, { count: ingCount }, { data: bioData }]) => {
      setProfile(prof || null);
      setFollowerCount(fCount || 0);
      setFollowingCount(ingCount || 0);
      if (bioData?.value) {
        if (bioData.value.email) setBioEmail(bioData.value.email);
        if (bioData.value.links) setBioLinks(bioData.value.links);
      }
      if (wConfigs && wConfigs.length > 0) {
        const built = wConfigs.map(wc => {
          const base = INITIAL_WIDGETS.find(w => w.id === wc.widget_id) || { id: wc.widget_id, title: wc.widget_id, icon: "◈", colorIdx: 0, data: {} };
          return { ...base, enabled: true, isPublic: true, colorIdx: wc.color_idx ?? base.colorIdx ?? 0, data: wc.data ? { ...base.data, ...wc.data } : base.data };
        });
        setWidgets(built);
      } else {
        setWidgets([]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]); // eslint-disable-line

  const isFollowingUser = following.includes(userId);
  const displayName = profile?.name || profile?.handle || 'Nook User';
  const displayHandle = profile?.handle ? (profile.handle.startsWith('@') ? profile.handle : '@' + profile.handle) : '';
  const initials = (displayName.trim().split(' ').map(p => p[0] || '').join('').slice(0, 2) || '??').toUpperCase();

  return (
    <div style={{ background: P.bg, minHeight: "calc(100vh - 61px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight, marginBottom: 20, padding: 0 }}>
          ← Back
        </button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: P.inkFaint, fontFamily: FF_S }}>Loading profile…</div>
        ) : !profile ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: P.inkFaint, fontFamily: FF_S }}>User not found.</div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{ background: P.white, borderRadius: 24, padding: "28px 32px", border: `1.5px solid ${P.lavender}55`, boxShadow: "0 4px 24px rgba(201,184,240,0.15)", marginBottom: 32, display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              <UserAvatar user={{ ...profile, color: profile.avatar_color }} size={80} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <h2 style={{ fontFamily: FF_D, fontSize: 26, margin: 0, color: P.ink, fontWeight: 400 }}>{displayName}</h2>
                  {displayHandle && <span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkLight, background: P.lavenderLight, borderRadius: 20, padding: "2px 10px" }}>{displayHandle}</span>}
                </div>
                {profile.bio && <p style={{ margin: "0 0 10px", color: P.inkLight, fontSize: 14, lineHeight: 1.65, maxWidth: 500 }}>{profile.bio}</p>}
                {(bioEmail || bioLinks.filter(l => l.url).length > 0) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {bioEmail && (
                      <a href={`mailto:${bioEmail}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FF_S, fontSize: 12, color: P.inkLight, textDecoration: "none", background: P.lavenderLight, borderRadius: 20, padding: "3px 11px" }}>
                        ✉ {bioEmail}
                      </a>
                    )}
                    {bioLinks.filter(l => l.url).map((lnk, i) => (
                      <a key={i} href={ensureHttps(lnk.url)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FF_S, fontSize: 12, color: "#9B85D8", textDecoration: "none", fontWeight: 500, background: P.lavenderLight, borderRadius: 20, padding: "3px 11px" }}>
                        🔗 {lnk.label || lnk.url}
                      </a>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                  <div><span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, fontWeight: 600 }}>{followerCount}</span><span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginLeft: 5 }}>followers</span></div>
                  <div><span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, fontWeight: 600 }}>{followingCount}</span><span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginLeft: 5 }}>following</span></div>
                  <div><span style={{ fontFamily: FF_D, fontSize: 18, color: P.ink, fontWeight: 600 }}>{widgets.length}</span><span style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginLeft: 5 }}>public widget{widgets.length !== 1 ? "s" : ""}</span></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => toggleFollow(userId)} style={{ background: isFollowingUser ? P.lavenderLight : P.lavender, border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 22px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: isFollowingUser ? P.inkFaint : P.ink, transition: "all 0.2s" }}>
                    {isFollowingUser ? "✓ Following" : "+ Follow"}
                  </button>
                  <button onClick={() => onMessage(userId)} style={{ background: P.white, border: `1.5px solid ${P.lavender}`, borderRadius: 12, padding: "8px 18px", cursor: "pointer", fontFamily: FF_S, fontSize: 13, color: P.inkLight, transition: "all 0.2s" }}>
                    ✉ Message
                  </button>
                </div>
              </div>
            </div>

            {/* Their Nook */}
            <h3 style={{ fontFamily: FF_D, fontSize: 20, color: P.ink, margin: "0 0 18px", fontWeight: 400 }}>Their Nook</h3>
            {widgets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: P.inkFaint, fontFamily: FF_S, fontSize: 14 }}>
                <p style={{ fontSize: 32, margin: "0 0 12px" }}>🌿</p>
                <p>This user hasn't added any widgets to their Nook yet.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {widgets.filter(w => w.id !== "archive").map(w => (
                  <WidgetCard key={w.id} widget={w} isOwnDashboard={false} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
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

const SettingsPage = ({ profilePic, setProfilePic, onLogout, accent = "#C9B8F0", onAccentChange, notifPrefs, setNotifPrefs, privPrefs, setPrivPrefs }) => {
  const { user, profile, updateProfile } = useAuth();
  const [section, setSection] = useState("account");
  const [name, setName]       = useState(profile?.name || "");
  const [email, setEmail]     = useState(user?.email || "");
  const [handle, setHandle]   = useState(profile?.handle || "");

  // Sync fields when profile loads (it may arrive after component mounts)
  useEffect(() => {
    if (profile?.name)   setName(profile.name);
    if (profile?.handle) setHandle(profile.handle);
  }, [profile?.name, profile?.handle]);
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);
  const [saved, setSaved]     = useState(false);
  // notifPrefs / privPrefs are now owned by App and passed in as props
  // — they persist to Supabase cross-device. Defaults are provided as prop defaults above.
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const fileRef = useRef();

  const save = async () => {
    const cleanHandle = handle.trim()
      ? (handle.trim().startsWith('@') ? handle.trim() : '@' + handle.trim())
      : handle;
    try { await updateProfile({ name, handle: cleanHandle }); setHandle(cleanHandle); } catch {}
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
              {[["Display name", name, setName, ""], ["Handle", handle, setHandle, "@yourhandle"], ["Email", email, setEmail, ""]].map(([label, val, setter, ph]) => (
                <div key={label}>
                  <label style={{ display: "block", fontFamily: FF_S, fontSize: 12, color: P.inkFaint, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ ...inp, border: label === "Handle" && !val ? `1.5px solid ${P.peach}` : inp.border }} />
                  {label === "Handle" && !val && <div style={{ fontFamily: FF_S, fontSize: 11, color: "#E8956A", marginTop: 4 }}>⚠ Set a handle so others can find you</div>}
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
                  <div key={c} onClick={() => onAccentChange && onAccentChange(c)} style={{ width: 40, height: 40, borderRadius: 12, background: c, cursor: "pointer", border: accent === c ? `3px solid ${P.ink}` : "3px solid transparent", transition: "all 0.15s", boxShadow: accent === c ? "0 2px 12px rgba(61,53,80,0.2)" : "none" }} />
                ))}
              </div>
              <p style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint, marginTop: 10 }}>Selected accent is used for highlights across your dashboard.</p>
              <div style={{ marginTop: 14, background: accent + "33", border: `2px solid ${accent}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: accent }} />
                <div>
                  <div style={{ fontFamily: FF_S, fontSize: 13, fontWeight: 600, color: P.ink }}>Preview</div>
                  <div style={{ fontFamily: FF_S, fontSize: 12, color: P.inkFaint }}>Your chosen accent colour looks like this</div>
                </div>
                <div style={{ marginLeft: "auto", background: accent, borderRadius: 10, padding: "6px 14px", fontFamily: FF_S, fontSize: 12, fontWeight: 600, color: P.ink }}>Button</div>
              </div>
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
  const [handle, setHandle] = useState("");
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
  const next = () => step < 3 ? setStep(s => s + 1) : onComplete(name, handle, bio, chosen);

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
              {[["Your name", name, setName, "Margot Ellison"], ["Your @handle", handle, setHandle, "@margot"], ["A short bio", bio, setBio, "Designer & dreamer 🌿"]].map(([label, val, setter, ph]) => (
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
    try {
      const saved = sessionStorage.getItem("nook_page");
      if (saved) return saved;
      // No saved page — check if a valid Supabase session is cached in localStorage.
      // If so, default to "dashboard" immediately (avoids an extra redirect render cycle).
      for (const key of Object.keys(localStorage)) {
        if (/^sb-.+-auth-token$/.test(key)) {
          const raw = localStorage.getItem(key);
          const session = raw ? JSON.parse(raw) : null;
          if (session?.user?.id && (!session.expires_at || Date.now() / 1000 + 30 < session.expires_at)) {
            return "dashboard";
          }
        }
      }
      return "home";
    } catch { return "home"; }
  });
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);
  const [convos, setConvos] = useState(INITIAL_CONVOS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [profilePic, setProfilePic] = useState(null);
  const [following, setFollowing] = useState([]);
  const [notifications, setNotifications] = useState(NOTIF_SEED);
  const [showNotifs, setShowNotifs] = useState(false);

  // ── Notification & privacy prefs (lifted here so addNotif can read them) ──
  const [notifPrefs, setNotifPrefs] = useState({ follows: true, likes: true, comments: true, mentions: true, announcements: false });
  const [privPrefs,  setPrivPrefs]  = useState({ defaultPublic: false, showOnline: true, allowMessages: true });
  // Stable ref so the async realtime closure always sees the latest prefs without re-subscribing
  const notifPrefsRef = useRef({ follows: true, likes: true, comments: true, mentions: true, announcements: false });
  useEffect(() => { notifPrefsRef.current = notifPrefs; }, [notifPrefs]);

  const [viewPostId, setViewPostId] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [profileViewId, setProfileViewId] = useState(null);
  const [prevPage, setPrevPage] = useState("feed");
  const [pendingDmUserId, setPendingDmUserId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // If the user just confirmed their email (Supabase redirects back with type=signup in hash),
    // we need to show onboarding immediately — before any auth-based page guard can redirect away.
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('type=signup')) return true;
    } catch {}
    return false;
  });
  const [widgetReloadKey, setWidgetReloadKey] = useState(0);
  const dashboardEverMounted = useRef(false);
  // Tracks the last non-null user so DashboardPage stays mounted even if
  // auth briefly flickers to null (e.g. during Supabase token refresh).
  const lastKnownUserRef = useRef(null);
  if (user) lastKnownUserRef.current = user;
  const [accent, setAccent] = useState("#C9B8F0");

  // Read accent from localStorage once user id is known
  useEffect(() => {
    if (!user?.id) return;
    try {
      const s = localStorage.getItem(`nook_accent_${user.id}`);
      if (s) setAccent(s);
    } catch {}
  }, [user?.id]);

  // Apply accent as CSS variables so anything using var(--nook-accent) picks it up
  useEffect(() => {
    document.documentElement.style.setProperty('--nook-accent', accent);
    document.documentElement.style.setProperty('--nook-accent-light', accent + '33');
  }, [accent]);

  const updateAccent = (newAccent) => {
    setAccent(newAccent);
    if (user?.id) {
      try { localStorage.setItem(`nook_accent_${user.id}`, newAccent); } catch {}
    }
  };
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

  // Persist key state in localStorage — keyed per-user so photos don't bleed across accounts
  // hasOnboarded is loaded per-user in useEffect([user?.id]) below; profilePic comes from Supabase.
  // This effect only handles the legacy global key migration (one-time read, then ignored).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nook_state");
      if (saved) {
        const s = JSON.parse(saved);
        // Only migrate hasOnboarded flag — never load a photo from the global key
        // (the photo may belong to a different user)
        if (s.hasOnboarded) setHasOnboarded(true);
        // Remove the global key so it can't pollute future sessions
        localStorage.removeItem("nook_state");
      }
    } catch {}
  }, []);

  // Load follows from Supabase when user is available
  useEffect(() => {
    if (!user) { setFollowing([]); return; }
    const load = async () => {
      try {
                const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        if (data) setFollowing(data.map(r => r.following_id));
      } catch {}
    };
    load();
  }, [user?.id]);

  // ── Load settings prefs + past notifications from Supabase on login ─────
  useEffect(() => {
    if (!user?.id) {
      setNotifPrefs({ follows: true, likes: true, comments: true, mentions: true, announcements: false });
      setPrivPrefs({ defaultPublic: false, showOnline: true, allowMessages: true });
      setNotifications([]);
      return;
    }
    (async () => {
      // ── Settings prefs ──────────────────────────────────────────────────
      const { data: settingsData } = await supabase.from('user_data').select('key, value')
        .eq('user_id', user.id).in('key', ['notif_prefs', 'priv_prefs', 'profile_pic']);
      if (settingsData) {
        const byKey = Object.fromEntries(settingsData.map(r => [r.key, r.value]));
        if (byKey.notif_prefs) {
          setNotifPrefs(p => ({ ...p, ...byKey.notif_prefs }));
          try { localStorage.setItem(`nook_notif_${user.id}`, JSON.stringify(byKey.notif_prefs)); } catch {}
        } else {
          try { const s = localStorage.getItem(`nook_notif_${user.id}`); if (s) setNotifPrefs(p => ({ ...p, ...JSON.parse(s) })); } catch {}
        }
        if (byKey.priv_prefs) {
          setPrivPrefs(p => ({ ...p, ...byKey.priv_prefs }));
          try { localStorage.setItem(`nook_priv_${user.id}`, JSON.stringify(byKey.priv_prefs)); } catch {}
        } else {
          try { const s = localStorage.getItem(`nook_priv_${user.id}`); if (s) setPrivPrefs(p => ({ ...p, ...JSON.parse(s) })); } catch {}
        }
        if (byKey.profile_pic?.data) {
          setProfilePic(byKey.profile_pic.data);
          try { localStorage.setItem(`nook_pic_${user.id}`, byKey.profile_pic.data); } catch {}
        } else {
          // Try user-specific localStorage cache as a fast fallback before Supabase loads
          try {
            const cached = localStorage.getItem(`nook_pic_${user.id}`);
            if (cached) setProfilePic(cached);
          } catch {}
        }
      }
      // ── Persistent notifications ────────────────────────────────────────
      const { data: notifData, error: notifErr } = await supabase
        .from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50);
      if (!notifErr && notifData) {
        setNotifications(notifData.map(r => ({
          id: r.id, type: r.type, uid: r.uid, name: r.name,
          text: r.text, read: r.read, ts: new Date(r.created_at).getTime(),
          source_id: r.source_id || null,
        })));
      }
    })();
  }, [user?.id]); // eslint-disable-line

  // Save notif prefs to Supabase + localStorage whenever they change
  useEffect(() => {
    if (!user?.id) return;
    try { localStorage.setItem(`nook_notif_${user.id}`, JSON.stringify(notifPrefs)); } catch {}
    supabase.from('user_data')
      .upsert({ user_id: user.id, key: 'notif_prefs', value: notifPrefs }, { onConflict: 'user_id,key' })
      .then(({ error }) => { if (error) console.error('[Settings] notif_prefs save error', error); });
  }, [notifPrefs, user?.id]); // eslint-disable-line

  // Save privacy prefs to Supabase + localStorage whenever they change
  useEffect(() => {
    if (!user?.id) return;
    try { localStorage.setItem(`nook_priv_${user.id}`, JSON.stringify(privPrefs)); } catch {}
    supabase.from('user_data')
      .upsert({ user_id: user.id, key: 'priv_prefs', value: privPrefs }, { onConflict: 'user_id,key' })
      .then(({ error }) => { if (error) console.error('[Settings] priv_prefs save error', error); });
  }, [privPrefs, user?.id]); // eslint-disable-line

  // Save profile photo to Supabase + user-specific localStorage so it persists across browsers/devices
  useEffect(() => {
    if (!user?.id || !profilePic) return;
    try { localStorage.setItem(`nook_pic_${user.id}`, profilePic); } catch {}
    supabase.from('user_data')
      .upsert({ user_id: user.id, key: 'profile_pic', value: { data: profilePic } }, { onConflict: 'user_id,key' })
      .then(({ error }) => { if (error) console.error('[App] profile_pic save error', error); });
  }, [profilePic, user?.id]); // eslint-disable-line

  useEffect(() => {
    try { sessionStorage.setItem("nook_page", page); } catch {}
  }, [page]);

  const toggleFollow = async (uid) => {
    const isNowFollowing = !following.includes(uid);
    // Optimistic update
    setFollowing(fs => isNowFollowing ? [...fs, uid] : fs.filter(id => id !== uid));
    // Persist to Supabase if logged in
    if (user) {
      try {
        if (isNowFollowing) {
          await supabase.from('follows').upsert({ follower_id: user.id, following_id: uid }, { onConflict: 'follower_id,following_id' });
        } else {
          await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', uid);
        }
      } catch {}
    }
  };

  // ── Realtime notification subscriptions ───────────────────────────────────
  // Notify current user when someone follows them, or comments on their post
  useEffect(() => {
    if (!user?.id) return;
    const addNotif = (notif) => {
      // Respect the user's notification preferences
      const prefs = notifPrefsRef.current;
      if (notif.type === 'follow'   && !prefs.follows)       return;
      if (notif.type === 'comment'  && !prefs.comments)      return;
      if (notif.type === 'like'     && !prefs.likes)         return;
      if (notif.type === 'mention'  && !prefs.mentions)      return;
      const id = crypto.randomUUID();
      const ts = Date.now();
      setNotifications(ns => [{ ...notif, id, ts, read: false }, ...ns]);
      // Persist to Supabase so notifications survive refresh
      if (user?.id) {
        supabase.from('notifications').insert({
          id, user_id: user.id, type: notif.type,
          uid: notif.uid || null, name: notif.name || null,
          text: notif.text, read: false,
          created_at: new Date(ts).toISOString(),
        }).then(({ error }) => { if (error) console.error('[Notif] insert error', error); });
      }
    };

    // ── Login-diff approach for new-follower notifications ─────────────────
    // This runs every time the user logs in. It compares the current follower
    // list against the last-known list stored in user_data and fires notifications
    // for any followers gained since the last login.
    // This is the primary mechanism — it works with zero Realtime/SQL configuration.
    (async () => {
      try {
        // Fetch all current followers for this user
        const { data: followerRows } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', user.id);
        const currentFollowerIds = (followerRows || []).map(r => r.follower_id);

        // Fetch the known-followers list we stored on the last login
        const { data: stored } = await supabase
          .from('user_data')
          .select('value')
          .eq('user_id', user.id)
          .eq('key', 'known_followers')
          .maybeSingle();
        const knownIds = stored?.value ? JSON.parse(stored.value) : null;

        if (knownIds !== null) {
          // Find followers who are new since last login
          const newIds = currentFollowerIds.filter(id => !knownIds.includes(id));
          for (const followerId of newIds) {
            try {
              const { data: p } = await supabase.from('profiles').select('name, handle').eq('id', followerId).maybeSingle();
              const name = p?.name || p?.handle || 'Someone';
              addNotif({ type: 'follow', uid: followerId, name, text: `${name} started following you` });
            } catch {
              addNotif({ type: 'follow', uid: followerId, name: 'Someone', text: 'Someone started following you' });
            }
          }
        }

        // Always update known_followers to the current list so next login diffs correctly
        await supabase.from('user_data').upsert(
          { user_id: user.id, key: 'known_followers', value: JSON.stringify(currentFollowerIds) },
          { onConflict: 'user_id,key' }
        );
      } catch {}
    })();

    // Subscribe to follows table changes via postgres_changes.
    // No server-side filter used (avoids REPLICA IDENTITY FULL requirement for INSERT events).
    // The follows table must be in the supabase_realtime publication — run supabase-follows-realtime.sql once.
    // This provides within-session real-time notifications as a bonus on top of the login-diff above.
    const followCh = supabase
      .channel(`notif-follows-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows' },
        async (payload) => {
          const followingId = payload.new?.following_id;
          const followerId  = payload.new?.follower_id;
          // Only process follows where the current user is being followed
          if (!followingId || followingId !== user.id) return;
          if (!followerId || followerId === user.id) return;
          try {
            const { data: p } = await supabase.from('profiles').select('name, handle').eq('id', followerId).maybeSingle();
            const name = p?.name || p?.handle || 'Someone';
            addNotif({ type: 'follow', uid: followerId, name, text: `${name} started following you` });
          } catch {
            addNotif({ type: 'follow', uid: followerId, name: 'Someone', text: 'Someone started following you' });
          }
        }
      )
      .subscribe();

    // ── Like & comment notifications (real-time via notifications table) ────
    // DB triggers (see supabase-feed-notification-triggers.sql) insert a row
    // into the notifications table whenever someone likes or comments on a post
    // owned by the current user. This subscription delivers those inserts to the
    // client in real-time so the bell icon lights up immediately.
    // The existing load-on-login block above handles notifications received
    // while the user was offline — no separate login-diff needed.
    const notifCh = supabase
      .channel(`user-notifs-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new;
          if (!n || n.user_id !== user.id) return;
          // Respect the user's notification preferences
          const prefs = notifPrefsRef.current;
          if (n.type === 'like'    && !prefs.likes)    return;
          if (n.type === 'comment' && !prefs.comments) return;
          if (n.type === 'follow'  && !prefs.follows)  return;
          // Update in-memory state — dedup by id in case load-on-login already caught it
          setNotifications(ns => {
            if (ns.some(x => x.id === n.id)) return ns;
            return [{ id: n.id, type: n.type, uid: n.uid, name: n.name, text: n.text, read: false, ts: new Date(n.created_at).getTime(), source_id: n.source_id || null }, ...ns.slice(0, 49)];
          });
        }
      )
      .subscribe();

    // ── Calendar-share notifications (login-diff) ──────────────────────────
    // Detect new calendar shares since last login and fire notifications.
    (async () => {
      try {
        const { data: shareRows } = await supabase.from('calendar_shares')
          .select('id, from_user_id, cat_name').eq('to_user_id', user.id);
        const currentShareIds = (shareRows || []).map(r => r.id);

        const { data: stored } = await supabase.from('user_data')
          .select('value').eq('user_id', user.id).eq('key', 'known_cal_share_ids').maybeSingle();
        const knownIds = stored?.value ? JSON.parse(stored.value) : null;

        if (knownIds !== null) {
          const newShares = (shareRows || []).filter(r => !knownIds.includes(r.id));
          for (const share of newShares) {
            try {
              const { data: p } = await supabase.from('profiles').select('name, handle').eq('id', share.from_user_id).maybeSingle();
              const name = p?.name || p?.handle || 'Someone';
              addNotif({ type: 'calendar_share', uid: share.from_user_id, name,
                text: `${name} shared their ${share.cat_name} calendar with you` });
            } catch {}
          }
        }
        await supabase.from('user_data').upsert(
          { user_id: user.id, key: 'known_cal_share_ids', value: JSON.stringify(currentShareIds) },
          { onConflict: 'user_id,key' }
        );
      } catch {}
    })();

    return () => {
      supabase.removeChannel(followCh);
      supabase.removeChannel(notifCh);
    };
  }, [user?.id]); // eslint-disable-line

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const totalUnread = convos.reduce((a, c) => a + c.messages.filter(m => m.from !== "me" && !m.read).length, 0);
  const isLoggedIn = !!user;
  const ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID;
  const isAdmin = !!user && !!ADMIN_ID && user.id === ADMIN_ID;

  const navigate = (p) => {
    // Guard: redirect to login if not authenticated and trying to access protected pages
    const publicPages = ["home", "login", "signup"];
    if (!user && !publicPages.includes(p)) { setPage("login"); return; }
    setPrevPage(prev => page !== p ? page : prev);
    setPage(p);
    setShowNotifs(false);
  };

  const logout = async () => {
    await signOut();
    // Clear the last-known-user ref so DashboardPage unmounts cleanly on logout
    lastKnownUserRef.current = null;
    dashboardEverMounted.current = false;
    try { sessionStorage.removeItem("nook_page"); } catch {}
    setProfilePic(null); // Clear photo so the next user doesn't see the previous user's photo
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
  const completeOnboarding = async (name, handle, bio, chosenIds) => {
    try {
      if (user && (name || bio || handle)) {
        const cleanHandle = handle.trim()
          ? (handle.trim().startsWith('@') ? handle.trim() : '@' + handle.trim())
          : ('@' + (user.email?.split('@')[0] || 'user'));
        await supabase.from('profiles').update({ name, bio, handle: cleanHandle }).eq('id', user.id);
      }
      // Save initial widget choices to Supabase right away
      if (user) {
        const rows = INITIAL_WIDGETS.map((w, i) => ({
          user_id: user.id,
          widget_id: w.id,
          enabled: chosenIds.includes(w.id),
          public: chosenIds.includes(w.id),
          color_idx: w.colorIdx ?? 0,
          sort_order: i,
        }));
        await supabase.from('widget_configs').upsert(rows, { onConflict: 'user_id,widget_id' });
      }
    } catch {}
    // Mark this specific user as onboarded in localStorage
    try { localStorage.setItem(`nook_onboarded_${user?.id}`, "1"); } catch {}
    // Clean the email confirmation hash from the URL so it doesn't re-trigger onboarding on refresh
    try { if (window.location.hash.includes('type=signup')) window.history.replaceState(null, '', window.location.pathname); } catch {}
    setHasOnboarded(true);
    setShowOnboarding(false);
    // Increment reload key so DashboardPage re-fetches widget configs from Supabase
    // (DashboardPage stays mounted while logged in, so we must trigger a fresh load)
    setWidgetReloadKey(k => k + 1);
    setPage("dashboard");
  };

  const openUserProfile = useCallback(async (handleOrId) => {
    if (!handleOrId) return;
    const goToProfile = (id) => {
      setProfileViewId(id);
      setPrevPage(pageRef.current || 'feed');
      setPage('profile');
      setShowNotifs(false);
    };
    // Full user object → use id directly
    if (typeof handleOrId === 'object' && handleOrId.id) { goToProfile(handleOrId.id); return; }
    if (typeof handleOrId !== 'string') return;

    // UUID detected → navigate directly. No need to validate first;
    // PublicProfilePage does its own profile lookup and handles not-found gracefully.
    const looksLikeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handleOrId);
    if (looksLikeUUID) { goToProfile(handleOrId); return; }

    // Handle lookup: strip leading @ and try BOTH with and without it,
    // because different code paths may store or pass handles in either format.
    const bare   = handleOrId.startsWith('@') ? handleOrId.slice(1) : handleOrId;
    const withAt = '@' + bare;
    try {
      // Try exact match with @
      const { data: d1 } = await supabase.from('profiles').select('id').eq('handle', withAt).maybeSingle();
      if (d1?.id) { goToProfile(d1.id); return; }
      // Try exact match without @
      const { data: d2 } = await supabase.from('profiles').select('id').eq('handle', bare).maybeSingle();
      if (d2?.id) { goToProfile(d2.id); return; }
      // Partial ilike fallback (in case handle is stored differently)
      const { data: d3 } = await supabase.from('profiles').select('id').ilike('handle', `%${bare}%`).limit(1);
      if (d3?.[0]?.id) { goToProfile(d3[0].id); return; }
    } catch {}
  }, []); // eslint-disable-line

  // Redirect unauthenticated users away from protected pages
  // Only trigger onboarding for brand new signups
  useEffect(() => {
    if (justSignedUp && user) {
      setJustSignedUp(false);
      setShowOnboarding(true);
    }
  }, [justSignedUp, user]);

  // If showOnboarding was set by the URL hash (email confirmation), but this user has
  // already been through onboarding, skip it and go straight to the dashboard.
  useEffect(() => {
    if (showOnboarding && user && !authLoading) {
      try {
        if (localStorage.getItem(`nook_onboarded_${user.id}`) === "1") {
          setShowOnboarding(false);
          setPage("dashboard");
        }
      } catch {}
    }
  }, [showOnboarding, user, authLoading]);

  const protectedPages = ["dashboard","customize","messages","feed","work","admin","settings","profile"];
  useEffect(() => {
    if (authLoading) return;
    if (showOnboarding) return;
    if (!user && protectedPages.includes(page)) { setPage("login"); return; }
    if (user && ["login","signup","home"].includes(page)) {
      setPage("dashboard"); return;
    }
    if (page === "admin" && !isAdmin) { setPage("dashboard"); }
  }, [user, authLoading, page, showOnboarding, isAdmin]);

  // Set during render (not in a useEffect) so the JSX condition sees it in the same render pass
  if (user && ["dashboard","customize"].includes(page)) dashboardEverMounted.current = true;

  // Show nothing while Supabase checks session — prevents flash of login page
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#F5F2FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#C9B8F0" }}>✦ Nook</div>
    </div>
  );

  return (
    <ProfileViewContext.Provider value={openUserProfile}>
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

        .nook-sidebar-layout { display: flex; height: calc(100vh - 61px); overflow: hidden; }
        .nook-sidebar { width: 220px; flex-shrink: 0; overflow-y: auto; position: sticky; top: 0; align-self: flex-start; height: 100%; }
        .nook-sidebar-content { flex: 1; min-width: 0; overflow-y: auto; height: 100%; }

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
          .nook-sidebar-nav-inner { display: grid; grid-template-columns: repeat(4, 1fr); overflow-x: visible; padding: 8px 10px; gap: 5px; }
          .nook-sidebar-nav-inner button { width: 100% !important; margin-bottom: 0 !important; padding: 8px 6px !important; justify-content: center; }
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
        onMarkRead={(id) => {
          setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
          if (user?.id) supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id)
            .then(({ error }) => { if (error) console.error('[Notif] mark read error', error); });
        }}
        onMarkAllRead={() => {
          setNotifications(ns => ns.map(n => ({ ...n, read: true })));
          if (user?.id) supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
            .then(({ error }) => { if (error) console.error('[Notif] mark all read error', error); });
        }}
        onOpenProfile={openUserProfile}
        onOpenPost={(postId) => { setViewPostId(postId); }}
        accent={accent}
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

      {/* DashboardPage stays mounted while logged in — hidden via CSS to preserve widget state.
          Uses lastKnownUserRef so a brief auth null-flicker doesn't unmount and wipe widget state. */}
      {dashboardEverMounted.current && lastKnownUserRef.current && (
        <div style={{ display: user && ["dashboard","customize"].includes(page) ? "block" : "none" }}>
          <DashboardPage user={lastKnownUserRef.current} view={page} onNavigate={navigate} profilePic={profilePic} setProfilePic={setProfilePic} widgetRequests={widgetRequests} setWidgetRequests={setWidgetRequests} following={following} toggleFollow={toggleFollow} onViewUser={openUserProfile} widgetReloadKey={widgetReloadKey} />
        </div>
      )}
      {page === "messages" && user && <MessagesPage requests={requests} setRequests={setRequests} pendingDmUserId={pendingDmUserId} onPendingDmHandled={() => setPendingDmUserId(null)} />}
      {page === "feed"     && user && <FeedPage onNavigate={navigate} onViewUser={openUserProfile} following={following} toggleFollowApp={toggleFollow} />}
      {page === "work"     && user && <WorkPage />}
      {page === "admin"    && isAdmin && <AdminPage widgetRequests={widgetRequests} setWidgetRequests={setWidgetRequests} />}
      {page === "settings" && user && <SettingsPage profilePic={profilePic} setProfilePic={setProfilePic} onLogout={logout} accent={accent} onAccentChange={updateAccent} notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs} privPrefs={privPrefs} setPrivPrefs={setPrivPrefs} />}
      {page === "profile"  && user && profileViewId && <PublicProfilePage userId={profileViewId} onBack={() => navigate(prevPage || "feed")} following={following} toggleFollow={toggleFollow} onMessage={(userId) => { setPendingDmUserId(userId); navigate("messages"); }} />}

      {/* Post detail modal — opened when clicking a like/comment notification */}
      {viewPostId && <PostDetailModal postId={viewPostId} onClose={() => setViewPostId(null)} />}

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
    </ProfileViewContext.Provider>
  );
}
