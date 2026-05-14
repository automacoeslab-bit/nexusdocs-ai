# NexusDocs AI — Design Spec
**Data:** 2026-05-14  
**Status:** Aprovado

---

## Objetivo

Plataforma de documentação viva chamada NexusDocs AI, integrada com GitHub, focada em documentação técnica moderna para um CRM com IA. Resultado final: ferramenta de engenharia interna com visual SaaS enterprise, não site de documentação genérico.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Astro 4 |
| Tema/estrutura | Starlight (com component overrides) |
| Estilo | Tailwind CSS |
| Diagramas | Mermaid via remark plugin (MDX → SVG automático) |
| CI/CD | GitHub Actions |
| Deploy | `deploy.yml` único genérico — evoluir para Pages ou Vercel na V2 |

---

## Arquitetura de Pastas

```
nexusdocs-ai/
├── src/
│   ├── content/docs/
│   │   ├── index.mdx
│   │   ├── visao-geral/
│   │   ├── arquitetura/        ← conteúdo rico
│   │   ├── ai-agents/          ← conteúdo rico
│   │   ├── produto/            ← esqueleto estruturado
│   │   ├── governanca/         ← esqueleto estruturado
│   │   ├── api-reference/      ← esqueleto estruturado
│   │   └── workflows/          ← esqueleto estruturado
│   ├── components/
│   │   ├── overrides/          # Slots do Starlight sobrescritos
│   │   │   ├── Hero.astro
│   │   │   ├── Header.astro
│   │   │   └── Footer.astro
│   │   └── ui/
│   │       ├── FeatureCard.astro
│   │       ├── NavCard.astro
│   │       └── CodeBlock.astro
│   ├── styles/
│   │   ├── global.css
│   │   └── custom.css
│   └── layouts/
│       └── DocLayout.astro
├── public/diagrams/
├── .github/workflows/
│   └── deploy.yml
└── astro.config.mjs
```

---

## Design System

### Tokens CSS (7 variáveis core — derivar o resto depois)

```css
--bg:      #09090B   /* zinc-950 — fundo principal */
--surface: #111115   /* superfícies elevadas */
--card:    #18181B   /* zinc-900 — cards */
--border:  #27272A   /* zinc-800 — divisores */
--text:    #FAFAFA   /* texto principal */
--muted:   #A1A1AA   /* zinc-400 — texto secundário */
--accent:  #3B82F6   /* blue-500 — destaque */
```

### Tipografia

- **Corpo/UI:** Inter (Google Fonts)
- **Código:** JetBrains Mono (Google Fonts)

### Regras visuais

1. **Glow:** apenas em hover ou elemento ativo — nunca permanente
2. **Header sticky:** `backdrop-blur` leve, opacidade baixa, sem animação pesada (mobile-safe)
3. **CodeBlock:** alinhado ao território mental de devs — VS Code dark, GitHub, Linear
4. **Cards:** `border-[--border]` base, hover `border-blue-500/40` + glow sutil

---

## Componentes

| Componente | Tipo | Descrição |
|-----------|------|-----------|
| `Hero.astro` | Override Starlight | Fullbleed, gradiente radial azul, badge V1, dois CTAs |
| `Header.astro` | Override Starlight | Logo + nav central + badge versão + link GitHub, sticky com blur |
| `Footer.astro` | Override Starlight | Minimalista, links essenciais |
| `FeatureCard.astro` | UI | Ícone + título + descrição, hover com borda azul |
| `NavCard.astro` | UI | Grid de navegação na homepage, seta animada no hover |
| `CodeBlock.astro` | UI | Fundo escuro, syntax highlight frio, badge de linguagem |

---

## Conteúdo das Páginas

| Página | Conteúdo |
|--------|----------|
| Visão Geral | Rico — overview do sistema, badges, feature cards |
| Arquitetura | Rico — C4 Context + Container diagrams em Mermaid, explicação detalhada |
| AI Agents | Rico — fluxo de agentes no CRM em Mermaid, casos de uso |
| Produto/CRM | Esqueleto — seções prontas para preencher |
| Governança | Esqueleto — seções prontas para preencher |
| API Reference | Esqueleto — endpoints placeholder com estrutura real |
| Workflows | Esqueleto — fluxos placeholder com estrutura real |

---

## Mermaid

Integração via `remark-mermaid` configurado no `astro.config.mjs`.  
Fluxo: `MDX → remark processa bloco mermaid → SVG → render automático`.  
Nenhuma configuração extra por página.

Exemplos a criar:
- C4 Context Diagram (Visão Geral do sistema)
- C4 Container Diagram (Arquitetura interna)
- Workflow de IA no CRM (AI Agents)

---

## GitHub Actions

Arquivo único: `.github/workflows/deploy.yml`

Responsabilidades na V1:
- Detecta push na `main`
- Instala dependências (`npm ci`)
- Executa build (`npm run build`)
- Valida estrutura de documentação
- Gera artefato do site

Comentários no arquivo indicam como evoluir para GitHub Pages ou Vercel na V2.

---

## Ordem de Implementação (V1) — Fases Incrementais

Cada fase é entregável por si só. Não avançar para a próxima sem validar a anterior.

### Fase 1 — Core Visual + Docs
1. Scaffold Astro + Starlight
2. Tailwind CSS configurado
3. Tokens CSS aplicados + tipografia (Inter + JetBrains Mono)
4. Página **Visão Geral** com conteúdo rico e visual premium
5. Sidebar e header funcionando
6. `npm run dev` abrindo corretamente

### Fase 2 — Mermaid
7. Plugin Mermaid configurado no `astro.config.mjs`
8. Página **Arquitetura** com C4 Context + Container diagrams renderizando
9. Validar render automático MDX → SVG

### Fase 3 — UI Components
10. `FeatureCard.astro` — hover com borda azul + glow
11. `Hero.astro` — override Starlight, gradiente radial, badge V1, CTAs
12. Aplicar componentes na Visão Geral

### Fase 4 — CI/CD
13. `.github/workflows/deploy.yml` — build + validação na `main`
14. Comentários indicando evolução para Pages/Vercel na V2

---

## O que NÃO está no escopo da V1

- Backend ou banco de dados
- IA complexa ou integrações externas
- Autenticação
- Busca avançada (a do Starlight é suficiente)
- i18n / múltiplos idiomas
- Analytics
