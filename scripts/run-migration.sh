#!/bin/bash

# Script to run database migration before deploying
# This updates the UserStatus enum from 4 values to 2 values

set -e

echo "🚀 Starting database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
DB_URL="$DATABASE_URL"

echo "📊 Running migration SQL..."
echo "   This will:"
echo "   1. Convert DELETED users to SUSPENDED"
echo "   2. Convert PENDING users to SUSPENDED"
echo "   3. Update enum type to only ACTIVE and SUSPENDED"
echo ""

# Run migration using psql
psql "$DB_URL" -f scripts/run-migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Run: npx prisma generate"
    echo "   2. Deploy the application"
else
    echo "❌ Migration failed!"
    exit 1
fi

