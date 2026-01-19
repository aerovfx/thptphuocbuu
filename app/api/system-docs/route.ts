import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const rootDir = process.cwd()
        const docsDir = path.join(rootDir, 'docs')

        const getMdFiles = (dir: string): any[] => {
            if (!fs.existsSync(dir)) return []
            return fs.readdirSync(dir)
                .filter(file => file.endsWith('.md'))
                .map(file => {
                    const filePath = path.join(dir, file)
                    const stats = fs.statSync(filePath)
                    return {
                        name: file,
                        path: dir === rootDir ? file : `docs/${file}`,
                        size: stats.size,
                        modifiedAt: stats.mtime,
                        category: dir === rootDir ? 'Root' : 'Documentation'
                    }
                })
        }

        const rootFiles = getMdFiles(rootDir)
        const docFiles = getMdFiles(docsDir)

        return NextResponse.json([...rootFiles, ...docFiles])
    } catch (error) {
        console.error('[SYSTEM_DOCS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
