/**
 * Simple scaffolder for a new dashboard module (frontend-only skeleton).
 *
 * Usage:
 *   npx tsx scripts/scaffold-module.ts my-feature
 *
 * Generates:
 *   app/dashboard/<feature>/page.tsx
 *   components/<Feature>/<Feature>Page.tsx
 *
 * Notes:
 * - Keeps it minimal and consistent; you can extend later for API routes, forms, etc.
 */

import fs from 'fs'
import path from 'path'

function toPascalCase(input: string) {
  return input
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFileSafe(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite existing file: ${filePath}`)
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

const feature = process.argv[2]
if (!feature) {
  console.error('Missing feature name. Example: npx tsx scripts/scaffold-module.ts order-sessions')
  process.exit(1)
}

const featureSlug = feature.trim().replace(/^\/+/, '').replace(/\/+$/, '')
const featurePascal = toPascalCase(featureSlug)
const featureComponentName = `${featurePascal}Page`

const repoRoot = path.resolve(__dirname, '..')
const appDir = path.join(repoRoot, 'app', 'dashboard', featureSlug)
const componentDir = path.join(repoRoot, 'components', featurePascal)

ensureDir(appDir)
ensureDir(componentDir)

const pagePath = path.join(appDir, 'page.tsx')
const componentPath = path.join(componentDir, `${featureComponentName}.tsx`)

writeFileSafe(
  pagePath,
  `import ${featureComponentName} from '@/components/${featurePascal}/${featureComponentName}'\n\nexport default function Page() {\n  return <${featureComponentName} />\n}\n`
)

writeFileSafe(
  componentPath,
  `'use client'\n\nexport default function ${featureComponentName}() {\n  return (\n    <div className=\"p-6\">\n      <h1 className=\"text-2xl font-bold\">${featurePascal}</h1>\n      <p className=\"text-gray-600 mt-2\">Module scaffold created. Implement UI here.</p>\n    </div>\n  )\n}\n`
)

console.log('✅ Scaffold created:')
console.log(`- ${path.relative(repoRoot, pagePath)}`)
console.log(`- ${path.relative(repoRoot, componentPath)}`)


