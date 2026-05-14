// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      title: 'NexusDocs AI',
      description: 'Documentação viva do CRM com IA — ferramenta de engenharia interna',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/automacoeslab-bit/nexusdocs-ai' },
      ],
      defaultLocale: 'root',
      locales: {
        root: { label: 'Português', lang: 'pt-BR' },
      },
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
