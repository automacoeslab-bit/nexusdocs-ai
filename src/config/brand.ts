// src/config/brand.ts
// ─────────────────────────────────────────────
// PAINEL DE CONTROLE DA MARCA
// Para trocar de cliente: edite apenas este arquivo
// e substitua src/assets/brand/logo.svg pelo logo do cliente.
// ─────────────────────────────────────────────

export const brand = {
  // Nome que aparece no header e na aba do browser
  name: 'NexusDocs AI',

  // Subtítulo usado no Hero da homepage
  tagline: 'Documentação viva para o CRM com Inteligência Artificial. Construída como produto de engenharia — versionada, automatizada, escalável.',

  // Descrição usada nos metadados (SEO, compartilhamento)
  description: 'Documentação viva do CRM com IA — ferramenta de engenharia interna',

  // Versão exibida no badge do Hero
  version: 'v1.0',

  // URL do repositório GitHub (ícone no header)
  github: 'https://github.com/automacoeslab-bit/nexusdocs-ai',

  // Logo — coloque o arquivo SVG em src/assets/brand/logo.svg
  logo: {
    src: './src/assets/brand/logo.svg',
    alt: 'NexusDocs AI',
    replacesTitle: false, // true = só logo, sem texto | false = logo + nome
  },

  // Paleta de cores — dark mode premium
  // Troque o `accent` para a cor principal do cliente (ex: '#10B981' para verde)
  colors: {
    accent:  '#3B82F6', // azul elétrico — cor de destaque principal
    bg:      '#09090B', // fundo da página
    surface: '#111115', // sidebar, header
    card:    '#18181B', // cards, code blocks
    border:  '#27272A', // divisores, bordas
    text:    '#FAFAFA', // texto principal
    muted:   '#A1A1AA', // texto secundário, placeholders
  },
} as const;
