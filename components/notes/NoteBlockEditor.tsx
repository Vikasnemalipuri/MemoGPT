'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  BookOpen, Plus, Trash2, Download, FileText, FileDown,
  MoreHorizontal, Pencil, Clock, ChevronLeft, Save,
  FileCode, Printer,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Note, NoteBlock } from '@/types'
import { cn, formatDate } from '@/lib/utils/helpers'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

// Lazy load the heavy MD editor
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" />,
})

interface NoteBlockEditorProps {
  userId: string
}

export default function NoteBlockEditor({ userId }: NoteBlockEditorProps) {
  const { noteBlocks, activeBlockId, setViewMode } = useAppStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editorValue, setEditorValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const supabase = createClient()

  const activeBlock = noteBlocks.find(b => b.id === activeBlockId)
  const activeNote = notes.find(n => n.id === activeNoteId)

  // Load notes for active block
  useEffect(() => {
    if (!activeBlockId) return
    supabase
      .from('notes')
      .select('*')
      .eq('block_id', activeBlockId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotes(data || [])
        if (data && data.length > 0 && !activeNoteId) {
          setActiveNoteId(data[0].id)
          setEditorValue(data[0].content)
        }
      })
  }, [activeBlockId, activeNoteId, supabase])

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id)
    setEditorValue(note.content)
    setEditMode(false)
  }

  const handleNewNote = async () => {
    if (!activeBlockId) return
    const newNote: Partial<Note> = {
      block_id: activeBlockId,
      user_id: userId,
      content: '# New Note\n\nStart writing...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('notes').insert(newNote).select().single()
    if (data) {
      setNotes(prev => [data, ...prev])
      setActiveNoteId(data.id)
      setEditorValue(data.content)
      setEditMode(true)
    }
  }

  const handleSave = useCallback(async () => {
    if (!activeNoteId || !editorValue) return
    setSaving(true)
    await supabase.from('notes').update({
      content: editorValue,
      updated_at: new Date().toISOString(),
    }).eq('id', activeNoteId)
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content: editorValue } : n))
    setSaving(false)
    setEditMode(false)
  }, [activeNoteId, editorValue, supabase])

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
    if (activeNoteId === noteId) {
      setActiveNoteId(notes[0]?.id || null)
      setEditorValue(notes[0]?.content || '')
    }
  }

  const handleExportMD = () => {
    if (!activeNote) return
    const blob = new Blob([activeNote.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeBlock?.title || 'note'}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const handleExportPDF = async () => {
    if (!activeNote) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const lines = doc.splitTextToSize(activeNote.content.replace(/[#*`_~]/g, ''), 180)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(activeBlock?.title || 'Note', 14, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(lines, 14, 32)
    doc.save(`${activeBlock?.title || 'note'}.pdf`)
    setShowExport(false)
  }

  if (!activeBlock) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-slate-500 font-medium">Select a Note Block</h3>
          <p className="text-slate-700 text-sm mt-1">Choose a notebook from the sidebar to view notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Notes list sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeBlock.icon}</span>
            <h2 className="font-semibold text-slate-100 text-sm truncate">{activeBlock.title}</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Export menu */}
            <div className="relative">
              <button
                onClick={() => setShowExport(o => !o)}
                className="btn-ghost p-1.5"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showExport && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-full mt-1 z-20 glass-card w-44 overflow-hidden shadow-glass-lg"
                    >
                      <button onClick={handleExportMD} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-sm text-slate-300">
                        <FileCode className="w-4 h-4 text-brand-400" /> Export Markdown
                      </button>
                      <button onClick={handleExportPDF} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-sm text-slate-300">
                        <FileDown className="w-4 h-4 text-red-400" /> Export PDF
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button onClick={handleNewNote} className="btn-ghost p-1.5" title="New note">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-600 text-xs">No notes yet</p>
              <button onClick={handleNewNote} className="text-brand-400 text-xs mt-1 hover:text-brand-300">
                Create first note
              </button>
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={cn(
                  'group flex items-start justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                  note.id === activeNoteId ? 'bg-brand-600/15 border border-brand-500/20' : 'hover:bg-white/5'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium truncate', note.id === activeNoteId ? 'text-slate-100' : 'text-slate-400')}>
                    {note.content.split('\n')[0].replace(/^#+ /, '') || 'Untitled Note'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{formatDate(note.created_at)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteNote(note.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                {formatDate(activeNote.updated_at)}
                {activeNote.source_session_id && (
                  <span className="text-brand-500">· From chat</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => { setEditMode(false); setEditorValue(activeNote.content) }}
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {saving ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Save className="w-3 h-3" /> Save</>
                      )}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditMode(true)} className="btn-secondary text-xs px-3 py-1.5">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Editor / Preview */}
            <div className="flex-1 overflow-auto" data-color-mode="dark">
              {editMode ? (
                <MDEditor
                  value={editorValue}
                  onChange={val => setEditorValue(val || '')}
                  height="100%"
                  preview="edit"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 0,
                    minHeight: '100%',
                  }}
                />
              ) : (
                <div className="px-8 py-6 markdown-body max-w-3xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {activeNote.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-center">
            <div>
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Select or create a note</p>
              <button onClick={handleNewNote} className="btn-primary mt-4 text-sm">
                <Plus className="w-4 h-4" /> New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
