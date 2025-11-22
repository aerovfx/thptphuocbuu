'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Bell,
  Settings,
  Grid,
  List,
  Filter,
  MoreVertical,
  ChevronDown,
  Code,
  Code2,
  Database,
  Server,
  Calculator,
  Users,
  Layout,
  Monitor,
  Brain,
  BookOpen,
  Terminal,
  Globe,
} from 'lucide-react'
import Avatar from '../Common/Avatar'

interface Class {
  id: string
  name: string
  code: string
  description: string | null
  teacher: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  _count: {
    enrollments: number
    materials: number
  }
  createdAt: string
}

interface ClassesPageContentProps {
  classes: Class[]
  currentUser: {
    user: {
      id: string
      name: string | null
      email: string | null
      role: string
      image: string | null
    }
  }
  canCreate: boolean
}

// Gradient colors for class cards
const gradientColors = [
  'from-pink-400 to-purple-500',
  'from-teal-400 to-green-500',
  'from-orange-400 to-red-500',
  'from-blue-400 to-cyan-500',
  'from-indigo-400 to-purple-500',
  'from-yellow-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-emerald-400 to-teal-500',
]

export default function ClassesPageContent({
  classes,
  currentUser,
  canCreate,
}: ClassesPageContentProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [selectedClassMenu, setSelectedClassMenu] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const [isMounted, setIsMounted] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Ensure component is mounted on client before rendering interactive elements
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!selectedClassMenu) return
      
      const menuElement = menuRefs.current.get(selectedClassMenu)
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setSelectedClassMenu(null)
      }
    }

    if (selectedClassMenu) {
      // Use setTimeout to ensure the menu is rendered before checking
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedClassMenu])

  // Set ref callback for menu elements
  const setMenuRef = (classId: string) => (element: HTMLDivElement | null) => {
    if (element) {
      menuRefs.current.set(classId, element)
    } else {
      menuRefs.current.delete(classId)
    }
  }

  // Filter classes based on search
  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Featured classes (first 2)
  const featuredClasses = filteredClasses.slice(0, 2)
  // All other classes
  const allClasses = filteredClasses.slice(2)

  const getGradientColor = (index: number) => {
    return gradientColors[index % gradientColors.length]
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Event handlers
  const handleBackClick = () => {
    router.push('/dashboard')
  }

  const handleSearchClick = () => {
    setShowSearch(!showSearch)
  }

  const handleNotificationClick = () => {
    router.push('/dashboard/notifications')
  }

  const handleSettingsClick = () => {
    router.push('/dashboard/settings')
  }

  const handleFilterClick = () => {
    setShowFilter(!showFilter)
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
  }

  const handleClassMenuClick = (e: React.MouseEvent, classId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedClassMenu(selectedClassMenu === classId ? null : classId)
  }

  const handleViewClass = (classId: string) => {
    router.push(`/dashboard/classes/${classId}`)
  }

  const handleEditClass = (classId: string) => {
    router.push(`/dashboard/classes/${classId}/edit`)
  }

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"?`)) {
      return
    }

    setIsDeleting(classId)
    setSelectedClassMenu(null)

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || error.message || 'Có lỗi xảy ra khi xóa lớp học')
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Có lỗi xảy ra khi xóa lớp học. Vui lòng thử lại.')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUserMenuClick = () => {
    router.push('/dashboard/profile')
  }

  const handleCreateClassClick = (e: React.MouseEvent) => {
    // Optional: Add analytics tracking or other side effects
    // The Link component will handle navigation
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearch(false)
      setSearchTerm('')
    }
  }

  const handleFilterStatusChange = (status: 'all' | 'active' | 'completed') => {
    setFilterStatus(status)
    // TODO: Implement actual filtering logic based on status
  }

  // Get icon based on class name/subject
  const getClassIcon = (className: string, code: string) => {
    const name = className.toLowerCase()
    const classCode = code.toLowerCase()

    // JavaScript/Web Development
    if (name.includes('javascript') || name.includes('js') || name.includes('web') || name.includes('front end') || classCode.includes('js') || classCode.includes('fe') || classCode.includes('wd')) {
      return Code
    }
    // Database/SQL
    if (name.includes('sql') || name.includes('database') || name.includes('db') || classCode.includes('sql')) {
      return Database
    }
    // Backend/PHP
    if (name.includes('php') || name.includes('backend') || name.includes('server') || classCode.includes('php')) {
      return Server
    }
    // Python
    if (name.includes('python') || classCode.includes('py')) {
      return Terminal
    }
    // Math/Problem Solving
    if (name.includes('problem') || name.includes('math') || name.includes('toán') || classCode.includes('ps')) {
      return Calculator
    }
    // Soft Skills
    if (name.includes('soft') || name.includes('skill') || name.includes('kỹ năng') || classCode.includes('ss')) {
      return Users
    }
    // Default: BookOpen for general classes
    return BookOpen
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 font-poppins mb-1">
                Dashboard
              </div>
              <h1 className="text-3xl font-bold text-gray-900 font-poppins flex items-center">
                <button
                  onClick={handleBackClick}
                  className="mr-2 hover:text-blue-600 transition-colors cursor-pointer"
                  aria-label="Quay lại dashboard"
                  type="button"
                >
                  ←
                </button>
                Classes
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSearchClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search size={20} className="text-gray-600" />
              </button>
              <button 
                onClick={handleNotificationClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={handleSettingsClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Settings"
              >
                <Settings size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div 
                onClick={handleUserMenuClick}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <Avatar
                  src={currentUser.user.image}
                  name={currentUser.user.name || 'User'}
                  size="sm"
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 font-poppins">
                    {currentUser.user.name?.split(' ')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 font-poppins">
                    {currentUser.user.role === 'ADMIN' && 'Admin'}
                    {currentUser.user.role === 'TEACHER' && 'Teacher'}
                    {currentUser.user.role === 'STUDENT' && 'Student'}
                    {currentUser.user.role === 'PARENT' && 'Parent'}
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-600" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Grid view"
                type="button"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="List view"
                type="button"
              >
                <List size={18} />
              </button>
              <button 
                onClick={handleFilterClick}
                className={`p-2 rounded-lg transition-colors ${
                  showFilter
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Filter"
                type="button"
              >
                <Filter size={18} />
              </button>
            </div>
            {canCreate && (
              <Link
                href="/dashboard/classes/new"
                onClick={handleCreateClassClick}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors shadow-md"
              >
                <Plus size={20} />
                <span>CREATE CLASS</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm lớp học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 font-poppins">Lọc theo:</span>
            <button 
              onClick={() => handleFilterStatusChange('all')}
              className={`px-4 py-2 text-sm rounded-lg font-poppins transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              Tất cả
            </button>
            <button 
              onClick={() => handleFilterStatusChange('active')}
              className={`px-4 py-2 text-sm rounded-lg font-poppins transition-colors ${
                filterStatus === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              Đang diễn ra
            </button>
            <button 
              onClick={() => handleFilterStatusChange('completed')}
              className={`px-4 py-2 text-sm rounded-lg font-poppins transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              Đã hoàn thành
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Featured Classes */}
        {featuredClasses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {featuredClasses.map((cls, index) => {
              // Generate random progress numbers for demo (12, 2, 8 as in design)
              const progressCompleted = 12
              const progressInProgress = 2
              const progressRemaining = 8
              const totalProgress = progressCompleted + progressInProgress + progressRemaining
              const completedPercent = (progressCompleted / totalProgress) * 100
              const inProgressPercent = (progressInProgress / totalProgress) * 100
              const remainingPercent = (progressRemaining / totalProgress) * 100

              return (
                <Link
                  key={cls.id}
                  href={`/dashboard/classes/${cls.id}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-gray-300 overflow-hidden relative"
                >
                  {/* Gradient graphic on left side */}
                  <div className={`absolute left-0 top-0 w-24 h-full bg-gradient-to-br ${getGradientColor(index)} opacity-20`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${getGradientColor(index)} shadow-md flex items-center justify-center`}>
                        {(() => {
                          const IconComponent = getClassIcon(cls.name, cls.code)
                          return <IconComponent size={32} className="text-white opacity-90" />
                        })()}
                      </div>
                      <div className="relative" ref={setMenuRef(cls.id)}>
                        <button
                          onClick={(e) => handleClassMenuClick(e, cls.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Class menu"
                          type="button"
                        >
                          <MoreVertical size={20} className="text-gray-400" />
                        </button>
                        {isMounted && selectedClassMenu === cls.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]" suppressHydrationWarning>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleViewClass(cls.id)
                                setSelectedClassMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-poppins"
                              type="button"
                            >
                              Xem chi tiết
                            </button>
                            {canCreate && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleEditClass(cls.id)
                                    setSelectedClassMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-poppins"
                                  type="button"
                                >
                                  Chỉnh sửa
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteClass(cls.id, cls.name)
                                  }}
                                  disabled={isDeleting === cls.id}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                >
                                  {isDeleting === cls.id ? 'Đang xóa...' : 'Xóa'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-poppins mb-2 font-medium">
                      {cls._count.enrollments} Trainees • {cls._count.materials} Materials
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 font-poppins mb-3">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-poppins mb-4 line-clamp-2 leading-relaxed">
                      {cls.description || 'No description available'}
                    </p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 font-poppins">
                          Class Progress
                        </span>
                      </div>
                      <div className="flex gap-0.5 rounded-lg overflow-hidden">
                        <div 
                          className="h-2.5 bg-green-500 flex items-center justify-center"
                          style={{ width: `${completedPercent}%` }}
                        >
                          <span className="text-[8px] font-bold text-white">{progressCompleted}</span>
                        </div>
                        <div 
                          className="h-2.5 bg-yellow-400 flex items-center justify-center"
                          style={{ width: `${inProgressPercent}%` }}
                        >
                          <span className="text-[8px] font-bold text-white">{progressInProgress}</span>
                        </div>
                        <div 
                          className="h-2.5 bg-gray-300 flex items-center justify-center"
                          style={{ width: `${remainingPercent}%` }}
                        >
                          <span className="text-[8px] font-bold text-gray-600">{progressRemaining}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500 font-poppins mb-2 font-medium">
                          Trainees
                        </div>
                        <div className="flex items-center -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                            J
                          </div>
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                            G
                          </div>
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                            T
                          </div>
                          <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                            M
                          </div>
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                            S
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white shadow-sm">
                            +{Math.max(0, cls._count.enrollments - 5)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-poppins mb-2 font-medium">
                          Instructor
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                            {getInitials(cls.teacher.firstName, cls.teacher.lastName).charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 font-poppins">
                            {cls.teacher.firstName.charAt(0)} {cls.teacher.lastName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* All Classes */}
        {allClasses.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-poppins mb-6">
              All Classes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allClasses.map((cls, index) => (
                <Link
                  key={cls.id}
                  href={`/dashboard/classes/${cls.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border-2 border-gray-200 hover:border-gray-300 relative overflow-hidden"
                >
                  {/* Gradient graphic */}
                  <div className={`absolute left-0 top-0 w-16 h-16 bg-gradient-to-br ${getGradientColor(index + 2)} opacity-20 rounded-br-2xl`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getGradientColor(index + 2)} shadow-sm flex items-center justify-center`}>
                        {(() => {
                          const IconComponent = getClassIcon(cls.name, cls.code)
                          return <IconComponent size={20} className="text-white opacity-90" />
                        })()}
                      </div>
                      <div className="relative" ref={setMenuRef(cls.id)}>
                        <button
                          onClick={(e) => handleClassMenuClick(e, cls.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors z-20 relative"
                          aria-label="Class menu"
                          type="button"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {isMounted && selectedClassMenu === cls.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]" suppressHydrationWarning>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleViewClass(cls.id)
                                setSelectedClassMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-poppins"
                              type="button"
                            >
                              Xem chi tiết
                            </button>
                            {canCreate && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleEditClass(cls.id)
                                    setSelectedClassMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-poppins"
                                  type="button"
                                >
                                  Chỉnh sửa
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteClass(cls.id, cls.name)
                                  }}
                                  disabled={isDeleting === cls.id}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                >
                                  {isDeleting === cls.id ? 'Đang xóa...' : 'Xóa'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Green dot indicator */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                    
                    <div className="text-xs text-gray-500 font-poppins mb-2 font-medium">
                      {cls._count.enrollments} Trainees • {cls._count.materials} Materials
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 font-poppins mb-3 line-clamp-1">
                      {cls.name}
                    </h3>
                    
                    {/* Progress bar with green dot */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="flex-1 h-1.5 bg-green-500 rounded-full"></div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 font-poppins mb-1.5 font-medium">Trainees</div>
                      <div className="flex items-center -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm">
                          J
                        </div>
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm">
                          G
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-[10px] font-bold border-2 border-white shadow-sm">
                          +{Math.max(0, cls._count.enrollments - 2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg font-poppins mb-2">
              No classes found
            </div>
            {canCreate && (
              <Link
                href="/dashboard/classes/new"
                className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-poppins font-semibold transition-colors mt-4"
              >
                <Plus size={20} />
                <span>Create your first class</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

