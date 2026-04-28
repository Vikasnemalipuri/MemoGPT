'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookmarkPlus, ChevronDown, Check, Plus, FolderOpen } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Note } from '@/types'
import { cn } from '@/lib/utils/helpers'

interface SendToNotesDropdownProps {
  messageContent: string
  messageId: string
  sessionId: string
}

export default function SendToNotesDropdown({ messageContent, messageId, sessionId }: SendToNotesDropdownProps) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedBlockId, setSavedBlockId] = useState<string | null>(null)
  const { noteBlocks, addNoteBlock } = useAppStore()
  const supabase = createClient()
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleSaveToBlock = useCallback(async (blockId: string) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const note: Partial<Note> = {
      block_id: blockId,
      user_id: user.id,
      content: messageContent,
      source_message_id: messageId,
      source_session_id: sessionId,
    }

    const { error } = await supabase.from('notes').insert(note)
    if (!error) {
      setSaved(true)
      setSavedBlockId(blockId)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
    setOpen(false)
  }, [messageContent, messageId, sessionId, supabase])

  const savedBlock = noteBlocks.find(b => b.id === savedBlockId)

  return (
    <div className="relative inline-block">
      <motion.button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-white/5 hover:bg-brand-600/20 text-slate-500 hover:text-brand-300 border border-white/8 hover:border-brand-500/30'
        )}
        title="Save to Notes"
      >
        {saved ? (
          <>
            <Check className="w-3 h-3" />
            Saved{savedBlock ? ` to ${savedBlock.title}` : ''}
          </>
        ) : (
          <>
            <BookmarkPlus className="w-3 h-3" />
            Save to Notes
            <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-full mb-2 left-0 z-20 glass-card w-56 shadow-glass-lg overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-white/8">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Note Block</p>
              </div>

              <div className="max-h-56 overflow-y-auto py-1">
                {noteBlocks.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <FolderOpen className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-600">No note blocks yet.</p>
                    <p className="text-xs text-slate-700">Create one in the sidebar.</p>
                  </div>
                ) : (
                  noteBlocks.map(block => (
                    <button
                      key={block.id}
                      onClick={() => handleSaveToBlock(block.id)}
                      disabled={saving}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                    >
                      <span className="text-sm flex-shrink-0">{block.icon}</span>
                      <span className="text-sm text-slate-300 truncate">{block.title}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
