import { UserRole } from '@prisma/client'

export interface DashboardModule {
  id: string
  title: string
  description?: string
  icon: string
  href: string
  roles: UserRole[]
  order: number
  category?: 'overview' | 'management' | 'reports' | 'settings'
}

// Định nghĩa các module theo role
export const dashboardModules: DashboardModule[] = [
  // Module chung cho tất cả users
  {
    id: 'home',
    title: 'Trang chủ',
    description: 'Tổng quan hoạt động',
    icon: 'LayoutDashboard',
    href: '/dashboard',
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN', 'BGH', 'BAN_TT', 'TRUONG_TONG', 'QUAN_NHIEM', 'TRUONG_HANH_CHINH', 'BAO_VE', 'LAO_CONG', 'DOAN_TN', 'DANG_BO', 'TAI_CHINH', 'Y_TE'],
    order: 1,
    category: 'overview',
  },
  {
    id: 'classes',
    title: 'Lớp học',
    description: 'Quản lý lớp học',
    icon: 'BookOpen',
    href: '/dashboard/classes',
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG', 'QUAN_NHIEM'],
    order: 2,
    category: 'management',
  },
  {
    id: 'social',
    title: 'Mạng xã hội',
    description: 'Kết nối và chia sẻ',
    icon: 'MessageSquare',
    href: '/dashboard/social',
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN', 'BGH', 'BAN_TT', 'TRUONG_TONG', 'QUAN_NHIEM', 'DOAN_TN', 'DANG_BO'],
    order: 3,
    category: 'overview',
  },
  {
    id: 'documents',
    title: 'Văn bản',
    description: 'Quản lý văn bản',
    icon: 'FileText',
    href: '/dashboard/documents',
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN', 'BGH', 'BAN_TT', 'TRUONG_TONG', 'QUAN_NHIEM', 'TRUONG_HANH_CHINH', 'TAI_CHINH', 'Y_TE'],
    order: 4,
    category: 'management',
  },
  
  // Module cho Admin và quản lý
  {
    id: 'spaces',
    title: 'Spaces',
    description: 'Quản lý không gian làm việc',
    icon: 'Building2',
    href: '/dashboard/spaces',
    roles: ['ADMIN', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG', 'QUAN_NHIEM'],
    order: 5,
    category: 'management',
  },
  {
    id: 'departments',
    title: 'Tổ chuyên môn',
    description: 'Quản lý tổ chuyên môn',
    icon: 'Briefcase',
    href: '/dashboard/departments',
    roles: ['ADMIN', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG'],
    order: 6,
    category: 'management',
  },
  {
    id: 'users',
    title: 'Người dùng',
    description: 'Quản lý người dùng',
    icon: 'Users',
    href: '/dashboard/users',
    roles: ['ADMIN', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG'],
    order: 7,
    category: 'management',
  },
  
  // Module cho Ban Giám Hiệu
  {
    id: 'reports',
    title: 'Báo cáo',
    description: 'Báo cáo tổng hợp',
    icon: 'BarChart3',
    href: '/dashboard/reports',
    roles: ['ADMIN', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG', 'TAI_CHINH'],
    order: 8,
    category: 'reports',
  },
  
  // Module cho Admin Panel
  {
    id: 'admin',
    title: 'Admin Panel',
    description: 'Quản trị hệ thống',
    icon: 'Shield',
    href: '/dashboard/admin',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    order: 9,
    category: 'settings',
  },
  
  // Module chung
  {
    id: 'premium',
    title: 'Premium',
    description: 'Nâng cấp tài khoản',
    icon: 'Crown',
    href: '/dashboard/premium',
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN', 'BGH', 'BAN_TT', 'TRUONG_TONG', 'QUAN_NHIEM', 'TRUONG_HANH_CHINH', 'BAO_VE', 'LAO_CONG', 'DOAN_TN', 'DANG_BO', 'TAI_CHINH', 'Y_TE'],
    order: 10,
    category: 'settings',
  },
  {
    id: 'settings',
    title: 'Cài đặt',
    description: 'Cài đặt tài khoản',
    icon: 'Settings',
    href: '/dashboard/settings',
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN', 'BGH', 'BAN_TT', 'TRUONG_TONG', 'QUAN_NHIEM', 'TRUONG_HANH_CHINH', 'BAO_VE', 'LAO_CONG', 'DOAN_TN', 'DANG_BO', 'TAI_CHINH', 'Y_TE'],
    order: 11,
    category: 'settings',
  },
]

/**
 * Lấy danh sách module dựa trên role của user
 */
export function getModulesByRole(role: UserRole): DashboardModule[] {
  return dashboardModules
    .filter((module) => module.roles.includes(role))
    .sort((a, b) => a.order - b.order)
}

/**
 * Lấy module theo category
 */
export function getModulesByCategory(role: UserRole, category: DashboardModule['category']): DashboardModule[] {
  return getModulesByRole(role).filter((module) => module.category === category)
}

/**
 * Kiểm tra user có quyền truy cập module không
 */
export function hasModuleAccess(role: UserRole, moduleId: string): boolean {
  const module = dashboardModules.find((m) => m.id === moduleId)
  return module ? module.roles.includes(role) : false
}

