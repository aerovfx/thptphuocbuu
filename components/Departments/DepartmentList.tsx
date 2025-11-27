'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DepartmentCard from './DepartmentCard'
import { Search, Filter, Plus, Loader2, BookOpen } from 'lucide-react'

interface Department {
  id: string
  name: string
  code: string
  description?: string | null
  type: string
  subject?: string | null
  icon?: string | null
  color?: string | null
  leader?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  } | null
  space?: { name: string } | null
  _count?: {
    members: number
    documents: number
  }
}

interface DepartmentListProps {
  initialDepartments?: Department[]
  type?: string
  spaceId?: string
  canCreate?: boolean
}

export default function DepartmentList({
  initialDepartments = [],
  type,
  spaceId,
  canCreate = false,
}: DepartmentListProps) {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchDepartments()
  }, [type, spaceId])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (spaceId) params.append('spaceId', spaceId)
      params.append('includeMembers', 'false')

      const response = await fetch(`/api/departments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || dept.type === filterType
    return matchesSearch && matchesType
  })

  const handleDepartmentClick = (department: Department) => {
    router.push(`/dashboard/departments/${department.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-green-500" size={32} />
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
            placeholder="Tìm kiếm tổ chuyên môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tất cả</option>
            <option value="TO_CHUYEN_MON">Tổ Chuyên Môn</option>
            <option value="TO_HANH_CHINH">Tổ Hành chính</option>
            <option value="BAN_TT">Ban Truyền Thông</option>
            <option value="BAN_TAI_CHINH">Ban Tài chính</option>
            <option value="BAN_Y_TE">Ban Y tế</option>
            <option value="DOAN_DANG">Đoàn/Đảng bộ</option>
          </select>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/dashboard/departments/new')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Tạo Tổ</span>
          </button>
        )}
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-poppins">
            {searchTerm || filterType !== 'all'
              ? 'Không tìm thấy tổ chuyên môn nào'
              : 'Chưa có tổ chuyên môn nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              onClick={() => handleDepartmentClick(department)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

