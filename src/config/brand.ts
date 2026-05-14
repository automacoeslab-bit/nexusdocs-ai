// src/config/brand.ts
// ─────────────────────────────────────────────
// PAINEL DE CONTROLE DA MARCA
// Para trocar de cliente: edite apenas este arquivo
// e substitua src/assets/brand/logo.png pelo logo do cliente.
// ─────────────────────────────────────────────

export const brand = {
  // Nome que aparece no header e na aba do browser
  name: 'TomikCRM',

  // Subtítulo usado no Hero da homepage
  tagline: 'Documentação técnica do CRM com Inteligência Artificial. Operação comercial de ponta a ponta — agentes, automações e resultados rastreáveis.',

  // Descrição usada nos metadados (SEO, compartilhamento)
  description: 'Documentação técnica do TomikCRM — CRM com IA de ponta a ponta',

  // Versão exibida no badge do Hero
  version: 'v2026',

  // URL do repositório GitHub (ícone no header)
  github: 'https://github.com/automacoeslab-bit/nexusdocs-ai',

  // Logo — coloque o arquivo PNG em src/assets/brand/logo.png
  logo: {
    src: './src/assets/brand/logo.png',
    alt: 'TomikCRM',
    replacesTitle: true, // logo já contém o nome da marca
  },

  // Paleta de cores — identidade visual TomikCRM 2026
  // Fonte: manual de marca (Sociedade das Marcas)
  colors: {
    accent:  '#7C8D52', // verde oliva — cor de destaque da marca
    bg:      '#12170E', // verde escuro quase preto — fundo da página
    surface: '#1C2118', // sidebar, header (entre bg e card)
    card:    '#252129', // cards, code blocks (cinza-roxo escuro da marca)
    border:  '#2E3B24', // divisores, bordas (+12.5% do verde escuro)
    text:    '#FFFFFF', // texto principal
    muted:   '#90A362', // texto secundário (+12.5% do accent)
  },
} as const;
