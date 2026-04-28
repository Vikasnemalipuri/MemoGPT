// All TypeScript interfaces for MemoGPT

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages?: Message[]
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface NoteFolder {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  color: string
  created_at: string
  children?: NoteFolder[]
  note_blocks?: NoteBlock[]
}

export interface NoteBlock {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  icon: string
  color: string
  created_at: string
  updated_at: string
  notes?: Note[]
}

export interface Note {
  id: string
  block_id: string
  user_id: string
  content: string
  source_message_id: string | null
  source_session_id: string | null
  created_at: string
  updated_at: string
}

export type ViewMode = 'chat' | 'notes' | 'split'
export type ActivePanel = 'history' | 'notes'
export type ExportFormat = 'pdf' | 'markdown'

export interface SearchResult {
  type: 'chat' | 'note'
  id: string
  title: string
  excerpt: string
  session_id?: string
  block_id?: string
  created_at: string
}
