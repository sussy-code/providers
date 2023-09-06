import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "MW provider docs",
  description: "Documentation for @movie-web/providers",
  srcDir: "src",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get Started', link: '/get-started/start' },
      { text: 'Reference', link: '/reference/start' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/movie-web/providers' }
    ]
  }
})
