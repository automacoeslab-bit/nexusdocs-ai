# Vercel Integration + White-label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar Vercel como segundo destino de deploy, tornar base path configurável por env var, adicionar segurança ao pipeline e preparar white-label para novos clientes.

**Architecture:** O mesmo artefato `dist/` gerado pelo GitHub Actions é enviado para GitHub Pages (`/nexusdocs-ai`) e para o Vercel (raiz `/`) no mesmo workflow. A variável `ASTRO_BASE_PATH` controla o subpath em build time. O `setup.mjs` automatiza o onboarding de novos clientes usando o `gh` CLI para criar secrets.

**Tech Stack:** Astro 4, GitHub Actions, Vercel CLI (`npx vercel`), Node.js 24, `gh` CLI, readline (built-in)

---

## Fase 1 — Core Vercel Integration

### Task 1: Base path configurável no `astro.config.mjs`

**Files:**
- Modify: `astro.config.mjs:23-24`
- Modify: `.env`

- [ ] **Step 1: Atualizar `astro.config.mjs`**

Adicionar após os imports existentes (antes de `const { colors } = brand;`):

```js
const base = process.env.ASTRO_BASE_PATH ?? '/nexusdocs-ai'
const site = process.env.ASTRO_SITE_URL || 'https://automacoeslab-bit.github.io'
```

Substituir dentro do `defineConfig`:

```js
// antes:
  site: 'https://automacoeslab-bit.github.io',
  base: '/nexusdocs-ai',

// depois:
  site,
  base: base || undefined,
```

- [ ] **Step 2: Atualizar `.env`**

Adicionar ao final do arquivo `.env`:

```
ASTRO_BASE_PATH=
ASTRO_SITE_URL=
```

(Vazias = comportamento de raiz `/` para dev local e Vercel)

- [ ] **Step 3: Verificar build local com base vazia**

```bash
npm run build
```

Esperado: build conclui sem erros. Verificar que não há subpath nos assets:

```bash
grep -c 'nexusdocs-ai' dist/index.html
```

Esperado: `0`

- [ ] **Step 4: Verificar build com base definida**

```bash
ASTRO_BASE_PATH=/nexusdocs-ai npm run build
```

```bash
grep -c 'nexusdocs-ai' dist/index.html
```

Esperado: número maior que `0`

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs .env
git commit -m "feat: base path e site URL configuráveis via env var"
```

---

### Task 2: Pré-requisitos manuais no Vercel (você executa)

**Files:** nenhum — são ações no Vercel e GitHub

> Esta task não tem código. São passos que você precisa executar manualmente antes da Task 3.

- [ ] **Step 1: Criar projeto no Vercel**

Acesse [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository** → selecione `automacoeslab-bit/nexusdocs-ai`.

Na configuração do projeto:
- **Framework Preset:** Other
- **Build Command:** deixar vazio (o build vem pronto do GitHub Actions)
- **Output Directory:** deixar vazio
- Clique em **Deploy** — vai falhar (sem build), mas cria o projeto com os IDs necessários.

- [ ] **Step 2: Obter os IDs do projeto**

No projeto criado → **Settings** → **General**:
- Copiar **Project ID** → guarde como `VERCEL_PROJECT_ID`

No Vercel → **Settings** (conta) → **General**:
- Copiar **Account ID** → guarde como `VERCEL_ORG_ID`

- [ ] **Step 3: Criar token do Vercel**

Vercel → **Settings** → **Tokens** → **Create** → nome: `nexusdocs-github-actions` → escopo: **Full Account** → guarde o valor como `VERCEL_TOKEN`.

- [ ] **Step 4: Adicionar secrets no GitHub**

Acesse `https://github.com/automacoeslab-bit/nexusdocs-ai/settings/secrets/actions` e adicione:

| Nome | Valor |
|---|---|
| `VERCEL_TOKEN` | token criado no Step 3 |
| `VERCEL_ORG_ID` | Account ID do Step 2 |
| `VERCEL_PROJECT_ID` | Project ID do Step 2 |

---

### Task 3: Adicionar passo Vercel ao `deploy.yml`

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Atualizar step "Criar .env para o pipeline"**

Localizar o step atual:

```yaml
      - name: Criar .env para o pipeline
        run: |
          echo "DOCS_NOTION_PATH=${{ github.workspace }}/docs-notion-src" > .env
          echo "SITE_BASE=/nexusdocs-ai" >> .env
```

Substituir por:

```yaml
      - name: Criar .env para o pipeline
        run: |
          echo "DOCS_NOTION_PATH=${{ github.workspace }}/docs-notion-src" > .env
          echo "SITE_BASE=/nexusdocs-ai" >> .env
          echo "ASTRO_BASE_PATH=/nexusdocs-ai" >> .env
```

- [ ] **Step 2: Adicionar step de deploy Vercel**

Após o step com `id: deploy` (Deploy para GitHub Pages), adicionar:

```yaml
      - name: Deploy para Vercel
        run: npx vercel deploy --prebuilt --prod dist/ --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

- [ ] **Step 3: Commit e push**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: deploy duplo — GitHub Pages + Vercel no mesmo workflow"
git push
```

- [ ] **Step 4: Acompanhar o workflow**

```bash
gh run watch --repo automacoeslab-bit/nexusdocs-ai
```

Esperado: todos os steps verdes, incluindo "Deploy para Vercel". O output do step mostra a URL de produção (ex: `https://nexusdocs-ai.vercel.app`).

- [ ] **Step 5: Verificar o site no Vercel**

Acessar a URL mostrada no output. Verificar:
- Homepage carrega com CSS
- Logo e links funcionam
- Sidebar carrega as páginas
- Uma página de docs abre corretamente

---

## Fase 2 — Segurança

### Task 4: Pinagem de Actions por SHA no `deploy.yml`

**Files:**
- Modify: `.github/workflows/deploy.yml`

> Pinagem previne ataques de supply chain onde uma tag (`@v4`) é movida para código malicioso. O SHA é imutável.

- [ ] **Step 1: Substituir todas as tags por SHAs em `deploy.yml`**

Fazer as seguintes substituições no arquivo `.github/workflows/deploy.yml`:

```yaml
# actions/checkout — ambas as ocorrências (nexusdocs-ai e docs-notion)
# antes:
        uses: actions/checkout@v4
# depois:
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4

# actions/setup-node
# antes:
        uses: actions/setup-node@v4
# depois:
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4

# actions/configure-pages
# antes:
        uses: actions/configure-pages@v4
# depois:
        uses: actions/configure-pages@1f0c5cde4bc74cd7e1254d0cb4de8d49e9068c7d  # v4

# actions/upload-pages-artifact
# antes:
        uses: actions/upload-pages-artifact@v3
# depois:
        uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa  # v3

# actions/deploy-pages
# antes:
        uses: actions/deploy-pages@v4
# depois:
        uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e  # v4
```

- [ ] **Step 2: Commit e push**

```bash
git add .github/workflows/deploy.yml
git commit -m "security: pinar GitHub Actions por SHA"
git push
```

- [ ] **Step 3: Verificar workflow**

```bash
gh run watch --repo automacoeslab-bit/nexusdocs-ai
```

Esperado: todos os steps verdes. SHA pinado não altera comportamento.

---

### Task 5: Dependabot

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Criar `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

- [ ] **Step 2: Commit e push**

```bash
git add .github/dependabot.yml
git commit -m "security: ativar Dependabot para npm e GitHub Actions"
git push
```

- [ ] **Step 3: Verificar no GitHub**

Acessar `https://github.com/automacoeslab-bit/nexusdocs-ai/security/dependabot` — deve mostrar Dependabot ativo. PRs automáticos podem aparecer em até 24h.

---

## Fase 3 — White-label (pode ser feito em sessão separada)

### Task 6: Script de setup para novos clientes (`setup.mjs`)

**Files:**
- Create: `setup.mjs`

> Usa o `gh` CLI (já instalado) para criar os secrets — o gh cuida da criptografia internamente, sem dependências extras.

- [ ] **Step 1: Criar `setup.mjs`**

```js
import { createInterface } from 'readline'
import { spawnSync } from 'child_process'

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    let value = ''
    process.stdin.on('data', function handler(char) {
      char = char.toString()
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', handler)
        process.stdout.write('\n')
        resolve(value)
      } else if (char === '') {
        process.exit()
      } else if (char === '') {
        value = value.slice(0, -1)
      } else {
        value += char
      }
    })
  })
}

async function validateGitHubToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'nexusdocs-setup' },
  })
  if (!res.ok) return null
  return (await res.json()).login
}

async function validateVercelToken(token) {
  const res = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}

function setSecret(repo, name, value) {
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', repo, '--body', value], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (result.status !== 0) {
    throw new Error(`Erro ao criar secret ${name}: ${result.stderr.toString().trim()}`)
  }
}

async function main() {
  console.log('\n=== NexusDocs Setup ===\n')
  console.log('Pré-requisito: gh CLI instalado e autenticado na conta do repo.\n')

  const ghToken = await askHidden('Token GitHub (repo + workflow scope): ')
  const ghUser = await validateGitHubToken(ghToken)
  if (!ghUser) {
    console.error('\nToken GitHub inválido. Verifique os escopos e tente novamente.')
    process.exit(1)
  }
  console.log(`Token GitHub válido — conta: ${ghUser}`)

  const repoInput = await ask('Repositório nexusdocs (ex: minha-org/nexusdocs-ai): ')
  const repo = repoInput.trim()
  if (!repo.includes('/')) {
    console.error('Formato inválido. Use: org/repo')
    process.exit(1)
  }

  const docsToken = await askHidden('Token para ler o docs-notion (Enter para usar o mesmo): ')
  const finalDocsToken = docsToken.trim() || ghToken

  const vercelToken = await askHidden('Token Vercel: ')
  const vercelOk = await validateVercelToken(vercelToken)
  if (!vercelOk) {
    console.error('\nToken Vercel inválido. Verifique e tente novamente.')
    process.exit(1)
  }
  console.log('Token Vercel válido.')

  const vercelOrgId = await ask('Vercel Org ID (Account ID): ')
  const vercelProjectId = await ask('Vercel Project ID: ')

  console.log('\nConfigurando secrets...')
  try {
    setSecret(repo, 'DOCS_NOTION_TOKEN', finalDocsToken)
    console.log('✓ DOCS_NOTION_TOKEN')
    setSecret(repo, 'VERCEL_TOKEN', vercelToken)
    console.log('✓ VERCEL_TOKEN')
    setSecret(repo, 'VERCEL_ORG_ID', vercelOrgId.trim())
    console.log('✓ VERCEL_ORG_ID')
    setSecret(repo, 'VERCEL_PROJECT_ID', vercelProjectId.trim())
    console.log('✓ VERCEL_PROJECT_ID')
  } catch (err) {
    console.error(`\n${err.message}`)
    process.exit(1)
  }

  const trigger = await ask('\nDisparar o primeiro deploy agora? (s/n): ')
  if (trigger.trim().toLowerCase() === 's') {
    const result = spawnSync('gh', ['workflow', 'run', 'deploy.yml', '--repo', repo], {
      stdio: 'inherit',
    })
    if (result.status === 0) {
      console.log(`\nDeploy disparado! Acompanhe em: https://github.com/${repo}/actions`)
    } else {
      console.log('\nNão foi possível disparar. Acesse GitHub Actions e execute manualmente.')
    }
  }

  console.log('\nSetup concluído!')
  rl.close()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
```

- [ ] **Step 2: Testar o script localmente**

```bash
node setup.mjs
```

Verificar:
- Tokens não aparecem na tela enquanto digita
- Token GitHub inválido exibe erro e sai com código 1
- Token Vercel inválido exibe erro e sai com código 1
- Token válido avança para próxima pergunta

- [ ] **Step 3: Commit**

```bash
git add setup.mjs
git commit -m "feat: script de setup interativo para onboarding white-label"
```

---

### Task 7: Marcar repo como Template Repository

**Files:** nenhum — ação via `gh` CLI

- [ ] **Step 1: Ativar Template Repository**

```bash
gh api repos/automacoeslab-bit/nexusdocs-ai \
  --method PATCH \
  --field is_template=true \
  --jq '.is_template'
```

Esperado: `true`

- [ ] **Step 2: Verificar**

Acessar `https://github.com/automacoeslab-bit/nexusdocs-ai` — deve aparecer o botão **"Use this template"** ao lado de "Code".

---

## Resumo de arquivos alterados

| Arquivo | Tipo | Task |
|---|---|---|
| `astro.config.mjs` | Modify | 1 |
| `.env` | Modify | 1 |
| `.github/workflows/deploy.yml` | Modify | 3, 4 |
| `.github/dependabot.yml` | Create | 5 |
| `setup.mjs` | Create | 6 |

## Ordem recomendada

Tasks 1 → 2 (manual) → 3 → 4 → 5 → 6 → 7

Tasks 6 e 7 (white-label) podem ser feitas em sessão separada.
