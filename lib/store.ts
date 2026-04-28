'use client'

import { create } from 'zustand'
import { ChatSession, Message, NoteBlock, NoteFolder } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface AppState {
  // Chat
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: Message[]
  isStreaming: boolean
  streamingContent: string

  // Notes
  folders: NoteFolder[]
  noteBlocks: NoteBlock[]
  activeBlockId: string | null

  // UI
  sidebarSection: 'history' | 'notes'
  viewMode: 'chat' | 'notes' | 'split'
  searchOpen: boolean
  isSidebarCollapsed: boolean

  // Actions — Chat
  setSessions: (sessions: ChatSession[]) => void
  setActiveSession: (id: string | null) => void
  addSession: (session: ChatSession) => void
  updateSessionTitle: (id: string, title: string) => void
  deleteSession: (id: string) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void

  // Actions — Notes
  setFolders: (folders: NoteFolder[]) => void
  setNoteBlocks: (blocks: NoteBlock[]) => void
  setActiveBlock: (id: string | null) => void
  addFolder: (folder: NoteFolder) => void
  addNoteBlock: (block: NoteBlock) => void
  deleteNoteBlock: (id: string) => void

  // Actions — UI
  setSidebarSection: (section: 'history' | 'notes') => void
  setViewMode: (mode: 'chat' | 'notes' | 'split') => void
  setSearchOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',

  folders: [],
  noteBlocks: [],
  activeBlockId: null,

  sidebarSection: 'history',
  viewMode: 'chat',
  searchOpen: false,
  isSidebarCollapsed: false,

  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  updateSessionTitle: (id, title) =>
    set((s) => ({
      sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess),
    })),
  deleteSession: (id) =>
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
      messages: s.activeSessionId === id ? [] : s.messages,
    })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),

  setFolders: (folders) => set({ folders }),
  setNoteBlocks: (noteBlocks) => set({ noteBlocks }),
  setActiveBlock: (id) => set({ activeBlockId: id, viewMode: 'notes' }),
  addFolder: (folder) => set((s) => ({ folders: [...s.folders, folder] })),
  addNoteBlock: (block) => set((s) => ({ noteBlocks: [...s.noteBlocks, block] })),
  deleteNoteBlock: (id) =>
    set((s) => ({
      noteBlocks: s.noteBlocks.filter((b) => b.id !== id),
      activeBlockId: s.activeBlockId === id ? null : s.activeBlockId,
    })),

  setSidebarSection: (section) => set({ sidebarSection: section }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
}))
