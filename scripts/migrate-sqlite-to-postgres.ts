import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'

// SQLite connection
const sqliteDb = new Database('./prisma/dev.db')

// PostgreSQL connection (from env)
const postgresPrisma = new PrismaClient()

async function migrateData() {
  try {
    console.log('🚀 Bắt đầu migrate dữ liệu từ SQLite sang PostgreSQL...\n')

    // 1. Migrate Users
    console.log('📦 Migrating Users...')
    const users = sqliteDb.prepare('SELECT * FROM users').all() as any[]
    let userCount = 0
    for (const user of users) {
      try {
        await postgresPrisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password,
            avatar: user.avatar,
            role: user.role,
            isPremium: user.isPremium === 1 || user.isPremium === true,
            status: user.status || 'ACTIVE',
            emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
            metadata: user.metadata,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
          },
          create: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password,
            avatar: user.avatar,
            role: user.role,
            isPremium: user.isPremium === 1 || user.isPremium === true,
            status: user.status || 'ACTIVE',
            emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
            metadata: user.metadata,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
          },
        })
        userCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating user ${user.email}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${userCount}/${users.length} users\n`)

    // 2. Migrate Modules
    console.log('📦 Migrating Modules...')
    const modules = sqliteDb.prepare('SELECT * FROM modules').all() as any[]
    let moduleCount = 0
    for (const module of modules) {
      try {
        // Parse dates
        const createdAt = module.createdAt 
          ? (typeof module.createdAt === 'string' && module.createdAt.includes('T') 
              ? new Date(module.createdAt) 
              : new Date(parseInt(module.createdAt)))
          : new Date()
        
        const updatedAt = module.updatedAt 
          ? (typeof module.updatedAt === 'string' && module.updatedAt.includes('T') 
              ? new Date(module.updatedAt) 
              : new Date(parseInt(module.updatedAt)))
          : new Date()

        await postgresPrisma.module.upsert({
          where: { id: module.id },
          update: {
            key: module.key,
            name: module.name,
            description: module.description,
            enabled: module.enabled === 1 || module.enabled === true,
            config: module.config,
            version: module.version || '1.0.0',
            createdAt,
            updatedAt,
          },
          create: {
            id: module.id,
            key: module.key,
            name: module.name,
            description: module.description,
            enabled: module.enabled === 1 || module.enabled === true,
            config: module.config,
            version: module.version || '1.0.0',
            createdAt,
            updatedAt,
          },
        })
        moduleCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating module ${module.name}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${moduleCount}/${modules.length} modules\n`)

    // 3. Migrate Classes (only if teacher exists)
    console.log('📦 Migrating Classes...')
    const classes = sqliteDb.prepare('SELECT * FROM classes').all() as any[]
    let classCount = 0
    for (const cls of classes) {
      try {
        // Check if teacher exists in PostgreSQL
        if (cls.teacherId) {
          const teacherExists = await postgresPrisma.user.findUnique({
            where: { id: cls.teacherId },
            select: { id: true },
          })
          
          if (!teacherExists) {
            console.log(`  ⚠ Skipping class ${cls.name} - teacher ${cls.teacherId} not found`)
            continue
          }
        }

        await postgresPrisma.class.upsert({
          where: { id: cls.id },
          update: {
            name: cls.name,
            code: cls.code,
            description: cls.description,
            subject: cls.subject,
            grade: cls.grade,
            teacherId: cls.teacherId || null,
            createdAt: cls.createdAt ? new Date(cls.createdAt) : new Date(),
            updatedAt: cls.updatedAt ? new Date(cls.updatedAt) : new Date(),
          },
          create: {
            id: cls.id,
            name: cls.name,
            code: cls.code,
            description: cls.description,
            subject: cls.subject,
            grade: cls.grade,
            teacherId: cls.teacherId || null,
            createdAt: cls.createdAt ? new Date(cls.createdAt) : new Date(),
            updatedAt: cls.updatedAt ? new Date(cls.updatedAt) : new Date(),
          },
        })
        classCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating class ${cls.name}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${classCount}/${classes.length} classes\n`)

    // 4. Migrate Class Enrollments (only for migrated classes)
    console.log('📦 Migrating Class Enrollments...')
    let enrollments: any[] = []
    try {
      enrollments = sqliteDb.prepare('SELECT * FROM class_enrollments').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table class_enrollments does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let enrollmentCount = 0
    for (const enrollment of enrollments) {
      try {
        // Check if user and class exist
        const userExists = await postgresPrisma.user.findUnique({ where: { id: enrollment.userId }, select: { id: true } })
        const classExists = await postgresPrisma.class.findUnique({ where: { id: enrollment.classId }, select: { id: true } })
        
        if (!userExists || !classExists) {
          console.log(`  ⚠ Skipping enrollment - user or class not found`)
          continue
        }

        await postgresPrisma.classEnrollment.upsert({
          where: {
            userId_classId: {
              userId: enrollment.userId,
              classId: enrollment.classId,
            },
          },
          update: {
            enrolledAt: enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : new Date(),
          },
          create: {
            userId: enrollment.userId,
            classId: enrollment.classId,
            enrolledAt: enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : new Date(),
          },
        })
        enrollmentCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating enrollment:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${enrollmentCount}/${enrollments.length} enrollments\n`)

    // 5. Migrate Premium Subscriptions (if table exists)
    console.log('📦 Migrating Premium Subscriptions...')
    let subscriptions: any[] = []
    try {
      subscriptions = sqliteDb.prepare('SELECT * FROM premium_subscriptions').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table premium_subscriptions does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let subscriptionCount = 0
    for (const sub of subscriptions) {
      try {
        await postgresPrisma.premiumSubscription.upsert({
          where: { id: sub.id },
          update: {
            userId: sub.userId,
            plan: sub.plan,
            status: sub.status || 'ACTIVE',
            startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
            endDate: sub.endDate ? new Date(sub.endDate) : new Date(),
            activatedBy: sub.activatedBy || 'MANUAL',
            completedTasks: sub.completedTasks || 0,
            createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
            updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
          },
          create: {
            id: sub.id,
            userId: sub.userId,
            plan: sub.plan,
            status: sub.status || 'ACTIVE',
            startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
            endDate: sub.endDate ? new Date(sub.endDate) : new Date(),
            activatedBy: sub.activatedBy || 'MANUAL',
            completedTasks: sub.completedTasks || 0,
            createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
            updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
          },
        })
        subscriptionCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating subscription:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${subscriptionCount}/${subscriptions.length} subscriptions\n`)

    // 6. Migrate Roles (if table exists)
    console.log('📦 Migrating Roles...')
    let roles: any[] = []
    try {
      roles = sqliteDb.prepare('SELECT * FROM roles').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table roles does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let roleCount = 0
    for (const role of roles) {
      try {
        await postgresPrisma.role.upsert({
          where: { id: role.id },
          update: {
            name: role.name,
            description: role.description,
            createdById: role.createdById,
            createdAt: role.createdAt ? new Date(role.createdAt) : new Date(),
            updatedAt: role.updatedAt ? new Date(role.updatedAt) : new Date(),
          },
          create: {
            id: role.id,
            name: role.name,
            description: role.description,
            createdById: role.createdById,
            createdAt: role.createdAt ? new Date(role.createdAt) : new Date(),
            updatedAt: role.updatedAt ? new Date(role.updatedAt) : new Date(),
          },
        })
        roleCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating role ${role.name}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${roleCount}/${roles.length} roles\n`)

    // 7. Migrate Permissions (if table exists)
    console.log('📦 Migrating Permissions...')
    let permissions: any[] = []
    try {
      permissions = sqliteDb.prepare('SELECT * FROM permissions').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table permissions does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let permissionCount = 0
    for (const perm of permissions) {
      try {
        // Parse createdAt safely
        let createdAt = new Date()
        if (perm.createdAt) {
          if (typeof perm.createdAt === 'string') {
            const parsed = new Date(perm.createdAt)
            if (!isNaN(parsed.getTime())) {
              createdAt = parsed
            }
          } else if (typeof perm.createdAt === 'number') {
            createdAt = new Date(perm.createdAt)
          }
        }

        await postgresPrisma.permission.upsert({
          where: { id: perm.id },
          update: {
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            createdAt,
          },
          create: {
            id: perm.id,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            createdAt,
          },
        })
        permissionCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating permission:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${permissionCount}/${permissions.length} permissions\n`)

    // 8. Migrate User Role Assignments (if table exists)
    console.log('📦 Migrating User Role Assignments...')
    let userRoles: any[] = []
    try {
      userRoles = sqliteDb.prepare('SELECT * FROM user_roles').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table user_roles does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let userRoleCount = 0
    for (const userRole of userRoles) {
      try {
        await postgresPrisma.userRoleAssignment.upsert({
          where: {
            userId_roleId: {
              userId: userRole.userId,
              roleId: userRole.roleId,
            },
          },
          update: {
            assignedById: userRole.assignedById,
            assignedAt: userRole.assignedAt ? new Date(userRole.assignedAt) : new Date(),
          },
          create: {
            id: userRole.id,
            userId: userRole.userId,
            roleId: userRole.roleId,
            assignedById: userRole.assignedById,
            assignedAt: userRole.assignedAt ? new Date(userRole.assignedAt) : new Date(),
          },
        })
        userRoleCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating user role assignment:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${userRoleCount}/${userRoles.length} user role assignments\n`)

    // 9. Migrate Module Permissions (if table exists)
    console.log('📦 Migrating Module Permissions...')
    let modulePermissions: any[] = []
    try {
      modulePermissions = sqliteDb.prepare('SELECT * FROM module_permissions').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table module_permissions does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let modulePermissionCount = 0
    for (const mp of modulePermissions) {
      try {
        await postgresPrisma.modulePermission.upsert({
          where: { id: mp.id },
          update: {
            moduleId: mp.moduleId,
            permissionId: mp.permissionId,
            roleId: mp.roleId,
            createdAt: mp.createdAt ? new Date(mp.createdAt) : new Date(),
          },
          create: {
            id: mp.id,
            moduleId: mp.moduleId,
            permissionId: mp.permissionId,
            roleId: mp.roleId,
            createdAt: mp.createdAt ? new Date(mp.createdAt) : new Date(),
          },
        })
        modulePermissionCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating module permission:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${modulePermissionCount}/${modulePermissions.length} module permissions\n`)

    // 10. Migrate Posts
    console.log('📦 Migrating Posts...')
    let posts: any[] = []
    try {
      posts = sqliteDb.prepare('SELECT * FROM posts').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table posts does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let postCount = 0
    for (const post of posts) {
      try {
        // Check if author exists
        if (post.authorId) {
          const authorExists = await postgresPrisma.user.findUnique({ where: { id: post.authorId }, select: { id: true } })
          if (!authorExists) {
            console.log(`  ⚠ Skipping post - author not found`)
            continue
          }
        }

        await postgresPrisma.post.upsert({
          where: { id: post.id },
          update: {
            content: post.content,
            type: post.type,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            authorId: post.authorId,
            scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date(),
          },
          create: {
            id: post.id,
            content: post.content,
            type: post.type,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            authorId: post.authorId,
            scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date(),
          },
        })
        postCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating post:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${postCount}/${posts.length} posts\n`)

    // 11. Migrate Departments
    console.log('📦 Migrating Departments...')
    let departments: any[] = []
    try {
      departments = sqliteDb.prepare('SELECT * FROM departments').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table departments does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let departmentCount = 0
    for (const dept of departments) {
      try {
        await postgresPrisma.department.upsert({
          where: { id: dept.id },
          update: {
            name: dept.name,
            code: dept.code || `DEPT-${dept.id.substring(0, 8).toUpperCase()}`,
            type: dept.type || 'ACADEMIC',
            description: dept.description,
            leaderId: dept.leaderId || dept.headId || null,
            createdAt: dept.createdAt ? new Date(dept.createdAt) : new Date(),
            updatedAt: dept.updatedAt ? new Date(dept.updatedAt) : new Date(),
          },
          create: {
            id: dept.id,
            name: dept.name,
            code: dept.code || `DEPT-${dept.id.substring(0, 8).toUpperCase()}`,
            type: dept.type || 'ACADEMIC',
            description: dept.description,
            leaderId: dept.leaderId || dept.headId || null,
            createdAt: dept.createdAt ? new Date(dept.createdAt) : new Date(),
            updatedAt: dept.updatedAt ? new Date(dept.updatedAt) : new Date(),
          },
        })
        departmentCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating department ${dept.name}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${departmentCount}/${departments.length} departments\n`)

    // 12. Migrate Spaces
    console.log('📦 Migrating Spaces...')
    let spaces: any[] = []
    try {
      spaces = sqliteDb.prepare('SELECT * FROM spaces').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table spaces does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let spaceCount = 0
    for (const space of spaces) {
      try {
        // Check if creator exists
        if (space.createdById) {
          const creatorExists = await postgresPrisma.user.findUnique({ where: { id: space.createdById }, select: { id: true } })
          if (!creatorExists) {
            console.log(`  ⚠ Skipping space - creator not found`)
            continue
          }
        }

        await postgresPrisma.space.upsert({
          where: { id: space.id },
          update: {
            name: space.name,
            description: space.description,
            code: space.code || `SPACE-${space.id.substring(0, 8).toUpperCase()}`,
            type: space.type,
            isActive: space.isActive !== undefined ? (space.isActive === 1 || space.isActive === true) : true,
            visibility: space.visibility || 'INTERNAL',
            createdAt: space.createdAt ? new Date(space.createdAt) : new Date(),
            updatedAt: space.updatedAt ? new Date(space.updatedAt) : new Date(),
          },
          create: {
            id: space.id,
            name: space.name,
            description: space.description,
            code: space.code || `SPACE-${space.id.substring(0, 8).toUpperCase()}`,
            type: space.type,
            isActive: space.isActive !== undefined ? (space.isActive === 1 || space.isActive === true) : true,
            visibility: space.visibility || 'INTERNAL',
            createdAt: space.createdAt ? new Date(space.createdAt) : new Date(),
            updatedAt: space.updatedAt ? new Date(space.updatedAt) : new Date(),
          },
        })
        spaceCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating space ${space.name}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${spaceCount}/${spaces.length} spaces\n`)

    // 12.1. Migrate Space Members
    console.log('📦 Migrating Space Members...')
    let spaceMembers: any[] = []
    try {
      spaceMembers = sqliteDb.prepare('SELECT * FROM space_members').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table space_members does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let spaceMemberCount = 0
    for (const member of spaceMembers) {
      try {
        // Check if space and user exist
        const spaceExists = await postgresPrisma.space.findUnique({ where: { id: member.spaceId }, select: { id: true } })
        const userExists = await postgresPrisma.user.findUnique({ where: { id: member.userId }, select: { id: true } })
        
        if (!spaceExists || !userExists) {
          console.log(`  ⚠ Skipping space member - space or user not found`)
          continue
        }

        await postgresPrisma.spaceMember.upsert({
          where: {
            spaceId_userId: {
              spaceId: member.spaceId,
              userId: member.userId,
            },
          },
          update: {
            role: member.role || 'MEMBER',
            roleDescription: member.roleDescription,
            canRead: member.canRead !== undefined ? (member.canRead === 1 || member.canRead === true) : true,
            canWrite: member.canWrite !== undefined ? (member.canWrite === 1 || member.canWrite === true) : false,
            canManage: member.canManage !== undefined ? (member.canManage === 1 || member.canManage === true) : false,
            canApprove: member.canApprove !== undefined ? (member.canApprove === 1 || member.canApprove === true) : false,
            canPublish: member.canPublish !== undefined ? (member.canPublish === 1 || member.canPublish === true) : false,
            invitedBy: member.invitedBy || null,
            joinedAt: member.joinedAt ? new Date(member.joinedAt) : new Date(),
          },
          create: {
            id: member.id,
            spaceId: member.spaceId,
            userId: member.userId,
            role: member.role || 'MEMBER',
            roleDescription: member.roleDescription,
            canRead: member.canRead !== undefined ? (member.canRead === 1 || member.canRead === true) : true,
            canWrite: member.canWrite !== undefined ? (member.canWrite === 1 || member.canWrite === true) : false,
            canManage: member.canManage !== undefined ? (member.canManage === 1 || member.canManage === true) : false,
            canApprove: member.canApprove !== undefined ? (member.canApprove === 1 || member.canApprove === true) : false,
            canPublish: member.canPublish !== undefined ? (member.canPublish === 1 || member.canPublish === true) : false,
            invitedBy: member.invitedBy || null,
            joinedAt: member.joinedAt ? new Date(member.joinedAt) : new Date(),
          },
        })
        spaceMemberCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating space member:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${spaceMemberCount}/${spaceMembers.length} space members\n`)

    // 12.2. Migrate Space Tasks
    console.log('📦 Migrating Space Tasks...')
    let spaceTasks: any[] = []
    try {
      spaceTasks = sqliteDb.prepare('SELECT * FROM space_tasks').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table space_tasks does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let spaceTaskCount = 0
    for (const task of spaceTasks) {
      try {
        // Check if space and createdBy exist
        const spaceExists = await postgresPrisma.space.findUnique({ where: { id: task.spaceId }, select: { id: true } })
        if (task.createdById) {
          const creatorExists = await postgresPrisma.user.findUnique({ where: { id: task.createdById }, select: { id: true } })
          if (!creatorExists) {
            console.log(`  ⚠ Skipping space task - creator not found`)
            continue
          }
        }
        
        if (!spaceExists) {
          console.log(`  ⚠ Skipping space task - space not found`)
          continue
        }

        await postgresPrisma.spaceTask.upsert({
          where: { id: task.id },
          update: {
            spaceId: task.spaceId,
            title: task.title,
            description: task.description,
            column: task.column || 'todo',
            order: task.order || 0,
            priority: task.priority || 'NORMAL',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            images: task.images,
            attachments: task.attachments,
            checklist: task.checklist,
            tags: task.tags,
            createdById: task.createdById,
            assignedToId: task.assignedToId || null,
            commentsCount: task.commentsCount || 0,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          },
          create: {
            id: task.id,
            spaceId: task.spaceId,
            title: task.title,
            description: task.description,
            column: task.column || 'todo',
            order: task.order || 0,
            priority: task.priority || 'NORMAL',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            images: task.images,
            attachments: task.attachments,
            checklist: task.checklist,
            tags: task.tags,
            createdById: task.createdById,
            assignedToId: task.assignedToId || null,
            commentsCount: task.commentsCount || 0,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          },
        })
        spaceTaskCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating space task ${task.title}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${spaceTaskCount}/${spaceTasks.length} space tasks\n`)

    // 13. Migrate Documents
    console.log('📦 Migrating Documents...')
    let documents: any[] = []
    try {
      documents = sqliteDb.prepare('SELECT * FROM documents').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table documents does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let documentCount = 0
    for (const doc of documents) {
      try {
        // Check if uploadedBy exists
        if (doc.uploadedById) {
          const uploaderExists = await postgresPrisma.user.findUnique({ where: { id: doc.uploadedById }, select: { id: true } })
          if (!uploaderExists) {
            console.log(`  ⚠ Skipping document - uploader not found`)
            continue
          }
        }

        await postgresPrisma.document.upsert({
          where: { id: doc.id },
          update: {
            title: doc.title,
            description: doc.description,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/octet-stream',
            type: doc.type || 'OTHER',
            category: doc.category,
            signedFileUrl: doc.signedFileUrl,
            uploadedById: doc.uploadedById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
          create: {
            id: doc.id,
            title: doc.title,
            description: doc.description,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/octet-stream',
            type: doc.type || 'OTHER',
            category: doc.category,
            signedFileUrl: doc.signedFileUrl,
            uploadedById: doc.uploadedById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
        })
        documentCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating document ${doc.title}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${documentCount}/${documents.length} documents\n`)

    // 14. Migrate Incoming Documents
    console.log('📦 Migrating Incoming Documents...')
    let incomingDocs: any[] = []
    try {
      incomingDocs = sqliteDb.prepare('SELECT * FROM incoming_documents').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table incoming_documents does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let incomingDocCount = 0
    for (const doc of incomingDocs) {
      try {
        // Check if createdBy exists
        if (doc.createdById) {
          const creatorExists = await postgresPrisma.user.findUnique({ where: { id: doc.createdById }, select: { id: true } })
          if (!creatorExists) {
            console.log(`  ⚠ Skipping incoming document - creator not found`)
            continue
          }
        } else {
          console.log(`  ⚠ Skipping incoming document - no creator ID`)
          continue
        }

        // Parse dates safely
        const receivedDate = doc.receivedDate 
          ? (typeof doc.receivedDate === 'string' && doc.receivedDate.includes('T') 
              ? new Date(doc.receivedDate) 
              : new Date(parseInt(doc.receivedDate)))
          : new Date()
        
        const deadline = doc.deadline 
          ? (typeof doc.deadline === 'string' && doc.deadline.includes('T') 
              ? new Date(doc.deadline) 
              : new Date(parseInt(doc.deadline)))
          : null

        await postgresPrisma.incomingDocument.upsert({
          where: { id: doc.id },
          update: {
            documentNumber: doc.documentNumber,
            documentCode: doc.documentCode,
            title: doc.title,
            content: doc.content,
            summary: doc.summary,
            type: doc.type || 'OTHER',
            status: doc.status || 'PENDING',
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/pdf',
            originalFileUrl: doc.originalFileUrl,
            ocrText: doc.ocrText,
            ocrConfidence: doc.ocrConfidence,
            aiCategory: doc.aiCategory,
            aiConfidence: doc.aiConfidence,
            aiExtractedData: doc.aiExtractedData,
            sender: doc.sender,
            receivedDate,
            priority: doc.priority || 'NORMAL',
            deadline,
            tags: doc.tags,
            notes: doc.notes,
            documentTypeCode: doc.documentTypeCode,
            createdById: doc.createdById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
          create: {
            id: doc.id,
            documentNumber: doc.documentNumber,
            documentCode: doc.documentCode,
            title: doc.title,
            content: doc.content,
            summary: doc.summary,
            type: doc.type || 'OTHER',
            status: doc.status || 'PENDING',
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/pdf',
            originalFileUrl: doc.originalFileUrl,
            ocrText: doc.ocrText,
            ocrConfidence: doc.ocrConfidence,
            aiCategory: doc.aiCategory,
            aiConfidence: doc.aiConfidence,
            aiExtractedData: doc.aiExtractedData,
            sender: doc.sender,
            receivedDate,
            priority: doc.priority || 'NORMAL',
            deadline,
            tags: doc.tags,
            notes: doc.notes,
            documentTypeCode: doc.documentTypeCode,
            createdById: doc.createdById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
        })
        incomingDocCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating incoming document ${doc.title}:`, error.message)
        if (process.env.NODE_ENV === 'development') {
          console.error(`    Details:`, error)
        }
      }
    }
    console.log(`  ✅ Đã migrate ${incomingDocCount}/${incomingDocs.length} incoming documents\n`)

    // 15. Migrate Outgoing Documents
    console.log('📦 Migrating Outgoing Documents...')
    let outgoingDocs: any[] = []
    try {
      outgoingDocs = sqliteDb.prepare('SELECT * FROM outgoing_documents').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table outgoing_documents does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let outgoingDocCount = 0
    for (const doc of outgoingDocs) {
      try {
        // Check if createdBy exists
        if (doc.createdById) {
          const creatorExists = await postgresPrisma.user.findUnique({ where: { id: doc.createdById }, select: { id: true } })
          if (!creatorExists) {
            console.log(`  ⚠ Skipping outgoing document - creator not found`)
            continue
          }
        }

        await postgresPrisma.outgoingDocument.upsert({
          where: { id: doc.id },
          update: {
            documentNumber: doc.documentNumber,
            documentCode: doc.documentCode,
            title: doc.title,
            content: doc.content,
            aiDraft: doc.aiDraft,
            template: doc.template,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            signedFileUrl: doc.signedFileUrl,
            recipient: doc.recipient,
            status: doc.status || 'PENDING',
            priority: doc.priority || 'NORMAL',
            sendDate: doc.sendDate ? new Date(doc.sendDate) : null,
            createdById: doc.createdById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
          create: {
            id: doc.id,
            documentNumber: doc.documentNumber,
            documentCode: doc.documentCode,
            title: doc.title,
            content: doc.content,
            aiDraft: doc.aiDraft,
            template: doc.template,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            signedFileUrl: doc.signedFileUrl,
            recipient: doc.recipient,
            status: doc.status || 'PENDING',
            priority: doc.priority || 'NORMAL',
            sendDate: doc.sendDate ? new Date(doc.sendDate) : null,
            createdById: doc.createdById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
        })
        outgoingDocCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating outgoing document ${doc.title}:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${outgoingDocCount}/${outgoingDocs.length} outgoing documents\n`)

    // 16. Migrate Incoming Document Assignments
    console.log('📦 Migrating Incoming Document Assignments...')
    let assignments: any[] = []
    try {
      assignments = sqliteDb.prepare('SELECT * FROM incoming_document_assignments').all() as any[]
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.log('  ℹ Table incoming_document_assignments does not exist, skipping...\n')
      } else {
        throw error
      }
    }
    let assignmentCount = 0
    for (const assignment of assignments) {
      try {
        // Check if document and assignedTo exist
        const docExists = await postgresPrisma.incomingDocument.findUnique({ where: { id: assignment.documentId }, select: { id: true } })
        const userExists = await postgresPrisma.user.findUnique({ where: { id: assignment.assignedToId }, select: { id: true } })
        
        if (!docExists || !userExists) {
          console.log(`  ⚠ Skipping assignment - document or user not found`)
          continue
        }

        await postgresPrisma.incomingDocumentAssignment.upsert({
          where: { id: assignment.id },
          update: {
            documentId: assignment.documentId,
            assignedToId: assignment.assignedToId,
            assignedById: assignment.assignedById || null,
            notes: assignment.notes,
            deadline: assignment.deadline ? new Date(assignment.deadline) : null,
            status: assignment.status || 'PENDING',
            completedAt: assignment.completedAt ? new Date(assignment.completedAt) : null,
            checklistItems: assignment.checklistItems,
            createdAt: assignment.createdAt ? new Date(assignment.createdAt) : new Date(),
            updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt) : new Date(),
          },
          create: {
            id: assignment.id,
            documentId: assignment.documentId,
            assignedToId: assignment.assignedToId,
            assignedById: assignment.assignedById || null,
            notes: assignment.notes,
            deadline: assignment.deadline ? new Date(assignment.deadline) : null,
            status: assignment.status || 'PENDING',
            completedAt: assignment.completedAt ? new Date(assignment.completedAt) : null,
            checklistItems: assignment.checklistItems,
            createdAt: assignment.createdAt ? new Date(assignment.createdAt) : new Date(),
            updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt) : new Date(),
          },
        })
        assignmentCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating assignment:`, error.message)
      }
    }
    console.log(`  ✅ Đã migrate ${assignmentCount}/${assignments.length} document assignments\n`)

    console.log('✅ Hoàn tất migrate dữ liệu!')
    console.log(`\n📊 Tóm tắt:`)
    console.log(`   - Users: ${userCount}`)
    console.log(`   - Modules: ${moduleCount}`)
    console.log(`   - Classes: ${classCount}`)
    console.log(`   - Enrollments: ${enrollmentCount}`)
    console.log(`   - Subscriptions: ${subscriptionCount}`)
    console.log(`   - Roles: ${roleCount}`)
    console.log(`   - Permissions: ${permissionCount}`)
    console.log(`   - User Role Assignments: ${userRoleCount}`)
    console.log(`   - Module Permissions: ${modulePermissionCount}`)
    console.log(`   - Posts: ${postCount}`)
    console.log(`   - Departments: ${departmentCount}`)
    console.log(`   - Spaces: ${spaceCount}`)
    console.log(`   - Space Members: ${spaceMemberCount}`)
    console.log(`   - Space Tasks: ${spaceTaskCount}`)
    console.log(`   - Documents: ${documentCount}`)
    console.log(`   - Incoming Documents: ${incomingDocCount}`)
    console.log(`   - Outgoing Documents: ${outgoingDocCount}`)
    console.log(`   - Document Assignments: ${assignmentCount}`)

  } catch (error: any) {
    console.error('❌ Error during migration:', error)
    throw error
  } finally {
    sqliteDb.close()
    await postgresPrisma.$disconnect()
  }
}

migrateData()

