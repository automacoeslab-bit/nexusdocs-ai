// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { brand } from './src/config/brand.ts';
const { colors } = brand;

export default defineConfig({
  integrations: [
    starlight({
      title: brand.name,
      description: brand.description,
      defaultLocale: 'root',
      locales: {
        root: { label: 'Português', lang: 'pt-BR' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: brand.github },
      ],
      // Injeta as cores da marca como CSS custom properties
      // Qualquer mudança em brand.colors reflete automaticamente no site
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
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
