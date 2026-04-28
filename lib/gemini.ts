import { GoogleGenAI } from '@google/genai'

// Check for the Google Generative AI key
const apiKey = process.env.GEMINI_API_KEY

// Using the latest GoogleGenAI SDK
export const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null

export const DEFAULT_MODEL = 'gemini-2.5-flash'
export const DEFAULT_SYSTEM_PROMPT = `You are MemoGPT, an intelligent AI assistant with a focus on helping users build their personal knowledge base. 
You provide thoughtful, well-structured responses that are easy to save as notes. 
When appropriate, use markdown formatting (headers, bullet points, code blocks) to make your responses more organized and note-worthy.`
