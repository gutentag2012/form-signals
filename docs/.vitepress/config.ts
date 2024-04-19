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
        items: [
          { text: 'What are Signals?', link: '/guide/what-are-signals' },
          {
            text: 'Quickstart',
            link: '/guide/quickstart',
            items: [{ text: 'React', link: '/guide/react/quickstart' }],
          },
          { text: 'Concepts', link: '/guide/concepts' },
          { text: 'Devtools', link: '/guide/devtools' },
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
          { text: 'Validation', link: '/guide/validation' },
          {
            text: 'Array Fields',
            link: '/guide/array-fields',
          },
          {
            text: 'Dynamic Objects',
            link: '/guide/dynamic-objects',
          },
          {
            text: 'Async Usage',
            link: '/guide/async-data',
            items: [{ text: 'React', link: '/guide/react/async-data' }],
          },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          {
            text: 'Core',
            collapsed: true,
            items: [
              { text: 'FormLogic', link: '/reference/core/FormLogic' },
              { text: 'FieldLogic', link: '/reference/core/FieldLogic' },
              { text: 'Validation', link: '/reference/core/Validation' },
              { text: 'Access', link: '/reference/core/Access' },
              { text: 'Signals', link: '/reference/core/Signals' },
            ],
          },
          {
            text: 'React',
            collapsed: true,
            items: [
              { text: 'FormContext', link: '/reference/react/FormContext' },
              { text: 'FormProvider', link: '/reference/react/FormProvider' },
              { text: 'useForm', link: '/reference/react/useForm' },
              { text: 'FieldContext', link: '/reference/react/FieldContext' },
              { text: 'FieldProvider', link: '/reference/react/FieldProvider' },
              { text: 'useField', link: '/reference/react/useField' },
            ],
          },
          {
            text: 'Dev Tools React',
            collapsed: true,
            items: [
              {
                text: 'FormDevTools',
                link: '/reference/dev-tools-react/FormDevTools',
              },
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
