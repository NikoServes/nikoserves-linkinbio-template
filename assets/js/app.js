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

  // === Phase 11 — Click count display (deferred fetch, silent failure) ===
  //
  // Plain English: AFTER the buttons are rendered, fire one fetch to /api/counts.
  // If it returns 200 with a valid payload, find any link that has clickCount.show
  // and append a count badge under it; also render a site-wide counter if the
  // top-level siteCounter.show is true.
  //
  // Silent failure (D-09): any error — 503, network down, malformed JSON, missing
  // config keys — falls through to do nothing. The bio + buttons stay clean.
  // NO console.* output in this block on the live site.
  //
  // No animation (D-11): plain DOM insertion. The deferred fetch already creates
  // a ~100-300ms gap; animating the appearance would risk visible CLS.
  //
  // Locale 'en-US' (D-10): matches Niko's American military audience tone.
  //
  // Per-link → event-name mapping (Plan 11-02 Task 1): derived from the same
  // slug logic used by the Phase 4 data-umami-event attribute on line ~99 of
  // this file. The mapping is `${section_slug}_${link.icon}`. A future
  // clickCount.eventName field could override this; out of scope for v1.

  function deferCounts() {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(loadCounts, { timeout: 2000 });
    } else {
      setTimeout(loadCounts, 50);
    }
  }

  async function loadCounts() {
    try {
      // Bail early if neither feature is configured — saves the fetch entirely.
      const hasSiteCounter = !!(config.siteCounter && config.siteCounter.show);
      const hasPerLink = config.sections.some(function (s) {
        return s.links.some(function (l) { return l.clickCount && l.clickCount.show; });
      });
      if (!hasSiteCounter && !hasPerLink) return;

      const res = await fetch('/api/counts', { credentials: 'omit' });
      if (!res.ok) return;   // 503 from Plan 11-01 lands here — silent skip

      const data = await res.json();
      if (!data || typeof data !== 'object') return;
      const events = data.events || {};
      const pageViews = data.pageViews || 0;
      const totalAll = data.total || 0;

      // Site-wide counter
      if (hasSiteCounter) {
        renderSiteCounter(config.siteCounter, events, pageViews, totalAll);
      }

      // Per-link counters
      if (hasPerLink) {
        renderPerLinkCounts(events);
      }
    } catch (_err) {
      // D-09: silent. No console output on the live site.
    }
  }

  function renderSiteCounter(cfg, events, pageViews, totalAll) {
    if (!cfg || !cfg.template) return;
    const count = resolveSiteCounterSource(cfg.source, events, pageViews, totalAll);
    if (count == null) return;
    const formatted = formatCount(count, cfg.format);
    const text = cfg.template.replace('{count}', formatted);

    const el = document.createElement('div');
    el.className = 'site-counter';
    el.textContent = text;   // textContent — safe (no XSS via template injection)

    // Position the element per cfg.position
    const sectionsContainer = document.querySelector('[data-config="sections"]');
    const bioEl = document.querySelector('[data-config="bio"]');
    const position = cfg.position || 'above-buttons';

    if (position === 'above-bio' && bioEl && bioEl.parentNode) {
      bioEl.parentNode.insertBefore(el, bioEl);
    } else if (position === 'below-buttons' && sectionsContainer) {
      sectionsContainer.parentNode.insertBefore(el, sectionsContainer.nextSibling);
    } else if (sectionsContainer) {
      // Default + 'above-buttons'
      sectionsContainer.parentNode.insertBefore(el, sectionsContainer);
    }
  }

  function resolveSiteCounterSource(source, events, pageViews, totalAll) {
    if (!source || source === 'all-links') return totalAll;
    if (source === 'page-views') return pageViews;
    if (source.indexOf('section:') === 0) {
      const sectionLabel = source.slice('section:'.length);
      const sectionSlug = sectionLabel.toLowerCase().replace(/\s+/g, '_');
      // Sum every event whose name starts with `${sectionSlug}_`
      let sum = 0;
      for (const evtName in events) {
        if (evtName.indexOf(sectionSlug + '_') === 0) sum += events[evtName] || 0;
      }
      return sum;
    }
    if (source.indexOf('link:') === 0) {
      const eventName = source.slice('link:'.length);
      return events[eventName] || 0;
    }
    return null;   // unknown source — silent skip
  }

  function renderPerLinkCounts(events) {
    for (const section of config.sections) {
      const sectionSlug = section.label.toLowerCase().replace(/\s+/g, '_');
      for (const link of section.links) {
        if (!link.clickCount || !link.clickCount.show || !link.clickCount.template) continue;
        const eventName = sectionSlug + '_' + link.icon;
        const count = events[eventName] || 0;
        const formatted = formatCount(count, link.clickCount.format);
        const text = link.clickCount.template.replace('{count}', formatted);

        // Find the <a> that matches this link via data-umami-event attribute
        const anchor = document.querySelector('a[data-umami-event="' + cssEscapeAttr(eventName) + '"]');
        if (!anchor || !anchor.parentNode) continue;

        const span = document.createElement('span');
        span.className = 'link-count';
        span.textContent = text;   // textContent — safe
        anchor.parentNode.insertBefore(span, anchor.nextSibling);
      }
    }
  }

  function formatCount(n, format) {
    try {
      if (format === 'raw') {
        return new Intl.NumberFormat('en-US').format(n);   // 1,234
      }
      return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);   // 1.2K
    } catch (_err) {
      // Older browsers without `notation: compact` — fall back to raw
      return String(n);
    }
  }

  // Minimal CSS-attribute-value escaper (no external dependency).
  // event names are slugs ([a-z0-9_-]+) so this is mostly defensive.
  function cssEscapeAttr(value) {
    return String(value).replace(/["\\]/g, '\\$&');
  }

  deferCounts();

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

    // Phase 14 — Avatar iridescent border. Bridges theme.avatarBorder config into CSS:
    // scalars become CSS custom properties, enum/mode values become body data-* attributes.
    // All optional — an absent key (or style "none") leaves the avatar exactly as today.
    if (theme.avatarBorder && theme.avatarBorder.style && theme.avatarBorder.style !== 'none') {
      var ab = theme.avatarBorder;
      if (body) {
        body.dataset.avatarBorderStyle = ab.style;                       // none|solid|gradient|iridescent
        body.dataset.avatarBorderMode = ab.mode || 'full';               // full|directional
        body.dataset.avatarBorderAnimated = ab.animated ? 'true' : 'false';
      }
      // thickness: clamp to the 2-16px range, default 5
      var t = parseInt(ab.thickness, 10);
      if (isNaN(t)) t = 5;
      t = Math.max(2, Math.min(16, t));
      root.style.setProperty('--avatar-border-thickness', t + 'px');
      // focal angle: 8-way name -> conic `from` angle in degrees
      var FOCAL_ANGLE = { 'top': 0, 'top-right': 45, 'right': 90, 'bottom-right': 135,
        'bottom': 180, 'bottom-left': 225, 'left': 270, 'top-left': 315 };
      var focalDeg = FOCAL_ANGLE[ab.focal];
      if (focalDeg === undefined) focalDeg = 45;
      root.style.setProperty('--avatar-border-focal', focalDeg + 'deg');
      // solid + gradient colors (consumed by the non-iridescent styles)
      if (ab.solidColor)    root.style.setProperty('--avatar-border-solid', ab.solidColor);
      if (ab.gradientFrom)  root.style.setProperty('--avatar-border-grad-from', ab.gradientFrom);
      if (ab.gradientTo)    root.style.setProperty('--avatar-border-grad-to', ab.gradientTo);
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
