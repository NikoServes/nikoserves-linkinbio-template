# nikoserves-linkinbio-template

A self-hosted, static link-in-bio template for creators. Fork it, drop in your config, deploy to Cloudflare Pages — your audience hits your custom domain, not Linktree or a third-party tool.

> Derived from [LittleLink](https://github.com/sethcottle/littlelink) (MIT) by Seth Cottle.

- **Live demo:** https://nikoserves.com/
- **Setup wizard:** https://nikoserves.com/setup (requires an access code — contact niko@nikoserves.com)

## What you get

- Static HTML/CSS/JS — no build step, no backend
- Cloudflare Pages free tier hosting (your only ongoing cost is the yearly domain fee)
- Cookieless analytics: Cloudflare Web Analytics (page views) + Umami Cloud (per-link clicks)
- Five starter themes (Light / Neon / Aurora / Aurora-animated / Pulse / and the default dark) — swap by editing one config field
- 20+ pre-styled brand buttons (TikTok, Instagram, YouTube, LinkedIn, X, Threads, Spotify, Twitch, Discord, GitHub, Reddit, Pinterest, Snapchat, SoundCloud, Patreon, Ko-fi, Buy Me a Coffee, Cash App, Venmo, PayPal, and more)
- Per-link power: spotlight CTAs, scheduled launches, subtitles, QR codes, embedded YouTube/Spotify, custom icon overrides
- Theme polish: cover banner, full-page background image, gradient text on headlines, avatar crop position
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
    "faviconPath": "/images/your-favicon.png",
    "coverImage": "/images/your-banner.jpg"
  },
  "themePath": "/themes/nikoserves.css",
  "theme": {
    "accent": "#optional-hex-override",
    "backgroundImage": "/images/your-background.jpg",
    "textColor": "#ffffff",
    "gradientFrom": "#00e5ff",
    "gradientTo": "#a855f7",
    "avatarPosition": "50% 30%"
  },
  "sections": [
    {
      "label": "Section header text",
      "links": [
        { "icon": "tiktok", "label": "Button text", "url": "https://..." },
        {
          "icon": "youtube",
          "label": "Watch the launch video",
          "url": "https://...",
          "spotlight": true,
          "subtitle": "Free 7-day trial",
          "visibleFrom": "2026-06-01T09:00:00Z",
          "visibleUntil": "2026-06-30T23:59:59Z",
          "iconUrl": "/images/my-logo.svg",
          "qrImage": "/images/qr-launch.png",
          "embed": { "type": "youtube", "id": "dQw4w9WgXcQ" }
        }
      ]
    }
  ],
  "analytics": { "umamiWebsiteId": "your-umami-uuid-or-leave-empty" }
}
```

Every field except `title`, `profile.name`, `profile.handle`, `profile.bio`, `profile.avatarPath`, `profile.faviconPath`, `themePath`, and `sections[]` is optional — leave it out (or set to an empty string) and the page falls back to a sensible default.

**Important:** also update the inline `<script id="app-config">` block at the bottom of `index.html` to match. The two must stay in sync — the inline copy is what the page reads on first paint (zero-latency, no fetch flash).

## Configuration reference

Every field in `config.json`, in detail. Required fields throw a console warning if missing; optional fields fall back to a sensible default or render nothing.

### `title`

- **Type:** string
- **Required:** yes
- **What it does:** sets the page `<title>` tag (browser tab text and SEO).
- **Example:** `"Your Name — Links"`

### `profile.name`

- **Type:** string
- **Required:** yes
- **What it does:** display name in the big header at the top of the page.
- **Example:** `"Your Name"`

### `profile.handle`

- **Type:** string
- **Required:** yes
- **What it does:** the `@handle` shown directly under the display name.
- **Example:** `"@yourhandle"`

### `profile.bio`

- **Type:** string
- **Required:** yes
- **What it does:** one-line tagline shown between the handle and the credential badge. Keep it under ~200 characters for layout.
- **Example:** `"Builder, writer, and coffee enthusiast — links to everything I do."`

### `profile.credential`

- **Type:** string
- **Required:** no (use `""` to omit the badge entirely)
- **What it does:** small badge-style line under the bio. Plain text only — emoji rendering is inconsistent on Windows browsers (Chrome/Brave/Edge render country-flag emoji as letters). For a flag, use the `<img class="flag-icon">` pattern in `index.html` instead (see the `images/flag-us.svg` asset).
- **Example:** `"Founder & CEO"`

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

### `profile.coverImage`

- **Type:** string (path)
- **Required:** no
- **What it does:** renders a banner image (~180px tall) across the top of the page, above the avatar. Recommended dimensions ~1200×400 px. Leave unset to skip the banner.
- **Example:** `"/images/cover-banner.jpg"`

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

### `theme.textColor`

- **Type:** string (CSS color)
- **Required:** no
- **What it does:** overrides the default text color on every button. Useful when your gradient or accent clashes with a brand button's recommended text color. Leave unset to use each brand's recommended color.
- **Example:** `"#ffffff"`

### `theme.backgroundImage`

- **Type:** string (path)
- **Required:** no
- **What it does:** full-page background image, layered above `theme.background`. Use darkened or blurred imagery so text stays legible. Leave unset to use the theme's flat or gradient background.
- **Example:** `"/images/page-bg.jpg"`

### `theme.gradientFrom` + `theme.gradientTo` (+ optional `theme.gradientAngle`)

- **Type:** strings (CSS colors; angle is a CSS angle like `"90deg"`)
- **Required:** no (must set both `gradientFrom` and `gradientTo` to activate)
- **What it does:** applies a gradient fill to the `<h1>` display name AND every `<h2>` section header. Strictly scoped to those two elements — body text and buttons are untouched, so contrast stays safe. `gradientAngle` defaults to a sensible value if omitted.
- **Example:** `"gradientFrom": "#00e5ff"`, `"gradientTo": "#a855f7"`, `"gradientAngle": "90deg"`

### `theme.avatarPosition`

- **Type:** string (CSS `object-position` value — `"X% Y%"`)
- **Required:** no
- **What it does:** repositions the photo inside the avatar circle. Useful when your headshot's subject isn't dead-center. `"50% 30%"` pulls the image 30% from the top, centered horizontally.
- **Example:** `"50% 30%"`

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
- **Example:** `"https://tiktok.com/@yourhandle"`

### `sections[].links[].spotlight`

- **Type:** boolean
- **Required:** no
- **What it does:** makes one link stand out — bigger, bolder, with a subtle pulse animation. The pulse auto-disables for visitors who have `prefers-reduced-motion` enabled. Best used on one CTA per page; multiple spotlights cancel each other out visually.
- **Example:** `"spotlight": true`

### `sections[].links[].subtitle`

- **Type:** string
- **Required:** no
- **What it does:** small line of text under the main button label (e.g. `"Free 7-day trial"` under a `"Buy course"` button). Single line — truncated with an ellipsis if it's too long for the button width.
- **Example:** `"subtitle": "Free 7-day trial"`

### `sections[].links[].iconUrl`

- **Type:** string (path)
- **Required:** no
- **What it does:** overrides the preset brand icon SVG with a custom image (your personal logo, a product shot, etc.). The brand color from `.button-<icon>` still applies — only the icon graphic changes. Drop your image into `/images/` and reference its path here.
- **Example:** `"iconUrl": "/images/my-logo.svg"`

### `sections[].links[].visibleFrom`

- **Type:** ISO 8601 datetime string
- **Required:** no
- **What it does:** hides the link until this date/time. Good for scheduled launches — set it once, push to GitHub today, and the link appears automatically. Uses the visitor's browser clock, so it's a convenience feature, not access control.
- **Example:** `"visibleFrom": "2026-06-01T09:00:00Z"`

### `sections[].links[].visibleUntil`

- **Type:** ISO 8601 datetime string
- **Required:** no
- **What it does:** hides the link after this date/time. Pair it with `visibleFrom` for limited-time offers that go up and come down without you touching the repo.
- **Example:** `"visibleUntil": "2026-06-30T23:59:59Z"`

### `sections[].links[].qrImage`

- **Type:** string (path)
- **Required:** no
- **What it does:** renders a QR code image (120×120 px, white background) directly ABOVE the button. Generate the QR elsewhere (e.g. a free online generator), drop the image into `/images/`, and reference it here. Useful for in-person events or printed materials.
- **Example:** `"qrImage": "/images/qr-newsletter.png"`

### `sections[].links[].embed`

- **Type:** object `{ "type": "youtube" | "spotify", "id": "..." }`
- **Required:** no
- **What it does:** renders a lazy-loaded YouTube video or Spotify track embed BELOW the button. `type` must be `"youtube"` or `"spotify"` (any other value is skipped with a console warning). `id` is the YouTube video ID (the part after `?v=` in the URL) or the Spotify track ID. Keep it to at most two embeds per page — Lighthouse Performance starts to drop above that.
- **Example:** `"embed": { "type": "youtube", "id": "dQw4w9WgXcQ" }`

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
- `/themes/aurora.css` — cool gradient dark theme
- `/themes/aurora-animated.css` — same look as aurora, but the background slowly shifts colors over time. Honors `prefers-reduced-motion` (visitors with that setting see the static version).
- `/themes/sunset.css` — warm orange/pink gradient dark theme
- `/themes/pulse.css` — subtle pulsing accent that draws the eye to buttons. Also honors `prefers-reduced-motion`.

To make a custom theme: copy one of the files, edit the `--theme-bg`, `--theme-accent`, `--theme-button` values, save as `/themes/yourtheme.css`, set `themePath` to its path in `config.json`. See **Writing a custom theme** above for a worked example.

## Brand button icons

`/images/icons/` ships with 100+ brand SVGs (notion, tiktok, instagram, facebook, youtube, calendly, github, linkedin, mastodon, paypal, spotify, twitch, and many more).

Roughly 20+ of these have matching color styles wired up in `/css/brands.css` out of the box — TikTok, Instagram, YouTube, Facebook, LinkedIn, X, Threads, Pinterest, Reddit, Snapchat, SoundCloud, Spotify, Twitch, GitHub, Discord, Patreon, PayPal, Venmo, Cash App, Buy Me a Coffee, Ko-fi, and a handful more. To use any other icon from the SVG library:

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

## Small UI extras (no config needed)

A few things ship as plain HTML/CSS — no config field, just available when you want them.

- **US flag icon** — `/images/flag-us.svg` is ready to drop into your credential badge instead of the `🇺🇸` emoji (emoji flag rendering is inconsistent across browsers and operating systems). Use it inside the `.badge` span:
  ```html
  <span class="badge"><img class="flag-icon" src="/images/flag-us.svg" alt=""> U.S. Army • Active Duty</span>
  ```
- **Bio paragraph width cap** — the `.column > p` rule in `style.css` caps the bio paragraph width to ~300px on desktop, so a long bio doesn't sprawl past the column of buttons. No action needed; it just works.
- **Cache-buster on `style.css`** — the `<link>` tag in `index.html` points at `/css/style.css?v=3`. Whenever you ship a CSS change, bump that number (e.g. `?v=4`) so visitors' browsers fetch the new file instead of serving a stale cached copy.

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
│   ├── neon.css
│   ├── aurora.css
│   ├── aurora-animated.css # Animated; honors prefers-reduced-motion
│   ├── sunset.css          # Warm orange/pink gradient
│   └── pulse.css           # Pulsing accent; honors prefers-reduced-motion
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
