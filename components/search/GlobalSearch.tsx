'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MessageSquare, StickyNote, ArrowRight, Command, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { SearchResult } from '@/types'
import { cn, truncate, formatDate } from '@/lib/utils/helpers'
import Fuse from 'fuse.js'

export default function GlobalSearch() {
  const { searchOpen, setSearchOpen, sessions, noteBlocks, setActiveSession, setActiveBlock, setViewMode } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [allItems, setAllItems] = useState<SearchResult[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  // ── loadAllItems must be declared BEFORE the useEffect that calls it ──
  const loadAllItems = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: msgs }, { data: notes }] = await Promise.all([
      supabase.from('messages').select('id, content, role, session_id, created_at').eq('role', 'assistant').order('created_at', { ascending: false }).limit(200),
      supabase.from('notes').select('id, content, block_id, created_at').order('created_at', { ascending: false }).limit(200),
    ])

    const chatItems: SearchResult[] = (msgs || []).map(m => ({
      type: 'chat' as const,
      id: m.id,
      title: sessions.find(s => s.id === m.session_id)?.title || 'Chat message',
      excerpt: truncate(m.content, 120),
      session_id: m.session_id,
      created_at: m.created_at,
    }))

    const noteItems: SearchResult[] = (notes || []).map(n => ({
      type: 'note' as const,
      id: n.id,
      title: noteBlocks.find(b => b.id === n.block_id)?.title || 'Note',
      excerpt: truncate(n.content.replace(/[#*`_~]/g, ''), 120),
      block_id: n.block_id,
      created_at: n.created_at,
    }))

    const all = [...chatItems, ...noteItems]
    setAllItems(all)
    setResults(all.slice(0, 8))
    setLoading(false)
  }, [sessions, noteBlocks, supabase])

  // Focus input when opened (loadAllItems is now in scope above)
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      loadAllItems()
    } else {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
    }
  }, [searchOpen, loadAllItems])

  // Fuzzy search
  useEffect(() => {
    if (!query.trim()) {
      setResults(allItems.slice(0, 8))
      setSelectedIdx(0)
      return
    }
    const fuse = new Fuse(allItems, {
      keys: ['title', 'excerpt'],
      threshold: 0.4,
      includeScore: true,
    })
    const res = fuse.search(query).slice(0, 10).map(r => r.item)
    setResults(res)
    setSelectedIdx(0)
  }, [query, allItems])

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.type === 'chat' && result.session_id) {
      setActiveSession(result.session_id)
      setViewMode('chat')
    } else if (result.type === 'note' && result.block_id) {
      setActiveBlock(result.block_id)
    }
    setSearchOpen(false)
  }, [setActiveSession, setActiveBlock, setViewMode, setSearchOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIdx]) handleSelect(results[selectedIdx])
    if (e.key === 'Escape') setSearchOpen(false)
  }

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-4"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card w-full max-w-2xl overflow-hidden shadow-glass-lg"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <input
                ref={inputRef}
                id="global-search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search chats and notes..."
                className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none"
              />
              <div className="flex items-center gap-2">
                {query && (
                  <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="text-xs text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-brand-500/50 border-t-brand-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">No results for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                <div className="py-1.5">
                  {/* Group label */}
                  {!query && (
                    <div className="px-4 py-2 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span className="text-xs text-slate-600 font-medium uppercase tracking-wider">Recent</span>
                    </div>
                  )}
                  {results.map((result, idx) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 transition-colors text-left',
                        idx === selectedIdx ? 'bg-brand-600/15 border-l-2 border-brand-500' : 'hover:bg-white/5'
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        result.type === 'chat'
                          ? 'bg-brand-600/20 text-brand-400'
                          : 'bg-emerald-600/20 text-emerald-400'
                      )}>
                        {result.type === 'chat'
                          ? <MessageSquare className="w-3.5 h-3.5" />
                          : <StickyNote className="w-3.5 h-3.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-medium px-1.5 py-0.5 rounded-full',
                            result.type === 'chat'
                              ? 'bg-brand-600/20 text-brand-400'
                              : 'bg-emerald-600/20 text-emerald-400'
                          )}>
                            {result.type === 'chat' ? 'Chat' : 'Note'}
                          </span>
                          <p className="text-sm font-medium text-slate-200 truncate">{result.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{result.excerpt}</p>
                      </div>
                      <ArrowRight className={cn('w-4 h-4 flex-shrink-0 mt-1 transition-opacity', idx === selectedIdx ? 'text-brand-400 opacity-100' : 'opacity-0')} />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="border-t border-white/8 px-4 py-2 flex items-center gap-4 text-xs text-slate-700">
              <span className="flex items-center gap-1"><kbd className="font-mono bg-white/5 px-1 rounded">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-white/5 px-1 rounded">↵</kbd> Open</span>
              <span className="ml-auto">{results.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
