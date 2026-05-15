# NexusDocs AI — Sync Pipeline Design
**Data:** 2026-05-14
**Status:** Aprovado

---

## Objetivo

Transformar o NexusDocs AI em uma plataforma docs-as-code baseada em sincronização Git. O repositório `docs-notion` é a fonte oficial de conteúdo (CMS Git-based). O NexusDocs AI é a camada de processamento e apresentação.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Conteúdo | `docs-notion` (GitHub) |
| Pipeline | Node.js ESM scripts |
| Hashing | SHA-256 via `crypto` nativo |
| Apresentação | Astro 4 + Starlight |
| Config | `.env` + `src/config/modules.ts` |

Zero dependências pagas. Zero APIs externas. Compatibilidade Windows-first com normalização para Linux/CI.

---

## Arquitetura de Pastas

```
nexusdocs-ai/
├── .env                              ← DOCS_NOTION_PATH=...
├── .env.example                      ← template commitado
│
├── scripts/
│   ├── sync-docs.mjs                 ← orquestrador principal
│   ├── detect-changes.mjs            ← detector de mudanças (SHA-256 + mtime)
│   ├── process-docs.mjs              ← processador de arquivos + assets
│   └── generate-sidebar.mjs          ← gerador de sidebar dinâmico
│
├── cache/
│   ├── last-sync.json                ← estado de sync com versionamento interno
│   ├── generated-sidebar.json        ← artefato de build (gitignored)
│   └── sync.lock                     ← anti-concorrência (transitório)
│
├── logs/
│   ├── sync.log                      ← todas as operações com timestamp (append)
│   └── errors.log                    ← erros e warnings (append)
│
├── src/
│   ├── config/
│   │   └── modules.ts                ← overrides manuais (label, order, icon, hidden)
│   │
│   └── content/docs/
│       ├── manual/                   ← páginas editadas manualmente (não tocadas pelo pipeline)
│       └── generated/                ← 100% controlado pelo pipeline
│           ├── visao-estrategia/
│           ├── arquitetura/
│           └── ...
│
└── public/
    └── modules/
        ├── visao-estrategia/
        │   └── diags/
        ├── arquitetura/
        │   └── diags/
        └── ...
```

---

## Fluxo de Dados

```
npm run sync-docs [--pull] [--dry-run] [--verbose]
        │
        ▼
sync-docs.mjs  (orquestrador)
  │
  ├─ 1. Valida DOCS_NOTION_PATH
  │       ├─ existe? → ok
  │       ├─ fallback para DOCS_NOTION_FALLBACK → warn
  │       └─ nem um nem outro → erro amigável + exit 1
  │
  ├─ 2. Cria cache/sync.lock
  │       └─ se já existir → "Sync já em execução. Delete cache/sync.lock se travou."
  │
  ├─ 3. [--pull] git pull (opcional)
  │       └─ falha → WARN nos logs, continua com estado local
  │
  ├─ 4. detect-changes.mjs
  │       ├─ lê cache/last-sync.json (versão 1)
  │       ├─ varre docs-notion: *-notion.md + diags/ + imagens
  │       ├─ compara mtime (rápido) → SHA-256 (confirma se mtime mudou)
  │       └─ retorna: { changed[], added[], deleted[], assets{} }
  │
  ├─ 5. process-docs.mjs (recebe diff)
  │       ├─ [--dry-run] → exibe diff sem escrever nada
  │       ├─ copia *-notion.md → src/content/docs/generated/{slug}/
  │       │     └─ remove sufixo "-notion" do nome: 01-MISSAO-VISAO-notion.md → 01-MISSAO-VISAO.md
  │       ├─ copia diags/ → public/modules/{slug}/diags/
  │       ├─ reescreve paths relativos no markdown
  │       │     ex: diags/foo.svg → /modules/visao-estrategia/diags/foo.svg
  │       ├─ remove arquivos deletados do destino
  │       ├─ validação não-bloqueante (WARN [markdown]):
  │       │     frontmatter quebrado, links relativos inválidos,
  │       │     imagens referenciadas mas não sincronizadas
  │       └─ atualiza cache/last-sync.json
  │
  ├─ 6. generate-sidebar.mjs
  │       ├─ auto-descobre pastas modulo-* no docs-notion
  │       ├─ lê src/config/modules.ts (overrides de label, order, icon, hidden)
  │       ├─ novos módulos aparecem automaticamente sem editar código
  │       └─ escreve cache/generated-sidebar.json
  │
  └─ 7. Remove cache/sync.lock
         └─ também removido em caso de erro (try/finally)
```

---

## Mapeamentos

### Módulo → Slug

| Pasta no docs-notion | Slug no Starlight |
|---|---|
| `modulo-visao-estrategia` | `visao-estrategia` |
| `modulo-arquitetura` | `arquitetura` |
| `modulo-feature` | `feature` |
| `modulo-produto` | `produto` |

Regra: remove prefixo `modulo-`, mantém kebab-case.

### Arquivo → Destino

```
[docs-notion]/modulo-visao-estrategia/01-MISSAO-VISAO-notion.md
  → src/content/docs/generated/visao-estrategia/01-MISSAO-VISAO.md

[docs-notion]/modulo-visao-estrategia/diags/diag-01-conceito-central.svg
  → public/modules/visao-estrategia/diags/diag-01-conceito-central.svg
```

### Arquivos ignorados pelo pipeline

- Arquivos sem sufixo `-notion.md` (monolíticos do ClickUp)
- `*.json` auxiliares (exceto manifests futuramente suportados)
- Arquivos temporários (`*.tmp`, `~*`, `.DS_Store`)

---

## Contratos de cada script

### `detect-changes.mjs`

```js
// Saída (stdout JSON ou retorno direto ao orquestrador):
{
  changed: ["modulo-visao-estrategia/01-MISSAO-VISAO-notion.md"],
  added:   ["modulo-arquitetura/15-01-A-PLATAFORMA-notion.md"],
  deleted: ["modulo-feature/03-FEATURE-AGENT-RUNTIME-notion.md"],
  assets: {
    changed: [...],
    added:   [...],
    deleted: [...]
  }
}
```

### `process-docs.mjs`

Flags suportadas: `--dry-run`, `--verbose`, `--only=modulo-arquitetura`

Comportamento de assets:
- Caminhos sempre normalizados para `/` (forward slash)
- Fingerprinting de asset: arquitetura preparada para `diag.a1b2c3.svg` na V2 (função `assetPath(file, options)` com `{ fingerprint: false }` por padrão)

### `generate-sidebar.mjs`

**Label das páginas:** extraído do primeiro H1 encontrado no arquivo `.md` gerado (ex: `# 🚀 TomikCRM — Missão e Visão` → label `"Missão e Visão"`). Fallback: filename humanizado removendo número prefixo e hífens (`01-MISSAO-VISAO` → `"MISSAO VISAO"`).

**Label das seções:** vem de `modules.ts` se definido, ou do slug humanizado (`visao-estrategia` → `"Visao Estrategia"`) como fallback.

Formato de saída (`cache/generated-sidebar.json`):
```json
[
  {
    "label": "Visão e Estratégia",
    "order": 1,
    "icon": "compass",
    "items": [
      { "label": "Missão e Visão", "link": "/generated/visao-estrategia/01-MISSAO-VISAO" },
      { "label": "Pilares Estratégicos", "link": "/generated/visao-estrategia/02-PILARES-ESTRATEGICOS" }
    ]
  }
]
```

`astro.config.mjs` lê via `fs.readFileSync` + `JSON.parse`, com fallback para `[]` se arquivo não existir (primeiro run):
```js
import { readFileSync, existsSync } from 'fs'
const sidebar = existsSync('./cache/generated-sidebar.json')
  ? JSON.parse(readFileSync('./cache/generated-sidebar.json', 'utf-8'))
  : []
```

### `src/config/modules.ts` (overrides manuais)

```ts
export const moduleConfig: Record<string, ModuleOverride> = {
  "modulo-visao-estrategia": {
    label: "Visão e Estratégia",
    order: 1,
    icon: "compass",
    hidden: false
  },
  "modulo-arquitetura": {
    label: "Arquitetura",
    order: 2,
    icon: "blocks"
  }
  // módulos sem entrada aqui → auto-gerados com label e ordem padrão
}
```

---

## `cache/last-sync.json` — estrutura versionada

```json
{
  "version": 1,
  "generatedAt": "2026-05-14T10:30:00.000Z",
  "files": {
    "modulo-visao-estrategia/01-MISSAO-VISAO-notion.md": {
      "mtime": 1747212600000,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  }
}
```

Ao ler o cache, se `version !== 1` → invalida e recalcula tudo (full resync).

---

## Normalização de paths

Todos os paths internos são normalizados para forward slash (`/`) imediatamente após leitura do filesystem. Função utilitária compartilhada entre scripts:

```js
const normalizePath = (p) => p.replace(/\\/g, '/')
```

---

## `cache/sync.lock` — anti-concorrência

- Criado no início do sync com `fs.writeFileSync`
- Removido em `try/finally` (garante remoção mesmo em crash)
- Se existir ao iniciar:
  ```
  [ERROR] Sync já em execução (ou travou).
          Delete cache/sync.lock para continuar.
  ```

---

## npm scripts

```json
{
  "scripts": {
    "sync-docs":         "node scripts/sync-docs.mjs",
    "sync-docs:pull":    "node scripts/sync-docs.mjs --pull",
    "sync-docs:dry":     "node scripts/sync-docs.mjs --dry-run",
    "sync-docs:verbose": "node scripts/sync-docs.mjs --verbose",
    "sync-docs:detect":  "node scripts/detect-changes.mjs",
    "sync-docs:process": "node scripts/process-docs.mjs",
    "sync-docs:sidebar": "node scripts/generate-sidebar.mjs",
    "dev":               "astro dev",
    "dev:sync":          "npm run sync-docs && astro dev",
    "start":             "astro dev",
    "build":             "npm run sync-docs && astro build",
    "preview":           "astro preview"
  }
}
```

---

## `.env.example` (commitado)

```
# Caminho absoluto para o repositório docs-notion
DOCS_NOTION_PATH=C:\Projetos\TomikOS\docs-notion

# Fallback opcional se DOCS_NOTION_PATH não existir
# DOCS_NOTION_FALLBACK=./docs-notion
```

---

## Saída do terminal

```
[NexusDocs Sync] 2026-05-14 10:30:00
[NexusDocs Sync] Source: C:\Projetos\TomikOS\docs-notion ✓
[NexusDocs Sync] DRY RUN — nenhum arquivo será modificado

[detect]  Verificando mudanças...
[detect]  + modulo-arquitetura/15-01-A-PLATAFORMA-notion.md     (adicionado)
[detect]  ~ modulo-visao-estrategia/01-MISSAO-VISAO-notion.md   (alterado)
[detect]  - modulo-feature/03-FEATURE-AGENT-RUNTIME-notion.md   (removido)

[process] DRY RUN: 2 arquivos seriam copiados, 1 removido
[process] WARN [markdown] modulo-arquitetura/15-01-A-PLATAFORMA-notion.md: imagem referenciada não encontrada: diags/missing.svg

[sidebar] 6 módulos detectados → sidebar gerado com 6 seções

[NexusDocs Sync] Concluído em 0.4s (dry-run)
```

---

## Separação de camadas

| Camada | Repositório | Responsabilidade |
|--------|------------|-----------------|
| Conteúdo | `docs-notion` | Fonte de verdade, editada pela equipe |
| Pipeline | `nexusdocs-ai/scripts/` | Sync, detecção, processamento |
| Config | `nexusdocs-ai/src/config/modules.ts` | Overrides de navegação |
| Apresentação | `nexusdocs-ai` Starlight | Renderização final |

Cada camada pode evoluir independentemente. Trocar Starlight por outra ferramenta não afeta o conteúdo. Trocar o pipeline não afeta a apresentação.

---

## V2 — Preparação para GitHub Actions (sem implementar agora)

O design já suporta evolução direta:

```yaml
# .github/workflows/sync.yml (futuro)
on:
  repository_dispatch:
    types: [docs-notion-push]
jobs:
  sync:
    steps:
      - run: npm run sync-docs:pull
      - run: npm run build
```

O `--pull` flag, o lockfile e os logs persistentes já estão preparados para esse uso.

---

## Requisitos da V1 (escopo desta implementação)

- [x] Sync manual via `npm run sync-docs`
- [x] git pull opcional via `--pull`
- [x] Detecção de mudanças com SHA-256 + mtime
- [x] Processamento incremental (só arquivos alterados)
- [x] Cópia de assets com paths corrigidos
- [x] Sidebar dinâmico via auto-discovery + overrides
- [x] Dry-run com diff visual
- [x] Modo verbose para debug
- [x] Lockfile anti-concorrência
- [x] Logs persistentes (sync.log + errors.log)
- [x] Validação markdown não-bloqueante
- [x] Separação manual/ vs generated/
- [x] Normalização Windows/Linux de paths
- [x] Arquitetura preparada para fingerprinting de assets (V2)
- [x] Zero dependências pagas ou APIs externas
