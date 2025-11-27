'use client'

import { useState, useEffect } from 'react'
import { Edit2, Users, Target, Workflow, Wrench, Calendar, FileText, BarChart3, Clock, CheckCircle2, X, Shield } from 'lucide-react'
import Avatar from '../Common/Avatar'

interface SpaceOverviewData {
  mission?: string
  members?: Array<{
    name: string
    role: string
    userId?: string
    avatar?: string | null
  }>
  workflow?: Array<{
    step: number
    title: string
    description?: string
  }>
  tools?: Array<{
    name: string
    link?: string
    description?: string
  }>
  timelines?: Array<{
    type: string
    schedule: string
    description?: string
  }>
  rules?: string[]
  kpis?: Array<{
    metric: string
    target?: string
    current?: string
  }>
  resources?: Array<{
    name: string
    link: string
    type?: string
  }>
}

interface SpaceOverviewProps {
  spaceId: string
  overview: string | null
  members: Array<{
    userId: string
    user?: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
      role: string
    }
    role?: string
    canManage?: boolean
  }>
  canManage: boolean
}

export default function SpaceOverview({
  spaceId,
  overview,
  members,
  canManage,
}: SpaceOverviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [editingData, setEditingData] = useState<SpaceOverviewData>(() => {
    try {
      return overview ? JSON.parse(overview) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overview: JSON.stringify(editingData),
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi lưu')
      }
    } catch (error) {
      console.error('Error saving overview:', error)
      alert('Đã xảy ra lỗi khi lưu')
    }
  }

  const addMember = () => {
    setEditingData({
      ...editingData,
      members: [...(editingData.members || []), { name: '', role: '' }],
    })
  }

  const removeMember = (index: number) => {
    setEditingData({
      ...editingData,
      members: editingData.members?.filter((_, i) => i !== index) || [],
    })
  }

  const addWorkflowStep = () => {
    const steps = editingData.workflow || []
    setEditingData({
      ...editingData,
      workflow: [...steps, { step: steps.length + 1, title: '', description: '' }],
    })
  }

  const removeWorkflowStep = (index: number) => {
    setEditingData({
      ...editingData,
      workflow: editingData.workflow?.filter((_, i) => i !== index) || [],
    })
  }

  const addTool = () => {
    setEditingData({
      ...editingData,
      tools: [...(editingData.tools || []), { name: '', link: '', description: '' }],
    })
  }

  const removeTool = (index: number) => {
    setEditingData({
      ...editingData,
      tools: editingData.tools?.filter((_, i) => i !== index) || [],
    })
  }

  const addTimeline = () => {
    setEditingData({
      ...editingData,
      timelines: [...(editingData.timelines || []), { type: '', schedule: '', description: '' }],
    })
  }

  const removeTimeline = (index: number) => {
    setEditingData({
      ...editingData,
      timelines: editingData.timelines?.filter((_, i) => i !== index) || [],
    })
  }

  const addRule = () => {
    setEditingData({
      ...editingData,
      rules: [...(editingData.rules || []), ''],
    })
  }

  const removeRule = (index: number) => {
    setEditingData({
      ...editingData,
      rules: editingData.rules?.filter((_, i) => i !== index) || [],
    })
  }

  const addKPI = () => {
    setEditingData({
      ...editingData,
      kpis: [...(editingData.kpis || []), { metric: '', target: '', current: '' }],
    })
  }

  const removeKPI = (index: number) => {
    setEditingData({
      ...editingData,
      kpis: editingData.kpis?.filter((_, i) => i !== index) || [],
    })
  }

  const addResource = () => {
    setEditingData({
      ...editingData,
      resources: [...(editingData.resources || []), { name: '', link: '', type: '' }],
    })
  }

  const removeResource = (index: number) => {
    setEditingData({
      ...editingData,
      resources: editingData.resources?.filter((_, i) => i !== index) || [],
    })
  }


  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
            Tổng quan Space
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
            >
              Lưu
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditingData(overview ? JSON.parse(overview) : {})
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-poppins"
            >
              Hủy
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. Mission */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                1. Mục tiêu & Phạm vi hoạt động
              </h3>
            </div>
            <textarea
              value={editingData.mission || ''}
              onChange={(e) => setEditingData({ ...editingData, mission: e.target.value })}
              placeholder="Space được tạo ra để làm gì? Đang phụ trách mảng/nhánh nào? Kết quả đầu ra mong muốn là gì?"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins"
            />
          </section>

          {/* 2. Members */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  2. Thành viên & Vai trò
                </h3>
              </div>
              <button
                onClick={addMember}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editingData.members?.map((member, index) => (
                <div key={index} className="relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  {/* Avatar preview */}
                  <div className="absolute top-3 left-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold text-lg font-poppins">
                        {member.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  </div>

                  {/* Remove button ở góc trên phải */}
                  <button
                    onClick={() => removeMember(index)}
                    className="absolute top-3 right-3 p-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>

                  {/* Form inputs */}
                  <div className="mt-16 space-y-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => {
                        const newMembers = [...(editingData.members || [])]
                        newMembers[index].name = e.target.value
                        setEditingData({ ...editingData, members: newMembers })
                      }}
                      placeholder="Tên thành viên"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => {
                        const newMembers = [...(editingData.members || [])]
                        newMembers[index].role = e.target.value
                        setEditingData({ ...editingData, members: newMembers })
                      }}
                      placeholder="Vai trò"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Workflow */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  3. Quy trình làm việc chuẩn
                </h3>
              </div>
              <button
                onClick={addWorkflowStep}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm bước
              </button>
            </div>
            <div className="space-y-3">
              {editingData.workflow?.map((step, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold font-poppins">
                      {step.step}
                    </span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const newWorkflow = [...(editingData.workflow || [])]
                        newWorkflow[index].title = e.target.value
                        setEditingData({ ...editingData, workflow: newWorkflow })
                      }}
                      placeholder="Tên bước"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <button
                      onClick={() => removeWorkflowStep(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-poppins"
                    >
                      Xóa
                    </button>
                  </div>
                  <textarea
                    value={step.description || ''}
                    onChange={(e) => {
                      const newWorkflow = [...(editingData.workflow || [])]
                      newWorkflow[index].description = e.target.value
                      setEditingData({ ...editingData, workflow: newWorkflow })
                    }}
                    placeholder="Mô tả chi tiết"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 4. Tools */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  4. Công cụ sử dụng
                </h3>
              </div>
              <button
                onClick={addTool}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-3">
              {editingData.tools?.map((tool, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={tool.name}
                      onChange={(e) => {
                        const newTools = [...(editingData.tools || [])]
                        newTools[index].name = e.target.value
                        setEditingData({ ...editingData, tools: newTools })
                      }}
                      placeholder="Tên công cụ"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <input
                      type="url"
                      value={tool.link || ''}
                      onChange={(e) => {
                        const newTools = [...(editingData.tools || [])]
                        newTools[index].link = e.target.value
                        setEditingData({ ...editingData, tools: newTools })
                      }}
                      placeholder="Link"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <button
                      onClick={() => removeTool(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-poppins"
                    >
                      Xóa
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tool.description || ''}
                    onChange={(e) => {
                      const newTools = [...(editingData.tools || [])]
                      newTools[index].description = e.target.value
                      setEditingData({ ...editingData, tools: newTools })
                    }}
                    placeholder="Mô tả"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 5. Timelines */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  5. Lịch làm việc & Deadline
                </h3>
              </div>
              <button
                onClick={addTimeline}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-3">
              {editingData.timelines?.map((timeline, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={timeline.type}
                      onChange={(e) => {
                        const newTimelines = [...(editingData.timelines || [])]
                        newTimelines[index].type = e.target.value
                        setEditingData({ ...editingData, timelines: newTimelines })
                      }}
                      placeholder="Loại (VD: Lịch họp, Deadline báo cáo...)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <input
                      type="text"
                      value={timeline.schedule}
                      onChange={(e) => {
                        const newTimelines = [...(editingData.timelines || [])]
                        newTimelines[index].schedule = e.target.value
                        setEditingData({ ...editingData, timelines: newTimelines })
                      }}
                      placeholder="Lịch trình (VD: Thứ 2 hàng tuần 14:00)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <button
                      onClick={() => removeTimeline(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-poppins"
                    >
                      Xóa
                    </button>
                  </div>
                  <input
                    type="text"
                    value={timeline.description || ''}
                    onChange={(e) => {
                      const newTimelines = [...(editingData.timelines || [])]
                      newTimelines[index].description = e.target.value
                      setEditingData({ ...editingData, timelines: newTimelines })
                    }}
                    placeholder="Mô tả"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 6. Rules */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  6. Quy tắc phối hợp & Giao tiếp
                </h3>
              </div>
              <button
                onClick={addRule}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-2">
              {editingData.rules?.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...(editingData.rules || [])]
                      newRules[index] = e.target.value
                      setEditingData({ ...editingData, rules: newRules })
                    }}
                    placeholder="Quy tắc..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                  />
                  <button
                    onClick={() => removeRule(index)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-poppins"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 7. KPIs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  7. Chỉ số đánh giá (KPI)
                </h3>
              </div>
              <button
                onClick={addKPI}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-3">
              {editingData.kpis?.map((kpi, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={kpi.metric}
                      onChange={(e) => {
                        const newKPIs = [...(editingData.kpis || [])]
                        newKPIs[index].metric = e.target.value
                        setEditingData({ ...editingData, kpis: newKPIs })
                      }}
                      placeholder="Chỉ số (VD: Số bài viết/tuần)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <button
                      onClick={() => removeKPI(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-poppins"
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={kpi.target || ''}
                      onChange={(e) => {
                        const newKPIs = [...(editingData.kpis || [])]
                        newKPIs[index].target = e.target.value
                        setEditingData({ ...editingData, kpis: newKPIs })
                      }}
                      placeholder="Mục tiêu"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <input
                      type="text"
                      value={kpi.current || ''}
                      onChange={(e) => {
                        const newKPIs = [...(editingData.kpis || [])]
                        newKPIs[index].current = e.target.value
                        setEditingData({ ...editingData, kpis: newKPIs })
                      }}
                      placeholder="Hiện tại"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 8. Resources */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  8. Tài liệu quan trọng / Mẫu biểu
                </h3>
              </div>
              <button
                onClick={addResource}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins"
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-3">
              {editingData.resources?.map((resource, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={resource.name}
                      onChange={(e) => {
                        const newResources = [...(editingData.resources || [])]
                        newResources[index].name = e.target.value
                        setEditingData({ ...editingData, resources: newResources })
                      }}
                      placeholder="Tên tài liệu"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <input
                      type="url"
                      value={resource.link}
                      onChange={(e) => {
                        const newResources = [...(editingData.resources || [])]
                        newResources[index].link = e.target.value
                        setEditingData({ ...editingData, resources: newResources })
                      }}
                      placeholder="Link"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                    />
                    <button
                      onClick={() => removeResource(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-poppins"
                    >
                      Xóa
                    </button>
                  </div>
                  <input
                    type="text"
                    value={resource.type || ''}
                    onChange={(e) => {
                      const newResources = [...(editingData.resources || [])]
                      newResources[index].type = e.target.value
                      setEditingData({ ...editingData, resources: newResources })
                    }}
                    placeholder="Loại (VD: Template, Quy chế...)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                  />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    )
  }

  // Display mode - parse safely to avoid hydration mismatch
  const overviewData: SpaceOverviewData = (() => {
    if (!overview) return {}
    try {
      return JSON.parse(overview)
    } catch {
      return {}
    }
  })()

  // Show loading state during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
            Tổng quan Space
          </h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
          Tổng quan Space
        </h2>
        {canManage && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
          >
            <Edit2 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* 1. Mission */}
        {overviewData.mission && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                1. Mục tiêu & Phạm vi hoạt động
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-poppins whitespace-pre-line">
              {overviewData.mission}
            </p>
          </section>
        )}

        {/* 2. Members */}
        {(overviewData.members && overviewData.members.length > 0) || members.length > 0 ? (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                2. Thành viên & Vai trò
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overviewData.members?.map((member, index) => (
                <div
                  key={index}
                  className="relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Avatar ở góc trên trái */}
                  <div className="absolute top-3 left-3">
                    {member.userId ? (
                      <Avatar
                        src={member.avatar || null}
                        name={member.name}
                        size="md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-lg font-poppins">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status badge ở góc trên phải */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold font-poppins">
                      Active
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mt-16">
                    <h4 className="font-semibold text-gray-900 dark:text-white font-poppins mb-1 text-lg">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-3">
                      {member.role || 'Thành viên'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                      <Users className="w-3 h-3" />
                      <span>Space Member</span>
                    </div>
                  </div>
                </div>
              ))}
              {members.map((member) => {
                if (!member.user) return null
                return (
                  <div
                    key={member.user.id}
                    className="relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Avatar ở góc trên trái */}
                    <div className="absolute top-3 left-3">
                      <Avatar
                        src={member.user.avatar}
                        name={`${member.user.firstName} ${member.user.lastName}`}
                        size="md"
                      />
                    </div>

                    {/* Status badge ở góc trên phải */}
                    <div className="absolute top-3 right-3">
                      {member.canManage ? (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold font-poppins">
                          Quản lý
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold font-poppins">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mt-16">
                      <h4 className="font-semibold text-gray-900 dark:text-white font-poppins mb-1 text-lg">
                        {member.user.firstName} {member.user.lastName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-3">
                        {member.role || 'Thành viên'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                        <Users className="w-3 h-3" />
                        <span>{member.user.email}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {/* 3. Workflow */}
        {overviewData.workflow && overviewData.workflow.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                3. Quy trình làm việc chuẩn
              </h3>
            </div>
            <div className="space-y-3">
              {overviewData.workflow.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold font-poppins flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white font-poppins mb-1">
                      {step.title}
                    </h4>
                    {step.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Tools */}
        {overviewData.tools && overviewData.tools.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                4. Công cụ sử dụng
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overviewData.tools.map((tool, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      {tool.link ? (
                        <a
                          href={tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline font-poppins"
                        >
                          {tool.name}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                          {tool.name}
                        </p>
                      )}
                      {tool.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Timelines */}
        {overviewData.timelines && overviewData.timelines.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                5. Lịch làm việc & Deadline
              </h3>
            </div>
            <div className="space-y-3">
              {overviewData.timelines.map((timeline, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                        {timeline.type}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-poppins mt-1">
                        {timeline.schedule}
                      </p>
                      {timeline.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">
                          {timeline.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Rules */}
        {overviewData.rules && overviewData.rules.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                6. Quy tắc phối hợp & Giao tiếp
              </h3>
            </div>
            <ul className="space-y-2">
              {overviewData.rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-gray-700 dark:text-gray-300 font-poppins"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. KPIs */}
        {overviewData.kpis && overviewData.kpis.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                7. Chỉ số đánh giá (KPI)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overviewData.kpis.map((kpi, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <p className="font-semibold text-gray-900 dark:text-white font-poppins mb-2">
                    {kpi.metric}
                  </p>
                  <div className="flex items-center space-x-4 text-sm font-poppins">
                    {kpi.target && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Mục tiêu: </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {kpi.target}
                        </span>
                      </div>
                    )}
                    {kpi.current && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Hiện tại: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {kpi.current}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Resources */}
        {overviewData.resources && overviewData.resources.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                8. Tài liệu quan trọng / Mẫu biểu
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overviewData.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                        {resource.name}
                      </p>
                      {resource.type && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins">
                          {resource.type}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!overviewData.mission &&
          (!overviewData.members || overviewData.members.length === 0) &&
          (!overviewData.workflow || overviewData.workflow.length === 0) &&
          (!overviewData.tools || overviewData.tools.length === 0) &&
          (!overviewData.timelines || overviewData.timelines.length === 0) &&
          (!overviewData.rules || overviewData.rules.length === 0) &&
          (!overviewData.kpis || overviewData.kpis.length === 0) &&
          (!overviewData.resources || overviewData.resources.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-poppins mb-4">
                Chưa có thông tin tổng quan. {canManage && 'Nhấn "Chỉnh sửa" để thêm thông tin.'}
              </p>
            </div>
          )}
      </div>
    </div>
  )
}

