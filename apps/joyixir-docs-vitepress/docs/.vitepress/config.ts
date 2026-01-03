import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Joyixir',
  description: 'AI-Powered Game Builder - Create games with natural language',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/features/ai-chat' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'App', link: 'https://joyixir.app' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Joyixir?', link: '/guide/what-is-joyixir' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Your First Game', link: '/guide/first-game' },
          ]
        },
        {
          text: 'Best Practices',
          items: [
            { text: 'Prompt Tips', link: '/guide/prompt-tips' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ]
        }
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'AI Chat', link: '/features/ai-chat' },
            { text: 'Live Preview', link: '/features/live-preview' },
            { text: 'Code Editor', link: '/features/code-editor' },
            { text: 'Templates', link: '/features/templates' },
            { text: '3D Support', link: '/features/three-js' },
            { text: 'Export & Deploy', link: '/features/export' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/joyixir' },
      { icon: 'twitter', link: 'https://twitter.com/joyixir' }
    ],

    footer: {
      message: 'Build games with AI',
      copyright: 'Copyright © 2024 Joyixir'
    },

    search: {
      provider: 'local'
    }
  }
})
