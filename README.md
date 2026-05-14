# nikoserves-linkinbio-template

A self-hosted, static link-in-bio template for creators. Fork it, drop in your config, deploy to Cloudflare Pages — your audience hits your custom domain, not Linktree or a third-party tool.

> Derived from [LittleLink](https://github.com/sethcottle/littlelink) (MIT) by Seth Cottle.

- **Live demo:** https://nikoserves.com/
- **Setup wizard:** https://nikoserves.com/setup (requires an access code — contact niko@nikoserves.com)

## What you get

- Static HTML/CSS/JS — no build step, no backend
- Cloudflare Pages free tier hosting (your only ongoing cost is the yearly domain fee)
- Cookieless analytics: Cloudflare Web Analytics (page views) + Umami Cloud (per-link clicks)
- Three starter themes (NikoServes / Light / Neon) — swap by editing one config field
- Mobile-first; Lighthouse Performance 90+

## Quick start (60 seconds, via the hosted wizard)

1. Go to https://nikoserves.com/setup, enter your access code, fill the form, click **Download config.json**.
2. **Fork this repo** to your GitHub account.
3. Replace the `config.json` in your fork with the one you downloaded.
4. Replace `/images/avatar-placeholder.svg` with your photo (any SVG or PNG named the same path).
5. Replace `/images/avatar.png` with your favicon (32x32 PNG recommended).
6. Commit and push.
7. Create a Cloudflare Pages project pointing at your fork. Settings: **Framework = None**, build command empty, output dir `/`.
8. Add your custom domain via Cloudflare Pages → Settings → Custom domains.

You're live.

## Manual setup (no wizard)

Edit `config.json` directly. Schema:

```json
{
  "title": "Your page <title>",
  "profile": {
    "name": "Display name in the big header",
    "handle": "@your-social-handle",
    "bio": "One-line tagline shown above your links",
    "credential": "Optional badge text — supports emoji",
    "avatarPath": "/images/your-avatar.svg",
    "faviconPath": "/images/your-favicon.png"
  },
  "themePath": "/themes/nikoserves.css",
  "theme": { "accent": "#optional-hex-override" },
  "sections": [
    {
      "label": "Section header text",
      "links": [
        { "icon": "tiktok", "label": "Button text", "url": "https://..." }
      ]
    }
  ],
  "analytics": { "umamiWebsiteId": "your-umami-uuid-or-leave-empty" }
}
```

**Important:** also update the inline `<script id="app-config">` block at the bottom of `index.html` to match. The two must stay in sync — the inline copy is what the page reads on first paint (zero-latency, no fetch flash).

## Themes

- `/themes/nikoserves.css` — dark + cyan accent (the live demo theme)
- `/themes/light.css` — clean white + dark text
- `/themes/neon.css` — synthwave / cyberpunk

To make a custom theme: copy one of the files, edit the `--theme-bg`, `--theme-accent`, `--theme-button` values, save as `/themes/yourtheme.css`, set `themePath` to its path in `config.json`.

## Brand button icons

`/images/icons/` ships with 100+ brand SVGs (notion, tiktok, instagram, facebook, youtube, calendly, github, linkedin, mastodon, paypal, spotify, twitch, and many more).

The default `config.json` and CSS only style 6 of them (the ones the live demo uses). To use a new icon:

1. Confirm `/images/icons/yourbrand.svg` exists (or add your own SVG there).
2. Add a CSS rule to `/css/brands.css`:
   ```css
   .button-yourbrand {
     --button-text: #ffffff;
     --button-background: #brand-color-hex;
   }
   ```
3. Reference `"icon": "yourbrand"` in a `config.json` link.

## Analytics

The template ships with **no analytics by default**. To enable:

1. Register at https://cloud.umami.is, add your domain, copy the website ID (UUID).
2. Paste the UUID into `config.json` → `analytics.umamiWebsiteId` AND into the inline `<script id="app-config">` block in `index.html`.
3. Add this line to `index.html`'s `<head>` (right before `</head>`):
   ```html
   <script defer src="https://cloud.umami.is/script.js" data-website-id="YOUR-UUID-HERE"></script>
   ```
4. Enable Cloudflare Web Analytics in your Pages dashboard → Settings → Web Analytics → Enable. Cloudflare auto-injects its beacon at the edge — no extra `<script>` needed.

No cookie banner required — both Umami Cloud and Cloudflare Web Analytics are cookieless.

## Project structure

```
.
├── index.html              # Main page; reads inline <script id="app-config">
├── 404.html                # Branded 404 (real HTTP 404 via Cloudflare Pages edge)
├── config.json             # Your editable config — must stay in sync with index.html's inline block
├── assets/js/app.js        # ~100 lines vanilla JS; reads config, renders links, applies theme
├── css/
│   ├── reset.css           # CSS reset
│   ├── style.css           # Layout, typography, scale tokens
│   └── brands.css          # Brand button styles
├── themes/
│   ├── nikoserves.css      # Default theme
│   ├── light.css
│   └── neon.css
└── images/
    ├── avatar-placeholder.svg   # Replace with your photo
    ├── avatar.png               # Favicon
    └── icons/                   # Brand SVGs
```

## License

MIT — see [LICENSE](LICENSE).

Derived from [LittleLink](https://github.com/sethcottle/littlelink) (also MIT) by Seth Cottle.
