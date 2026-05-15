# NexusDocs AI — Sync Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o pipeline modular de sincronização docs-notion → NexusDocs AI com 4 scripts ESM, sidebar dinâmico, detecção incremental por SHA-256 e suporte a dry-run/verbose/lockfile.

**Architecture:** O orquestrador `sync-docs.mjs` chama `detect-changes.mjs` → `process-docs.mjs` → `generate-sidebar.mjs` em sequência. Cada script também é executável isoladamente. O `astro.config.mjs` lê `cache/generated-sidebar.json` em vez de sidebar hardcoded.

**Tech Stack:** Node.js 24 ESM, `--env-file=.env` nativo (zero deps novas), `crypto` SHA-256, `fs`/`path`/`child_process` built-in, Astro 4 + Starlight.

---

## Task 1: Scaffolding — diretórios, .gitignore, .env.example, package.json

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `cache/.gitkeep`
- Create: `logs/.gitkeep`
- Create: `src/content/docs/manual/.gitkeep`
- Create: `src/content/docs/generated/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p scripts cache logs src/content/docs/manual src/content/docs/generated public/modules
```

- [ ] **Step 2: Criar arquivos .gitkeep para manter dirs no Git**

```bash
touch cache/.gitkeep logs/.gitkeep src/content/docs/manual/.gitkeep src/content/docs/generated/.gitkeep
```

- [ ] **Step 3: Atualizar .gitignore**

Adicionar ao final do `.gitignore` existente:

```
# NexusDocs sync pipeline
cache/generated-sidebar.json
cache/sync.lock
cache/last-sync.json
logs/sync.log
logs/errors.log
src/content/docs/generated/
public/modules/
.env
```

(Remover `.env` da linha existente se já estiver lá — consolidar numa só.)

- [ ] **Step 4: Criar .env.example**

Criar `/.env.example`:

```
# Caminho absoluto para o repositório docs-notion
# Windows: use barras normais ou barras duplas invertidas
DOCS_NOTION_PATH=C:/Projetos/TomikOS/docs-notion

# Fallback opcional — usado se DOCS_NOTION_PATH não existir
# DOCS_NOTION_FALLBACK=./docs-notion
```

- [ ] **Step 5: Atualizar package.json com os novos scripts**

Substituir a seção `"scripts"` no `package.json`:

```json
"scripts": {
  "sync-docs":         "node --env-file=.env scripts/sync-docs.mjs",
  "sync-docs:pull":    "node --env-file=.env scripts/sync-docs.mjs --pull",
  "sync-docs:dry":     "node --env-file=.env scripts/sync-docs.mjs --dry-run",
  "sync-docs:verbose": "node --env-file=.env scripts/sync-docs.mjs --verbose",
  "sync-docs:detect":  "node --env-file=.env scripts/detect-changes.mjs",
  "sync-docs:process": "node --env-file=.env scripts/process-docs.mjs",
  "sync-docs:sidebar": "node --env-file=.env scripts/generate-sidebar.mjs",
  "dev":               "astro dev",
  "dev:sync":          "npm run sync-docs && astro dev",
  "start":             "astro dev",
  "build":             "npm run sync-docs && astro build",
  "preview":           "astro preview",
  "astro":             "astro"
}
```

- [ ] **Step 6: Criar .env local (não commitado)**

Criar `/.env`:

```
DOCS_NOTION_PATH=C:/Projetos/TomikOS/docs-notion
```

- [ ] **Step 7: Verificar estrutura criada**

```bash
ls cache/ logs/ src/content/docs/ scripts/
```

Esperado: `cache/`, `logs/`, `manual/`, `generated/` visíveis. `scripts/` ainda vazio.

- [ ] **Step 8: Commit**

```bash
git add .gitignore .env.example cache/.gitkeep logs/.gitkeep src/content/docs/manual/.gitkeep src/content/docs/generated/.gitkeep package.json
git commit -m "feat: scaffolding do pipeline sync-docs — dirs, .gitignore, scripts npm"
```

---

## Task 2: src/config/modules.ts — tipos e overrides manuais

**Files:**
- Create: `src/config/modules.ts`

- [ ] **Step 1: Criar modules.ts com tipo e config inicial**

Criar `src/config/modules.ts`:

```ts
export interface ModuleOverride {
  label?: string
  order?: number
  icon?: string
  hidden?: boolean
  category?: string
}

export const moduleConfig: Record<string, ModuleOverride> = {
  'modulo-visao-estrategia': {
    label: 'Visão e Estratégia',
    order: 1,
    icon: 'open-book',
  },
  'modulo-arquitetura': {
    label: 'Arquitetura',
    order: 2,
    icon: 'puzzle',
  },
  'modulo-feature': {
    label: 'Features',
    order: 3,
    icon: 'rocket',
  },
  'modulo-produto': {
    label: 'Produto',
    order: 4,
    icon: 'laptop',
  },
  'modulo-governanca': {
    label: 'Governança',
    order: 5,
    icon: 'setting',
  },
  'modulo-guide': {
    label: 'Guias',
    order: 6,
    icon: 'document',
  },
  'modulo-relacionamentos': {
    label: 'Relacionamentos',
    order: 7,
    icon: 'forward-slash',
  },
}
```

- [ ] **Step 2: Verificar que o TypeScript aceita o arquivo**

```bash
npx astro check 2>&1 | head -20
```

Esperado: sem erros no novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/config/modules.ts
git commit -m "feat: modules.ts — overrides manuais de label/order/icon para sidebar"
```

---

## Task 3: scripts/detect-changes.mjs — detecção incremental SHA-256

**Files:**
- Create: `scripts/detect-changes.mjs`

- [ ] **Step 1: Criar detect-changes.mjs**

Criar `scripts/detect-changes.mjs`:

```js
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
```

- [ ] **Step 2: Rodar standalone e verificar output**

```bash
npm run sync-docs:detect
```

Esperado: lista de todos os arquivos `-notion.md` como `+` (adicionados, pois cache está vazio).

Exemplo de output:
```
[detect]  + modulo-visao-estrategia/01-MISSAO-VISAO-notion.md  (adicionado)
[detect]  + modulo-arquitetura/14-01-VISAO-GERAL-ARQUITETURA-DADOS-notion.md  (adicionado)
...
```

- [ ] **Step 3: Rodar uma segunda vez (sem cache ainda) e confirmar consistência**

```bash
npm run sync-docs:detect
```

Esperado: mesma lista (cache ainda não foi escrito, tudo ainda aparece como adicionado).

- [ ] **Step 4: Commit**

```bash
git add scripts/detect-changes.mjs
git commit -m "feat: detect-changes.mjs — detecção incremental SHA-256 + mtime"
```

---

## Task 4: scripts/process-docs.mjs — NORMALIZE → VALIDATE → TRANSFORM

**Files:**
- Create: `scripts/process-docs.mjs`

- [ ] **Step 1: Criar process-docs.mjs**

Criar `scripts/process-docs.mjs`:

```js
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
```

- [ ] **Step 2: Rodar em dry-run e verificar output**

```bash
npm run sync-docs:process -- --dry-run --verbose
```

Esperado: listagem de todos os arquivos que seriam copiados, sem criar nada em `src/content/docs/generated/`.

- [ ] **Step 3: Rodar sem dry-run e verificar arquivos criados**

```bash
npm run sync-docs:process -- --verbose
```

Verificar:
```bash
ls src/content/docs/generated/
```

Esperado: pastas `visao-estrategia/`, `arquitetura/`, `feature/`, etc. com arquivos `.md` (sem sufixo `-notion`).

- [ ] **Step 4: Verificar que assets foram copiados**

```bash
ls public/modules/
```

Esperado: pastas por slug com subpastas `diags/`.

- [ ] **Step 5: Verificar conteúdo de um arquivo — paths reescritos**

```bash
grep -n "diags/" "src/content/docs/generated/visao-estrategia/01-MISSAO-VISAO.md" | head -5
```

Esperado: todos os paths `diags/` reescritos para `/modules/visao-estrategia/diags/...`.

- [ ] **Step 6: Verificar cache atualizado**

```bash
cat cache/last-sync.json | head -20
```

Esperado: JSON com `version: 1`, `generatedAt` e entradas de arquivos com `mtime` e `sha256`.

- [ ] **Step 7: Rodar detect-changes novamente (deve retornar zero mudanças)**

```bash
npm run sync-docs:detect
```

Esperado: `Nenhuma mudança detectada.`

- [ ] **Step 8: Commit**

```bash
git add scripts/process-docs.mjs
git commit -m "feat: process-docs.mjs — NORMALIZE/VALIDATE/TRANSFORM com dry-run e reescrita de paths"
```

---

## Task 5: scripts/generate-sidebar.mjs — sidebar dinâmico via auto-discovery

**Files:**
- Create: `scripts/generate-sidebar.mjs`

- [ ] **Step 1: Criar generate-sidebar.mjs**

Criar `scripts/generate-sidebar.mjs`:

```js
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

// Lê moduleConfig do modules.ts via JSON estático (sem importar TS)
// Usa uma leitura simplificada — o modules.ts exporta objeto literal
function readModuleConfig() {
  const configPath = 'src/config/modules.ts'
  if (!existsSync(configPath)) return {}
  // Importar modules.ts direto não funciona em .mjs sem transpiler
  // Strategy: usar um módulo JSON auxiliar gerado pelo TypeScript via astro
  // Para V1: o modules.ts é transformado em um objeto via eval controlado
  // Alternativa mais segura V1: duplicar a config num modules.json
  // Decisão: ler modules.ts com regex para extrair o objeto
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

    // Resolução: module.json > modules.ts > auto-gerado
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
```

- [ ] **Step 2: Rodar standalone**

```bash
npm run sync-docs:sidebar -- --verbose
```

Esperado: listagem dos módulos com suas páginas e arquivo `cache/generated-sidebar.json` criado.

- [ ] **Step 3: Inspecionar o JSON gerado**

```bash
cat cache/generated-sidebar.json
```

Esperado: array com seções tendo `label`, `items` (cada item com `label` e `link`). Labels legíveis como `"Missão e Visão"`, não `"01-MISSAO-VISAO"`.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-sidebar.mjs
git commit -m "feat: generate-sidebar.mjs — auto-discovery de módulos + overrides modules.ts"
```

---

## Task 6: scripts/sync-docs.mjs — orquestrador com lockfile e logs

**Files:**
- Create: `scripts/sync-docs.mjs`

- [ ] **Step 1: Criar sync-docs.mjs**

Criar `scripts/sync-docs.mjs`:

```js
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
```

- [ ] **Step 2: Testar dry-run completo**

```bash
npm run sync-docs:dry
```

Esperado: output completo do pipeline sem modificar arquivos. Cache não deve ser atualizado.

- [ ] **Step 3: Testar sync completo**

Apagar cache para forçar full sync:
```bash
rm -f cache/last-sync.json
```

```bash
npm run sync-docs
```

Esperado: output completo, arquivos criados, `logs/sync.log` escrito.

- [ ] **Step 4: Verificar logs**

```bash
cat logs/sync.log | head -30
```

Esperado: log com timestamps de todas as operações.

- [ ] **Step 5: Testar lockfile**

Criar lock manual e tentar rodar:
```bash
echo "test" > cache/sync.lock
npm run sync-docs
```

Esperado: erro `Sync já em execução`. Limpar o lock:
```bash
rm cache/sync.lock
```

- [ ] **Step 6: Testar --verbose**

```bash
npm run sync-docs:verbose
```

Esperado: cada arquivo listado individualmente com source → destino.

- [ ] **Step 7: Commit**

```bash
git add scripts/sync-docs.mjs
git commit -m "feat: sync-docs.mjs — orquestrador com lockfile, logs e flags --pull/--dry-run/--verbose"
```

---

## Task 7: astro.config.mjs — sidebar dinâmico via generated-sidebar.json

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Verificar que generated-sidebar.json existe**

```bash
cat cache/generated-sidebar.json | head -10
```

Se não existir, rodar:
```bash
npm run sync-docs
```

- [ ] **Step 2: Atualizar astro.config.mjs**

Substituir o bloco do `sidebar` em `astro.config.mjs`. Adicionar as imports no topo e substituir a array hardcoded:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { brand } from './src/config/brand.ts';
import { readFileSync, existsSync } from 'fs';

const { colors } = brand;

// Lê o sidebar gerado pelo pipeline. Fallback vazio se ainda não existir.
const generatedSidebar = existsSync('./cache/generated-sidebar.json')
  ? JSON.parse(readFileSync('./cache/generated-sidebar.json', 'utf-8'))
  : []

export default defineConfig({
  integrations: [
    starlight({
      title: brand.name,
      description: brand.description,
      defaultLocale: 'root',
      locales: {
        root: { label: 'Português', lang: 'pt-BR' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: brand.github },
      ],
      head: [
        {
          tag: 'style',
          content: `
            :root {
              --accent:  ${colors.accent};
              --bg:      ${colors.bg};
              --surface: ${colors.surface};
              --card:    ${colors.card};
              --border:  ${colors.border};
              --text:    ${colors.text};
              --muted:   ${colors.muted};
            }
          `,
        },
      ],
      customCss: [
        'starlight-theme-obsidian/styles/layers.css',
        'starlight-theme-obsidian/styles/theme.css',
        'starlight-theme-obsidian/styles/centered-reading.css',
        'starlight-theme-obsidian/styles/common.css',
        './src/styles/global.css',
        './src/styles/custom.css',
      ],
      components: {
        Hero: './src/components/overrides/Hero.astro',
        SiteTitle: './src/components/overrides/SiteTitle.astro',
        PageFrame: 'starlight-theme-obsidian/overrides/PageFrame.astro',
        Sidebar: 'starlight-theme-obsidian/overrides/Sidebar.astro',
        Pagination: 'starlight-theme-obsidian/overrides/Pagination.astro',
        ThemeSelect: 'starlight-theme-obsidian/overrides/ThemeSelect.astro',
      },
      sidebar: generatedSidebar,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Rodar astro check para validar a config**

```bash
npx astro check 2>&1 | tail -5
```

Esperado: sem erros críticos.

- [ ] **Step 4: Iniciar o dev server e verificar sidebar**

```bash
npm run dev
```

Abrir `http://localhost:4321` e verificar que:
- Sidebar exibe os módulos do docs-notion (Visão e Estratégia, Arquitetura, etc.)
- Cada seção tem as páginas como subítens clicáveis
- Nenhum erro 404 ao clicar

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: astro.config lê sidebar dinâmico do cache/generated-sidebar.json"
```

---

## Task 8: Migrar páginas existentes para manual/ e verificar primeiro build completo

**Files:**
- Move: `src/content/docs/visao-geral/` → `src/content/docs/manual/visao-geral/`
- Move: `src/content/docs/arquitetura/` → `src/content/docs/manual/arquitetura/`
- Move: `src/content/docs/ai-agents/` → `src/content/docs/manual/ai-agents/`
- Move: `src/content/docs/produto/` → `src/content/docs/manual/produto/`
- Move: `src/content/docs/governanca/` → `src/content/docs/manual/governanca/`
- Move: `src/content/docs/api-reference/` → `src/content/docs/manual/api-reference/`
- Move: `src/content/docs/workflows/` → `src/content/docs/manual/workflows/`
- Keep: `src/content/docs/index.mdx` (homepage permanece na raiz)

- [ ] **Step 1: Mover os stubs para manual/**

```bash
mv src/content/docs/visao-geral  src/content/docs/manual/
mv src/content/docs/arquitetura  src/content/docs/manual/
mv src/content/docs/ai-agents    src/content/docs/manual/
mv src/content/docs/produto      src/content/docs/manual/
mv src/content/docs/governanca   src/content/docs/manual/
mv src/content/docs/api-reference src/content/docs/manual/
mv src/content/docs/workflows    src/content/docs/manual/
```

- [ ] **Step 2: Verificar estrutura final**

```bash
ls src/content/docs/
ls src/content/docs/manual/
ls src/content/docs/generated/
```

Esperado:
```
src/content/docs/
├── index.mdx
├── manual/
│   ├── visao-geral/
│   ├── arquitetura/
│   └── ...
└── generated/
    ├── visao-estrategia/
    ├── arquitetura/
    └── ...
```

- [ ] **Step 3: Rodar build completo**

```bash
npm run build
```

Esperado: build concluído sem erros. O pipeline roda sync antes do build.

- [ ] **Step 4: Verificar o site compilado**

```bash
npm run preview
```

Abrir `http://localhost:4321` e verificar:
- Sidebar com os módulos do docs-notion
- Conteúdo das páginas renderizando corretamente
- Imagens/SVGs carregando de `/modules/{slug}/diags/`
- Sem erros no console do browser

- [ ] **Step 5: Testar `dev:sync` (sync + dev em sequência)**

```bash
npm run dev:sync
```

Esperado: pipeline roda, depois dev server sobe com sidebar atualizado.

- [ ] **Step 6: Commit final**

```bash
git add src/content/docs/manual/ src/content/docs/generated/
git add -u  # captura os moves
git commit -m "feat: migrar stubs para manual/ — pipeline docs-notion ativo e funcionando"
```

---

## Self-Review — Cobertura do spec

| Requisito | Task |
|---|---|
| Sync manual via `npm run sync-docs` | Task 6 |
| git pull opcional via `--pull` | Task 6 |
| Detecção de mudanças com SHA-256 + mtime | Task 3 |
| Processamento incremental | Task 4 |
| Cópia de assets com paths corrigidos | Task 4 |
| Sidebar dinâmico via auto-discovery + overrides | Task 5 |
| Dry-run com diff visual | Tasks 4, 6 |
| Modo verbose para debug | Tasks 4, 5, 6 |
| Lockfile anti-concorrência | Task 6 |
| Logs persistentes (sync.log + errors.log) | Task 6 |
| Validação markdown não-bloqueante | Task 4 |
| Separação manual/ vs generated/ | Tasks 1, 8 |
| Normalização Windows/Linux de paths | Tasks 3, 4, 5 |
| Arquitetura preparada para fingerprinting (V2) | Task 4 (`assetPath`) |
| Pipeline stages INGEST→PUBLISH | Tasks 3, 4, 5, 6 |
| IDs estáveis via frontmatter | Task 4 (`extractFrontmatter`) |
| Leitura de module.json por módulo | Task 5 (`readModuleJson`) |
| Zero dependências pagas ou externas | Tasks 1-8 (Node built-ins only) |
| `.env` com `--env-file` nativo | Tasks 1, 6 |
| Fallback `DOCS_NOTION_FALLBACK` | Task 6 |
| Erro amigável se path inválido | Task 6 |
| scripts executáveis isoladamente | Tasks 3, 4, 5 |
