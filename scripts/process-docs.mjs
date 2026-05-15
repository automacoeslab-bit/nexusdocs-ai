import {
  readFileSync, writeFileSync, copyFileSync, mkdirSync,
  existsSync, readdirSync, rmSync, statSync
} from 'fs'
import { createHash } from 'crypto'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const normalizePath = (p) => p.replace(/\\/g, '/')

// ── Utilitários ──────────────────────────────────────────────────────────────

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function moduleSlug(moduleName) {
  return moduleName.replace(/^modulo-/, '')
}

function destFilename(notionFilename) {
  return notionFilename.replace(/-notion\.md$/, '.md')
}

function assetPath(file, _options = { fingerprint: false }) {
  // V2: computar hash e inserir antes da extensão
  return file
}

// ── NORMALIZE: extração de frontmatter ───────────────────────────────────────

function extractFrontmatter(content) {
  const fm = {}
  if (!content.trimStart().startsWith('---')) return fm
  const end = content.indexOf('\n---', 3)
  if (end === -1) return fm
  const block = content.slice(3, end).trim()
  for (const line of block.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key) fm[key] = val
  }
  return fm
}

// ── VALIDATE: verificações não-bloqueantes ───────────────────────────────────

function validateMarkdown(content, sourceModulePath, filename, log) {
  const warnings = []

  // Frontmatter não fechado
  if (content.trimStart().startsWith('---')) {
    const end = content.indexOf('\n---', 3)
    if (end === -1) warnings.push('frontmatter não fechado (falta ---)')
  }

  // Referências a diags/ que não existem na fonte
  const diagRefs = [...content.matchAll(/\(diags\/([^)]+)\)/g)]
  for (const [, diagFile] of diagRefs) {
    const diagPath = join(sourceModulePath, 'diags', diagFile.replace(/\//g, '\\'))
    if (!existsSync(diagPath)) {
      warnings.push(`imagem referenciada não encontrada: diags/${diagFile}`)
    }
  }

  // Referências a imagens na raiz do módulo
  const imgRefs = [...content.matchAll(/\((?!https?:\/\/|\/|diags\/)([^)]+\.(png|jpg|jpeg|gif|webp|svg))\)/gi)]
  for (const [, imgFile] of imgRefs) {
    const imgPath = join(sourceModulePath, imgFile.replace(/\//g, '\\'))
    if (!existsSync(imgPath)) {
      warnings.push(`imagem referenciada não encontrada: ${imgFile}`)
    }
  }

  for (const w of warnings) {
    const msg = `[process] WARN [markdown] ${filename}: ${w}`
    console.warn(msg)
    log(msg)
  }
}

// ── TRANSFORM: reescrita de paths ────────────────────────────────────────────

function rewriteAssetPaths(content, slug) {
  // diags/foo.svg → /modules/visao-estrategia/diags/foo.svg
  content = content.replace(
    /(!?\[[^\]]*\])\((diags\/[^)]+)\)/g,
    (_, prefix, path) => `${prefix}(/modules/${slug}/${assetPath(path)})`
  )
  // image.png → /modules/visao-estrategia/image.png (refs relativas na raiz)
  content = content.replace(
    /(!?\[[^\]]*\])\(((?!https?:\/\/|\/|diags\/)([^)]+\.(png|jpg|jpeg|gif|webp|svg)))\)/gi,
    (_, prefix, path) => `${prefix}(/modules/${slug}/${assetPath(path)})`
  )
  return content
}

// ── Processamento de um arquivo MD ───────────────────────────────────────────

function processMarkdownFile(relPath, docsNotionPath, dryRun, verbose, log) {
  const parts = normalizePath(relPath).split('/')
  const moduleName = parts[0]
  const filename = parts[1]
  const slug = moduleSlug(moduleName)
  const dest = destFilename(filename)
  const sourceModulePath = join(docsNotionPath, moduleName)
  const sourcePath = join(docsNotionPath, moduleName, filename)
  const destDir = join('src', 'content', 'docs', 'generated', slug)
  const destPath = join(destDir, dest)

  const content = readFileSync(sourcePath, 'utf-8')
  const fm = extractFrontmatter(content)

  validateMarkdown(content, sourceModulePath, filename, log)

  const transformed = rewriteAssetPaths(content, slug)

  if (verbose) console.log(`[process] ${relPath} → ${normalizePath(destPath)}`)

  if (!dryRun) {
    mkdirSync(destDir, { recursive: true })
    writeFileSync(destPath, transformed, 'utf-8')
  }

  return {
    relPath: normalizePath(relPath),
    slug,
    dest,
    id: fm.id || null,
    mtime: statSync(sourcePath).mtimeMs,
    sha256: sha256(sourcePath),
  }
}

// ── Processamento de um asset ─────────────────────────────────────────────────

function processAsset(relPath, docsNotionPath, dryRun, verbose, log) {
  const parts = normalizePath(relPath).split('/')
  const moduleName = parts[0]
  const slug = moduleSlug(moduleName)
  const restParts = parts.slice(1)
  const sourcePath = join(docsNotionPath, moduleName, ...restParts)
  const destPath = join('public', 'modules', slug, ...restParts)
  const destDir = dirname(destPath)

  if (verbose) console.log(`[process] asset ${relPath} → ${normalizePath(destPath)}`)

  if (!dryRun) {
    mkdirSync(destDir, { recursive: true })
    copyFileSync(sourcePath, destPath)
  }

  return {
    relPath: normalizePath(relPath),
    mtime: statSync(sourcePath).mtimeMs,
    sha256: sha256(sourcePath),
  }
}

// ── Remoção de arquivos deletados ─────────────────────────────────────────────

function removeDeletedFile(relPath, dryRun, verbose, log) {
  const parts = normalizePath(relPath).split('/')
  const moduleName = parts[0]
  const slug = moduleSlug(moduleName)

  let destPath
  if (relPath.endsWith('-notion.md')) {
    const dest = destFilename(parts[1])
    destPath = join('src', 'content', 'docs', 'generated', slug, dest)
  } else {
    const restParts = parts.slice(1)
    destPath = join('public', 'modules', slug, ...restParts)
  }

  if (existsSync(destPath)) {
    if (verbose) console.log(`[process] remover ${normalizePath(destPath)}`)
    if (!dryRun) rmSync(destPath)
    log(`[process] removido: ${normalizePath(destPath)}`)
  }
}

// ── Carregar e salvar cache ───────────────────────────────────────────────────

function loadCache() {
  const cachePath = 'cache/last-sync.json'
  if (!existsSync(cachePath)) return { version: 1, generatedAt: null, files: {} }
  try {
    const data = JSON.parse(readFileSync(cachePath, 'utf-8'))
    return data.version === 1 ? data : { version: 1, generatedAt: null, files: {} }
  } catch {
    return { version: 1, generatedAt: null, files: {} }
  }
}

function saveCache(cache) {
  mkdirSync('cache', { recursive: true })
  writeFileSync('cache/last-sync.json', JSON.stringify(cache, null, 2), 'utf-8')
}

// ── Função principal exportável ───────────────────────────────────────────────

export function processDocs(diff, docsNotionPath, options = {}) {
  const { dryRun = false, verbose = false, log = () => {} } = options
  const cache = loadCache()
  const updatedFiles = { ...cache.files }

  const toProcess = [...diff.added, ...diff.changed]
  const toProcessAssets = [...diff.assets.added, ...diff.assets.changed]
  const toDelete = [...diff.deleted, ...diff.assets.deleted]

  let copied = 0, removed = 0

  for (const relPath of toProcess) {
    try {
      const result = processMarkdownFile(relPath, docsNotionPath, dryRun, verbose, log)
      updatedFiles[relPath] = { mtime: result.mtime, sha256: result.sha256, id: result.id }
      copied++
    } catch (err) {
      const msg = `[process] ERRO ao processar ${relPath}: ${err.message}`
      console.error(msg)
      log(msg)
    }
  }

  for (const relPath of toProcessAssets) {
    try {
      const result = processAsset(relPath, docsNotionPath, dryRun, verbose, log)
      updatedFiles[relPath] = { mtime: result.mtime, sha256: result.sha256 }
      copied++
    } catch (err) {
      const msg = `[process] ERRO ao copiar asset ${relPath}: ${err.message}`
      console.error(msg)
      log(msg)
    }
  }

  for (const relPath of toDelete) {
    removeDeletedFile(relPath, dryRun, verbose, log)
    delete updatedFiles[relPath]
    removed++
  }

  if (!dryRun) {
    saveCache({
      version: 1,
      generatedAt: new Date().toISOString(),
      files: updatedFiles,
    })
  }

  return { copied, removed }
}

// ── Execução standalone ───────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  const { detectChanges } = await import('./detect-changes.mjs')
  const docsNotionPath = process.env.DOCS_NOTION_PATH

  if (!docsNotionPath || !existsSync(docsNotionPath)) {
    console.error('[process] ERRO: DOCS_NOTION_PATH não definido ou não existe')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')

  const diff = detectChanges(docsNotionPath)
  const total = diff.added.length + diff.changed.length + diff.deleted.length +
    diff.assets.added.length + diff.assets.changed.length + diff.assets.deleted.length

  if (total === 0) {
    console.log('[process] Nenhuma mudança para processar.')
    process.exit(0)
  }

  if (dryRun) console.log('[process] DRY RUN — nenhum arquivo será modificado\n')

  const { copied, removed } = processDocs(diff, docsNotionPath, { dryRun, verbose })

  if (dryRun) {
    console.log(`\n[process] DRY RUN: ${copied} arquivo(s) seriam copiados, ${removed} removidos`)
  } else {
    console.log(`[process] ${copied} arquivo(s) copiados, ${removed} removidos`)
  }
}
