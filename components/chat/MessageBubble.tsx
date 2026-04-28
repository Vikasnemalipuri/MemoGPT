'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { motion } from 'framer-motion'
import { User, BrainCircuit, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Message } from '@/types'
import { cn, formatDate } from '@/lib/utils/helpers'
import SendToNotesDropdown from './SendToNotesDropdown'
import 'highlight.js/styles/github-dark.css'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  sessionId: string
}

const MessageBubble = memo(function MessageBubble({ message, isStreaming, sessionId }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser
          ? 'bg-brand-600/30 border border-brand-500/30'
          : 'bg-surface-800 border border-white/10'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-brand-300" />
          : <BrainCircuit className="w-4 h-4 text-brand-400" />
        }
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[82%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-3',
          isUser
            ? 'bg-brand-600/25 border border-brand-500/20 rounded-tr-sm'
            : 'bg-white/5 border border-white/8 rounded-tl-sm'
        )}>
          {isUser ? (
            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={cn('markdown-body text-sm', isStreaming && 'typing-cursor')}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-surface-850 border border-white/10 rounded-xl p-4 my-3 overflow-x-auto text-sm">
                      {children}
                    </pre>
                  ),
                  code: ({ inline, children, ...props }: any) =>
                    inline
                      ? <code className="text-brand-300 bg-brand-950/60 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                      : <code className="text-slate-200 font-mono text-sm" {...props}>{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action bar (AI messages only) */}
        {!isUser && !isStreaming && (
          <div className="flex items-center gap-1.5 px-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <SendToNotesDropdown
              messageContent={message.content}
              messageId={message.id}
              sessionId={sessionId}
            />

            <span className="text-slate-700 text-xs ml-1">{formatDate(message.created_at)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default MessageBubble
