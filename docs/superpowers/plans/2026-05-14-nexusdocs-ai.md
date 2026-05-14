# NexusDocs AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir NexusDocs AI — plataforma de documentação viva com visual SaaS enterprise (dark mode azul elétrico), Mermaid integrado via componente, e CI/CD via GitHub Actions.

**Architecture:** Astro + Starlight com component overrides registrados no `astro.config.mjs`. Tailwind CSS com 7 tokens CSS core que sobrescrevem as CSS variables do Starlight. Mermaid via componente Astro (`MermaidDiagram.astro`) usando o pacote `mermaid` npm — sem plugin remark/rehype, sem playwright. Estrutura em 4 fases incrementais; cada fase deve funcionar antes de avançar para a próxima.

**Tech Stack:** Astro (latest), @astrojs/starlight, @astrojs/tailwind, mermaid, GitHub Actions

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `astro.config.mjs` | Config central: Starlight, Tailwind, sidebar, component overrides, customCss |
| `tailwind.config.mjs` | Config Tailwind com content paths corretos |
| `src/styles/global.css` | Google Fonts (Inter + JetBrains Mono) + 7 tokens CSS core |
| `src/styles/custom.css` | Overrides das CSS variables do Starlight para o tema premium |
| `src/components/overrides/Hero.astro` | Override do Hero do Starlight — fullbleed, gradiente, badge V1, CTAs |
| `src/components/ui/FeatureCard.astro` | Card reutilizável com hover premium (borda azul + glow) |
| `src/components/ui/MermaidDiagram.astro` | Componente que renderiza diagramas Mermaid client-side |
| `src/content/docs/index.mdx` | Homepage — hero com CTAs e link para Visão Geral |
| `src/content/docs/visao-geral/index.mdx` | Visão Geral — conteúdo rico com FeatureCards |
| `src/content/docs/arquitetura/index.mdx` | Arquitetura — C4 Context + Container com MermaidDiagram |
| `src/content/docs/ai-agents/index.mdx` | AI Agents — fluxo de agentes com MermaidDiagram |
| `src/content/docs/produto/index.mdx` | Produto/CRM — esqueleto estruturado |
| `src/content/docs/governanca/index.mdx` | Governança — esqueleto estruturado |
| `src/content/docs/api-reference/index.mdx` | API Reference — esqueleto com endpoints placeholder |
| `src/content/docs/workflows/index.mdx` | Workflows — esqueleto com fluxos placeholder |
| `.github/workflows/deploy.yml` | CI/CD: build + validação no push à main |

---

## FASE 1 — Core Visual + Docs

### Task 1: Scaffold do projeto Astro + Starlight e git init

**Files:**
- Create: `astro.config.mjs`
- Create: `package.json`
- Create: `tailwind.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Navegar para o diretório do projeto e fazer scaffold**

```bash
cd C:/Projetos/nexusdocs-ai
npm create astro@latest . -- --template starlight --no-install --no-git
```

Quando perguntar sobre diretório existente, confirmar com `yes`. Quando perguntar sobre TypeScript, escolher `Strict`. Quando perguntar sobre `npm install`, escolher `No` (faremos a seguir).

- [ ] **Step 2: Instalar dependências base**

```bash
cd C:/Projetos/nexusdocs-ai
npm install
```

Expected: `node_modules/` criado, nenhum erro.

- [ ] **Step 3: Adicionar Tailwind CSS**

```bash
npx astro add tailwind --yes
```

Expected: `@astrojs/tailwind` instalado, `tailwind.config.mjs` criado automaticamente, `astro.config.mjs` atualizado.

- [ ] **Step 4: Instalar pacote mermaid**

```bash
npm install mermaid
```

Expected: `mermaid` aparece em `dependencies` no `package.json`.

- [ ] **Step 5: Inicializar git e fazer primeiro commit**

```bash
git init
git add .
git commit -m "chore: scaffold Astro + Starlight + Tailwind"
```

Expected: commit criado com sucesso.

- [ ] **Step 6: Validar que o projeto roda**

```bash
npm run dev
```

Expected: servidor rodando em `http://localhost:4321`, página padrão do Starlight carregando no navegador. Fechar com Ctrl+C depois de verificar.

---

### Task 2: Design system — tokens CSS, tipografia e overrides do Starlight

**Files:**
- Create: `src/styles/global.css`
- Create: `src/styles/custom.css`
- Modify: `astro.config.mjs`
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Criar `src/styles/global.css` com tokens e tipografia**

```css
/* src/styles/global.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg:      #09090B;
  --surface: #111115;
  --card:    #18181B;
  --border:  #27272A;
  --text:    #FAFAFA;
  --muted:   #A1A1AA;
  --accent:  #3B82F6;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg);
  color: var(--text);
}

code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

- [ ] **Step 2: Criar `src/styles/custom.css` com overrides das CSS variables do Starlight**

```css
/* src/styles/custom.css */

/* Força dark mode como padrão e aplica nossos tokens */
:root,
[data-theme='dark'],
[data-theme='light'] {
  --sl-color-accent:            var(--accent);
  --sl-color-accent-high:       #60A5FA;
  --sl-color-accent-low:        #1D4ED8;
  --sl-color-white:             var(--text);
  --sl-color-gray-1:            #E4E4E7;
  --sl-color-gray-2:            #D4D4D8;
  --sl-color-gray-3:            var(--muted);
  --sl-color-gray-4:            #52525B;
  --sl-color-gray-5:            #3F3F46;
  --sl-color-gray-6:            var(--border);
  --sl-color-black:             var(--bg);
  --sl-color-bg:                var(--bg);
  --sl-color-bg-sidebar:        var(--surface);
  --sl-color-bg-nav:            var(--surface);
  --sl-color-bg-inline-code:    var(--card);
  --sl-color-hairline:          var(--border);
  --sl-font:                    'Inter', sans-serif;
  --sl-font-mono:               'JetBrains Mono', monospace;
  --sl-nav-height:              4rem;
}

/* Sidebar premium */
.sidebar-pane {
  border-right: 1px solid var(--border);
}

/* Links da sidebar */
.sidebar-content a {
  color: var(--muted);
  transition: color 0.15s ease;
}

.sidebar-content a:hover,
.sidebar-content a[aria-current='page'] {
  color: var(--text);
}

.sidebar-content a[aria-current='page'] {
  color: var(--accent);
}

/* Header sticky com blur leve */
header.header {
  background-color: color-mix(in srgb, var(--surface) 80%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

/* Conteúdo principal */
.content-panel {
  background-color: var(--bg);
}

/* Código inline */
code:not(pre code) {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  font-size: 0.875em;
  color: #60A5FA;
}

/* Pre / code blocks */
pre {
  background-color: var(--card) !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px !important;
}

/* Headings */
h1, h2, h3, h4 {
  color: var(--text);
  letter-spacing: -0.02em;
}

h1 { font-size: 2.25rem; font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
h3 { font-size: 1.25rem; font-weight: 600; }

/* Links */
a {
  color: var(--accent);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* Tabelas */
table {
  border-collapse: collapse;
  width: 100%;
}
th {
  background-color: var(--surface);
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}
tr:hover td {
  background-color: var(--surface);
}
```

- [ ] **Step 3: Atualizar `tailwind.config.mjs` para incluir os content paths corretos**

```js
// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      '#09090B',
        surface: '#111115',
        card:    '#18181B',
        border:  '#27272A',
        accent:  '#3B82F6',
        muted:   '#A1A1AA',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Atualizar `astro.config.mjs` para registrar os CSS files e configurar Starlight**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    starlight({
      title: 'NexusDocs AI',
      description: 'Documentação viva do CRM com IA — ferramenta de engenharia interna',
      defaultLocale: 'root',
      locales: { root: { label: 'Português', lang: 'pt-BR' } },
      defaultColorScheme: 'dark',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/your-org/nexusdocs-ai' },
      ],
      customCss: [
        './src/styles/global.css',
        './src/styles/custom.css',
      ],
      sidebar: [
        { label: 'Visão Geral', link: '/visao-geral/' },
        { label: 'Arquitetura', link: '/arquitetura/' },
        { label: 'AI Agents', link: '/ai-agents/' },
        {
          label: 'Produto',
          items: [
            { label: 'CRM', link: '/produto/' },
            { label: 'Workflows', link: '/workflows/' },
          ],
        },
        { label: 'Governança', link: '/governanca/' },
        { label: 'API Reference', link: '/api-reference/' },
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
```

- [ ] **Step 5: Validar que o projeto ainda roda e o tema está aplicado**

```bash
npm run dev
```

Expected: página carregando com fundo escuro (`#09090B`). Sidebar com fundo `#111115`. Fonte Inter aplicada. Fechar com Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/styles/ astro.config.mjs tailwind.config.mjs
git commit -m "feat: design system — tokens CSS, tipografia e overrides Starlight"
```

---

### Task 3: Página Visão Geral com conteúdo rico

**Files:**
- Create: `src/content/docs/visao-geral/index.mdx`
- Modify: `src/content/docs/index.mdx`

- [ ] **Step 1: Criar `src/content/docs/visao-geral/index.mdx` com conteúdo rico**

```mdx
---
title: Visão Geral
description: O que é o NexusDocs AI e como ele funciona
---

import { Badge, Card, CardGrid } from '@astrojs/starlight/components';

# NexusDocs AI <Badge text="v1.0" variant="note" />

**NexusDocs AI** é a plataforma de documentação viva do nosso CRM com inteligência artificial. Construída como produto de engenharia, não como wiki — versionada, automatizada, e projetada para times técnicos que se movem rápido.

---

## O que é este sistema

O CRM com IA é uma plataforma de gestão de relacionamento com clientes potencializada por agentes de IA especializados. Esses agentes operam em pipelines de vendas, qualificação de leads, análise de interações e automação de follow-ups.

Esta documentação cobre:

- **Arquitetura** — como os componentes se comunicam
- **AI Agents** — quem são os agentes e o que fazem
- **API Reference** — contratos e endpoints
- **Workflows** — fluxos automatizados end-to-end
- **Governança** — políticas, segurança e compliance

---

## Capacidades Principais

<CardGrid>
  <Card title="AI Agents Especializados" icon="rocket">
    Agentes de IA focados em tarefas específicas: qualificação, scoring, follow-up automático e análise de sentimento.
  </Card>
  <Card title="Pipeline Inteligente" icon="bars">
    Fluxo de vendas com scoring automático, priorização por IA e alertas de oportunidade em tempo real.
  </Card>
  <Card title="Integrações Nativas" icon="puzzle">
    Conectores para e-mail, calendário, Slack, WhatsApp Business e ERPs via API padronizada.
  </Card>
  <Card title="Observabilidade Total" icon="magnifier">
    Logs estruturados, traces de decisões de IA, métricas de performance e dashboards operacionais.
  </Card>
</CardGrid>

---

## Stack Tecnológica

| Camada | Tecnologia | Papel |
|--------|-----------|-------|
| Frontend | React + Next.js | Interface do usuário CRM |
| API Gateway | Node.js + Fastify | Roteamento e autenticação |
| AI Engine | Python + LangChain | Orquestração de agentes |
| LLM | Claude (Anthropic) | Reasoning e geração de texto |
| Database | PostgreSQL + pgvector | Dados relacionais + embeddings |
| Cache | Redis | Sessões e respostas de IA |
| Infra | AWS ECS + RDS | Compute e persistência |
| CI/CD | GitHub Actions | Pipeline de build e deploy |

---

## Princípios de Design

### Agentes como Serviços
Cada agente de IA é um serviço independente com contrato de API bem definido. Pode ser atualizado, versionado e monitorado de forma isolada.

### Decisões Rastreáveis
Toda decisão tomada por IA é logada com contexto, prompt, resposta e metadados. Nenhuma "caixa preta" em produção.

### Segurança por Design
PII (Personally Identifiable Information) nunca passa pelo modelo de IA diretamente. Dados são anonimizados antes de qualquer chamada ao LLM.

---

## Como Navegar Esta Documentação

Comece pela [Arquitetura](/arquitetura/) para entender como os componentes se relacionam.  
Em seguida, explore os [AI Agents](/ai-agents/) para entender as capacidades de IA.  
Use a [API Reference](/api-reference/) como referência técnica durante o desenvolvimento.
```

- [ ] **Step 2: Atualizar `src/content/docs/index.mdx` para redirecionar para Visão Geral**

```mdx
---
title: NexusDocs AI
description: Documentação viva do CRM com IA
template: splash
hero:
  title: NexusDocs AI
  tagline: Documentação viva para o CRM com Inteligência Artificial. Construída como produto de engenharia — versionada, automatizada, escalável.
  actions:
    - text: Começar
      link: /visao-geral/
      icon: right-arrow
      variant: primary
    - text: Arquitetura
      link: /arquitetura/
      icon: external
---
```

- [ ] **Step 3: Validar renderização no browser**

```bash
npm run dev
```

Abrir `http://localhost:4321` — verificar homepage com hero. Abrir `http://localhost:4321/visao-geral/` — verificar tabela, cards e conteúdo rico. Fechar com Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/
git commit -m "feat: homepage e página Visão Geral com conteúdo rico"
```

---

## FASE 2 — Mermaid

### Task 4: Componente MermaidDiagram e página Arquitetura

**Files:**
- Create: `src/components/ui/MermaidDiagram.astro`
- Create: `src/content/docs/arquitetura/index.mdx`

- [ ] **Step 1: Criar `src/components/ui/MermaidDiagram.astro`**

```astro
---
// src/components/ui/MermaidDiagram.astro
interface Props {
  code: string;
  caption?: string;
}
const { code, caption } = Astro.props;
const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
---

<figure class="mermaid-figure not-content">
  <div class="mermaid-wrapper" data-mermaid-id={id} data-mermaid-code={code}>
    <div class="mermaid-loading">
      <span>Carregando diagrama...</span>
    </div>
  </div>
  {caption && <figcaption class="mermaid-caption">{caption}</figcaption>}
</figure>

<script>
  import mermaid from 'mermaid';

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    darkMode: true,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 14,
    themeVariables: {
      darkMode: true,
      background: '#18181B',
      primaryColor: '#3B82F6',
      primaryTextColor: '#FAFAFA',
      primaryBorderColor: '#27272A',
      lineColor: '#A1A1AA',
      secondaryColor: '#111115',
      tertiaryColor: '#27272A',
      edgeLabelBackground: '#18181B',
      nodeTextColor: '#FAFAFA',
    },
  });

  async function renderDiagrams() {
    const wrappers = document.querySelectorAll<HTMLElement>('[data-mermaid-id]');
    for (const wrapper of wrappers) {
      const id = wrapper.dataset.mermaidId!;
      const code = wrapper.dataset.mermaidCode!;
      try {
        const { svg } = await mermaid.render(id, code);
        wrapper.innerHTML = svg;
      } catch (err) {
        wrapper.innerHTML = `<pre class="mermaid-error">Erro ao renderizar diagrama:\n${err}</pre>`;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDiagrams);
  } else {
    renderDiagrams();
  }
</script>

<style>
  .mermaid-figure {
    margin: 2rem 0;
  }

  .mermaid-wrapper {
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2rem;
    overflow-x: auto;
    display: flex;
    justify-content: center;
  }

  .mermaid-loading {
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
  }

  .mermaid-caption {
    text-align: center;
    color: var(--muted);
    font-size: 0.875rem;
    margin-top: 0.75rem;
    font-style: italic;
  }

  .mermaid-error {
    color: #F87171;
    font-size: 0.75rem;
    padding: 1rem;
  }

  /* Override SVG colors do Mermaid */
  .mermaid-wrapper svg {
    max-width: 100%;
    height: auto;
  }
</style>
```

- [ ] **Step 2: Criar `src/content/docs/arquitetura/index.mdx` com C4 diagrams**

```mdx
---
title: Arquitetura
description: Visão técnica do sistema — C4 Context e Container diagrams
---

import { Badge } from '@astrojs/starlight/components';
import MermaidDiagram from '../../components/ui/MermaidDiagram.astro';

# Arquitetura do Sistema <Badge text="C4 Model" variant="tip" />

O sistema segue o modelo C4 para documentação de arquitetura — quatro níveis de abstração que permitem comunicar o design para diferentes audiências.

---

## C4 Level 1 — Context Diagram

Mostra o sistema como uma caixa preta e como ele se relaciona com usuários e sistemas externos.

<MermaidDiagram
  code={`
C4Context
  title CRM com IA — Diagrama de Contexto

  Person(vendedor, "Vendedor", "Usuário do CRM que gerencia leads e oportunidades")
  Person(gestor, "Gestor Comercial", "Acompanha métricas, metas e performance do time")
  Person(devs, "Time de Engenharia", "Desenvolve e mantém o sistema")

  System(crm, "CRM com IA", "Plataforma de gestão de relacionamento potencializada por agentes de IA")

  System_Ext(email, "Provedor de E-mail", "Gmail / Outlook — envio e leitura de e-mails")
  System_Ext(calendar, "Calendário", "Google Calendar / Outlook Calendar")
  System_Ext(whatsapp, "WhatsApp Business", "Canal de comunicação com leads")
  System_Ext(anthropic, "Anthropic Claude API", "LLM para reasoning e geração de texto")
  System_Ext(erp, "ERP Corporativo", "Sistema legado com dados de clientes e contratos")

  Rel(vendedor, crm, "Gerencia leads, oportunidades e tarefas")
  Rel(gestor, crm, "Acompanha dashboards e relatórios")
  Rel(devs, crm, "Desenvolve, monitora e mantém")
  Rel(crm, email, "Envia e lê e-mails automaticamente")
  Rel(crm, calendar, "Agenda reuniões e follow-ups")
  Rel(crm, whatsapp, "Envia mensagens automatizadas")
  Rel(crm, anthropic, "Chama API para análise e geração de conteúdo")
  Rel(crm, erp, "Sincroniza dados de clientes e contratos")
`}
  caption="C4 Level 1 — Sistema CRM com IA e suas dependências externas"
/>

---

## C4 Level 2 — Container Diagram

Mostra os principais contêineres (aplicações, serviços, bancos de dados) que compõem o sistema.

<MermaidDiagram
  code={`
C4Container
  title CRM com IA — Diagrama de Contêineres

  Person(user, "Usuário", "Vendedor ou Gestor")

  Container_Boundary(crm_boundary, "CRM com IA") {
    Container(webapp, "Web App", "Next.js / React", "Interface principal do CRM — pipeline, leads, tarefas")
    Container(api_gw, "API Gateway", "Node.js / Fastify", "Autenticação, roteamento, rate limiting")
    Container(ai_engine, "AI Engine", "Python / LangChain", "Orquestração de agentes de IA")
    Container(worker, "Background Worker", "Node.js / Bull", "Filas de tarefas assíncronas")
    ContainerDb(postgres, "PostgreSQL + pgvector", "Database", "Dados relacionais + embeddings de IA")
    ContainerDb(redis, "Redis", "Cache", "Sessões, filas e cache de respostas IA")
  }

  System_Ext(claude, "Claude API", "Anthropic")
  System_Ext(email, "E-mail / Calendar", "Provedores externos")

  Rel(user, webapp, "Acessa via browser", "HTTPS")
  Rel(webapp, api_gw, "Chama API", "REST / JSON")
  Rel(api_gw, ai_engine, "Delega tarefas de IA", "HTTP interno")
  Rel(api_gw, postgres, "Lê/escreve dados", "SQL")
  Rel(api_gw, redis, "Cache e sessões", "Redis Protocol")
  Rel(ai_engine, claude, "Chama LLM", "HTTPS / API Key")
  Rel(ai_engine, postgres, "Lê contexto de leads", "SQL")
  Rel(worker, email, "Envia comunicações", "SMTP / API")
  Rel(worker, redis, "Consome filas", "Redis Protocol")
`}
  caption="C4 Level 2 — Contêineres internos do CRM com IA"
/>

---

## Decisões Arquiteturais

### Por que AI Engine separado?
O AI Engine em Python permite usar o ecossistema LangChain/LangGraph para orquestração de agentes. Desacoplado do API Gateway, pode ser escalado, versionado e atualizado de forma independente.

### Por que pgvector?
Embeddings de leads, e-mails e interações são armazenados junto com os dados relacionais no PostgreSQL via extensão pgvector. Elimina a necessidade de um vector store separado (Pinecone, Weaviate) na V1.

### Por que Redis para filas?
O Bull (agora BullMQ) usa Redis nativamente. Follow-ups, envios de e-mail e processamentos de IA são enfileirados e processados de forma assíncrona sem bloquear a API.

---

## Fluxo de uma Requisição Típica

1. Vendedor acessa o pipeline no **Web App**
2. Web App chama **API Gateway** para buscar leads com scoring atualizado
3. API Gateway verifica cache no **Redis** — se hit, retorna imediatamente
4. Se miss, consulta **PostgreSQL** e solicita ao **AI Engine** re-scoring
5. AI Engine chama **Claude API** com contexto do lead
6. Score atualizado é salvo no **PostgreSQL** e cacheado no **Redis**
7. Resposta retorna ao usuário em < 200ms (cache hit) ou < 2s (cold path)
```

- [ ] **Step 3: Validar Mermaid renderizando no browser**

```bash
npm run dev
```

Abrir `http://localhost:4321/arquitetura/`. Verificar que os dois diagramas Mermaid são renderizados (não ficam como texto). O C4 Context e C4 Container devem aparecer como SVG no fundo escuro. Fechar com Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/MermaidDiagram.astro src/content/docs/arquitetura/
git commit -m "feat: componente MermaidDiagram e página Arquitetura com C4 diagrams"
```

---

## FASE 3 — UI Components

### Task 5: FeatureCard component

**Files:**
- Create: `src/components/ui/FeatureCard.astro`

- [ ] **Step 1: Criar `src/components/ui/FeatureCard.astro`**

```astro
---
// src/components/ui/FeatureCard.astro
interface Props {
  title: string;
  description: string;
  icon?: string;
  href?: string;
  badge?: string;
}
const { title, description, icon, href, badge } = Astro.props;
const Tag = href ? 'a' : 'div';
---

<Tag href={href} class:list={['feature-card', { 'feature-card--link': !!href }]}>
  {icon && <span class="feature-card__icon" aria-hidden="true">{icon}</span>}
  <div class="feature-card__content">
    <div class="feature-card__header">
      <h3 class="feature-card__title">{title}</h3>
      {badge && <span class="feature-card__badge">{badge}</span>}
    </div>
    <p class="feature-card__description">{description}</p>
  </div>
  {href && <span class="feature-card__arrow" aria-hidden="true">→</span>}
</Tag>

<style>
  .feature-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  }

  .feature-card--link {
    cursor: pointer;
  }

  .feature-card--link:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 15%, transparent),
                0 4px 16px color-mix(in srgb, var(--accent) 10%, transparent);
    text-decoration: none;
  }

  .feature-card__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .feature-card__content {
    flex: 1;
    min-width: 0;
  }

  .feature-card__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .feature-card__title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    border: none;
    padding: 0;
  }

  .feature-card__badge {
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--accent);
    background-color: color-mix(in srgb, var(--accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 4px;
    padding: 0.125rem 0.5rem;
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }

  .feature-card__description {
    font-size: 0.875rem;
    color: var(--muted);
    margin: 0;
    line-height: 1.5;
  }

  .feature-card__arrow {
    color: var(--muted);
    font-size: 1rem;
    transition: color 0.2s ease, transform 0.2s ease;
    flex-shrink: 0;
    align-self: center;
  }

  .feature-card--link:hover .feature-card__arrow {
    color: var(--accent);
    transform: translateX(3px);
  }
</style>
```

- [ ] **Step 2: Atualizar `src/content/docs/visao-geral/index.mdx` para usar FeatureCard**

Substituir a seção "Capacidades Principais" pelos FeatureCards customizados. Abrir o arquivo e localizar a seção `## Capacidades Principais`. Substituir o bloco de `<CardGrid>` do Starlight por:

```mdx
import FeatureCard from '../../components/ui/FeatureCard.astro';

## Capacidades Principais

<div class="feature-grid">
  <FeatureCard
    icon="🤖"
    title="AI Agents Especializados"
    description="Agentes de IA focados em tarefas específicas: qualificação, scoring, follow-up automático e análise de sentimento."
    href="/ai-agents/"
    badge="Core"
  />
  <FeatureCard
    icon="📊"
    title="Pipeline Inteligente"
    description="Fluxo de vendas com scoring automático, priorização por IA e alertas de oportunidade em tempo real."
    href="/workflows/"
  />
  <FeatureCard
    icon="🔌"
    title="Integrações Nativas"
    description="Conectores para e-mail, calendário, Slack, WhatsApp Business e ERPs via API padronizada."
    href="/api-reference/"
  />
  <FeatureCard
    icon="🔍"
    title="Observabilidade Total"
    description="Logs estruturados, traces de decisões de IA, métricas de performance e dashboards operacionais."
  />
</div>

<style>{`
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }
`}</style>
```

Remover o `import { Badge, Card, CardGrid }` da linha superior e manter apenas o `import { Badge }`. Adicionar `import FeatureCard from '../../components/ui/FeatureCard.astro';`.

- [ ] **Step 3: Validar FeatureCard no browser**

```bash
npm run dev
```

Abrir `http://localhost:4321/visao-geral/`. Verificar que os FeatureCards aparecem em grid, com ícone, título, descrição e arrow. Testar hover (borda azul + glow sutil). Fechar com Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/FeatureCard.astro src/content/docs/visao-geral/
git commit -m "feat: componente FeatureCard premium com hover azul"
```

---

### Task 6: Hero override do Starlight

**Files:**
- Create: `src/components/overrides/Hero.astro`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Criar `src/components/overrides/Hero.astro`**

```astro
---
// src/components/overrides/Hero.astro
import type { Props } from '@astrojs/starlight/props';

const { entry } = Astro.props;
const { data } = entry;
const { hero } = data;
---

{hero ? (
  <div class="hero-wrapper">
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-content">
      <div class="hero-badge">
        <span class="hero-badge__dot"></span>
        <span>NexusDocs AI</span>
        <span class="hero-badge__version">v1.0</span>
      </div>

      <h1 class="hero-title">{hero.title}</h1>

      {hero.tagline && (
        <p class="hero-tagline">{hero.tagline}</p>
      )}

      {hero.actions && hero.actions.length > 0 && (
        <div class="hero-actions">
          {hero.actions.map((action) => (
            <a
              href={action.link}
              class:list={[
                'hero-action',
                action.variant === 'primary'
                  ? 'hero-action--primary'
                  : 'hero-action--secondary',
              ]}
            >
              {action.text}
              {action.icon === 'right-arrow' && <span aria-hidden="true">→</span>}
            </a>
          ))}
        </div>
      )}

      <div class="hero-meta">
        <span>Documentação técnica</span>
        <span class="hero-meta__dot">·</span>
        <span>CRM com IA</span>
        <span class="hero-meta__dot">·</span>
        <span>Ferramenta de engenharia interna</span>
      </div>
    </div>
  </div>
) : null}

<style>
  .hero-wrapper {
    position: relative;
    padding: 5rem 2rem 4rem;
    text-align: center;
    overflow: hidden;
  }

  .hero-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 60% 50% at 50% 0%,
      color-mix(in srgb, var(--accent) 12%, transparent) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 720px;
    margin: 0 auto;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.875rem;
    background-color: color-mix(in srgb, var(--accent) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 100px;
    font-size: 0.8125rem;
    color: #93C5FD;
    margin-bottom: 2rem;
  }

  .hero-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #3B82F6;
    box-shadow: 0 0 6px #3B82F6;
  }

  .hero-badge__version {
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
  }

  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--text);
    margin: 0 0 1.25rem;
    border: none;
    padding: 0;
  }

  .hero-tagline {
    font-size: 1.125rem;
    color: var(--muted);
    line-height: 1.6;
    margin: 0 0 2.5rem;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2.5rem;
  }

  .hero-action {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .hero-action--primary {
    background-color: var(--accent);
    color: white;
  }

  .hero-action--primary:hover {
    background-color: #2563EB;
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .hero-action--secondary {
    background-color: var(--card);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .hero-action--secondary:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    text-decoration: none;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--muted);
    flex-wrap: wrap;
  }

  .hero-meta__dot {
    color: var(--border);
  }
</style>
```

- [ ] **Step 2: Registrar o Hero override no `astro.config.mjs`**

Abrir `astro.config.mjs` e adicionar a seção `components` dentro do `starlight({...})`:

```js
starlight({
  // ... resto da config existente ...
  components: {
    Hero: './src/components/overrides/Hero.astro',
  },
}),
```

- [ ] **Step 3: Validar Hero no browser**

```bash
npm run dev
```

Abrir `http://localhost:4321`. Verificar: badge azul com dot animado, título grande, tagline em cinza, botões CTA (primário azul, secundário outline), meta-info em rodapé, gradiente radial azul sutil no fundo. Fechar com Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/components/overrides/Hero.astro astro.config.mjs
git commit -m "feat: Hero override premium com gradiente radial e badge animado"
```

---

### Task 7: Página AI Agents (rica) e páginas skeleton

**Files:**
- Create: `src/content/docs/ai-agents/index.mdx`
- Create: `src/content/docs/produto/index.mdx`
- Create: `src/content/docs/governanca/index.mdx`
- Create: `src/content/docs/api-reference/index.mdx`
- Create: `src/content/docs/workflows/index.mdx`

- [ ] **Step 1: Criar `src/content/docs/ai-agents/index.mdx` com conteúdo rico e Mermaid**

```mdx
---
title: AI Agents
description: Os agentes de IA que potencializam o CRM — capacidades, fluxos e decisões
---

import { Badge } from '@astrojs/starlight/components';
import MermaidDiagram from '../../components/ui/MermaidDiagram.astro';
import FeatureCard from '../../components/ui/FeatureCard.astro';

# AI Agents <Badge text="Core System" variant="success" />

O CRM opera com quatro agentes de IA especializados, cada um responsável por um domínio específico. Eles são serviços independentes que se comunicam via API interna e compartilham contexto via PostgreSQL + pgvector.

---

## Os Quatro Agentes

<div class="feature-grid">
  <FeatureCard
    icon="🎯"
    title="Lead Scorer"
    description="Analisa dados do lead (cargo, empresa, comportamento, interações) e gera um score de 0-100 com justificativa."
    badge="Síncrono"
  />
  <FeatureCard
    icon="🗣️"
    title="Qualifier Agent"
    description="Conduz qualificação automática via e-mail ou chat, usando framework BANT adaptado com linguagem natural."
    badge="Assíncrono"
  />
  <FeatureCard
    icon="📬"
    title="Follow-up Agent"
    description="Gera e agenda follow-ups personalizados com base no histórico de interações e stage do pipeline."
    badge="Assíncrono"
  />
  <FeatureCard
    icon="📡"
    title="Sentiment Analyzer"
    description="Analisa o tom de e-mails e mensagens recebidas, sinalizando leads em risco ou com alta intenção de compra."
    badge="Batch"
  />
</div>

<style>{`
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }
`}</style>

---

## Fluxo de Orquestração

<MermaidDiagram
  code={`
flowchart TD
    A[Novo Lead Criado] --> B{Lead Scorer}
    B -->|Score >= 70| C[Alta Prioridade\nNotifica vendedor]
    B -->|Score 40-69| D[Média Prioridade\nFila normal]
    B -->|Score < 40| E[Baixa Prioridade\nNurturing automático]

    C --> F{Qualifier Agent}
    D --> F
    E --> G[Follow-up Agent\nsequência nurturing]

    F -->|Qualificado| H[Oportunidade criada\nno pipeline]
    F -->|Não qualificado| I[Lead descartado\ncom motivo registrado]
    F -->|Sem resposta| J[Follow-up Agent\nreativação]

    H --> K[Vendedor assume\ncom contexto completo]
    J --> F

    subgraph Background["Background — Continuous"]
      L[Sentiment Analyzer\nanalisa toda comunicação]
      L -->|Risco detectado| M[Alerta para vendedor]
      L -->|Alta intenção| N[Sobe prioridade do lead]
    end

    style Background fill:#18181B,stroke:#27272A
    style A fill:#3B82F6,color:#fff
    style H fill:#22C55E,color:#fff
    style I fill:#EF4444,color:#fff
`}
  caption="Fluxo de orquestração dos AI Agents no pipeline de vendas"
/>

---

## Contrato de API dos Agentes

Todos os agentes expõem a mesma interface base:

```http
POST /agents/{agent-name}/run
Authorization: Bearer {internal-token}
Content-Type: application/json

{
  "lead_id": "uuid",
  "context": { ... },
  "options": {
    "async": true,
    "callback_url": "https://internal/webhook"
  }
}
```

**Resposta síncrona:**
```json
{
  "run_id": "uuid",
  "agent": "lead-scorer",
  "status": "completed",
  "result": {
    "score": 84,
    "reasoning": "Cargo C-level em empresa com 500+ funcionários...",
    "confidence": 0.91
  },
  "duration_ms": 1240,
  "model": "claude-sonnet-4-6",
  "tokens_used": 847
}
```

---

## Princípios de Segurança dos Agentes

**PII fora do contexto do LLM:** Nome, e-mail, telefone e outros dados pessoais são substituídos por tokens antes de qualquer chamada ao Claude. O modelo vê `[LEAD_001]`, não "João Silva".

**Auditoria completa:** Todo run de agente é logado com: prompt enviado, resposta recebida, tokens usados, latência, modelo e versão. Retenção de 90 dias.

**Rate limiting por lead:** Máximo de 10 chamadas de agente por lead por hora para evitar loops e custos descontrolados.
```

- [ ] **Step 2: Criar páginas skeleton — produto**

```mdx
---
title: Produto — CRM
description: Funcionalidades e módulos do CRM com IA
---

import { Badge } from '@astrojs/starlight/components';

# Produto — CRM <Badge text="Em construção" variant="caution" />

> Esta seção está sendo desenvolvida. Contribuições são bem-vindas via Pull Request.

---

## Módulos Principais

### Pipeline de Vendas
_Documentação em breve._

**O que cobre:**
- Configuração de stages do pipeline
- Automações por stage
- Regras de movimentação automática
- Integração com AI Scoring

---

### Gestão de Leads
_Documentação em breve._

**O que cobre:**
- Campos customizáveis de lead
- Deduplicação automática
- Enriquecimento de dados
- Histórico de interações

---

### Dashboard e Relatórios
_Documentação em breve._

**O que cobre:**
- Métricas em tempo real
- Relatórios de performance por vendedor
- Forecasting com IA
- Exportações customizadas

---

## Como Contribuir

Para adicionar documentação a esta seção:

1. Crie um branch: `git checkout -b docs/produto-pipelines`
2. Edite: `src/content/docs/produto/index.mdx`
3. Abra um Pull Request com o conteúdo
```

- [ ] **Step 3: Criar skeleton — governança**

```mdx
---
title: Governança
description: Políticas, segurança, compliance e SLAs do sistema
---

import { Badge } from '@astrojs/starlight/components';

# Governança <Badge text="Em construção" variant="caution" />

---

## Políticas de Segurança

### Autenticação e Autorização
_Documentação em breve._

- JWT com expiração de 24h
- RBAC: Admin, Gestor, Vendedor, Read-only
- SSO via OAuth2 / SAML (planejado)

---

### Tratamento de Dados Pessoais (LGPD)
_Documentação em breve._

- Política de retenção de dados
- Direito ao esquecimento
- Logs de acesso a PII
- DPO e canal de contato

---

## SLAs

| Endpoint | Target P99 | Target Availability |
|---------|-----------|-------------------|
| API Gateway | < 200ms | 99.9% |
| AI Engine (sync) | < 3s | 99.5% |
| AI Engine (async) | < 30s | 99.0% |

---

## Incident Response

_Documentação em breve._

- Runbook de incidentes
- Escalation path
- Comunicação com stakeholders
```

- [ ] **Step 4: Criar skeleton — api-reference**

```mdx
---
title: API Reference
description: Endpoints, contratos e exemplos de integração
---

import { Badge } from '@astrojs/starlight/components';

# API Reference <Badge text="v1.0" variant="note" />

Base URL: `https://api.nexuscrm.internal/v1`

Autenticação: `Authorization: Bearer {token}`

---

## Leads

### GET /leads
Lista leads com paginação e filtros.

```http
GET /leads?page=1&limit=20&score_min=70
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Empresa XYZ",
      "score": 84,
      "stage": "qualified",
      "created_at": "2026-05-14T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "total": 243, "limit": 20 }
}
```

---

### POST /leads
Cria um novo lead.

```http
POST /leads
Content-Type: application/json

{
  "company": "Empresa XYZ",
  "contact_email": "contato@empresa.com",
  "source": "linkedin",
  "initial_data": { ... }
}
```

---

## Agents

### POST /agents/{name}/run
Executa um agente manualmente. Ver [AI Agents](/ai-agents/) para documentação completa.

---

## Webhooks

_Documentação em breve._

Eventos disponíveis: `lead.created`, `lead.scored`, `lead.stage_changed`, `opportunity.created`
```

- [ ] **Step 5: Criar skeleton — workflows**

```mdx
---
title: Workflows
description: Fluxos automatizados e integrações do CRM
---

import { Badge } from '@astrojs/starlight/components';

# Workflows <Badge text="Em construção" variant="caution" />

---

## Workflow: Novo Lead Recebido

**Trigger:** Lead criado via formulário, API ou integração  
**Duração estimada:** 30-60 segundos (scoring + qualificação inicial)

1. Lead salvo no banco
2. **Lead Scorer** executa (síncrono, ~2s)
3. Score registrado, prioridade atribuída
4. Se score ≥ 70 → vendedor notificado via Slack
5. **Qualifier Agent** entra em fila (assíncrono)
6. Primeiro e-mail de qualificação enviado em até 5 minutos

---

## Workflow: Follow-up Automático

**Trigger:** Lead sem resposta por N dias (configurável)  
**Configuração:** Admin define N por stage do pipeline

_Documentação detalhada em breve._

---

## Workflow: Detecção de Risco

**Trigger:** Sentiment Analyzer detecta tom negativo  
**Ação:** Alerta imediato para vendedor + gestor

_Documentação detalhada em breve._

---

## Como Criar um Workflow Customizado

_Documentação em breve._
```

- [ ] **Step 6: Validar todas as páginas no browser**

```bash
npm run dev
```

Verificar que todas as rotas funcionam abrindo:
- `http://localhost:4321/ai-agents/` — diagrama Mermaid, cards, código
- `http://localhost:4321/produto/` — skeleton com badge "Em construção"
- `http://localhost:4321/governanca/` — skeleton com tabela SLA
- `http://localhost:4321/api-reference/` — skeleton com exemplos HTTP
- `http://localhost:4321/workflows/` — skeleton com fluxos

Verificar que sidebar mostra todas as páginas. Fechar com Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add src/content/docs/
git commit -m "feat: página AI Agents rica e skeleton das páginas restantes"
```

---

## FASE 4 — CI/CD

### Task 8: GitHub Actions deploy.yml

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Criar diretório e arquivo de workflow**

```bash
mkdir -p C:/Projetos/nexusdocs-ai/.github/workflows
```

- [ ] **Step 2: Criar `.github/workflows/deploy.yml`**

```yaml
# .github/workflows/deploy.yml
#
# Workflow de CI/CD para NexusDocs AI
#
# V1: Build + validação no push à main
#
# Para ativar deploy automático, descomente uma das seções abaixo:
# - GitHub Pages: descomente o job "deploy-pages"
# - Vercel: descomente o job "deploy-vercel" e configure os secrets
#
name: CI — Build e Validação

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependências
        run: npm ci

      - name: Build
        run: npm run build

      - name: Validar estrutura de documentação
        run: |
          echo "Validando estrutura de docs..."
          test -d dist || (echo "ERRO: diretório dist não encontrado" && exit 1)
          test -f dist/index.html || (echo "ERRO: index.html não gerado" && exit 1)
          test -d dist/visao-geral || (echo "ERRO: página visao-geral não gerada" && exit 1)
          test -d dist/arquitetura || (echo "ERRO: página arquitetura não gerada" && exit 1)
          test -d dist/ai-agents || (echo "ERRO: página ai-agents não gerada" && exit 1)
          echo "Estrutura validada com sucesso."

      - name: Upload artefato do site
        uses: actions/upload-artifact@v4
        with:
          name: nexusdocs-ai-dist
          path: dist/
          retention-days: 7

  # ============================================================
  # DEPLOY — GitHub Pages
  # Para ativar:
  #   1. Descomente este job
  #   2. Em Settings > Pages, selecione "GitHub Actions" como source
  #   3. Adicione `base: '/nexusdocs-ai/'` no astro.config.mjs se
  #      o repo não for o root do seu GitHub Pages
  # ============================================================
  #
  # deploy-pages:
  #   name: Deploy para GitHub Pages
  #   needs: build
  #   if: github.ref == 'refs/heads/main'
  #   runs-on: ubuntu-latest
  #   permissions:
  #     contents: read
  #     pages: write
  #     id-token: write
  #   environment:
  #     name: github-pages
  #     url: ${{ steps.deployment.outputs.page_url }}
  #   steps:
  #     - name: Download artefato
  #       uses: actions/download-artifact@v4
  #       with:
  #         name: nexusdocs-ai-dist
  #         path: dist/
  #     - name: Setup Pages
  #       uses: actions/configure-pages@v4
  #     - name: Upload para Pages
  #       uses: actions/upload-pages-artifact@v3
  #       with:
  #         path: dist/
  #     - name: Deploy
  #       id: deployment
  #       uses: actions/deploy-pages@v4

  # ============================================================
  # DEPLOY — Vercel
  # Para ativar:
  #   1. Descomente este job
  #   2. Instale o Vercel CLI: npm i -g vercel
  #   3. Execute: vercel link (para linkar o projeto)
  #   4. Adicione os secrets no GitHub:
  #      - VERCEL_TOKEN (em vercel.com/account/tokens)
  #      - VERCEL_ORG_ID (em .vercel/project.json após link)
  #      - VERCEL_PROJECT_ID (em .vercel/project.json após link)
  # ============================================================
  #
  # deploy-vercel:
  #   name: Deploy para Vercel
  #   needs: build
  #   if: github.ref == 'refs/heads/main'
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: actions/setup-node@v4
  #       with:
  #         node-version: '20'
  #         cache: 'npm'
  #     - run: npm ci
  #     - run: npm install -g vercel
  #     - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
  #     - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
  #     - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

- [ ] **Step 3: Validar build local antes de commitar**

```bash
cd C:/Projetos/nexusdocs-ai
npm run build
```

Expected: diretório `dist/` criado, nenhum erro de TypeScript ou Astro. Verificar que `dist/index.html`, `dist/visao-geral/index.html`, `dist/arquitetura/index.html` existem.

```bash
ls dist/
```

Expected: `index.html`, `visao-geral/`, `arquitetura/`, `ai-agents/`, etc.

- [ ] **Step 4: Commit final**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: GitHub Actions CI/CD — build e validação com deploy comentado para Pages/Vercel"
```

- [ ] **Step 5: Verificação final completa**

```bash
npm run build && npm run dev
```

Abrir no browser e verificar o checklist final:
- [ ] Homepage com Hero premium (gradiente, badge, CTAs)
- [ ] Sidebar com todas as páginas listadas
- [ ] Visão Geral com FeatureCards em grid
- [ ] Arquitetura com 2 diagramas Mermaid renderizados
- [ ] AI Agents com diagrama de fluxo e cards
- [ ] Páginas skeleton (produto, governança, api-reference, workflows) carregando
- [ ] Dark mode aplicado em todo o site
- [ ] Tipografia Inter + JetBrains Mono
- [ ] Header sticky com blur

Fechar dev server com Ctrl+C.

- [ ] **Step 6: Tag de release da V1**

```bash
git tag -a v1.0.0 -m "NexusDocs AI V1 — documentação viva com visual SaaS enterprise"
```

---

## Notas de Implementação

### Se o `npm create astro` pedir para sobrescrever arquivos existentes
Confirmar `yes` — o scaffold do Starlight cria a estrutura base e os arquivos de spec em `docs/` não são afetados.

### Se o Mermaid não renderizar no browser
Abrir o DevTools (F12) e verificar o console. O erro mais comum é `id already exists` — isso é resolvido automaticamente pelo gerador de IDs aleatórios no componente `MermaidDiagram.astro`.

### Se o Tailwind não aplicar estilos
Verificar se `applyBaseStyles: false` está configurado no `tailwind()` dentro do `astro.config.mjs`. Sem isso, os estilos base do Tailwind conflitam com os do Starlight.

### Sobre o `defaultColorScheme: 'dark'`
Esta opção força o dark mode como padrão mas ainda permite que o usuário troque para light. Para remover o toggle completamente, adicione `disable: true` nas opções de i18n do Starlight — mas não recomendado para V1.
```
