'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Paperclip, Mic, Sparkles, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  useEffect(() => { adjustHeight() }, [input, adjustHeight])

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming || disabled) return
    onSend(input.trim())
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [input, isStreaming, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    'Explain this concept with examples',
    'Write a Python function that...',
    'Summarize the key points of...',
  ]

  return (
    <div className="border-t border-white/5 bg-surface-900/50 backdrop-blur-md px-4 py-4">
      {/* Suggestions (when empty) */}
      <AnimatePresence>
        {!input && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="flex-shrink-0 text-xs text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/8
                  border border-white/8 hover:border-white/15 rounded-full px-3 py-1.5 transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input box */}
      <div className="relative flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3
        focus-within:border-brand-500/40 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all duration-200">

        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'MemoGPT is thinking...' : 'Ask anything... (Shift+Enter for new line)'}
            disabled={isStreaming || disabled}
            rows={1}
            className="bg-transparent text-slate-100 placeholder:text-slate-600 text-sm leading-relaxed
              resize-none focus:outline-none disabled:opacity-50 w-full max-h-[200px] scrollbar-hide"
            style={{ minHeight: '24px' }}
          />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
          {isStreaming ? (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={onStop}
              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30
                rounded-xl flex items-center justify-center transition-all text-red-400"
              title="Stop generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="w-8 h-8 bg-brand-600 hover:bg-brand-500 disabled:bg-white/5 disabled:opacity-40
                rounded-xl flex items-center justify-center transition-all shadow-brand
                disabled:shadow-none disabled:cursor-not-allowed"
              title="Send (Enter)"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-700 text-center mt-2">
        MemoGPT may produce errors. Always verify important info.
      </p>
    </div>
  )
}
