import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * API để trích xuất nội dung từ file (PDF, Word, text)
 * Trả về các dòng đầu của file để tự động điền vào description/notes
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File không được để trống' }, { status: 400 })
    }

    // Protect server from large uploads; extraction is best-effort and should not process huge files.
    // Users can still upload up to 50MB, but auto-extract preview is skipped for large files.
    const MAX_EXTRACT_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_EXTRACT_SIZE) {
      return NextResponse.json({
        success: false,
        preview: '',
        fullText: '',
        hasMore: false,
        error: 'File quá lớn để trích xuất tự động.',
      })
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let extractedText = ''

    try {
      // Read file as text for text files
      if (fileExtension === 'txt') {
        const text = await file.text()
        extractedText = text
      }
      // For PDF, DOC, DOCX - we'll extract text using available methods
      else if (fileExtension === 'pdf') {
        // For PDF, we'll use a simple approach: read as text (works for text-based PDFs)
        // For scanned PDFs, would need OCR library like pdf-parse or Tesseract
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          // Try to extract text from PDF using pdf-parse
          try {
            const pdfParseModule: any = await import('pdf-parse')
            const pdfParse = pdfParseModule?.default ?? pdfParseModule
            const pdfData = await pdfParse(buffer)
            extractedText = pdfData.text || ''
          } catch (e) {
            // If pdf-parse fails, try reading as text (for text-based PDFs)
            try {
              extractedText = buffer.toString('utf-8')
              // Filter out binary data, keep only readable text
              extractedText = extractedText.replace(/[^\x20-\x7E\n\r]/g, '')
              // If result is mostly binary, indicate failure
              if (extractedText.length < 50) {
                extractedText = 'Không thể trích xuất nội dung từ file PDF. File có thể là PDF scan. Vui lòng nhập thủ công.'
              }
            } catch (e2) {
              extractedText = 'Không thể trích xuất nội dung từ file PDF. Vui lòng nhập thủ công.'
            }
          }
        } catch (e) {
          extractedText = 'Không thể trích xuất nội dung từ file PDF. Vui lòng nhập thủ công.'
        }
      }
      // For Word documents
      else if (fileExtension === 'docx' || fileExtension === 'doc') {
        try {
          const mammoth = await import('mammoth')
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value || ''
        } catch (e) {
          console.error('Error extracting from Word:', e)
          extractedText = 'Không thể trích xuất nội dung từ file Word. Vui lòng nhập thủ công.'
        }
      }
      // For images (would need OCR)
      else if (['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
        extractedText = 'File hình ảnh. Cần OCR để trích xuất nội dung.'
      }
      else {
        extractedText = 'Định dạng file không được hỗ trợ trích xuất tự động.'
      }

      // Extract first few lines (first 500 characters or first 10 lines)
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0)
      const firstLines = lines.slice(0, 10).join('\n')
      const preview = firstLines.substring(0, 500)

      return NextResponse.json({
        success: true,
        preview: preview,
        fullText: extractedText.substring(0, 2000), // Limit to 2000 chars for response
        hasMore: extractedText.length > 2000,
      })
    } catch (error: any) {
      console.error('Error extracting content:', error)
      return NextResponse.json({
        success: false,
        error: 'Không thể trích xuất nội dung từ file',
        preview: '',
      })
    }
  } catch (error: any) {
    console.error('Error in extract-content API:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi trích xuất nội dung' },
      { status: 500 }
    )
  }
}

