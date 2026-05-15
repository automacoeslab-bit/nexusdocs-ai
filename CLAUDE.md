# NexusDocs AI — Contexto para Claude Code

## O que é

Plataforma white-label de documentação: converte arquivos Markdown de um repositório privado em site estático publicado automaticamente. Cada cliente tem sua própria cópia do repositório (via GitHub Template) e seu próprio repositório de conteúdo.

**Instância atual:** TomikCRM — conteúdo em `EduargoGrigolo/docs-notion`, site em `automacoeslab-bit.github.io/nexusdocs-ai` e Vercel.

---

## Arquitetura do pipeline

```
Push no repositório de conteúdo
  → repository_dispatch "docs-updated"
    → GitHub Actions (deploy.yml)
      → checkout nexusdocs-ai + checkout conteúdo
      → sync-docs.mjs (copia .md e imagens para src/content/docs/generated/)
      → build com ASTRO_BASE_PATH=/nexusdocs-ai → upload GitHub Pages
      → build com ASTRO_BASE_PATH='' → deploy Vercel (--prebuilt)
```

**Dois builds por workflow** — GitHub Pages precisa do subpath `/nexusdocs-ai` nos assets; Vercel serve da raiz `/`.

---

## Arquivos críticos

| Arquivo | Responsabilidade |
|---|---|
| `astro.config.mjs` | Lê `ASTRO_BASE_PATH` e `ASTRO_SITE_URL` do ambiente |
| `.github/workflows/deploy.yml` | Pipeline completo: sync → build × 2 → GH Pages + Vercel |
| `scripts/sync-docs.mjs` | Copia arquivos do repositório de conteúdo para `src/content/docs/generated/` |
| `scripts/process-docs.mjs` | Normaliza frontmatter e reescreve paths de imagens |
| `scripts/generate-sidebar.mjs` | Gera `cache/generated-sidebar.json` a partir da estrutura de pastas |
| `src/config/brand.ts` | Nome, logo e cores do produto (editado pelo cliente) |
| `setup.mjs` | Script interativo de onboarding para novos clientes |

---

## Secrets do repositório

| Secret | Valor (instância atual) |
|---|---|
| `DOCS_REPO` | `EduargoGrigolo/docs-notion` |
| `DOCS_NOTION_TOKEN` | Token GitHub com escopo `repo` para ler o conteúdo |
| `VERCEL_TOKEN` | Token Vercel Full Account |
| `VERCEL_ORG_ID` | Account ID do Vercel |
| `VERCEL_PROJECT_ID` | Project ID do Vercel |

---

## Convenções do repositório de conteúdo

```
modulo-<nome>/
├── 01-NOME-notion.md      ← sufixo -notion.md obrigatório
├── 02-OUTRO-notion.md
└── diags/
    └── imagem.png
```

- Pastas `modulo-*` → seções na sidebar
- Número no início define a ordem
- Arquivos sem `-notion.md` são ignorados pelo sync
- Imagens ficam em `diags/` dentro do módulo

---

## Variáveis de ambiente

| Var | GH Actions (Pages) | GH Actions (Vercel) | Local / Vercel |
|---|---|---|---|
| `ASTRO_BASE_PATH` | `/nexusdocs-ai` | `` (vazio) | `` (vazio) |
| `ASTRO_SITE_URL` | não definida (usa default) | não definida | não definida |
| `DOCS_NOTION_PATH` | `$GITHUB_WORKSPACE/docs-notion-src` | — | path local |
| `SITE_BASE` | `/nexusdocs-ai` | — | — |

---

## Vercel — pontos de atenção

- **"Ignored Build Step" = `exit 0`** em Settings → Build & Development Settings. Sem isso o Vercel tenta buildar sozinho e falha.
- Deploy usa `vercel deploy --prebuilt --prod` com output em `.vercel/output/static/` + `.vercel/output/config.json` (`{"version":3}`).
- Actions todas pinadas por SHA no `deploy.yml` (não usar tags `@v4`).

---

## White-label

- Repositório marcado como GitHub Template → clientes usam "Use this template"
- `setup.mjs` faz o onboarding interativo: pede tokens, valida via API, cria os 5 secrets via `gh secret set`, dispara o primeiro deploy
- Cada cliente configura seu próprio `DOCS_REPO`, tokens e IDs — sem tocar no YAML

---

## O que não quebrar

- Fluxo `repository_dispatch` do repositório de conteúdo → deve continuar disparando o workflow
- GitHub Pages continua funcionando: build com `ASTRO_BASE_PATH=/nexusdocs-ai` antes do upload do artefato
- O artefato do Pages é upado **antes** do segundo build (que sobrescreve `dist/`)
- `sync-docs.mjs` depende de `DOCS_NOTION_PATH` apontar para onde o conteúdo foi clonado
