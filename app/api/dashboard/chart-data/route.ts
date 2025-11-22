import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'
    const userId = searchParams.get('userId') || session.user.id
    const role = searchParams.get('role') || session.user.role

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get incoming documents
    const incomingDocs = await prisma.incomingDocument.findMany({
      where: {
        createdById: userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Get outgoing documents
    const outgoingDocs = await prisma.outgoingDocument.findMany({
      where: {
        createdById: userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Group by time period
    const groupData = (docs: any[], period: string, type: 'incoming' | 'outgoing') => {
      const groups: Record<string, { count: number; completed: number }> = {}

      docs.forEach((doc) => {
        const date = new Date(doc.createdAt)
        let key: string

        if (period === 'week') {
          const day = date.getDay()
          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
          key = days[day]
        } else if (period === 'month') {
          key = `Tuần ${Math.ceil(date.getDate() / 7)}`
        } else if (period === 'quarter') {
          key = `Tháng ${date.getMonth() + 1}`
        } else {
          key = `Q${Math.floor(date.getMonth() / 3) + 1}`
        }

        if (!groups[key]) {
          groups[key] = { count: 0, completed: 0 }
        }

        groups[key].count++
        if (doc.status === 'COMPLETED' || doc.status === 'APPROVED') {
          groups[key].completed++
        }
      })

      return groups
    }

    const incomingGroups = groupData(incomingDocs, period, 'incoming')
    const outgoingGroups = groupData(outgoingDocs, period, 'outgoing')

    // Combine data
    const allKeys = new Set([...Object.keys(incomingGroups), ...Object.keys(outgoingGroups)])
    const chartData = Array.from(allKeys).map((key) => ({
      name: key,
      'văn bản đến': incomingGroups[key]?.count || 0,
      'văn bản đi': outgoingGroups[key]?.count || 0,
      'hoàn thành': (incomingGroups[key]?.completed || 0) + (outgoingGroups[key]?.completed || 0),
    }))

    // Sort by name
    chartData.sort((a, b) => {
      if (period === 'week') {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        return days.indexOf(a.name) - days.indexOf(b.name)
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

