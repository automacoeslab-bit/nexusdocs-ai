import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from 'fs'
import { createHash } from 'crypto'
import { join } from 'path'
import { fileURLToPath } from 'url'

const normalizePath = (p) => p.replace(/\\/g, '/')

const ASSET_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg)$/i
const IGNORED = /^(\.|~)|\.tmp$|\.DS_Store/

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function loadCache() {
  const cachePath = 'cache/last-sync.json'
  if (!existsSync(cachePath)) return { version: 1, generatedAt: null, files: {} }
  try {
    const data = JSON.parse(readFileSync(cachePath, 'utf-8'))
    if (data.version !== 1) {
      console.log('[detect]  Cache com versão diferente — full resync')
      return { version: 1, generatedAt: null, files: {} }
    }
    return data
  } catch {
    return { version: 1, generatedAt: null, files: {} }
  }
}

function scanDocsNotion(docsNotionPath) {
  const mdFiles = []
  const assetFiles = []

  const modules = readdirSync(docsNotionPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('modulo-'))
    .map(d => d.name)

  for (const mod of modules) {
    const modPath = join(docsNotionPath, mod)
    const entries = readdirSync(modPath, { withFileTypes: true })

    for (const entry of entries) {
      if (IGNORED.test(entry.name)) continue

      if (entry.isFile() && entry.name.endsWith('-notion.md')) {
        mdFiles.push(normalizePath(join(mod, entry.name)))
      }

      if (entry.isFile() && ASSET_EXTENSIONS.test(entry.name)) {
        assetFiles.push(normalizePath(join(mod, entry.name)))
      }

      if (entry.isDirectory() && entry.name === 'diags') {
        const diagEntries = readdirSync(join(modPath, 'diags'), { withFileTypes: true })
        for (const df of diagEntries) {
          if (df.isFile() && !IGNORED.test(df.name)) {
            assetFiles.push(normalizePath(join(mod, 'diags', df.name)))
          }
        }
      }
    }
  }

  return { mdFiles, assetFiles }
}

export function detectChanges(docsNotionPath) {
  const cache = loadCache()
  const cached = cache.files || {}
  const { mdFiles, assetFiles } = scanDocsNotion(docsNotionPath)
  const allCurrentFiles = [...mdFiles, ...assetFiles]

  const result = {
    changed: [],
    added: [],
    deleted: [],
    assets: { changed: [], added: [], deleted: [] },
  }

  // Detectar adicionados e alterados
  for (const relPath of mdFiles) {
    const absPath = join(docsNotionPath, relPath.replace(/\//g, '\\'))
    const stat = statSync(absPath)
    const mtime = stat.mtimeMs

    if (!cached[relPath]) {
      result.added.push(relPath)
    } else if (mtime !== cached[relPath].mtime) {
      const hash = sha256(absPath)
      if (hash !== cached[relPath].sha256) {
        result.changed.push(relPath)
      }
    }
  }

  for (const relPath of assetFiles) {
    const absPath = join(docsNotionPath, relPath.replace(/\//g, '\\'))
    const stat = statSync(absPath)
    const mtime = stat.mtimeMs

    if (!cached[relPath]) {
      result.assets.added.push(relPath)
    } else if (mtime !== cached[relPath].mtime) {
      const hash = sha256(absPath)
      if (hash !== cached[relPath].sha256) {
        result.assets.changed.push(relPath)
      }
    }
  }

  // Detectar deletados
  for (const cachedPath of Object.keys(cached)) {
    if (!allCurrentFiles.includes(cachedPath)) {
      if (cachedPath.includes('/diags/') || ASSET_EXTENSIONS.test(cachedPath)) {
        result.assets.deleted.push(cachedPath)
      } else {
        result.deleted.push(cachedPath)
      }
    }
  }

  return result
}

// Execução standalone
const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  const docsNotionPath = process.env.DOCS_NOTION_PATH
  if (!docsNotionPath || !existsSync(docsNotionPath)) {
    console.error('[detect]  ERRO: DOCS_NOTION_PATH não definido ou não existe')
    process.exit(1)
  }
  const result = detectChanges(docsNotionPath)
  const total = result.added.length + result.changed.length + result.deleted.length +
    result.assets.added.length + result.assets.changed.length + result.assets.deleted.length

  if (total === 0) {
    console.log('[detect]  Nenhuma mudança detectada.')
  } else {
    for (const f of result.added)          console.log(`[detect]  + ${f}  (adicionado)`)
    for (const f of result.changed)        console.log(`[detect]  ~ ${f}  (alterado)`)
    for (const f of result.deleted)        console.log(`[detect]  - ${f}  (removido)`)
    for (const f of result.assets.added)   console.log(`[detect]  + ${f}  (asset adicionado)`)
    for (const f of result.assets.changed) console.log(`[detect]  ~ ${f}  (asset alterado)`)
    for (const f of result.assets.deleted) console.log(`[detect]  - ${f}  (asset removido)`)
  }
}
