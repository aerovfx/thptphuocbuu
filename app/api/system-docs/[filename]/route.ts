import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(
    req: Request,
    { params }: { params: { filename: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { filename } = params
        // Prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new NextResponse('Invalid filename', { status: 400 })
        }

        const rootDir = process.cwd()
        const docsDir = path.join(rootDir, 'docs')

        let filePath = path.join(rootDir, filename)
        if (!fs.existsSync(filePath) || !filename.endsWith('.md')) {
            filePath = path.join(docsDir, filename)
        }

        if (!fs.existsSync(filePath) || !filename.endsWith('.md')) {
            return new NextResponse('File not found', { status: 404 })
        }

        const content = fs.readFileSync(filePath, 'utf-8')
        const stats = fs.statSync(filePath)

        return NextResponse.json({
            name: filename,
            content,
            size: stats.size,
            modifiedAt: stats.mtime
        })
    } catch (error) {
        console.error('[SYSTEM_DOCS_ITEM_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
