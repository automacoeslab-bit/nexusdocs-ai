import { existsSync, writeFileSync, rmSync, mkdirSync, appendFileSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const LOCK_FILE = 'cache/sync.lock'
const LOG_FILE = 'logs/sync.log'
const ERROR_LOG = 'logs/errors.log'

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const flags = {
  pull: args.includes('--pull'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
}

// ── Logging ───────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function log(msg) {
  console.log(msg)
  try {
    mkdirSync('logs', { recursive: true })
    appendFileSync(LOG_FILE, `${timestamp()} ${msg}\n`, 'utf-8')
  } catch {}
}

function logError(msg) {
  console.error(msg)
  try {
    mkdirSync('logs', { recursive: true })
    appendFileSync(ERROR_LOG, `${timestamp()} ${msg}\n`, 'utf-8')
    appendFileSync(LOG_FILE, `${timestamp()} ${msg}\n`, 'utf-8')
  } catch {}
}

// ── Lockfile ──────────────────────────────────────────────────────────────────

function acquireLock() {
  mkdirSync('cache', { recursive: true })
  if (existsSync(LOCK_FILE)) {
    logError('[NexusDocs Sync] ERRO: Sync já em execução (ou travou).')
    logError('                 Delete cache/sync.lock para continuar.')
    process.exit(1)
  }
  writeFileSync(LOCK_FILE, timestamp(), 'utf-8')
}

function releaseLock() {
  if (existsSync(LOCK_FILE)) rmSync(LOCK_FILE)
}

// ── Validação do path ─────────────────────────────────────────────────────────

function resolveDocsPath() {
  const primary = process.env.DOCS_NOTION_PATH
  const fallback = process.env.DOCS_NOTION_FALLBACK

  if (primary && existsSync(primary)) {
    return primary.replace(/\\/g, '/')
  }

  if (primary && !existsSync(primary)) {
    logError(`[NexusDocs Sync] ERRO: DOCS_NOTION_PATH não encontrado: ${primary}`)
    if (fallback && existsSync(fallback)) {
      log(`[NexusDocs Sync] WARN: usando fallback: ${fallback}`)
      return fallback.replace(/\\/g, '/')
    }
  }

  if (fallback && existsSync(fallback)) {
    log(`[NexusDocs Sync] WARN: usando fallback: ${fallback}`)
    return fallback.replace(/\\/g, '/')
  }

  logError('[NexusDocs Sync] ERRO: Nenhum caminho válido encontrado.')
  logError('                 Configure DOCS_NOTION_PATH no arquivo .env')
  process.exit(1)
}

// ── Git pull opcional ─────────────────────────────────────────────────────────

function gitPull(docsNotionPath) {
  log('[NexusDocs Sync] Executando git pull...')
  try {
    const output = execSync('git pull', {
      cwd: docsNotionPath,
      encoding: 'utf-8',
      timeout: 30000,
    })
    log(`[NexusDocs Sync] git pull: ${output.trim()}`)
  } catch (err) {
    logError(`[NexusDocs Sync] WARN: git pull falhou — continuando com estado local`)
    logError(`[NexusDocs Sync] Detalhe: ${err.message}`)
  }
}

// ── Pipeline principal ────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()
  const docsNotionPath = resolveDocsPath()

  log(`\n[NexusDocs Sync] ${timestamp()}`)
  log(`[NexusDocs Sync] Source: ${docsNotionPath} ✓`)
  if (flags.dryRun) log('[NexusDocs Sync] DRY RUN — nenhum arquivo será modificado\n')

  acquireLock()

  try {
    // 1. Git pull (opcional)
    if (flags.pull) gitPull(docsNotionPath)

    // 2. Detect changes
    log('\n[detect]  Verificando mudanças...')
    const { detectChanges } = await import('./detect-changes.mjs')
    const diff = detectChanges(docsNotionPath)

    const totalMd = diff.added.length + diff.changed.length + diff.deleted.length
    const totalAssets = diff.assets.added.length + diff.assets.changed.length + diff.assets.deleted.length

    for (const f of diff.added)          log(`[detect]  + ${f}  (adicionado)`)
    for (const f of diff.changed)        log(`[detect]  ~ ${f}  (alterado)`)
    for (const f of diff.deleted)        log(`[detect]  - ${f}  (removido)`)
    for (const f of diff.assets.added)   log(`[detect]  + ${f}  (asset adicionado)`)
    for (const f of diff.assets.changed) log(`[detect]  ~ ${f}  (asset alterado)`)
    for (const f of diff.assets.deleted) log(`[detect]  - ${f}  (asset removido)`)

    if (totalMd + totalAssets === 0) {
      log('[detect]  Nenhuma mudança detectada.')
    }

    // 3. Process docs
    if (totalMd + totalAssets > 0) {
      const { processDocs } = await import('./process-docs.mjs')
      const { copied, removed } = processDocs(diff, docsNotionPath, {
        dryRun: flags.dryRun,
        verbose: flags.verbose,
        log: (msg) => appendFileSync(LOG_FILE, `${timestamp()} ${msg}\n`, 'utf-8'),
      })
      if (flags.dryRun) {
        log(`\n[process] DRY RUN: ${copied} arquivo(s) seriam copiados, ${removed} removidos`)
      } else {
        log(`\n[process] ${copied} arquivo(s) copiados, ${removed} removidos`)
      }
    }

    // 4. Generate sidebar
    const { generateSidebar } = await import('./generate-sidebar.mjs')
    const sidebar = generateSidebar(docsNotionPath, flags.verbose)
    log(`[sidebar] ${sidebar.length} módulos detectados → sidebar gerado com ${sidebar.length} seções`)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    log(`\n[NexusDocs Sync] Concluído em ${elapsed}s${flags.dryRun ? ' (dry-run)' : ''}`)

  } finally {
    releaseLock()
  }
}

main().catch(err => {
  logError(`[NexusDocs Sync] ERRO FATAL: ${err.message}`)
  releaseLock()
  process.exit(1)
})
