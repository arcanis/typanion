module.exports = {
  title: `Typanion`,
  tagline: `Type-safe runtime type validation with no dependencies`,
  url: `https://mael.dev/typanion/`,
  baseUrl: process.env.CONTEXT === `production` ? `/typanion/` : `/`,
  onBrokenLinks: `throw`,
  onBrokenMarkdownLinks: `warn`,
  favicon: `logo.svg`,
  organizationName: `arcanis`,
  projectName: `typanion`,
  themeConfig: {
    sidebarCollapsible: false,
    algolia: {
      apiKey: `47075646ffba88bf3475b4b640843da6`,
      indexName: `typanion`,
    },
    navbar: {
      title: `Typanion`,
      logo: {
        alt: `Typanion Logo`,
        src: `logo.svg`,
      },
      items: [
        {
          to: `docs/`,
          activeBasePath: `docs`,
          label: `Docs`,
          position: `left`,
        },
        {
          href: `https://github.com/arcanis/typanion`,
          label: `GitHub`,
          position: `right`,
        },
      ],
    },
    footer: {
      style: `dark`,
      links: [
        {
          title: `Community`,
          items: [
            {
              label: `Discord`,
              href: `https://discordapp.com/invite/yarnpkg`,
            },
          ],
        },
        {
          title: `More`,
          items: [
            {
              label: `GitHub`,
              href: `https://github.com/arcanis/typanion`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Typanion, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: require(`prism-react-renderer/themes/vsDark`),
    },
  },
  presets: [
    [
      `@docusaurus/preset-classic`,
      {
        docs: {
          sidebarPath: require.resolve(`./sidebars.js`),
          editUrl: `https://github.com/arcanis/typanion/edit/master/website/`,
        },
        blog: {
          showReadingTime: true,
          editUrl: `https://github.com/arcanis/typanion/edit/master/website/blog/`,
        },
        theme: {
          customCss: require.resolve(`./src/css/custom.css`),
        },
      },
    ],
  ],
};
