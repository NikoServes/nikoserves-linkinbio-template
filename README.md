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

## Configuration reference

Every field in `config.json`, in detail. Required fields throw a console warning if missing; optional fields fall back to a sensible default or render nothing.

### `title`

- **Type:** string
- **Required:** yes
- **What it does:** sets the page `<title>` tag (browser tab text and SEO).
- **Example:** `"NikoServes — Links"`

### `profile.name`

- **Type:** string
- **Required:** yes
- **What it does:** display name in the big header at the top of the page.
- **Example:** `"NikoServes"`

### `profile.handle`

- **Type:** string
- **Required:** yes
- **What it does:** the `@handle` shown directly under the display name.
- **Example:** `"@nikoserves"`

### `profile.bio`

- **Type:** string
- **Required:** yes
- **What it does:** one-line tagline shown between the handle and the credential badge. Keep it under ~200 characters for layout.
- **Example:** `"Your Army unc. Military tips & money moves from the inside."`

### `profile.credential`

- **Type:** string
- **Required:** no (use `""` to omit the badge entirely)
- **What it does:** small badge-style line under the bio. Supports emoji.
- **Example:** `"🇺🇸 U.S. Army • Active Duty"`

### `profile.avatarPath`

- **Type:** string (path)
- **Required:** yes
- **Default:** `"/images/avatar-placeholder.svg"`
- **What it does:** path to the profile photo shown as a large circle at the top of the page. SVG or PNG; square aspect ratio recommended.
- **Example:** `"/images/avatar-placeholder.svg"`

### `profile.faviconPath`

- **Type:** string (path)
- **Required:** yes
- **Default:** `"/images/avatar.png"`
- **What it does:** path to the favicon (browser tab icon). 32×32 PNG is the safe default.
- **Example:** `"/images/avatar.png"`

### `themePath`

- **Type:** string (path)
- **Required:** yes
- **Default:** `"/themes/nikoserves.css"`
- **What it does:** which theme stylesheet to load. Point at one of the bundled themes or your own.
- **Example:** `"/themes/light.css"`

### `theme.background`

- **Type:** string (CSS color)
- **Required:** no
- **What it does:** runtime override for the page background color. If set, overrides the theme file's `--theme-bg` value. Leave the whole `theme` object as `{}` to use the theme's defaults.
- **Example:** `"#0a0e17"`

### `theme.accent`

- **Type:** string (CSS color)
- **Required:** no
- **What it does:** runtime override for the accent color used on links, focus rings, and highlights. Overrides the theme's `--theme-accent`.
- **Example:** `"#00e5ff"`

### `theme.button`

- **Type:** string (CSS background)
- **Required:** no
- **What it does:** runtime override for the default button background. Accepts solid colors or `linear-gradient(...)` strings. Overrides `--theme-button`.
- **Example:** `"linear-gradient(165deg, #0099b3 0%, #00e5ff 50%, #66f0ff 100%)"`

### `sections[]`

- **Type:** array of objects
- **Required:** yes (must contain at least one section)
- **What it does:** ordered groups of links rendered top to bottom on the page.

### `sections[].label`

- **Type:** string
- **Required:** yes
- **What it does:** section header text rendered above the buttons in that group.
- **Example:** `"Start Here"`

### `sections[].links[]`

- **Type:** array of objects
- **Required:** yes (one or more per section)
- **What it does:** the actual buttons rendered in the section.

### `sections[].links[].icon`

- **Type:** string
- **Required:** yes
- **What it does:** name of the brand icon SVG in `/images/icons/` (without `.svg`) AND the matching CSS class in `css/brands.css` (without the `button-` prefix). For example, `"tiktok"` loads `/images/icons/tiktok.svg` and applies the `.button-tiktok` style.
- **Example:** `"instagram"`

### `sections[].links[].label`

- **Type:** string
- **Required:** yes
- **What it does:** button text the visitor reads.
- **Example:** `"Follow on TikTok"`

### `sections[].links[].url`

- **Type:** string (URL)
- **Required:** yes
- **What it does:** where the button takes the visitor when clicked. Verify each URL resolves before deploy.
- **Example:** `"https://tiktok.com/@nikoserves"`

### `analytics.umamiWebsiteId`

- **Type:** string (UUID) or empty string
- **Required:** no (use `""` to skip Umami integration)
- **What it does:** the Umami Cloud website ID. Drives per-link click event tracking. The `<script>` tag in `index.html` also reads this — keep both in sync.
- **Example:** `"a2bf34da-1234-4691-9fe4-aabbccddeeff"`

## Writing a custom theme

The bundled themes are starting points. To customize colors, copy one and edit five CSS custom properties.

**Step 1 — Duplicate a theme.** Copy `/themes/light.css` to `/themes/mine.css`. (Pick whichever bundled theme is closest to what you want — light, neon, or nikoserves.)

**Step 2 — Edit the custom properties.** Open `/themes/mine.css`. You'll see something like this:

```css
:root {
  --theme-bg: #ffffff;
  --theme-text: #0a0e17;
  --theme-accent: #00a3b3;
  --theme-button: #f4f4f6;
  --theme-button-text: #0a0e17;
}
```

Change the hex values to whatever you want. The five properties cover:

- `--theme-bg` — page background
- `--theme-text` — body text color
- `--theme-accent` — links, focus rings, highlights
- `--theme-button` — default button background (can also be a `linear-gradient(...)`)
- `--theme-button-text` — text color on buttons

**Step 3 — Wire it up.** In `config.json`, set `themePath` to your new file:

```json
"themePath": "/themes/mine.css"
```

**Step 4 — Commit and push.** Cloudflare Pages picks up the change in ~60 seconds.

**Tip:** if you only want a quick accent-color override (not a full new theme), leave `themePath` alone and set `theme.accent` in config.json. That's a one-line tweak with no new file.

## Themes

- `/themes/nikoserves.css` — dark + cyan accent (the live demo theme)
- `/themes/light.css` — clean white + dark text
- `/themes/neon.css` — synthwave / cyberpunk

To make a custom theme: copy one of the files, edit the `--theme-bg`, `--theme-accent`, `--theme-button` values, save as `/themes/yourtheme.css`, set `themePath` to its path in `config.json`. See **Writing a custom theme** above for a worked example.

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

## Troubleshooting

### My site loads but shows the default "Your Name" placeholder

The `config.json` file and the inline `<script id="app-config">` block at the bottom of `index.html` are out of sync. The page reads the inline block on first paint — if you only updated `config.json`, the inline copy still has the old placeholder values. Open `index.html`, scroll to the bottom, and paste the same JSON into the `<script id="app-config">` tag.

### Brand button has no color / shows a generic gray

The icon SVG exists in `/images/icons/`, but there's no matching CSS rule in `/css/brands.css`. Brand buttons need both. Add a rule like:

```css
.button-yourbrand {
  --button-text: #ffffff;
  --button-background: #1a73e8;
}
```

Use the brand's official color. Search for "[brand] brand guidelines" if you don't know the exact hex.

### Custom font doesn't load

Two common causes:

1. Missing `<link rel="preconnect">` to the font CDN (Google Fonts, etc.) in `index.html`'s `<head>`. Without it, the browser does a cold DNS lookup before the font request.
2. Typo in the `font-family` value in your CSS. Font names are case-sensitive and must match exactly what the CDN serves.

### Lighthouse Performance dropped

Things that drag the score:

- Third-party scripts (tracking pixels, embeds, chat widgets) — each one adds 5-15 points of cost.
- Large unoptimized images — keep the avatar under 50KB; prefer SVG when possible.
- Render-blocking CSS — the bundled CSS is already preloaded; don't add new `<link rel="stylesheet">` tags without `media` or `onload` strategies.
- Missing `<link rel="preload">` on the avatar — if you removed it, Lighthouse will flag LCP.

### Umami events don't fire on click

Three things to check, in order:

1. Are you using an ad blocker? uBlock Origin and similar block `cloud.umami.is`. Test in incognito with all extensions disabled.
2. Is the website ID in `analytics.umamiWebsiteId` AND in the `<script data-website-id="...">` tag matching the UUID shown in your Umami dashboard?
3. In Umami's site settings, does the configured domain match the domain the visitor is actually on (apex vs www)? Mismatch silently drops events.

## Performance notes

What to expect out of the box and what affects the scores.

- **Lighthouse Performance:** 90+ on mobile is the design target. The live demo at https://nikoserves.com/ hits 95-100 on a clean run.
- **LCP target:** under 2.5 seconds. The avatar image is the LCP element on this page. It's preloaded via `<link rel="preload">` in `index.html` — don't lazy-load it, or LCP will regress.
- **Analytics cost:** Umami + Cloudflare Web Analytics together add roughly 5 Lighthouse Performance points. That's an acceptable trade for the visibility they buy. Drop Umami if you don't need per-link tracking and you'll get those points back.
- **brands.css size:** ~1.7KB in the default build (only 6 brand styles). If you add custom brand rules, try to keep the file under 5KB — past that, mobile parse time starts to show up in Total Blocking Time.
- **Avatar format:** SVG is already optimal for the placeholder. For photographic avatars, WebP or AVIF will shave another 30-50% off the file size compared to PNG. The browser support is universal in 2026.

## FAQ

### Can I use this commercially?

Yes — MIT license. Use it for your own brand, your clients' brands, charge for setup if you want. Just keep the LICENSE file in your fork.

### Do I need a Cloudflare account?

Yes, for Pages hosting and DNS. The free tier covers everything in this template (Pages, Web Analytics, Registrar if you buy your domain through Cloudflare). No paid plan needed.

### Can I add a payment / Stripe link?

Yes. Add a CSS rule for `.button-stripe` in `/css/brands.css`, drop a Stripe icon SVG into `/images/icons/stripe.svg`, then reference `"icon": "stripe"` in a `config.json` link. Same pattern as any other brand button.

### How do I host this on Netlify / Vercel / S3 instead?

It's a static site — any static host works. Cloudflare Pages is the recommended path because Web Analytics auto-injection is free and one-click. On other hosts you'll lose that integration but Umami still works.

### Will my analytics work if a visitor has uBlock Origin?

Umami may be blocked (cloud.umami.is is on common blocklists). Cloudflare Web Analytics is much harder to block because Cloudflare injects the beacon at the edge — the script comes from the same origin as your page. Expect Umami to under-count by 5-15% overall, with Cloudflare picking up most of what Umami misses.

## License

MIT — see [LICENSE](LICENSE).

Derived from [LittleLink](https://github.com/sethcottle/littlelink) (also MIT) by Seth Cottle.
