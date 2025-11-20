/**
 * OpenAI Integration for AI Services
 * 
 * This file provides actual implementations using OpenAI API
 * Replace placeholder functions in ai-service.ts with these
 */

import { OpenAI } from 'openai'
import type {
  OCRResult,
  ClassificationResult,
  ExtractionResult,
  SummaryResult,
} from './ai-service'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Document Classification using GPT-4 with Standard Document Type Codes
 */
export async function classifyDocumentOpenAI(
  title: string,
  content: string,
  context?: 'incoming' | 'outgoing' | 'internal'
): Promise<{ code: string; name: string; group: string; confidence: number; reasoning?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  // Load system prompt from file (simplified version)
  const systemPrompt = `Bạn là một chuyên gia phân loại văn bản hành chính Việt Nam theo chuẩn Nghị định 30/2020/NĐ-CP.

Phân loại văn bản vào một trong các mã sau:

**Văn bản hành chính:** CV, QĐ, CT, TB, BC, TT, KH, CTri, DA, PA, QDinh, QC, HD, BB, GM, GT, GĐĐ, PG, PC, PB, HS, HDN
**Văn bản đến:** CVĐ, GMĐ, TBĐ, BCĐ, KTĐ
**Văn bản đi:** CVD, QĐD, TBD, KHD, BCD
**Văn bản pháp lý:** NQ, TTg, NĐ, L
**Văn bản nội bộ:** TBn, BBh, YC, DX, KT

Trả về JSON: {"code": "CV", "name": "Công văn", "group": "administrative", "confidence": 0.95, "reasoning": "lý do"}`

  try {
    const userPrompt = `Phân loại văn bản sau:

**Tiêu đề:** ${title}

**Nội dung:** ${content.substring(0, 3000)}

${context ? `**Ngữ cảnh:** ${context === 'incoming' ? 'Văn bản đến' : context === 'outgoing' ? 'Văn bản đi' : 'Văn bản nội bộ'}` : ''}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    // Validate result
    if (!result.code || !result.name || !result.group) {
      throw new Error('Invalid classification result format')
    }

    return {
      code: result.code,
      name: result.name,
      group: result.group,
      confidence: result.confidence || 0.75,
      reasoning: result.reasoning,
    }
  } catch (error) {
    console.error('Error classifying document with OpenAI:', error)
    throw error
  }
}

/**
 * Extract Metadata from Document
 */
export async function extractMetadataOpenAI(content: string): Promise<ExtractionResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Bạn là một chuyên gia trích xuất thông tin từ văn bản hành chính. Trích xuất các thông tin sau từ văn bản: số văn bản, ngày ban hành, nơi ban hành, người ký, nội dung chính. Trả về JSON với format: {"documentNumber": "...", "issueDate": "...", "issuer": "...", "signer": "...", "content": "..."}`,
        },
        {
          role: 'user',
          content: `Trích xuất thông tin từ văn bản sau:\n\n${content.substring(0, 4000)}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      documentNumber: result.documentNumber || '',
      issueDate: result.issueDate || '',
      issuer: result.issuer || '',
      signer: result.signer || '',
      content: result.content || '',
    }
  } catch (error) {
    console.error('Error extracting metadata with OpenAI:', error)
    throw error
  }
}

/**
 * Summarize Document
 */
export async function summarizeDocumentOpenAI(
  content: string,
  maxLength: number = 200
): Promise<SummaryResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Bạn là một chuyên gia tóm tắt văn bản hành chính. Tóm tắt văn bản sau đây trong khoảng ${maxLength} từ, và liệt kê 3-5 điểm chính. Trả về JSON với format: {"summary": "...", "keyPoints": ["...", "..."], "confidence": 0.0-1.0}`,
        },
        {
          role: 'user',
          content: `Tóm tắt văn bản sau:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      summary: result.summary || '',
      keyPoints: result.keyPoints || [],
      confidence: result.confidence || 0.80,
    }
  } catch (error) {
    console.error('Error summarizing document with OpenAI:', error)
    throw error
  }
}

/**
 * Suggest Draft for Outgoing Document
 */
export async function suggestDraftOpenAI(
  type: string,
  recipient: string,
  purpose: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Bạn là một chuyên gia soạn thảo văn bản hành chính theo chuẩn Nghị định 30/2020/NĐ-CP. Tạo bản nháp văn bản đi với đầy đủ các phần: phần mở đầu, nội dung chính, phần kết thúc. Sử dụng ngôn ngữ trang trọng, rõ ràng, đúng thể thức hành chính.`,
        },
        {
          role: 'user',
          content: `Tạo bản nháp văn bản đi với thông tin sau:
- Loại: ${type}
- Người/nơi nhận: ${recipient}
- Mục đích: ${purpose}

Tạo văn bản đầy đủ theo chuẩn Nghị định 30/2020.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error suggesting draft with OpenAI:', error)
    throw error
  }
}

/**
 * Semantic Search using OpenAI Embeddings
 */
export async function semanticSearchOpenAI(
  query: string,
  documentIds?: string[]
): Promise<Array<{ id: string; score: number }>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  try {
    // Generate embedding for query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    // TODO: Compare with document embeddings stored in database
    // This would require storing embeddings when documents are created
    // For now, return empty array as placeholder

    return []
  } catch (error) {
    console.error('Error performing semantic search with OpenAI:', error)
    throw error
  }
}

