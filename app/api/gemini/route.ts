import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { prompt, model, temperature, systemInstruction } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const text = await generateText(prompt, {
      model: model || 'gemini-2.5-flash',
      temperature,
      systemInstruction
    })

    return NextResponse.json({ text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
