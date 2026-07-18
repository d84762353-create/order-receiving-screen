import { GoogleGenerativeAI } from '@google/generative-ai'

// Inisialisasi API Key. Kami mendukung beberapa alternatif nama env variable.
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey)
  console.log('[Gemini] Inisialisasi GoogleGenerativeAI berhasil.')
} else {
  console.warn('[Gemini] Peringatan: GEMINI_API_KEY tidak ditemukan di environment variables.')
}

interface GenerateOptions {
  model?: string
  temperature?: number
  maxOutputTokens?: number
  systemInstruction?: string
}

/**
 * Mengirim prompt ke model Gemini (Default: gemini-2.5-flash)
 */
export async function generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY atau GOOGLE_API_KEY belum dikonfigurasi di environment variables.')
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
  }

  // Gunakan gemini-2.5-flash sebagai default, atau gemini-1.5-flash / gemini-2.0-flash
  const modelName = options.model || 'gemini-2.5-flash'
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: options.systemInstruction
  })

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens
      }
    })

    const response = await result.response
    return response.text()
  } catch (err: any) {
    console.error(`[Gemini] Gagal generate content menggunakan ${modelName}:`, err)
    throw err
  }
}
