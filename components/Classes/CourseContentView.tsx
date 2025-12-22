'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  Settings,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Edit,
} from 'lucide-react'
import EditLessonModal from './EditLessonModal'
// import Avatar from '@/components/Common/Avatar'

interface Chapter {
  id: string
  title: string
  description: string | null
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content: string | null
  order: number
  duration: number | null
  isCompleted?: boolean
  completedCount?: number
}

interface CourseContentViewProps {
  classDetail: {
    id: string
    name: string
    code: string
    description: string | null
    subject: string
    teacher: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
    }
  }
  chapters: Chapter[]
  currentLessonId?: string
  currentUser: {
    user: {
      id: string
      name: string | null
      role: string
    }
  }
  enrolledUsers: Array<{
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }>
}

export default function CourseContentView({
  classDetail,
  chapters,
  currentLessonId,
  currentUser,
  enrolledUsers,
}: CourseContentViewProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Initialize state on client side only to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    setExpandedChapters(new Set((chapters || []).map((ch) => ch.id)))
    setSelectedLessonId(currentLessonId || chapters?.[0]?.lessons?.[0]?.id || null)
  }, [chapters, currentLessonId])

  const currentLesson = (chapters || [])
    .flatMap((ch) => ch.lessons || [])
    .find((lesson) => lesson.id === selectedLessonId)

  const totalLessons = (chapters || []).reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0)
  const completedLessons = (chapters || []).reduce(
    (sum, ch) => sum + (ch.lessons || []).filter((l) => l.isCompleted).length,
    0
  )
  const totalDuration = (chapters || []).reduce(
    (sum, ch) => sum + ((ch.lessons || []).reduce((s, l) => s + (l.duration || 0), 0) || 0),
    0
  )

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const getLessonNumber = (chapter: Chapter, lesson: Lesson) => {
    let lessonNum = 1
    for (const ch of chapters || []) {
      if (ch.id === chapter.id) {
        for (const l of ch.lessons || []) {
          if (l.id === lesson.id) {
            return lessonNum
          }
          lessonNum++
        }
        break
      }
      lessonNum += ch.lessons?.length || 0
    }
    return lessonNum
  }

  const getCurrentLessonNumber = () => {
    if (!currentLesson) return 0
    for (const ch of chapters || []) {
      for (const l of ch.lessons || []) {
        if (l.id === currentLesson.id) {
          return getLessonNumber(ch, l)
        }
      }
    }
    return 0
  }

  const getNextLesson = () => {
    if (!currentLesson) return null
    const allLessons = (chapters || []).flatMap((ch) => ch.lessons || [])
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id)
    return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  }

  const getPrevLesson = () => {
    if (!currentLesson) return null
    const allLessons = (chapters || []).flatMap((ch) => ch.lessons || [])
    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id)
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null
  }

  const isTeacher = currentUser.user.role === 'TEACHER' || currentUser.user.role === 'ADMIN'
  const isClassTeacher = isTeacher && (classDetail.teacher.id === currentUser.user.id || currentUser.user.role === 'ADMIN')

  const handleEditSuccess = () => {
    // Reload page to get updated data
    window.location.reload()
  }

  // Show loading state until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Course Navigation */}
      <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          {/* Back Button */}
          <Link
            href="/dashboard/classes"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 font-poppins"
          >
            <ArrowLeft size={18} />
            <span>Back to courses</span>
          </Link>

          {/* Course Category */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold font-poppins">
              {classDetail.subject}
            </span>
            <CheckCircle2 size={16} className="text-green-500" />
          </div>

          {/* Course Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 font-poppins">
            {classDetail.name}
          </h1>
          <p className="text-sm text-gray-600 mb-4 font-poppins">
            {classDetail.description || 'Course description'}
          </p>

          {/* Course Metrics */}
          <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span className="font-poppins">{totalDuration} minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <GraduationCap size={16} />
              <span className="font-poppins">
                Completed {completedLessons} times
              </span>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="space-y-1">
            {(chapters || []).map((chapter) => (
              <div key={chapter.id} className="mb-2">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center space-x-2">
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                    <span className="font-semibold text-gray-900 font-poppins">
                      {chapter.title}
                    </span>
                  </div>
                </button>
                {expandedChapters.has(chapter.id) && (
                  <div className="ml-6 space-y-1">
                    {(chapter.lessons || []).map((lesson) => {
                      const lessonNum = getLessonNumber(chapter, lesson)
                      const isActive = lesson.id === selectedLessonId
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-colors text-left ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {lesson.isCompleted ? (
                            <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {isActive && (
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {lessonNum}
                                </span>
                              )}
                              <span className={`text-sm font-poppins ${isActive ? 'font-semibold' : ''}`}>
                                {lesson.title}
                              </span>
                            </div>
                            {lesson.description && (
                              <p className="text-xs text-gray-500 mt-1 font-poppins line-clamp-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Central Content Area */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {currentLesson ? (
            <>
              {/* Lesson Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 font-poppins">
                      {currentLesson.title}
                    </h2>
                    {currentLesson.description && (
                      <p className="text-lg text-gray-600 font-poppins">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>
                  {isClassTeacher && (
                    <button
                      onClick={() => setEditingLesson(currentLesson)}
                      className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Chỉnh sửa bài học"
                    >
                      <Edit size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lesson Content */}
              <div className="prose prose-lg max-w-none mb-8 font-poppins">
                {currentLesson.content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    className="text-gray-700 leading-relaxed"
                  />
                ) : (
                  <div className="text-gray-600 space-y-4">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                      quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                      consequat.
                    </p>
                    <p>
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                      eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                      sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
                      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                      doloremque laudantium, totam rem aperiam."
                    </blockquote>
                    <p>
                      At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
                      praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias
                      excepturi sint occaecati cupiditate non provident.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                <button
                  onClick={() => {
                    const prev = getPrevLesson()
                    if (prev) setSelectedLessonId(prev.id)
                  }}
                  disabled={!getPrevLesson()}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
                >
                  <ArrowLeft size={18} />
                  <span>Prev</span>
                </button>
                <span className="text-sm text-gray-500 font-poppins">
                  {getCurrentLessonNumber()}/{totalLessons}
                </span>
                <button
                  onClick={() => {
                    const next = getNextLesson()
                    if (next) setSelectedLessonId(next.id)
                  }}
                  disabled={!getNextLesson()}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
                >
                  <span>Next</span>
                  <ArrowLeft size={18} className="rotate-180" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-poppins">No lesson selected</p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Right Sidebar - User Interactions */}
      <aside className="w-16 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4 space-y-4">
        {/* Notification Badge */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors">
            2
          </div>
        </div>

        {/* User Avatars Stack */}
        <div className="flex flex-col items-center space-y-2">
          {enrolledUsers.slice(0, 10).map((user, index) => {
            const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
            return (
              <div key={user.id} className="relative">
                {user.avatar ? (
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-200">
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {initials}
                  </div>
                )}
                {index < 3 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-3 mt-auto">
          <button className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
            <Settings size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
            <MessageCircle size={20} />
          </button>
        </div>
      </aside>
    </div>
  )
}

