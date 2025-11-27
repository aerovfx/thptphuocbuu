'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SpaceCard from './SpaceCard'
import { Search, Filter, Plus, Loader2 } from 'lucide-react'

interface Space {
  id: string
  name: string
  code: string
  description?: string | null
  type: string
  visibility: string
  icon?: string | null
  color?: string | null
  parent?: { name: string } | null
  _count?: {
    members: number
    departments: number
  }
}

interface SpaceListProps {
  initialSpaces?: Space[]
  parentId?: string
  type?: string
  canCreate?: boolean
}

export default function SpaceList({
  initialSpaces = [],
  parentId,
  type,
  canCreate = false,
}: SpaceListProps) {
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVisibility, setFilterVisibility] = useState<string>('all')

  useEffect(() => {
    fetchSpaces()
  }, [parentId, type])

  const fetchSpaces = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (parentId) params.append('parentId', parentId)
      if (type) params.append('type', type)

      const response = await fetch(`/api/spaces?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSpaces(data)
      }
    } catch (error) {
      console.error('Error fetching spaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch =
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVisibility =
      filterVisibility === 'all' || space.visibility === filterVisibility
    return matchesSearch && matchesVisibility
  })

  const handleSpaceClick = (space: Space) => {
    router.push(`/dashboard/spaces/${space.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm kiếm space..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="PUBLIC">Công khai</option>
            <option value="INTERNAL">Nội bộ</option>
            <option value="PRIVATE">Riêng tư</option>
          </select>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/dashboard/spaces/new')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Tạo Space</span>
          </button>
        )}
      </div>

      {/* Spaces Grid */}
      {filteredSpaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 font-poppins">
            {searchTerm || filterVisibility !== 'all'
              ? 'Không tìm thấy space nào'
              : 'Chưa có space nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onClick={() => handleSpaceClick(space)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

