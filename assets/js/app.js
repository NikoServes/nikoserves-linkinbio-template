// /assets/js/app.js — runs on DOMContentLoaded thanks to defer attribute on <script>
// Plain English: reads the inline JSON config block, then fills in the page.
(function () {
  // Phase 9.3 — Curated Google Fonts allow-list (OFL-licensed; preconnect-friendly)
  // Keys map to opt-in `theme.font` config values. `null` (system) means no fetch.
  const CURATED_FONTS = {
    system:           null,
    inter:            { family: "Inter",          weights: "400;600;700", cssName: '"Inter", system-ui, sans-serif' },
    'dm-sans':        { family: "DM+Sans",        weights: "400;600;700", cssName: '"DM Sans", system-ui, sans-serif' },
    fraunces:         { family: "Fraunces",       weights: "400;600;700", cssName: '"Fraunces", Georgia, serif' },
    'space-grotesk':  { family: "Space+Grotesk",  weights: "400;600;700", cssName: '"Space Grotesk", system-ui, sans-serif' },
    'crimson-text':   { family: "Crimson+Text",   weights: "400;600;700", cssName: '"Crimson Text", Georgia, serif' }
  };

  // Step 1: find the inline JSON block
  const node = document.getElementById('app-config');
  if (!node) {
    console.error('[nikoserves] No #app-config block found in HTML');
    return;
  }

  // Step 2: parse it — JSON.parse gives a clear line/column error on typos
  let config;
  try {
    config = JSON.parse(node.textContent);
  } catch (err) {
    console.error('[nikoserves] config.json failed to parse:', err);
    return;
  }

  // Step 2.5: inject brand theme vars from config into CSS custom properties.
  // This runs before profile text is written so theme is applied ASAP.
  // CSS fallback values in style.css mean this is an enhancement, not a requirement.
  applyTheme(config.theme);

  // Step 3: fill in profile fields using textContent (not inner-HTML — prevents XSS)
  setText('[data-config="name"]',       config.profile.name);
  setText('[data-config="handle"]',     config.profile.handle);
  setText('[data-config="bio"]',        config.profile.bio);
  setText('[data-config="credential"]', config.profile.credential);

  // Phase 10.1 — Cover/banner image (D-05). Class toggle reveals the element; default state is hidden.
  if (config.profile.coverImage) {
    const cover = document.querySelector('[data-config="cover"]');
    if (cover) {
      cover.style.backgroundImage = `url("${config.profile.coverImage}")`;
      cover.classList.add('cover--has-image');
    }
  }

  // Step 3.5: write head-level metadata and asset paths from config (Phase 7, PROD-01 + TMPL-01)
  if (config.title) document.title = config.title;
  setAttr('meta[data-config="author"]',  'content', config.profile.name);
  setAttr('link[data-config="favicon"]', 'href',    config.profile.faviconPath);
  setAttr('img[data-config="avatar"]',   'src',     config.profile.avatarPath);
  setAttr('link#theme-css',              'href',    config.themePath);

  // Step 4: render sections + buttons into [data-config="sections"]
  const container = document.querySelector('[data-config="sections"]');
  if (!container) return;

  for (const section of config.sections) {
    // Section heading
    const header = document.createElement('h2');
    header.className = 'section-label';
    header.textContent = section.label;   // textContent — safe
    container.appendChild(header);

    // Links within section
    for (const link of section.links) {
      // Security: reject non-http URLs before they reach the DOM
      if (!link.url.startsWith('https://') && !link.url.startsWith('http://')) {
        console.warn('[nikoserves] Skipping unsafe URL:', link.url);
        continue;
      }

      // Phase 10.2 — Link scheduling (D-10).
      // Caveat: this uses the visitor's browser clock and is NOT access control.
      // Use it for convenience ("launch a sale at noon Friday"), not security.
      if (link.visibleFrom || link.visibleUntil) {
        const now = Date.now();
        if (link.visibleFrom  && now < Date.parse(link.visibleFrom))  continue;   // Not yet
        if (link.visibleUntil && now > Date.parse(link.visibleUntil)) continue;   // Expired
      }

      const a = document.createElement('a');
      a.className = `button button-${link.icon}`;
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';    // security: prevents tab-jacking
      a.setAttribute('role', 'button');

      // Phase 10.2 — Spotlight link (D-07). Adds .button--spotlight class for accent border + pulse.
      if (link.spotlight) a.classList.add('button--spotlight');

      // Per-link analytics: outbound-only Umami event (ANLYT-05 / Umami issue #3144)
      if (link.url.startsWith('http')) {
        const labelSlug = section.label.toLowerCase().replace(/\s+/g, '_');
        a.setAttribute('data-umami-event', `${labelSlug}_${link.icon}`);
      }

      // Brand icon
      const img = document.createElement('img');
      img.className = 'icon';
      img.setAttribute('aria-hidden', 'true');
      img.src = `/images/icons/${link.icon}.svg`;
      img.alt = `${link.label} Logo`;   // safe string assignment
      img.width = 20;                    // matches .icon CSS (1.25rem = 20px); reserves layout space → CLS
      img.height = 20;
      // Phase 10.2 — Per-link icon override (D-08). Overrides the default /images/icons/${icon}.svg path.
      // The brand-class color (.button-${icon}) still applies; only the icon graphic changes.
      if (link.iconUrl) img.src = link.iconUrl;
      a.appendChild(img);

      a.appendChild(document.createTextNode(link.label));  // textContent — safe

      // Phase 10.2 — Subtitle text under the label (D-09). Optional; truncates with ellipsis via CSS.
      if (link.subtitle) {
        const sub = document.createElement('small');
        sub.className = 'button-subtitle';
        sub.textContent = link.subtitle;
        a.appendChild(document.createElement('br'));
        a.appendChild(sub);
      }

      // Phase 10.2 hotfix — Per-link QR image (optional; image lives in creator's repo).
      // Renders ABOVE the button. Creator supplies a relative path string (e.g. /images/qr-bmc.png).
      if (link.qrImage) {
        const qrImg = document.createElement('img');
        qrImg.className = 'link-qr';
        qrImg.src = link.qrImage;
        qrImg.alt = '';
        qrImg.setAttribute('aria-hidden', 'true');
        container.appendChild(qrImg);
      }

      container.appendChild(a);

      // Phase 10.3 — Embedded media (D-11/D-12; lazy-loaded; safelisted types only).
      // Renders BELOW the button. Only `youtube` and `spotify` types are safelisted —
      // any other type is logged and skipped. encodeURIComponent(id) prevents URL injection.
      // The iframe `allow` attribute is the minimum each provider requires.
      if (link.embed && link.embed.type && link.embed.id) {
        const EMBED_TEMPLATES = {
          youtube: function (id) {
            return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          },
          spotify: function (id) {
            return `<iframe src="https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=generator" loading="lazy" allow="encrypted-media"></iframe>`;
          }
        };
        const renderer = EMBED_TEMPLATES[link.embed.type];
        if (!renderer) {
          console.warn('[linkinbio] Unknown embed type:', link.embed.type);
        } else {
          const wrap = document.createElement('div');
          wrap.className = 'link-embed link-embed--' + link.embed.type;
          wrap.innerHTML = renderer(link.embed.id);
          container.appendChild(wrap);
        }
      }
    }
  }

  // Helper: set textContent only if element exists and value is non-empty
  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) el.textContent = value;
  }

  // Helper: set an attribute only if element exists and value is non-empty
  function setAttr(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el && value) el.setAttribute(attr, value);
  }

  // Reads theme values from config and injects them as CSS custom properties
  // on the root element. Each token has a CSS fallback, so partial failure is safe.
  function applyTheme(theme) {
    const root = document.documentElement;
    const body = document.body;
    if (theme.background) root.style.setProperty('--theme-bg',     theme.background);
    if (theme.accent)     root.style.setProperty('--theme-accent', theme.accent);
    if (theme.button)     root.style.setProperty('--theme-button', theme.button);

    // Phase 9.1 additions — bridge new theme fields (all optional, CSS fallbacks preserve current look)
    if (theme.buttonRadius) root.style.setProperty('--button-radius', theme.buttonRadius);
    if (theme.buttonStyle && body) body.dataset.buttonStyle = theme.buttonStyle;
    if (theme.avatarShape) {
      const radius = { circle: '50%', square: '0', rounded: '0.75rem' }[theme.avatarShape];
      if (radius) root.style.setProperty('--avatar-radius', radius);
    }
    // Phase 9.4 cherry-pick — Avatar crop position (full wizard UI ships in 9.4)
    if (theme.avatarPosition) root.style.setProperty('--avatar-position', theme.avatarPosition);

    // Phase 9.4 — Button text color override (overrides each brand's --button-text default)
    if (theme.textColor) root.style.setProperty('--button-text-override', theme.textColor);

    // Phase 10.1 — Image background overlay (D-03). Layered ABOVE the flat/gradient via CSS multi-value background.
    if (theme.backgroundImage) {
      root.style.setProperty('--theme-bg-image', `url("${theme.backgroundImage}")`);
    }

    // Phase 9.4 — Gradient headlines (D-03 STRICT scope: h1[data-config="name"] + h2.section-label ONLY)
    if (theme.gradientFrom && theme.gradientTo) {
      root.style.setProperty('--gradient-from', theme.gradientFrom);
      root.style.setProperty('--gradient-to',   theme.gradientTo);
      if (theme.gradientAngle) root.style.setProperty('--gradient-angle', theme.gradientAngle);

      // Tag the display name <h1> — it exists at this point because index.html declares it
      var h1 = document.querySelector('h1[data-config="name"]');
      if (h1) h1.classList.add('gradient-text');

      // Tag section headers — they're created later in the render loop; watch for them
      var sectionContainer = document.querySelector('[data-config="sections"]');
      if (sectionContainer) {
        var tagSections = function () {
          sectionContainer.querySelectorAll('h2.section-label:not(.gradient-text)').forEach(function (h) {
            h.classList.add('gradient-text');
          });
        };
        // Tag any already-rendered section labels
        tagSections();
        // And keep tagging as the section-rendering loop appends more
        var mo = new MutationObserver(tagSections);
        mo.observe(sectionContainer, { childList: true, subtree: true });
      }
    }

    // Phase 9.3 — Font picker: inject Google Fonts <link> when a curated font is selected.
    // theme.font === 'system' (or undefined) → no fetch, no DOM change. Default.
    if (theme.font && CURATED_FONTS[theme.font]) {
      const f = CURATED_FONTS[theme.font];
      // f is null for the 'system' key; only inject when non-null.
      if (f) {
        const linkId = 'theme-font-css';
        let link = document.getElementById(linkId);
        if (!link) {
          link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = `https://fonts.googleapis.com/css2?family=${f.family}:wght@${f.weights}&display=swap`;
        root.style.setProperty('--font-body', f.cssName);
      }
    }
  }
})();
