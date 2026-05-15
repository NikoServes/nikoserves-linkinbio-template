# Your link-in-bio site — usage guide

This guide explains how your link-in-bio site works and how to manage it day-to-day. Your site lives at your custom domain (the one your operator gave you). It was built and deployed by your operator using the [nikoserves-linkinbio-template](https://github.com/NikoServes/nikoserves-linkinbio-template).

Keep this page bookmarked — most questions you'll have are answered here.

## Where to find your analytics

You have two analytics dashboards. They show different things and you'll use them for different reasons.

### Umami (per-link click tracking)

- **URL:** https://cloud.umami.is
- **Login:** your operator sent you the credentials. If you've lost them, ask for a reset.
- **What it shows:** which buttons people click. Use this when you want to know "is anyone clicking my TikTok link?" or "which CTA is winning?"

Two tabs you'll use:

- **Realtime** — clicks happening right now. Open this after you post a TikTok with your link in the bio and watch the counter tick up.
- **Events** — total click counts per link. The button labels look like `start_here_tiktok` — the part before the underscore is the section the button belongs to, the part after is the platform.

### Cloudflare Web Analytics (overall traffic)

- **URL:** https://dash.cloudflare.com → your site → **Web Analytics**
- **Login:** your operator sent you the Cloudflare login (or invited you as a viewer).
- **What it shows:** total page views, top referrers (where visitors came from), country breakdown.

Less detail than Umami at the per-link level, but it catches traffic that Umami misses (visitors with ad blockers).

## When events under-count

A reality of every analytics tool: some clicks won't be counted. Here's what to expect.

- Up to 5–15% of clicks won't appear in Umami due to ad blockers (uBlock Origin and similar block `cloud.umami.is`). This is normal — every analytics tool has the same problem.
- Cloudflare Web Analytics is much harder to block, because Cloudflare injects it at the edge. Use it to spot-check Umami's numbers.
- For the most accurate signal, look at trends over weeks, not single days. A bad day might just be a noisy day.

## How to change a link

You have two options.

### Option A — Tell your operator (easiest)

Email your operator the change. Something like: "Change my TikTok URL to https://tiktok.com/@my-new-handle." They'll update it and push the change. Cloudflare Pages auto-redeploys in about 60 seconds.

This is the right choice if you don't want to touch any code.

### Option B — Edit it yourself in GitHub

If you have access to the GitHub repo, you can edit it through the web interface — no installs, no command line.

1. Open `https://github.com/<your-username>/<your-repo>` in a browser.
2. Click `config.json` to open it.
3. Click the pencil icon (top right of the file view) to edit.
4. Find the link you want to change. Each link looks like `{ "icon": "tiktok", "label": "TikTok", "url": "https://..." }`.
5. Edit the `url` value.
6. Scroll down to **Commit changes**, write a short description (e.g. "update TikTok link"), and commit.
7. Cloudflare Pages auto-deploys in ~60 seconds.

**IMPORTANT:** If you edit `config.json` yourself, you also need to edit the same value inside `index.html` (look for the `<script id="app-config">` block near the bottom of the file). The two must stay in sync — the page reads the inline copy on first paint, then `config.json` on subsequent loads. If they don't match, visitors see stale data.

Your operator can simplify this two-file workflow for you if it becomes a pain — ask them.

## What's the yearly domain fee?

Your only ongoing cost is the domain renewal.

- **Cost:** roughly $10–15 per year for a `.com` (other TLDs vary — `.io` or `.co` can be $30–50/yr).
- **Who you pay:** whoever you registered the domain through (Cloudflare Registrar, Namecheap, GoDaddy, etc.). Not your operator, and not Cloudflare Pages.
- **What's free:** hosting (Cloudflare Pages free tier), SSL certificates (auto-renewed by Cloudflare), analytics (Umami Cloud + Cloudflare Web Analytics free tiers), the wizard. No monthly subscription.

**When does it renew?** Your operator should have noted your renewal date when they handed the site off. Set a calendar reminder 30 days before that date. If you let the domain expire, your site stops resolving — the files are still on Cloudflare, but no one can reach them by name until you renew.

## I want to change my photo

Two files to update:

- **Profile photo** (the big circle at the top of the page) → `/images/avatar-placeholder.svg` (or `.png` if you used a PNG)
- **Favicon** (the tiny icon in the browser tab) → `/images/avatar.png`

Two ways to update them:

- Send the new files to your operator and ask them to swap them in.
- Replace them yourself via GitHub. Open the file in the repo, click the **Delete** button, commit. Then upload the new file with the same name. Cloudflare Pages redeploys automatically.

## Advanced customization

These are extra knobs in `config.json` that your operator can turn on for you, or you can edit them yourself in GitHub if you're comfortable doing that. None of them are required — your site works fine without any of them. Anywhere a setting needs a date, write it as an ISO 8601 string like `"2026-06-01T09:00:00Z"` (the `Z` means UTC).

### Spotlight one link to make it stand out

Add `"spotlight": true` to any link to make it bigger, bolder, and gently pulse. Best for the one CTA you really want clicked (your newest course, a current offer, your booking link).

```json
{ "icon": "youtube", "label": "Watch the launch", "url": "https://...", "spotlight": true }
```

**Tip:** spotlight one link at a time. If everything is highlighted, nothing is.

### Add a subtitle under a button

Small text under the main button label. Good for promo lines like `"Free 7-day trial"` or `"Limited spots"`.

```json
{ "icon": "stripe", "label": "Buy the course", "url": "https://...", "subtitle": "Free 7-day trial" }
```

**Tip:** keep it short — one line, ~30 characters. Longer subtitles get cut off with an ellipsis.

### Schedule a link to appear or disappear

Hide a link until a launch date, or take it down after a deadline. Both fields are optional and you can use either or both.

```json
{
  "icon": "cal",
  "label": "Book a strategy call",
  "url": "https://...",
  "visibleFrom": "2026-06-01T09:00:00Z",
  "visibleUntil": "2026-06-30T23:59:59Z"
}
```

**Tip:** this uses the visitor's browser clock, so it's not bulletproof. Treat it as a convenience for sales and launches, not as access control.

### Add a QR code above a button

Renders a QR code image (120×120 px) directly above the link. Useful when you hand out printed cards or stickers and want people to scan straight into the link.

```json
{ "icon": "buymeacoffee", "label": "Buy me a coffee", "url": "https://...", "qrImage": "/images/qr-bmc.png" }
```

**Tip:** generate the QR code with any free online tool (qr-code-generator.com works fine), then have your operator upload the PNG to `/images/` in the repo.

### Use your own icon instead of the brand default

If you want your own logo on a button instead of, say, the default TikTok icon, point `iconUrl` at an image in `/images/`.

```json
{ "icon": "tiktok", "label": "My TikTok", "url": "https://...", "iconUrl": "/images/my-logo.svg" }
```

**Tip:** the button still uses the brand's color from `.button-tiktok`. Only the icon graphic changes. SVG looks best because it stays crisp at any size.

### Embed a YouTube video or Spotify track under a link

Add an `embed` object to render an inline player BELOW the button. Only YouTube and Spotify are supported.

```json
{
  "icon": "youtube",
  "label": "Watch the launch video",
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "embed": { "type": "youtube", "id": "dQw4w9WgXcQ" }
}
```

For Spotify, use `"type": "spotify"` and put the track ID (the part after `/track/` in the Spotify URL) as the `id`.

**Tip:** stop at two embeds per page. Each one is a third-party iframe and they slow the page down noticeably above that.

### Show a banner image above your avatar

Set `profile.coverImage` to display a banner across the top of the page.

```json
{
  "profile": {
    "name": "Your Name",
    "coverImage": "/images/cover-banner.jpg"
  }
}
```

**Tip:** aim for ~1200×400 pixels. Anything taller pushes the buttons further down the screen on mobile.

### Add a full-page background image

Set `theme.backgroundImage` to layer an image over the theme's solid color or gradient.

```json
{ "theme": { "backgroundImage": "/images/page-bg.jpg" } }
```

**Tip:** darkened or blurred imagery works best — text needs to stay legible. If your bio is hard to read after adding the image, pick a darker photo or skip this feature.

### Gradient color on your name and section headers

Add both `theme.gradientFrom` and `theme.gradientTo` (both are required to activate the gradient). Optional `theme.gradientAngle` controls the direction.

```json
{
  "theme": {
    "gradientFrom": "#00e5ff",
    "gradientTo":   "#a855f7",
    "gradientAngle": "90deg"
  }
}
```

**Tip:** only the big `<h1>` display name and `<h2>` section headers get the gradient — your buttons and bio text are not touched. This protects readability.

### Override the text color on every button

If your button gradient or background clashes with the default brand-text color, force a single text color for every button:

```json
{ "theme": { "textColor": "#ffffff" } }
```

**Tip:** test on light AND dark theme variants before keeping it — what looks great on one might be unreadable on the other.

### Move the avatar crop position

If your headshot's subject isn't centered, nudge the crop with `theme.avatarPosition`. The two numbers are horizontal and vertical percentages.

```json
{ "theme": { "avatarPosition": "50% 30%" } }
```

**Tip:** `"50% 50%"` is dead center (the default). `"50% 30%"` pulls the image up so the visitor sees more of the top of your photo (typically your face).

### Switch to an animated theme

Animated themes look fancy but cost a tiny bit of CPU. Point `themePath` at one of the animated options:

```json
{ "themePath": "/themes/aurora-animated.css" }
```

Available animated themes:

- `/themes/aurora-animated.css` — slowly shifting gradient background
- `/themes/pulse.css` — subtle pulsing accent on buttons

Both honor `prefers-reduced-motion`, so visitors who've set that preference on their device see the static version automatically.

## Troubleshooting

### My site isn't loading

First, check if it's just you — open the site in a different network (mobile data instead of wifi) or an incognito window. If it works elsewhere, the problem is your ISP or local DNS, not the site.

If it's down for everyone:

1. Check the Cloudflare status page: https://www.cloudflarestatus.com. If Cloudflare is having an outage, your site will be down until they fix it. Nothing to do but wait.
2. If Cloudflare is fine, log into the Cloudflare dashboard, go to your Pages project, click **Deployments**. If the most recent deployment shows "Failed," something in a recent change broke the build. Ask your operator to look at it.

### A link goes to the wrong place

Typo in `config.json`. Use Option A above (ask your operator) or Option B (fix it yourself in GitHub).

### Umami shows zero events but I know people are clicking

Most common cause: you have an ad blocker enabled in your own browser, and when YOU click your own links, Umami can't fire. Test in an incognito window with no extensions enabled. If clicks show up there, your own browser was the problem.

Second most common cause: the Umami website ID in `config.json` doesn't match the one in your Umami dashboard. Ask your operator to verify.

### My site looks broken on mobile

This shouldn't happen out of the box — the template is tested at 375px wide and up. If you see something broken, take a screenshot, note which phone and browser, and send it to your operator. Mobile bugs are usually one-line fixes.

## Questions, changes, problems

Email your operator. Typical response time is 24-48 hours. If your operator didn't leave you a contact in the handoff package, ask `niko@nikoserves.com` and we'll route you.

Keep this page bookmarked. Most questions you'll have once a month are already answered above.
