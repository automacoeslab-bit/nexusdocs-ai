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
      logo: brand.logo,
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
        './src/styles/global.css',
        './src/styles/custom.css',
      ],
      components: {
        Hero: './src/components/overrides/Hero.astro',
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
