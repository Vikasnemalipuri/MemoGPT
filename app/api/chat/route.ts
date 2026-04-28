import { gemini, DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from '@/lib/gemini'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId } = await request.json()

    if (!gemini) {
      throw new Error('Gemini API key is missing. Please add GEMINI_API_KEY to your .env.local file.')
    }

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const stream = await gemini.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: formattedMessages,
      config: {
        systemInstruction: DEFAULT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.text || ''
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, sessionId })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
