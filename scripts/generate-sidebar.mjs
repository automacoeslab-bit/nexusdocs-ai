import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const normalizePath = (p) => p.replace(/\\/g, '/')

function moduleSlug(moduleName) {
  return moduleName.replace(/^modulo-/, '')
}

// Extrai label da primeira linha H1 do arquivo
function extractPageLabel(content, filename) {
  const h1 = content.match(/^#\s+(.+)$/m)
  if (h1) {
    let label = h1[1]
    // Remove tudo antes e incluindo " — " (em dash U+2014)
    const emDashIdx = label.indexOf('—')
    if (emDashIdx !== -1) {
      label = label.slice(emDashIdx + 1).trim()
    } else {
      // Remove emojis e espaços iniciais
      label = label.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\s]+/gu, '').trim()
    }
    if (label.length > 0) return label
  }
  // Fallback: humaniza o filename
  return filename
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Lê module.json se existir no docs-notion
function readModuleJson(docsNotionPath, moduleName) {
  const modulePath = join(docsNotionPath, moduleName, 'module.json')
  if (!existsSync(modulePath)) return {}
  try {
    return JSON.parse(readFileSync(modulePath, 'utf-8'))
  } catch {
    return {}
  }
}

// Lê moduleConfig do modules.ts via regex (sem importar TS em runtime)
function readModuleConfig() {
  const configPath = 'src/config/modules.ts'
  if (!existsSync(configPath)) return {}
  const content = readFileSync(configPath, 'utf-8')
  const config = {}
  const entryRegex = /'([^']+)':\s*\{([^}]+)\}/g
  let match
  while ((match = entryRegex.exec(content)) !== null) {
    const key = match[1]
    const body = match[2]
    const obj = {}
    const labelMatch = body.match(/label:\s*'([^']+)'/)
    const orderMatch = body.match(/order:\s*(\d+)/)
    const iconMatch = body.match(/icon:\s*'([^']+)'/)
    const hiddenMatch = body.match(/hidden:\s*(true|false)/)
    if (labelMatch) obj.label = labelMatch[1]
    if (orderMatch) obj.order = parseInt(orderMatch[1])
    if (iconMatch) obj.icon = iconMatch[1]
    if (hiddenMatch) obj.hidden = hiddenMatch[1] === 'true'
    config[key] = obj
  }
  return config
}

export function generateSidebar(docsNotionPath, verbose = false) {
  const generatedBase = join('src', 'content', 'docs', 'generated')

  if (!existsSync(generatedBase)) {
    console.log('[sidebar] Nenhum conteúdo gerado encontrado. Rode sync-docs:process primeiro.')
    return []
  }

  const moduleConfig = readModuleConfig()

  // Auto-descoberta dos módulos no docs-notion
  const discoveredModules = readdirSync(docsNotionPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('modulo-'))
    .map(d => d.name)

  const sections = []

  for (const moduleName of discoveredModules) {
    const slug = moduleSlug(moduleName)
    const generatedModulePath = join(generatedBase, slug)

    if (!existsSync(generatedModulePath)) continue

    // Resolução: modules.ts > module.json > auto-gerado
    const fromJson = readModuleJson(docsNotionPath, moduleName)
    const fromTs = moduleConfig[moduleName] || {}

    const label = fromTs.label || fromJson.label || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const order = fromTs.order ?? fromJson.order ?? 99
    const icon = fromTs.icon || fromJson.icon || null
    const hidden = fromTs.hidden ?? fromJson.hidden ?? false

    if (hidden) {
      if (verbose) console.log(`[sidebar] Módulo ${moduleName} oculto (hidden: true)`)
      continue
    }

    // Listar páginas do módulo
    const mdFiles = readdirSync(generatedModulePath)
      .filter(f => f.endsWith('.md'))
      .sort()

    const items = []
    for (const mdFile of mdFiles) {
      const mdPath = join(generatedModulePath, mdFile)
      const content = readFileSync(mdPath, 'utf-8')
      const pageLabel = extractPageLabel(content, mdFile.replace('.md', ''))
      const link = `/generated/${slug}/${mdFile.replace('.md', '')}`
      items.push({ label: pageLabel, link })
    }

    if (items.length === 0) continue

    const section = { label, order, items }
    if (icon) section.icon = icon
    sections.push(section)
  }

  // Ordenar seções pelo campo order
  sections.sort((a, b) => a.order - b.order)

  // Remover campo interno 'order' do JSON final
  const output = sections.map(({ order: _order, ...rest }) => rest)

  mkdirSync('cache', { recursive: true })
  writeFileSync('cache/generated-sidebar.json', JSON.stringify(output, null, 2), 'utf-8')

  if (verbose) {
    for (const s of output) {
      console.log(`[sidebar]   ${s.label} (${s.items.length} páginas)`)
    }
  }

  return output
}

// ── Execução standalone ───────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  const docsNotionPath = process.env.DOCS_NOTION_PATH
  if (!docsNotionPath || !existsSync(docsNotionPath)) {
    console.error('[sidebar] ERRO: DOCS_NOTION_PATH não definido ou não existe')
    process.exit(1)
  }

  const verbose = process.argv.includes('--verbose')
  const result = generateSidebar(docsNotionPath, verbose)
  console.log(`[sidebar] ${result.length} módulos → cache/generated-sidebar.json gerado`)
}
