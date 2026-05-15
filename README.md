# NexusDocs — Documentação Inteligente para o Seu Produto

> Site de documentação profissional que atualiza sozinho a cada edição. Sem servidor, sem complicação.

---

## O que é o NexusDocs?

O NexusDocs transforma arquivos Markdown simples em um site de documentação completo, com sidebar, busca, tema escuro e links funcionais — publicado automaticamente em menos de 1 minuto após qualquer alteração.

**Você edita um arquivo → faz um commit → o site atualiza sozinho.**

O seu time de conteúdo nunca precisa tocar no código deste repositório.

---

## Como funciona

```
Repositório de conteúdo (docs-notion)
    │
    └─→ Push de qualquer arquivo
            │
            └─→ NexusDocs detecta a mudança
                    │
                    └─→ Sincroniza, compila e publica
                            │
                            ├─→ GitHub Pages  (gratuito)
                            └─→ Vercel        (domínio customizado)
```

---

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Passo 1 — Criar sua conta no GitHub](#passo-1--criar-sua-conta-no-github)
- [Passo 2 — Criar o repositório de conteúdo](#passo-2--criar-o-repositório-de-conteúdo)
- [Passo 3 — Criar sua cópia do NexusDocs](#passo-3--criar-sua-cópia-do-nexusdocs)
- [Passo 4 — Criar conta no Vercel](#passo-4--criar-conta-no-vercel)
- [Passo 5 — Configurar o projeto no Vercel](#passo-5--configurar-o-projeto-no-vercel)
- [Passo 6 — Obter os tokens necessários](#passo-6--obter-os-tokens-necessários)
- [Passo 7 — Rodar o setup](#passo-7--rodar-o-setup)
- [Passo 8 — Personalizar o site](#passo-8--personalizar-o-site)
- [Como escrever documentação](#como-escrever-documentação)
- [Como adicionar imagens e diagramas](#como-adicionar-imagens-e-diagramas)
- [Como adicionar um domínio customizado](#como-adicionar-um-domínio-customizado)
- [Perguntas frequentes](#perguntas-frequentes)

---

## Pré-requisitos

Antes de começar, você vai precisar de:

| O que | Para quê | Custo |
|---|---|---|
| [Conta no GitHub](https://github.com/signup) | Armazenar o código e disparar o deploy | Gratuito |
| [Conta no Vercel](https://vercel.com/signup) | Publicar o site com domínio customizado | Gratuito (Hobby) |
| [Node.js 18+](https://nodejs.org/en/download) | Rodar o script de setup | Gratuito |
| [Git](https://git-scm.com/downloads) | Clonar o repositório | Gratuito |
| [GitHub CLI](https://cli.github.com/) | Configurar secrets automaticamente | Gratuito |

> **Dica:** Instale o Node.js primeiro — ele já vem com o `npm` que você vai usar nos próximos passos.

---

## Passo 1 — Criar sua conta no GitHub

1. Acesse **[github.com/signup](https://github.com/signup)**
2. Escolha um nome de usuário (ex: `minha-empresa`)
3. Confirme o e-mail
4. Na pergunta sobre tipo de conta, escolha **Free**

---

## Passo 2 — Criar o repositório de conteúdo

Este repositório vai guardar apenas os arquivos Markdown da sua documentação. Seu time de conteúdo vai trabalhar aqui.

1. Acesse **[github.com/new](https://github.com/new)**
2. Nome do repositório: `docs` (ou qualquer nome que preferir)
3. Visibilidade: **Private** (recomendado) ou Public
4. Marque **"Add a README file"**
5. Clique em **Create repository**

Guarde a URL deste repositório — você vai precisar dela no Passo 7.

---

## Passo 3 — Criar sua cópia do NexusDocs

1. Acesse **[github.com/automacoeslab-bit/nexusdocs-ai](https://github.com/automacoeslab-bit/nexusdocs-ai)**
2. Clique no botão **"Use this template"** → **"Create a new repository"**
3. Escolha sua conta como dono
4. Nome sugerido: `nexusdocs` ou `docs-site`
5. Visibilidade: **Public** (obrigatório para GitHub Pages gratuito)
6. Clique em **Create repository**

Agora clone o repositório na sua máquina:

```bash
git clone https://github.com/SUA-CONTA/nexusdocs.git
cd nexusdocs
npm install
```

---

## Passo 4 — Criar conta no Vercel

1. Acesse **[vercel.com/signup](https://vercel.com/signup)**
2. Clique em **"Continue with GitHub"** e autorize
3. Escolha o plano **Hobby** (gratuito)

---

## Passo 5 — Configurar o projeto no Vercel

1. No Vercel, clique em **"Add New Project"**
2. Localize seu repositório `nexusdocs` e clique em **Import**
3. Em **Framework Preset**, deixe como **Other**
4. Deixe **Build Command** e **Output Directory** em branco
5. Clique em **Deploy**

> O deploy vai falhar — isso é normal. Só precisamos do projeto criado para pegar os IDs.

Após o deploy falhar:

- Clique em **"Go to Project"** → **Settings → General**
- Role até o final e copie o **Project ID** → anote como `VERCEL_PROJECT_ID`
- Acesse **[vercel.com/account/settings](https://vercel.com/account/settings)** e copie o **Account ID** → anote como `VERCEL_ORG_ID`

---

## Passo 6 — Obter os tokens necessários

Você vai precisar de 2 tokens. Veja como gerar cada um:

### Token do GitHub

O token permite que o NexusDocs leia seu repositório de conteúdo privado.

1. Acesse **[github.com/settings/tokens/new](https://github.com/settings/tokens/new)**
2. Em **Note**, escreva: `nexusdocs`
3. Em **Expiration**, escolha **No expiration** (ou 1 ano)
4. Marque as seguintes permissões:
   - ✅ `repo` — acesso completo a repositórios
   - ✅ `workflow` — para disparar o pipeline
5. Clique em **Generate token**
6. **Copie o token agora** — ele não aparece novamente depois

### Token do Vercel

O token permite que o GitHub Actions publique no Vercel.

1. Acesse **[vercel.com/account/tokens](https://vercel.com/account/tokens)**
2. Clique em **Create**
3. Nome: `nexusdocs-deploy`
4. Escopo: **Full Account**
5. Clique em **Create Token**
6. **Copie o token agora** — ele não aparece novamente depois

---

## Passo 7 — Rodar o setup

Com tudo em mãos, rode o script de configuração dentro da pasta do projeto:

```bash
node setup.mjs
```

O script vai perguntar as informações nesta ordem:

| Pergunta | O que informar |
|---|---|
| Token GitHub | O token gerado no Passo 6 |
| Repositório nexusdocs | Ex: `minha-empresa/nexusdocs` |
| Token para ler o docs-notion | Enter para usar o mesmo token do GitHub |
| Token Vercel | O token Vercel gerado no Passo 6 |
| Vercel Account ID | O `VERCEL_ORG_ID` anotado no Passo 5 |
| Vercel Project ID | O `VERCEL_PROJECT_ID` anotado no Passo 5 |
| Disparar o primeiro deploy? | Digite `s` e pressione Enter |

O script configura tudo automaticamente e dispara o primeiro deploy. Em cerca de 1 minuto seu site estará no ar.

> **Os tokens digitados não aparecem na tela** — isso é intencional por segurança.

---

## Passo 8 — Personalizar o site

Abra o arquivo `src/config/brand.ts` para configurar a identidade do seu produto:

```ts
export const brand = {
  name: 'Nome do Seu Produto',       // aparece no topo da sidebar
  description: 'Descrição curta',    // usado em SEO e meta tags
  logo: {
    src: '/logo.png',                // coloque seu logo em public/
    alt: 'Logo do produto',
  },
  colors: {
    accent:  '#4ade80',              // cor de destaque (botões, links ativos)
    bg:      '#0f1410',              // cor de fundo geral
    surface: '#161d17',              // fundo de cards e painéis
    card:    '#1a2e1c',              // fundo de blocos destacados
    border:  '#2d4a30',              // bordas e separadores
    text:    '#e2f0e3',              // texto principal
    muted:   '#6b8f70',              // texto secundário e labels
  },
}
```

Para trocar o logo:
1. Coloque o arquivo (`.png` ou `.svg`) na pasta `public/`
2. Atualize o campo `logo.src` com o nome do arquivo (ex: `/meu-logo.png`)
3. Faça commit e push — o site atualiza sozinho

---

## Como escrever documentação

Toda a documentação fica no repositório de conteúdo criado no Passo 2. A estrutura de pastas é:

```
docs/
├── modulo-introducao/
│   ├── 01-BOAS-VINDAS-notion.md
│   └── 02-PRIMEIROS-PASSOS-notion.md
├── modulo-funcionalidades/
│   ├── 01-VISAO-GERAL-notion.md
│   └── diags/
│       └── fluxo.png
└── modulo-faq/
    └── 01-PERGUNTAS-FREQUENTES-notion.md
```

Cada pasta `modulo-*` vira uma **seção** na sidebar.
Cada arquivo `*-notion.md` vira uma **página**.

### Regras de nomenclatura

| O que | Formato | Exemplo |
|---|---|---|
| Pasta de seção | `modulo-<nome>` | `modulo-introducao` |
| Arquivo de página | `<numero>-<NOME>-notion.md` | `01-BOAS-VINDAS-notion.md` |
| Imagens | qualquer nome dentro de `diags/` | `diags/fluxo.png` |

**Importante:**
- O número no início (`01-`, `02-`...) define a **ordem** das páginas na sidebar
- O sufixo `-notion.md` é **obrigatório** — arquivos sem ele são ignorados
- Use letras maiúsculas no nome (o sistema converte automaticamente)

### Criar uma página nova pelo GitHub (sem instalar nada)

1. No repositório de conteúdo, navegue até a pasta do módulo
2. Clique em **Add file → Create new file**
3. Nome do arquivo: `03-MINHA-PAGINA-notion.md`
4. Escreva o conteúdo em Markdown
5. Clique em **Commit changes**

O site atualiza em menos de 1 minuto.

### Exemplo de conteúdo mínimo

```markdown
# Título da Página

Escreva o conteúdo normalmente aqui.

## Seção 1

Texto da seção.

## Seção 2

Mais conteúdo.
```

### Criar uma nova seção (módulo)

1. No repositório de conteúdo, clique em **Add file → Create new file**
2. No campo do nome, digite: `modulo-nova-secao/01-INTRODUCAO-notion.md`
   - O GitHub cria a pasta automaticamente quando você inclui `/` no nome
3. Escreva o conteúdo e faça commit

---

## Como adicionar imagens e diagramas

Organize as imagens dentro de uma pasta `diags/` no módulo correspondente:

```
modulo-funcionalidades/
├── 01-VISAO-GERAL-notion.md
└── diags/
    ├── arquitetura.png
    └── fluxo-pagamento.svg
```

### Passo a passo

1. Dentro da pasta do módulo, crie a subpasta `diags/`
2. Faça upload da imagem para dentro de `diags/`
3. No arquivo `.md`, referencie assim:

```markdown
![Descrição da imagem](diags/arquitetura.png)
```

**Formatos aceitos:** `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`

> **Atenção:** A pasta deve se chamar exatamente `diags/` — sem variação de nome.

---

## Como adicionar um domínio customizado

Após o setup inicial, você pode apontar um domínio próprio (ex: `docs.seusite.com.br`) para o Vercel:

1. No Vercel, acesse seu projeto → **Settings → Domains**
2. Clique em **Add Domain**
3. Digite o domínio (ex: `docs.seusite.com.br`)
4. Siga as instruções do Vercel para configurar o DNS no seu provedor de domínio (Registro.br, GoDaddy, Cloudflare, etc.)

O Vercel fornece as instruções exatas de acordo com seu provedor.

---

## Perguntas frequentes

**O site não atualizou após meu commit — o que fazer?**

Aguarde até 2 minutos. Se ainda não atualizou, verifique o status em:
`https://github.com/SUA-CONTA/nexusdocs/actions`

Se houver um ❌ vermelho, clique no workflow com erro para ver o log detalhado.

---

**Posso editar pelo computador ao invés do GitHub?**

Sim. Clone o repositório de conteúdo normalmente, edite com qualquer editor de texto (VS Code, Notepad++, etc.) e faça `git push`. O resultado é o mesmo.

---

**O arquivo sumiu do site mas ainda está no repositório — por quê?**

Verifique se o nome do arquivo termina em `-notion.md`. Arquivos sem esse sufixo são ignorados pelo pipeline.

---

**Posso ter vários colaboradores editando o conteúdo?**

Sim. Convide as pessoas no repositório de conteúdo em **Settings → Collaborators**. Cada colaborador pode editar diretamente pelo site do GitHub, sem precisar instalar nada.

---

**Como troco a conta do Vercel para a da empresa depois?**

Basta atualizar os secrets no GitHub:

1. Acesse `https://github.com/SUA-CONTA/nexusdocs/settings/secrets/actions`
2. Atualize `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` com os valores da nova conta
3. O próximo deploy já vai para a conta nova automaticamente

---

**Posso usar formatação rica no Markdown?**

Sim: tabelas, listas, negrito, itálico, blocos de código, links e imagens funcionam normalmente. Consulte o **[Guia de Markdown do GitHub](https://docs.github.com/pt/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)** para referência completa.

---

## Suporte

Dúvidas ou problemas? Entre em contato com quem configurou seu NexusDocs.
