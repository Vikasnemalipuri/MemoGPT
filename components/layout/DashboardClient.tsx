'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, BookOpen, SplitSquareHorizontal, PanelLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import NoteBlockEditor from '@/components/notes/NoteBlockEditor'
import GlobalSearch from '@/components/search/GlobalSearch'
import { cn } from '@/lib/utils/helpers'

interface DashboardClientProps {
  user: {
    id: string
    email: string
    user_metadata?: { full_name?: string; avatar_url?: string }
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const {
    setSessions, setNoteBlocks, setFolders,
    viewMode, setViewMode, activeBlockId,
    isSidebarCollapsed,
  } = useAppStore()

  const supabase = createClient()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const [{ data: sessions }, { data: blocks }, { data: folders }] = await Promise.all([
        supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(50),
        supabase.from('note_blocks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('note_folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      if (sessions) setSessions(sessions)
      if (blocks) setNoteBlocks(blocks)
      if (folders) setFolders(folders)
    }
    loadData()
  }, [user.id, setFolders, setNoteBlocks, setSessions, supabase])

  const viewTabs = [
    { id: 'chat', icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Chat' },
    { id: 'notes', icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Notes' },
    { id: 'split', icon: <SplitSquareHorizontal className="w-3.5 h-3.5" />, label: 'Split' },
  ] as const

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-surface-900/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* View mode tabs */}
            <div className="flex items-center bg-white/5 rounded-xl p-0.5 gap-0.5">
              {viewTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                    viewMode === tab.id
                      ? 'bg-white/10 text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right side status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-slow" />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ChatWindow userId={user.id} />
              </motion.div>
            )}

            {viewMode === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <NoteBlockEditor userId={user.id} />
              </motion.div>
            )}

            {viewMode === 'split' && (
              <motion.div
                key="split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full flex"
              >
                <div className="flex-1 border-r border-white/5 overflow-hidden">
                  <ChatWindow userId={user.id} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <NoteBlockEditor userId={user.id} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Search Overlay */}
      <GlobalSearch />
    </div>
  )
}
