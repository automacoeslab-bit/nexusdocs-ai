# NexusDocs — Integração Vercel + White-label

**Data:** 2026-05-15  
**Status:** Aprovado

---

## Objetivo

Adicionar Vercel como segundo destino de deploy, mantendo GitHub Pages funcionando sem mudanças. Preparar o repositório para uso white-label por múltiplos clientes.

---

## Arquitetura

```
Push no docs-notion
  → repository_dispatch
    → GitHub Actions
      → sync (docs-notion → src/content/docs/generated/)
      → build (npm run build)
      → deploy → GitHub Pages  (base: /nexusdocs-ai)
              → Vercel         (base: vazio, serve da raiz /)
```

O mesmo artefato `dist/` é enviado para ambos os destinos. O Vercel recebe o build pronto via `vercel deploy --prebuilt` — não executa o build por conta própria.

---

## Seção 1: Base path configurável

### Problema
`astro.config.mjs` tem `base: '/nexusdocs-ai'` fixo. O Vercel serve da raiz `/`, então precisa de base vazia.

### Solução
`astro.config.mjs` passa a ler `ASTRO_BASE_PATH` do ambiente:

```js
const base = process.env.ASTRO_BASE_PATH ?? '/nexusdocs-ai'

export default defineConfig({
  site: 'https://automacoeslab-bit.github.io',
  base: base || undefined,
  ...
})
```

- `base: undefined` → Astro trata como raiz `/`
- `base: '/nexusdocs-ai'` → comportamento atual do GitHub Pages

### Valores por ambiente

| Ambiente | `ASTRO_BASE_PATH` | Resultado |
|---|---|---|
| Local (`.env`) | `` (vazio) | Serve de `/` |
| GitHub Actions | `/nexusdocs-ai` | Serve de `/nexusdocs-ai` |
| Vercel | `` (vazio, não definida) | Serve de `/` |

### Arquivos alterados
- `astro.config.mjs` — lê `ASTRO_BASE_PATH`; o campo `site` também passa a ler `ASTRO_SITE_URL` (para que o sitemap e canonical URLs funcionem corretamente no Vercel com domínio customizado)
- `.env` — adiciona `ASTRO_BASE_PATH=` e `ASTRO_SITE_URL=` (vazios para dev local)

### Campo `site` configurável

```js
const base = process.env.ASTRO_BASE_PATH ?? '/nexusdocs-ai'
const site = process.env.ASTRO_SITE_URL || 'https://automacoeslab-bit.github.io'

export default defineConfig({
  site,
  base: base || undefined,
  ...
})
```

| Ambiente | `ASTRO_SITE_URL` |
|---|---|
| GitHub Actions | `https://automacoeslab-bit.github.io` (default) |
| Vercel (TomikCRM) | `https://nexusdocs-ai.vercel.app` ou domínio customizado |

---

## Seção 2: Deploy duplo no workflow

### Passo adicional no `deploy.yml`

Após o step "Deploy para GitHub Pages", adicionar:

```yaml
- name: Deploy para Vercel
  run: npx vercel deploy --prebuilt --prod dist/ --token ${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

> Sem `--prod`, o Vercel faz deploy para uma URL de preview temporária, não para a URL de produção do projeto.

### Passo de criação do `.env` atualizado

```yaml
- name: Criar .env para o pipeline
  run: |
    echo "DOCS_NOTION_PATH=${{ github.workspace }}/docs-notion-src" > .env
    echo "SITE_BASE=/nexusdocs-ai" >> .env
    echo "ASTRO_BASE_PATH=/nexusdocs-ai" >> .env
```

### Secrets novos no repo `automacoeslab-bit/nexusdocs-ai`

| Secret | Como obter |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | vercel.com → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Projeto no Vercel → Settings → General → Project ID |

### Pré-requisito
Criar projeto no Vercel antes de rodar o workflow:
```bash
npx vercel link  # dentro do diretório nexusdocs-ai
```
Isso cria `.vercel/project.json` com os IDs necessários.

---

## Seção 3: Template repo + script de setup (white-label)

### Template Repository
Marcar `automacoeslab-bit/nexusdocs-ai` como template no GitHub:
- Settings → General → marcar "Template repository"

Sem mudança de código. Clientes criam seu repo via "Use this template".

### `setup.mjs`

Script interativo para onboarding de novos clientes. Fica na raiz do repo.

**Fluxo:**
1. Pergunta o token GitHub do cliente (input oculto)
2. Valida o token fazendo uma chamada de teste à API do GitHub
3. Pergunta a URL do repo `docs-notion` do cliente
4. Pergunta o token Vercel (input oculto)
5. Pergunta o Vercel Org ID e Project ID
6. Cria os secrets no repo via API do GitHub
7. Dispara o primeiro workflow manualmente

**Requisitos de segurança:**
- Tokens solicitados com `readline` em modo oculto (`rl.stdoutMuted = true`)
- Nunca logar valores de tokens (`console.log`, `console.error`)
- Validar token antes de salvar (chamada de teste à API)
- Exibir apenas confirmação de sucesso/falha, nunca o valor

**Pré-requisitos para o cliente:**
- Node.js instalado
- Repo criado a partir do template
- Conta no Vercel com projeto criado
- Token GitHub com escopo `repo` + `workflow`
- Token Vercel

---

## Seção 4: Segurança

### 4.1 Pinagem de Actions por SHA

Todas as Actions no `deploy.yml` trocam `@v4` por SHA imutável. Previne ataques de supply chain onde uma tag é movida para código malicioso.

Actions afetadas:
- `actions/checkout`
- `actions/setup-node`
- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`
- `peter-evans/repository-dispatch` (em `docs-notion`)

### 4.2 Dependabot

Arquivo `.github/dependabot.yml` com verificações semanais:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

Dependabot abre PRs automaticamente. Não faz merge — você decide.

---

## O que NÃO muda

- Fluxo de push do `docs-notion` → `repository_dispatch` → workflow
- Deploy do GitHub Pages (continua funcionando igual)
- Scripts de sync (`sync-docs.mjs`, `process-docs.mjs`, `generate-sidebar.mjs`)
- Componentes Astro (`Hero.astro`, `SiteTitle.astro`)
- CSS customizado
- Qualquer funcionalidade existente da documentação do TomikCRM

---

## Ordem de implementação

1. `astro.config.mjs` + `.env` (base path via env var)
2. Criar projeto no Vercel + obter IDs
3. Adicionar secrets no GitHub
4. Atualizar `deploy.yml` (passo Vercel + ASTRO_BASE_PATH no .env)
5. Pinagem de Actions por SHA
6. Dependabot
7. `setup.mjs` (white-label — pode ser feito depois)
8. Marcar repo como template (white-label — pode ser feito depois)
