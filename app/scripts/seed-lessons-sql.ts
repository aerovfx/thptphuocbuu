/**
 * Seed demo lessons using direct SQL
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

const dbPath = join(process.cwd(), 'prisma', 'dev.db')

// Get class IDs
const js101Id = execSync(`sqlite3 "${dbPath}" "SELECT id FROM classes WHERE code = 'JS101' LIMIT 1;"`, { encoding: 'utf-8' }).trim()
const ps201Id = execSync(`sqlite3 "${dbPath}" "SELECT id FROM classes WHERE code = 'PS201' LIMIT 1;"`, { encoding: 'utf-8' }).trim()
const fe102Id = execSync(`sqlite3 "${dbPath}" "SELECT id FROM classes WHERE code = 'FE102' LIMIT 1;"`, { encoding: 'utf-8' }).trim()

console.log('🌱 Seeding lessons using SQL...')
console.log(`JS101 ID: ${js101Id}`)
console.log(`PS201 ID: ${ps201Id}`)
console.log(`FE102 ID: ${fe102Id}`)

if (!js101Id || !ps201Id || !fe102Id) {
  console.error('❌ Could not find class IDs')
  process.exit(1)
}

// Helper to generate CUID-like ID
function generateId() {
  return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// JS101 Lessons
const js101Chapter1Id = generateId()
const js101Chapter2Id = generateId()

execSync(`sqlite3 "${dbPath}" <<EOF
DELETE FROM lessons WHERE chapterId IN (SELECT id FROM chapters WHERE classId = '${js101Id}');
DELETE FROM chapters WHERE classId = '${js101Id}';

INSERT INTO chapters (id, title, description, "order", classId, createdAt, updatedAt) VALUES
('${js101Chapter1Id}', 'Introduction', 'Chapter 1: Introduction', 0, '${js101Id}', datetime('now'), datetime('now')),
('${js101Chapter2Id}', 'JavaScript Basics', 'Chapter 2: JavaScript Basics', 1, '${js101Id}', datetime('now'), datetime('now'));

INSERT INTO lessons (id, title, description, content, "order", duration, chapterId, createdAt, updatedAt) VALUES
('${generateId()}', 'Introducing the library and how it works', 'Learn the fundamentals of JavaScript and its core concepts', '<h2>What is JavaScript?</h2><p>JavaScript is a high-level, interpreted programming language.</p>', 0, 15, '${js101Chapter1Id}', datetime('now'), datetime('now')),
('${generateId()}', 'Get the sample code', 'Where to find the sample code and how to access it', '<h2>Getting Started with Sample Code</h2><p>All sample code is available in our GitHub repository.</p>', 1, 10, '${js101Chapter1Id}', datetime('now'), datetime('now')),
('${generateId()}', 'Create a Firebase project and Set up your app', 'How to create a basic Firebase project and how to run it locally', '<h2>Firebase Setup</h2><p>Firebase is a platform developed by Google.</p>', 2, 20, '${js101Chapter1Id}', datetime('now'), datetime('now')),
('${generateId()}', 'Variables and Data Types', 'Understanding variables, let, const, and data types', '<h2>Variables in JavaScript</h2><p>JavaScript has three ways to declare variables: var, let, and const.</p>', 0, 15, '${js101Chapter2Id}', datetime('now'), datetime('now')),
('${generateId()}', 'Functions and Scope', 'Learn about function declarations, arrow functions, and scope', '<h2>Functions</h2><p>Functions are one of the fundamental building blocks in JavaScript.</p>', 1, 20, '${js101Chapter2Id}', datetime('now'), datetime('now'));
EOF
`, { stdio: 'inherit' })

console.log('✅ Seeded JS101 lessons')

// PS201 Lessons
const ps201Chapter1Id = generateId()

execSync(`sqlite3 "${dbPath}" <<EOF
DELETE FROM lessons WHERE chapterId IN (SELECT id FROM chapters WHERE classId = '${ps201Id}');
DELETE FROM chapters WHERE classId = '${ps201Id}';

INSERT INTO chapters (id, title, description, "order", classId, createdAt, updatedAt) VALUES
('${ps201Chapter1Id}', 'Problem Solving Fundamentals', 'Chapter 1: Problem Solving Fundamentals', 0, '${ps201Id}', datetime('now'), datetime('now'));

INSERT INTO lessons (id, title, description, content, "order", duration, chapterId, createdAt, updatedAt) VALUES
('${generateId()}', 'Introduction to Problem Solving', 'Learn the basic approach to solving complex problems', '<h2>Problem Solving Approach</h2><p>Effective problem solving requires a systematic approach.</p>', 0, 15, '${ps201Chapter1Id}', datetime('now'), datetime('now')),
('${generateId()}', 'Algorithm Design', 'Understanding algorithms and their design principles', '<h2>Algorithm Design</h2><p>Algorithms are step-by-step procedures for solving problems.</p>', 1, 25, '${ps201Chapter1Id}', datetime('now'), datetime('now'));
EOF
`, { stdio: 'inherit' })

console.log('✅ Seeded PS201 lessons')

// FE102 Lessons
const fe102Chapter1Id = generateId()

execSync(`sqlite3 "${dbPath}" <<EOF
DELETE FROM lessons WHERE chapterId IN (SELECT id FROM chapters WHERE classId = '${fe102Id}');
DELETE FROM chapters WHERE classId = '${fe102Id}';

INSERT INTO chapters (id, title, description, "order", classId, createdAt, updatedAt) VALUES
('${fe102Chapter1Id}', 'HTML Fundamentals', 'Chapter 1: HTML Fundamentals', 0, '${fe102Id}', datetime('now'), datetime('now'));

INSERT INTO lessons (id, title, description, content, "order", duration, chapterId, createdAt, updatedAt) VALUES
('${generateId()}', 'HTML Structure', 'Learn the basic structure of HTML documents', '<h2>HTML Basics</h2><p>HTML is the standard markup language for creating web pages.</p>', 0, 15, '${fe102Chapter1Id}', datetime('now'), datetime('now')),
('${generateId()}', 'CSS Styling', 'Introduction to CSS and styling web pages', '<h2>CSS Introduction</h2><p>CSS is used to style and layout web pages.</p>', 1, 20, '${fe102Chapter1Id}', datetime('now'), datetime('now'));
EOF
`, { stdio: 'inherit' })

console.log('✅ Seeded FE102 lessons')

console.log('\n✅ Finished seeding all lessons!')

