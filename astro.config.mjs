import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { brand } from './src/config/brand.ts';
import { readFileSync, existsSync } from 'fs';

const { colors } = brand;

// Lê o sidebar gerado pelo pipeline. Fallback vazio se ainda não existir.
// Remove o campo `icon` dos grupos, pois o schema strict do Starlight não o aceita.
function stripIcon(entry) {
  if (entry && typeof entry === 'object' && Array.isArray(entry.items)) {
    const { icon: _icon, ...rest } = entry;
    return { ...rest, items: entry.items.map(stripIcon) };
  }
  return entry;
}
const generatedSidebar = existsSync('./cache/generated-sidebar.json')
  ? JSON.parse(readFileSync('./cache/generated-sidebar.json', 'utf-8')).map(stripIcon)
  : []

export default defineConfig({
  site: 'https://automacoeslab-bit.github.io',
  base: '/nexusdocs-ai',
  integrations: [
    starlight({
      title: brand.name,
      description: brand.description,
      defaultLocale: 'root',
      locales: {
        root: { label: 'Português', lang: 'pt-BR' },
      },
      social: [],
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
