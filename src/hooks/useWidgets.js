import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_WIDGETS = [
  { id: 'todo',        title: 'To-Do List',          icon: '✓',  enabled: true,  public: true,  colorIdx: 0, category: 'productivity' },
  { id: 'goals',       title: 'Goals for the Year',  icon: '★',  enabled: true,  public: true,  colorIdx: 1, category: 'productivity' },
  { id: 'reading',     title: 'Reading List',         icon: '📖', enabled: true,  public: false, colorIdx: 2, category: 'culture' },
  { id: 'mood',        title: 'Mood Tracker',         icon: '☀',  enabled: true,  public: false, colorIdx: 3, category: 'lifestyle' },
  { id: 'habitstreak', title: 'Habit Tracker',        icon: '🔥', enabled: true,  public: true,  colorIdx: 2, category: 'lifestyle' },
  { id: 'gallery',     title: 'Gallery',              icon: '🖼',  enabled: true,  public: true,  colorIdx: 4, category: 'social' },
  { id: 'blog',        title: 'Blog',                 icon: '✍',  enabled: true,  public: true,  colorIdx: 0, category: 'culture' },
  { id: 'bookmarks',   title: 'Bookmarks',            icon: '🔖', enabled: true,  public: false, colorIdx: 2, category: 'productivity' },
  { id: 'exercise',    title: 'Exercise Log',         icon: '🏃', enabled: true,  public: false, colorIdx: 1, category: 'sports' },
  { id: 'links',       title: 'Saved Links',          icon: '🔗', enabled: false, public: true,  colorIdx: 4, category: 'productivity' },
  { id: 'gratitude',   title: 'Gratitude Journal',    icon: '♡',  enabled: false, public: false, colorIdx: 5, category: 'lifestyle' },
  { id: 'sobriety',    title: 'Sobriety Streak',      icon: '🌱', enabled: false, public: false, colorIdx: 1, category: 'lifestyle' },
  { id: 'instagram',   title: 'Instagram',            icon: '📸', enabled: false, public: true,  colorIdx: 4, category: 'social' },
  { id: 'sports',      title: 'Sports Tracker',       icon: '🏃', enabled: false, public: true,  colorIdx: 3, category: 'sports' },
  { id: 'hobbies',     title: 'Hobbies',              icon: '🎨', enabled: false, public: true,  colorIdx: 5, category: 'lifestyle' },
  { id: 'linkedin',    title: 'LinkedIn',             icon: '💼', enabled: false, public: true,  colorIdx: 0, category: 'social' },
  { id: 'twitter',     title: 'Twitter / X',          icon: '✕',  enabled: false, public: true,  colorIdx: 3, category: 'social' },
  { id: 'projects',    title: 'Current Projects',     icon: '🚀', enabled: false, public: true,  colorIdx: 1, category: 'entrepreneurship' },
  { id: 'podcast',     title: 'Podcast Picks',        icon: '🎙', enabled: false, public: true,  colorIdx: 4, category: 'culture' },
  { id: 'travel',      title: 'Travel',               icon: '✈',  enabled: false, public: true,  colorIdx: 2, category: 'lifestyle' },
  { id: 'articles',    title: 'Articles',             icon: '✍',  enabled: false, public: true,  colorIdx: 5, category: 'culture' },
  { id: 'archive',     title: 'Year in Review',       icon: '✦',  enabled: true,  public: false, colorIdx: 5, category: 'lifestyle' },
]

export function useWidgets(userId) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    loadWidgets(userId)
  }, [userId])

  async function loadWidgets(uid) {
    const { data } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('user_id', uid)

    if (data && data.length > 0) {
      // Merge saved config with defaults (handles newly added widget types)
      const saved = Object.fromEntries(data.map(d => [d.widget_id, d]))
      setWidgets(DEFAULT_WIDGETS.map(w => ({
        ...w,
        enabled: saved[w.id]?.enabled ?? w.enabled,
        public:  saved[w.id]?.public  ?? w.public,
        colorIdx: saved[w.id]?.color_idx ?? w.colorIdx,
        sort_order: saved[w.id]?.sort_order ?? 99,
      })).sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)))
    }
    setLoading(false)
  }

  async function saveWidget(widgetId, changes) {
    if (!userId) return
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...changes } : w))
    await supabase.from('widget_configs').upsert({
      user_id: userId,
      widget_id: widgetId,
      enabled: changes.enabled,
      public: changes.public,
      color_idx: changes.colorIdx,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,widget_id' })
  }

  async function reorderWidgets(orderedIds) {
    if (!userId) return
    setWidgets(prev => {
      const byId = Object.fromEntries(prev.map(w => [w.id, w]))
      return orderedIds.map((id, i) => ({ ...byId[id], sort_order: i }))
        .concat(prev.filter(w => !orderedIds.includes(w.id)))
    })
    const upserts = orderedIds.map((id, i) => ({
      user_id: userId, widget_id: id, sort_order: i,
      updated_at: new Date().toISOString()
    }))
    await supabase.from('widget_configs').upsert(upserts, { onConflict: 'user_id,widget_id' })
  }

  return { widgets, loading, saveWidget, reorderWidgets }
}
