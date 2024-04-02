import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Form Signals',
  description:
    'Reactive and fully type-safe form state management/validation library',
  head: [['link', { rel: 'icon', href: '/logo-bg.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo-no-bg.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'Roadmap', link: '/roadmap' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          collapsed: false,
          items: [
            { text: 'What are Signals?', link: '/guide/what-are-signals' },
            {
              text: 'Quickstart',
              link: '/guide/quickstart',
              items: [{ text: 'React', link: '/guide/quickstart-react' }],
            },
            { text: 'Concepts', link: '/guide/concepts' },
          ],
        },
        {
          text: 'Guides',
          collapsed: false,
          items: [
            {
              text: 'Basic Usage',
              link: '/guide/basic-usage',
              items: [{ text: 'React', link: '/guide/basic-usage-react' }],
            },
            { text: 'Validation', link: '/guide/validation' },
            { text: 'Transformation', link: '/guide/transformation' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gutentag2012/form-signals' },
    ],
  },
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
    config(md) {
      md.use(tabsMarkdownPlugin)
    },
  },
})
