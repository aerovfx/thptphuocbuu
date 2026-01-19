#!/bin/bash

# Master Migration Script for THPT Phước Bửu Production
# Date: 2026-01-20

set -e

# Production Database URL (Neon)
export PROD_DATABASE_URL="postgresql://neondb_owner:npg_KenJcZdU58og@ep-delicate-snow-a1gm8l2y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
# Development Database URL (Prisma)
export DEV_DATABASE_URL="postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_5s-rlEb45dHkrmN3UdYzo@db.prisma.io:5432/postgres?sslmode=require"

echo "🚀 Bắt đầu quá trình Migrate dữ liệu lên Production..."
echo "======================================================"

# 1. Update Schema
echo "📋 Bước 1: Đồng bộ Database Schema..."
DATABASE_URL=$PROD_DATABASE_URL npx prisma db push --accept-data-loss

# 2. Seed Essential Metadata
echo ""
echo "🌱 Bước 2: Khởi tạo Metadata (Modules, Document Types, etc.)..."

echo "  > Seeding Modules..."
DATABASE_URL=$PROD_DATABASE_URL npx tsx app/scripts/seed-modules.ts

echo "  > Seeding Document Types..."
DATABASE_URL=$PROD_DATABASE_URL npx tsx app/scripts/seed-document-types.ts

echo "  > Seeding Departments & Spaces..."
DATABASE_URL=$PROD_DATABASE_URL npx tsx app/scripts/seed-departments-spaces.ts

echo "  > Seeding Permissions..."
if [ -f "app/scripts/seed-permissions.ts" ]; then
    DATABASE_URL=$PROD_DATABASE_URL npx tsx app/scripts/seed-permissions.ts
fi

# 3. Custom Data Sync (Users)
echo ""
echo "👥 Bước 3: Đồng bộ dữ liệu người dùng (ADMIN rights)..."
# Chúng ta sẽ sử dụng một script tạm thời để sync users từ DEV sang PROD
DATABASE_URL=$PROD_DATABASE_URL npx tsx -e "
import { PrismaClient } from '@prisma/client';
const devDb = new PrismaClient({ datasources: { db: { url: process.env.DEV_DATABASE_URL } } });
const prodDb = new PrismaClient({ datasources: { db: { url: process.env.PROD_DATABASE_URL } } });

async function sync() {
  const users = await devDb.user.findMany();
  console.log('Syncing ' + users.length + ' users...');
  for (const user of users) {
    await prodDb.user.upsert({
      where: { email: user.email },
      update: { role: user.role, firstName: user.firstName, lastName: user.lastName },
      create: { ...user, id: undefined }
    });
  }
  console.log('✅ Xong!');
}
sync().finally(() => { devDb.\$disconnect(); prodDb.\$disconnect(); });
"

echo ""
echo "======================================================"
echo "✅ Quá trình Migrate hoàn tất thành công!"
echo "🚀 Hệ thống Production đã được cập nhật dữ liệu mới nhất."
