# Joyixir Documentation

This is the documentation for [Joyixir](https://joyixir.app), built with [Mintlify](https://mintlify.com).

## Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally:

```bash
npm i -g mintlify
```

Run the following command at the root of your documentation (where `mint.json` is):

```bash
mintlify dev
```

## Publishing Changes

Changes are automatically deployed when pushed to the main branch via Mintlify's GitHub integration.

### Manual Deployment

Install the Mintlify CLI and run:

```bash
mintlify deploy
```

## Documentation Structure

```
joyixir-docs/
├── mint.json              # Mintlify configuration
├── introduction.mdx       # Welcome page
├── quickstart.mdx         # Getting started guide
├── plans-and-credits.mdx  # Pricing information
├── changelog.mdx          # Release notes
├── features/
│   ├── ai-chat.mdx
│   ├── live-preview.mdx
│   ├── code-editor.mdx
│   ├── templates.mdx
│   ├── three-js-support.mdx
│   └── export-deploy.mdx
├── integrations/
│   ├── supabase.mdx
│   ├── github.mdx
│   └── vercel.mdx
└── guides/
    ├── your-first-game.mdx
    ├── prompt-tips.mdx
    ├── troubleshooting.mdx
    └── best-practices.mdx
```

## Adding New Pages

1. Create a new `.mdx` file in the appropriate directory
2. Add frontmatter with title and description:
   ```mdx
   ---
   title: 'Page Title'
   description: 'Brief description'
   ---
   ```
3. Add the page to `mint.json` navigation

## Components

Mintlify provides many built-in components:

- `<Card>` - Clickable cards with icons
- `<CardGroup>` - Grid of cards
- `<Accordion>` - Expandable sections
- `<Tabs>` - Tab panels
- `<Steps>` - Step-by-step guides
- `<CodeGroup>` - Multiple code examples
- `<Frame>` - Image frames
- `<Note>`, `<Warning>`, `<Tip>` - Callouts

See [Mintlify Components](https://mintlify.com/docs/content/components) for full documentation.

## Alternative: Self-Hosted with VitePress

If you prefer not to use Mintlify, you can convert these docs to VitePress:

```bash
npm create vitepress@latest
```

The MDX files are mostly compatible with VitePress markdown.

## Hosting Options

| Platform | Cost | Features |
|----------|------|----------|
| **Mintlify** | $150/mo | Best UX, analytics, search |
| **GitBook** | Free tier | Easy, limited customization |
| **Docusaurus** | Free (self-host) | Full control, React-based |
| **VitePress** | Free (self-host) | Fast, Vue-based |
| **Vercel** | Free tier | For self-hosted solutions |

## Custom Domain

To use `docs.joyixir.app`:

1. Add CNAME record pointing to Mintlify
2. Configure custom domain in Mintlify dashboard
3. Enable HTTPS (automatic with Mintlify)
