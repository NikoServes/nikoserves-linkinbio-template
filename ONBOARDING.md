# Operator onboarding checklist

This doc is for the person bringing a new creator online — that's you, the operator. Follow it top to bottom. Every step lists what to verify before moving on.

The goal: deliver a live, custom-domain link-in-bio site for a new client in about an hour.

## Before you start — info to collect

Get all of this from the client before you touch a keyboard. You'll save yourself two rounds of "wait, what's your TikTok URL again?" back-and-forth.

- [ ] Creator's preferred display name + handle (e.g. `"@username"`)
- [ ] Bio / tagline (≤ 200 characters)
- [ ] Credential badge text (optional; supports emoji — e.g. `"🎙️ Podcast host"`)
- [ ] List of social URLs (TikTok / Instagram / Facebook / YouTube / etc.) — VERIFY each one resolves in a browser before deploy
- [ ] Profile photo (SVG or PNG, square aspect ratio, ≥ 200×200px)
- [ ] Favicon (32×32 PNG)
- [ ] Preferred theme (NikoServes / Light / Neon — show them the live demos at https://nikoserves.com/)
- [ ] Domain — do they have one already? Is it on Cloudflare DNS? If not, expect 24-48h propagation delay after they update nameservers.
- [ ] Will THEY have GitHub access, or will you (the operator) host the fork in your own GitHub account?

If any of these are missing, stop and chase them down. Half the deploy delays come from waiting on a missing avatar.

## Step 1 — Fork the template

Two ways:

**Option A — GitHub "Use this template" button** (if enabled on the template repo). Visit https://github.com/NikoServes/nikoserves-linkinbio-template, click **Use this template**, name the new repo something like `clientname-linkinbio`.

**Option B — Manual fork.** Click **Fork** on the template repo. Either way, the result is the same: a new repo under your or the client's GitHub account.

**Verify before continuing:** open the new repo in GitHub. Confirm `config.json`, `index.html`, and the `themes/` directory are all present.

## Step 2 — Generate the config

Two ways:

**Option A — Hosted wizard (recommended).** Send the client (or use yourself) to https://nikoserves.com/setup. The wizard is gated by an access code — request one from `niko@nikoserves.com`. Fill in the form fields (name, handle, bio, social links, theme), click **Download config.json**, and you've got a ready-to-commit file.

**Option B — Edit directly.** Open `config.json` in the fork. Refer to the **Configuration reference** section of https://github.com/NikoServes/nikoserves-linkinbio-template/blob/master/README.md to know what each field does. Edit in your local clone or via the GitHub web editor.

**Verify before continuing:** open the new `config.json` and confirm: title is set, profile fields are filled in, at least one section with one link exists, no `"Your Name"` or `"@yourhandle"` placeholders are left over.

**Revising an existing site?** The setup wizard can also *import* a `config.json` instead of starting from a blank form. Open the wizard at `/setup` and use the **Import an existing config** fieldset at the top — either pick a saved `config.json` file or click **Load my live config** to pull the currently-deployed config straight off the live site. The form fills in, you edit it visually, then re-download. This is the easy path for a handoff to a new operator or a round of edits months later — no need to rebuild the whole form by hand.

## Step 3 — Replace images

Exactly two files to swap in `/images/`:

1. **Profile photo** — `/images/avatar-placeholder.svg`. Replace with the client's photo. If they sent a PNG, rename their file to `avatar-placeholder.png` and update `profile.avatarPath` in `config.json` to `"/images/avatar-placeholder.png"`. (Or keep the SVG filename and replace contents.)
2. **Favicon** — `/images/avatar.png`. Replace with the client's 32×32 favicon. If they sent a different size, resize it down to 32×32 first.

**Verify before continuing:** commit the image changes to the fork. Open the GitHub web view of each replaced file and confirm the new image is showing.

## Step 4 — Create Cloudflare Pages project

1. Log into the Cloudflare dashboard.
2. Go to **Workers & Pages** → **Pages** → **Create application** → **Connect to Git**.
3. Authorize Cloudflare to read the client's (or your) GitHub repos.
4. Select the new fork.
5. Configure the build:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Output directory:** `/`
6. Click **Save and Deploy**.
7. Wait ~60 seconds for the first build.

**Verify before continuing:** Cloudflare gives the project a `<random-name>.pages.dev` URL. Open it. Confirm the page renders correctly — client's name, photo, bio, all the links visible. If it shows "Your Name" placeholder text, the `config.json` and inline `<script id="app-config">` block in `index.html` are out of sync — go back and fix.

## Step 5 — Add custom domain

This is fast (~5 min) if the domain is already on Cloudflare DNS, slower (hours) if the client needs to move nameservers first.

1. In the Pages project, go to **Custom domains** → **Set up a custom domain**.
2. Enter `clientdomain.com` (the apex domain).
3. Cloudflare auto-creates the DNS records when the domain is on the same Cloudflare account. If it's on a different account or registrar, Cloudflare gives you a CNAME record to add manually.
4. Wait for the SSL certificate to provision. The status flips from **Verifying** to **Active**.
5. Repeat for `www.clientdomain.com`.
6. Add a Redirect Rule (under the zone's **Rules** → **Redirect Rules**) using the "Redirect from www to root" template so `www.clientdomain.com` redirects to `clientdomain.com` (or the other way around — pick one and stick with it).

**Verify before continuing:** open `https://clientdomain.com` AND `https://www.clientdomain.com` in incognito. Both should serve the page (one might redirect to the other — that's correct). Check that the padlock icon shows a valid certificate.

## Step 6 — Wire up analytics

Two trackers, both free.

**Umami Cloud (per-link clicks):**

1. Go to https://cloud.umami.is. Sign in (or create the account if you're doing it on the client's behalf).
2. **Add a website** → enter the client's domain → save.
3. Copy the **Website ID** (a UUID).
4. In the fork's `config.json`, set `analytics.umamiWebsiteId` to that UUID.
5. In the fork's `index.html`, find the inline `<script id="app-config">` block at the bottom — set `analytics.umamiWebsiteId` to the same UUID there.
6. In the fork's `index.html`, find the `<script>` tag that loads `https://cloud.umami.is/script.js` and set `data-website-id="..."` to the same UUID.
7. Commit and push. Cloudflare Pages redeploys in ~60 seconds.

**Cloudflare Web Analytics (page views, traffic, referrers):**

1. In the Pages project → **Settings** → **Web Analytics** → **Enable**.
2. That's it. Cloudflare auto-injects the beacon at the edge.

**Verify before continuing:** visit the live domain in incognito. Click a link. In Umami's **Realtime** tab, the click should appear within a few seconds. In Cloudflare's Web Analytics tab, the pageview will show up within a minute.

## Step 7 — Handoff to client

- [ ] Email the client their live URL (the custom domain, not the `.pages.dev` URL)
- [ ] Send them a link to USAGE.md: https://github.com/NikoServes/nikoserves-linkinbio-template/blob/master/USAGE.md
- [ ] Send them their Umami dashboard login (or invite them as a Viewer if you want to keep admin access)
- [ ] Note the yearly domain renewal date in your calendar — set a reminder 30 days before
- [ ] Save any custom CSS or theme tweaks you made for this client in a notes file (Notion, Google Doc, etc.) so the next operator can pick up the account
- [ ] Confirm in writing that the handoff is complete and what the client owns vs what you own

## Time expectations

| Phase | Time |
|---|---|
| Info collection | 15 min |
| Fork + config + images | 15 min |
| CF Pages create + deploy | 5 min |
| Custom domain attach | 5–60 min (depends on DNS provider) |
| Umami + CF Analytics | 10 min |
| Handoff | 15 min |
| **Total** | **~1 hour** (best case, CF-hosted DNS) |

If the client's domain is on Namecheap, GoDaddy, or another registrar, add 24-48 hours of DNS propagation between Step 5 and the verify check.

## Common gotchas

- **Cookie banner anywhere?** Means a third-party tracker snuck in. Check `index.html` for any stray `<script>` tags besides Umami and Cloudflare Web Analytics. Neither of those needs a banner — they're both cookieless.
- **Site shows "Your Name" placeholder after deploy?** The `config.json` file and the inline `<script id="app-config">` block in `index.html` are out of sync. The page reads the inline block on first paint. Both need the same data.
- **Custom domain stuck on "Verifying" for >30 minutes?** Check the DNS records Cloudflare generated. Sometimes the auto-flow doesn't catch an existing CNAME conflict — manually delete the conflicting record in the zone and Cloudflare will retry.
- **Umami says 0 events but you clicked the links?** Your own browser probably has an ad blocker that blocks `cloud.umami.is`. Test in a fresh incognito window with no extensions. Then confirm the website ID matches in all three places (config.json, inline script, `<script data-website-id>` tag).
- **Lighthouse Performance dropped below 90 after handoff?** The client may have asked for an extra script tag (chat widget, embed, tracker). Each one costs 5-15 points. Push back if the score matters more than the feature.

## What's next?

Once the client's basic setup is live and working, point them at the advanced features in [USAGE.md](USAGE.md) when they're ready to do more — spotlight CTAs, scheduled link launches, embedded YouTube/Spotify, QR codes on individual buttons, cover banner images, full-page background images, gradient headlines, and the animated themes (`aurora-animated`, `pulse`). All of these are optional and configured through `config.json` — no code changes, no rebuilds.
