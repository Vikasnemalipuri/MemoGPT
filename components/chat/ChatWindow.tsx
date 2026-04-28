'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, Sparkles, MessageSquare, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Message, ChatSession } from '@/types'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import { cn } from '@/lib/utils/helpers'

interface ChatWindowProps {
  userId: string
}

export default function ChatWindow({ userId }: ChatWindowProps) {
  const {
    messages, setMessages, addMessage, isStreaming, setStreaming,
    streamingContent, setStreamingContent, activeSessionId, setActiveSession,
    addSession, updateSessionTitle, sessions, setViewMode,
  } = useAppStore()

  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const supabase = createClient()

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return }
    supabase
      .from('messages')
      .select('*')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []))
  }, [activeSessionId, setMessages, supabase])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const ensureSession = useCallback(async (): Promise<string> => {
    if (activeSessionId) return activeSessionId

    const newSession: Partial<ChatSession> = {
      user_id: userId,
      title: 'New Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('chat_sessions').insert(newSession).select().single()
    if (data) {
      addSession(data)
      setActiveSession(data.id)
      return data.id
    }
    return ''
  }, [activeSessionId, userId, supabase, addSession, setActiveSession])

  const autoTitle = useCallback(async (sessionId: string, firstUserMsg: string) => {
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [{
            role: 'user',
            content: `Generate a short 4-6 word title for a chat that starts with: "${firstUserMsg.slice(0, 120)}". Reply with ONLY the title, no quotes, no punctuation at end.`,
          }],
        }),
      })
      const reader = resp.body?.getReader()
      let title = ''
      if (reader) {
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6))
                title += data.content || ''
              } catch {}
            }
          }
        }
      }
      if (title.trim()) {
        await supabase.from('chat_sessions').update({ title: title.trim() }).eq('id', sessionId)
        updateSessionTitle(sessionId, title.trim())
      }
    } catch {}
  }, [supabase, updateSessionTitle])

  const handleSend = useCallback(async (content: string) => {
    const sessionId = await ensureSession()
    if (!sessionId) return

    // Save user message
    const userMsg: Partial<Message> = {
      session_id: sessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    const { data: savedUser } = await supabase.from('messages').insert(userMsg).select().single()
    const userMessage: Message = savedUser || { id: crypto.randomUUID(), session_id: sessionId, role: 'user', content, created_at: new Date().toISOString() }
    addMessage(userMessage)

    // Auto title if first message
    const isFirst = messages.length === 0
    if (isFirst) autoTitle(sessionId, content)

    // Stream AI response
    setStreaming(true)
    setStreamingContent('')

    const allMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))

    abortRef.current = new AbortController()
    let fullContent = ''

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, sessionId }),
        signal: abortRef.current.signal,
      })

      const reader = resp.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6))
                fullContent += data.content || ''
                setStreamingContent(fullContent)
              } catch {}
            }
          }
        }
      }

      // Save AI message to DB
      if (fullContent) {
        const aiMsg: Partial<Message> = {
          session_id: sessionId,
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        }
        const { data: savedAi } = await supabase.from('messages').insert(aiMsg).select().single()
        const aiMessage: Message = savedAi || { id: crypto.randomUUID(), session_id: sessionId, role: 'assistant', content: fullContent, created_at: new Date().toISOString() }
        addMessage(aiMessage)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: 'assistant',
          content: '⚠️ Something went wrong. Please check your API key and try again.',
          created_at: new Date().toISOString(),
        }
        addMessage(errMsg)
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }, [messages, ensureSession, supabase, addMessage, setStreaming, setStreamingContent, autoTitle])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
    if (streamingContent) {
      const sessionId = activeSessionId || ''
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: 'assistant',
        content: streamingContent,
        created_at: new Date().toISOString(),
      }
      addMessage(aiMessage)
    }
    setStreamingContent('')
  }, [streamingContent, activeSessionId, addMessage, setStreaming, setStreamingContent])

  const hasContent = messages.length > 0 || isStreaming

  return (
    <div className="flex flex-col h-full">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!hasContent ? (
          <WelcomeScreen onSuggestion={handleSend} />
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                sessionId={activeSessionId || ''}
              />
            ))}

            {/* Streaming bubble */}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  session_id: activeSessionId || '',
                  role: 'assistant',
                  content: streamingContent,
                  created_at: new Date().toISOString(),
                }}
                isStreaming={true}
                sessionId={activeSessionId || ''}
              />
            )}

            {/* Thinking indicator */}
            {isStreaming && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-800 border border-white/10 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-brand-400 animate-pulse-slow" />
                </div>
                <div className="flex gap-1.5 items-center px-4 py-3 bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-brand-400 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
      />
    </div>
  )
}

function WelcomeScreen({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  const prompts = [
    { icon: '💡', title: 'Explain a concept', text: 'Explain how transformers work in machine learning' },
    { icon: '🐍', title: 'Write code', text: 'Write a Python async web scraper with error handling' },
    { icon: '📋', title: 'Summarize', text: 'Summarize the key points about React Server Components' },
    { icon: '🔍', title: 'Debug', text: 'Help me debug this TypeScript type error: ...' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full text-center py-16"
    >
      <div className="w-16 h-16 bg-brand-600/20 border border-brand-500/30 rounded-2xl flex items-center justify-center mb-6 glow-brand">
        <BrainCircuit className="w-8 h-8 text-brand-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">What can I help you with?</h2>
      <p className="text-slate-500 text-sm mb-10 max-w-sm">
        Ask anything. Save the best answers directly to your Note Blocks.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {prompts.map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => onSuggestion(p.text)}
            className="text-left p-4 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/15
              rounded-2xl transition-all duration-200 group"
          >
            <span className="text-xl mb-2 block">{p.icon}</span>
            <p className="text-sm font-medium text-slate-300 group-hover:text-slate-100">{p.title}</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{p.text}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
