'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Plus, MessageSquare, FolderOpen, Search, Settings,
  ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2,
  BookOpen, PanelLeft, Sparkles, FolderPlus, StickyNote, LogOut,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate, truncate } from '@/lib/utils/helpers'
import { ChatSession, NoteBlock, NoteFolder } from '@/types'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface SidebarProps {
  user: { id: string; email: string; user_metadata?: { full_name?: string; avatar_url?: string } }
}

export default function Sidebar({ user }: SidebarProps) {
  const {
    sessions, activeSessionId, setActiveSession, deleteSession, updateSessionTitle,
    noteBlocks, folders, activeBlockId, setActiveBlock, addSession,
    sidebarSection, setSidebarSection, setViewMode, setSearchOpen, isSidebarCollapsed, toggleSidebar,
    addNoteBlock, addFolder,
  } = useAppStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newBlockName, setNewBlockName] = useState('')
  const [showNewBlock, setShowNewBlock] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const handleNewChat = async () => {
    const supabase = createClient()
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: 'New Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('chat_sessions').insert(newSession).select().single()
    if (data) {
      addSession(data)
      setActiveSession(data.id)
      setViewMode('chat')
    }
  }

  const handleCreateBlock = async () => {
    if (!newBlockName.trim()) return
    const newBlock: NoteBlock = {
      id: crypto.randomUUID(),
      user_id: user.id,
      folder_id: null,
      title: newBlockName.trim(),
      icon: '📝',
      color: '#6366f1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('note_blocks').insert(newBlock).select().single()
    if (data) {
      addNoteBlock(data)
      setNewBlockName('')
      setShowNewBlock(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const startEdit = (session: ChatSession) => {
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return
    await supabase.from('chat_sessions').update({ title: editTitle }).eq('id', editingId)
    updateSessionTitle(editingId, editTitle)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('chat_sessions').delete().eq('id', id)
    deleteSession(id)
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const avatarLetter = user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'

  if (isSidebarCollapsed) {
    return (
      <motion.div
        initial={false}
        animate={{ width: 60 }}
        className="h-screen bg-surface-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 gap-3"
      >
        <button onClick={toggleSidebar} className="btn-ghost p-2">
          <PanelLeft className="w-5 h-5" />
        </button>
        <button onClick={handleNewChat} className="btn-ghost p-2">
          <Plus className="w-5 h-5" />
        </button>
        <button onClick={() => { setSidebarSection('history'); toggleSidebar() }} className="btn-ghost p-2">
          <MessageSquare className="w-5 h-5" />
        </button>
        <button onClick={() => { setSidebarSection('notes'); toggleSidebar() }} className="btn-ghost p-2">
          <BookOpen className="w-5 h-5" />
        </button>
        <button onClick={() => setSearchOpen(true)} className="btn-ghost p-2 mt-auto">
          <Search className="w-5 h-5" />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: 280 }}
      className="sidebar flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brand">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">MemoGPT</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={toggleSidebar} className="btn-ghost p-1.5" title="Collapse sidebar">
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          id="new-chat-btn"
          onClick={handleNewChat}
          className="w-full btn-primary justify-center py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pb-2">
        <button
          id="search-btn"
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-slate-500 hover:text-slate-300 transition-all text-sm"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-xs bg-white/10 px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="px-3 pb-2">
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => setSidebarSection('history')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              sidebarSection === 'history'
                ? 'bg-white/10 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            History
          </button>
          <button
            onClick={() => setSidebarSection('notes')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              sidebarSection === 'notes'
                ? 'bg-white/10 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Notes
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        <AnimatePresence mode="wait">
          {sidebarSection === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              className="space-y-0.5"
            >
              <p className="text-xs text-slate-600 font-medium px-2 py-1 uppercase tracking-wider">Recent</p>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-600 text-xs">No chats yet</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    isEditing={editingId === session.id}
                    editTitle={editTitle}
                    onSelect={() => { setActiveSession(session.id); setViewMode('chat') }}
                    onEdit={() => startEdit(session)}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => handleDelete(session.id)}
                    onEditTitleChange={setEditTitle}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Notebooks</p>
                <button
                  onClick={() => setShowNewBlock(true)}
                  className="text-slate-600 hover:text-slate-300 transition-colors"
                  title="Add Note Block"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* New block input */}
              <AnimatePresence>
                {showNewBlock && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-1.5 px-1 py-1">
                      <input
                        autoFocus
                        value={newBlockName}
                        onChange={e => setNewBlockName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleCreateBlock()
                          if (e.key === 'Escape') setShowNewBlock(false)
                        }}
                        placeholder="Block name..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                      />
                      <button onClick={handleCreateBlock} className="btn-primary px-2.5 py-1.5 text-xs">
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Note blocks */}
              {noteBlocks.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-600 text-xs">No note blocks yet</p>
                  <button
                    onClick={() => setShowNewBlock(true)}
                    className="text-brand-400 text-xs mt-1 hover:text-brand-300"
                  >
                    Create one
                  </button>
                </div>
              ) : (
                noteBlocks.map((block) => (
                  <NoteBlockItem
                    key={block.id}
                    block={block}
                    isActive={block.id === activeBlockId}
                    onSelect={() => setActiveBlock(block.id)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-600/30 rounded-full flex items-center justify-center flex-shrink-0 border border-brand-500/30">
            <span className="text-xs font-bold text-brand-300">{avatarLetter}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs text-slate-600 truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost p-1.5" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}

function SessionItem({
  session, isActive, isEditing, editTitle, onSelect, onEdit,
  onSaveEdit, onCancelEdit, onDelete, onEditTitleChange
}: {
  session: ChatSession
  isActive: boolean
  isEditing: boolean
  editTitle: string
  onSelect: () => void
  onEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onEditTitleChange: (v: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all duration-150',
        isActive ? 'bg-brand-600/15 border border-brand-500/20' : 'hover:bg-white/5'
      )}
      onClick={!isEditing ? onSelect : undefined}
    >
      <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-brand-400' : 'text-slate-600')} />

      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={e => onEditTitleChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit() }}
          onBlur={onSaveEdit}
          className="flex-1 bg-transparent text-xs text-slate-100 focus:outline-none border-b border-brand-500/50"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className={cn('flex-1 text-xs truncate', isActive ? 'text-slate-100' : 'text-slate-400')}>
          {truncate(session.title, 28)}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3 text-slate-500" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}

function NoteBlockItem({ block, isActive, onSelect }: {
  block: NoteBlock
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all duration-150 text-left',
        isActive ? 'bg-brand-600/15 border border-brand-500/20' : 'hover:bg-white/5'
      )}
    >
      <span className="text-sm">{block.icon}</span>
      <span className={cn('flex-1 text-xs truncate', isActive ? 'text-slate-100' : 'text-slate-400')}>
        {block.title}
      </span>
    </button>
  )
}
