import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/form-signals/',
  title: 'Form Signals',
  description:
    'Reactive and fully type-safe form state management/validation library',
  head: [['link', { rel: 'icon', href: '/form-signals/logo-bg.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo-no-bg.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'Roadmap', link: '/roadmap' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'What are Signals?', link: '/guide/what-are-signals' },
          {
            text: 'Quickstart',
            link: '/guide/quickstart',
            items: [{ text: 'React', link: '/guide/react/quickstart' }],
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
            items: [{ text: 'React', link: '/guide/react/basic-usage' }],
          },
          // TODO Add async usage implementation, examples and docs
          // {
          //   text: 'Async Usage',
          //   link: '/guide/async-usage',
          //   items: [{ text: 'React', link: '/guide/react/async-usage' }],
          // },
          { text: 'Validation', link: '/guide/validation' },
          {
            text: 'Array Fields',
            link: '/guide/array-fields',
            items: [{ text: 'React', link: '/guide/react/array-fields' }],
          },
          {
            text: 'Examples',
            link: '/guide/examples',
            items: [{ text: 'React', link: '/guide/react/examples' }],
          },
        ],
      },
      {
        text: 'Reference',
        collapsed: true,
        items: [
          {
            text: 'Core',
            collapsed: true,
            items: [
              { text: 'FormLogic', link: '/reference/core/FormLogic' },
              { text: 'FieldLogic', link: '/reference/core/FieldLogic' },
            ],
          },
          {
            text: 'React',
            collapsed: true,
            items: [
              { text: 'useForm', link: '/reference/react/useForm' },
              { text: 'useField', link: '/reference/react/useField' },
            ],
          },
        ],
      },
    ],

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
