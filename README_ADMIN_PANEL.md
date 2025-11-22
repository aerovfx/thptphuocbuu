# Admin Panel Documentation

## Tổng quan

Admin Panel là hệ thống quản lý toàn diện cho phép quản trị viên quản lý users, roles, permissions, modules và xem audit logs.

## Kiến trúc

### 1. Database Schema

#### Models chính:
- **User**: Thêm field `status` (ACTIVE, SUSPENDED, DELETED, PENDING), `lastLogin`, `metadata`
- **Role**: Vai trò trong hệ thống
- **Permission**: Quyền truy cập (resource:action)
- **RolePermission**: Many-to-many giữa Role và Permission
- **UserRoleAssignment**: Gán role cho user
- **Module**: Module trong hệ thống với config JSON
- **AdminAuditLog**: Lịch sử hoạt động của admin

### 2. API Endpoints

#### User Management
- `GET /api/admin/users` - List users (với pagination, search, filter)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Soft delete user
- `POST /api/admin/users/[id]/reset-password` - Reset password
- `POST /api/admin/users/[id]/suspend` - Suspend/activate user
- `PUT /api/admin/users/[id]/roles` - Assign roles to user

#### Role & Permission Management
- `GET /api/admin/roles` - List all roles
- `POST /api/admin/roles` - Create role
- `GET /api/admin/roles/[id]` - Get role details
- `PUT /api/admin/roles/[id]` - Update role
- `DELETE /api/admin/roles/[id]` - Delete role
- `PUT /api/admin/roles/[id]/permissions` - Update role permissions
- `GET /api/admin/permissions` - List all permissions
- `POST /api/admin/permissions` - Create permission
- `GET /api/admin/permissions/me` - Get current user's permissions

#### Module Management
- `GET /api/admin/modules` - List all modules
- `POST /api/admin/modules` - Create module
- `GET /api/admin/modules/[id]` - Get module details
- `PUT /api/admin/modules/[id]` - Update module
- `DELETE /api/admin/modules/[id]` - Delete module
- `PUT /api/admin/modules/[id]/enable` - Enable/disable module
- `PUT /api/admin/modules/[id]/config` - Update module config

#### Audit Logs
- `GET /api/admin/audit-logs` - List audit logs (với filters)
- `GET /api/admin/audit-logs/[id]` - Get audit log details

### 3. RBAC System

#### Permission Format
Permissions được định nghĩa dưới dạng: `resource:action`

Ví dụ:
- `module:user:read` - Đọc danh sách users
- `module:user:write` - Tạo/sửa users
- `module:user:delete` - Xóa users
- `module:role:read` - Đọc danh sách roles

#### RBAC Functions (lib/rbac.ts)
- `getUserPermissions(userId)` - Lấy tất cả permissions của user
- `hasPermission(userId, resource, action)` - Kiểm tra permission
- `hasAnyPermission(userId, checks)` - Kiểm tra bất kỳ permission nào
- `hasAllPermissions(userId, checks)` - Kiểm tra tất cả permissions
- `getUserRoles(userId)` - Lấy roles của user
- `hasRole(userId, roleName)` - Kiểm tra role
- `hasAnyRole(userId, roleNames)` - Kiểm tra bất kỳ role nào
- `isModuleEnabled(moduleKey)` - Kiểm tra module có bật không
- `canAccessModule(userId, moduleKey, action)` - Kiểm tra quyền truy cập module

#### RBAC Middleware (lib/rbac-middleware.ts)
- `requireRBAC(request, requirement)` - Middleware để check permissions
- `withRBAC(requirement, handler)` - Wrapper cho API handlers
- `requireAdmin(request)` - Require admin role

#### Usage Examples

**API Route:**
```typescript
import { requireRBAC } from '@/lib/rbac-middleware'

export async function GET(request: Request) {
  const rbacResult = await requireRBAC(request, {
    resource: 'module:user',
    action: 'read',
  })

  if (!rbacResult.authorized) {
    return NextResponse.json({ error: rbacResult.error }, { status: 403 })
  }

  // Your code here
}
```

**Client Component:**
```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { hasPermission, isAdmin } = usePermissions()

  if (!hasPermission('module:user', 'write')) {
    return <div>Không có quyền</div>
  }

  return <button>Tạo user</button>
}
```

**Protected Component:**
```typescript
import ProtectedButton from '@/components/Admin/ProtectedButton'

<ProtectedButton
  resource="module:user"
  action="write"
  onClick={handleCreate}
>
  Tạo user
</ProtectedButton>
```

### 4. UI Components

#### Pages
- `/dashboard/admin` - Admin Dashboard
- `/dashboard/admin/users` - User Management
- `/dashboard/admin/roles` - Role & Permission Management
- `/dashboard/admin/modules` - Module Management
- `/dashboard/admin/audit-logs` - Audit Logs

#### Components
- `AdminDashboard` - Dashboard với stats và quick actions
- `AdminUsersManagement` - Quản lý users
- `AdminRolesManagement` - Quản lý roles và permissions
- `AdminModulesManagement` - Quản lý modules
- `AdminAuditLogs` - Xem audit logs
- `ProtectedAction` - Component chỉ render khi có permission
- `ProtectedButton` - Button chỉ render khi có permission

### 5. Setup & Migration

#### 1. Chạy migration
```bash
npx prisma migrate dev
```

#### 2. Seed permissions
```bash
npx tsx scripts/seed-permissions.ts
```

#### 3. Seed modules
```bash
npx tsx scripts/seed-modules.ts
```

#### 4. Tạo role mặc định (tùy chọn)
Có thể tạo role "Content Manager" với các permissions cơ bản thông qua Admin UI.

### 6. Permission Model

#### Resources
- `module:user` - User management
- `module:role` - Role management
- `module:permission` - Permission management
- `module:module` - Module management
- `module:audit` - Audit logs
- `module:document` - Document management
- `module:class` - Class management
- `module:assignment` - Assignment management

#### Actions
- `read` - Đọc/xem
- `write` - Tạo/sửa
- `delete` - Xóa
- `export` - Xuất dữ liệu
- `approve` - Phê duyệt
- `grade` - Chấm điểm
- `configure` - Cấu hình

### 7. Audit Logging

Mọi hành động quan trọng đều được ghi lại trong `AdminAuditLog`:
- User CRUD operations
- Role/Permission changes
- Module enable/disable
- Config updates
- Password resets
- User status changes

Mỗi log entry bao gồm:
- Actor (admin user)
- Action
- Target (resource type và ID)
- Details (JSON)
- IP address
- User agent
- Timestamp

### 8. Security Best Practices

1. **Admin-only access**: Tất cả admin endpoints đều check `role === 'ADMIN'`
2. **Audit logging**: Mọi thay đổi đều được ghi lại
3. **Input validation**: Sử dụng Zod schema validation
4. **Password hashing**: Bcrypt với salt rounds 10
5. **Soft delete**: Users được soft delete (status = DELETED) thay vì xóa hoàn toàn
6. **Permission caching**: Có thể cache permissions trong Redis (future enhancement)

### 9. Future Enhancements

- [ ] Permission caching với Redis
- [ ] MFA (Multi-Factor Authentication) cho admin
- [ ] IP allowlist/blocklist
- [ ] Session management và revoke
- [ ] Impersonation feature (admin login as user)
- [ ] Feature flags với rollout percentage
- [ ] Multi-tenant support
- [ ] API rate limiting per user/role
- [ ] Export audit logs to S3/Cold storage

### 10. Testing

#### Test Admin Access
1. Login với tài khoản ADMIN
2. Truy cập `/dashboard/admin`
3. Kiểm tra các tính năng:
   - Tạo user mới
   - Gán role cho user
   - Tạo role và permissions
   - Bật/tắt module
   - Xem audit logs

#### Test RBAC
1. Tạo role mới với permissions giới hạn
2. Gán role cho user (không phải ADMIN)
3. Test user đó có thể truy cập các tính năng theo permissions
4. Verify audit logs ghi lại các hành động

## Troubleshooting

### Lỗi: "Permission denied"
- Kiểm tra user có được gán role không
- Kiểm tra role có permissions cần thiết không
- Kiểm tra module có được bật không

### Lỗi: "Module access denied"
- Kiểm tra module có `enabled = true` không
- Kiểm tra user có permission `module:{moduleKey}:{action}` không

### Lỗi: "Role not found"
- Chạy seed script để tạo permissions mặc định
- Tạo role thủ công qua Admin UI

