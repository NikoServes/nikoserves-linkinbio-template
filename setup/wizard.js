// Setup Wizard — generates a config.json for a new link-in-bio creator.
// No frameworks, no build. Live preview iframe re-renders on every form change (debounced).

(function () {
  // ===========================
  // Helpers
  // ===========================

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  // Debounce: returns a function that delays calling `fn` until `ms` after the last call.
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  // ===========================
  // Section / link row builders
  // ===========================

  function addSection(label) {
    const tpl = $('#section-template').content.cloneNode(true);
    const row = tpl.querySelector('.section-row');
    if (label) row.querySelector('[name="section-label"]').value = label;
    $('#sections-list').appendChild(tpl);
    queueUpdate();
  }

  function addLink(sectionRow, icon, label, url) {
    const tpl = $('#link-template').content.cloneNode(true);
    if (icon) tpl.querySelector('[name="link-icon"]').value = icon;
    if (label) tpl.querySelector('[name="link-label"]').value = label;
    if (url) tpl.querySelector('[name="link-url"]').value = url;
    sectionRow.querySelector('.links-list').appendChild(tpl);
    queueUpdate();
  }

  // ===========================
  // Read form -> build config object
  // ===========================

  function buildConfig() {
    const form = $('#wizard-form');
    const fd = new FormData(form);

    // Collect sections from DOM (FormData can't represent the nested structure)
    const sections = $$('.section-row').map(function (row) {
      return {
        label: row.querySelector('[name="section-label"]').value.trim(),
        links: $$('.link-row', row).map(function (linkRow) {
          // Phase 10.2 — Per-link power features. New fields are all optional;
          // we emit `undefined` when empty so JSON.stringify drops them entirely.
          var spotlightEl    = linkRow.querySelector('[name="link-spotlight"]');
          var iconUrlEl      = linkRow.querySelector('[name="link-iconUrl"]');
          var subtitleEl     = linkRow.querySelector('[name="link-subtitle"]');
          var visibleFromEl  = linkRow.querySelector('[name="link-visibleFrom"]');
          var visibleUntilEl = linkRow.querySelector('[name="link-visibleUntil"]');
          // Phase 10.2 hotfix — Per-link QR image path
          var qrImageEl      = linkRow.querySelector('[name="link-qrImage"]');
          // Phase 10.3 — Embedded media (YouTube/Spotify). Both type + ID must be set
          // to emit; otherwise the embed object is dropped from the link.
          var embedTypeEl    = linkRow.querySelector('[name="link-embed-type"]');
          var embedIdEl      = linkRow.querySelector('[name="link-embed-id"]');
          var embedType      = (embedTypeEl && embedTypeEl.value) || '';
          var embedId        = (embedIdEl   && embedIdEl.value.trim()) || '';
          var embed          = (embedType && embedId) ? { type: embedType, id: embedId } : undefined;

          // Phase 11 — Per-link clickCount (opt-in). Emit `undefined` when the toggle is
          // off OR when no template is supplied, so JSON.stringify drops the key entirely
          // from the downloaded config. Same defensive reader pattern as Phase 10.2.
          var ccShowEl     = linkRow.querySelector('[name="link-clickcount-show"]');
          var ccTemplateEl = linkRow.querySelector('[name="link-clickcount-template"]');
          var ccFormatEl   = linkRow.querySelector('[name="link-clickcount-format"]');
          var ccShow       = !!(ccShowEl && ccShowEl.checked);
          var ccTemplate   = (ccTemplateEl && ccTemplateEl.value.trim())   || '';
          var ccFormat     = (ccFormatEl   && ccFormatEl.value)            || 'compact';
          var clickCount   = (ccShow && ccTemplate)
            ? { show: true, template: ccTemplate, format: ccFormat }
            : undefined;

          return {
            icon:  linkRow.querySelector('[name="link-icon"]').value,
            label: linkRow.querySelector('[name="link-label"]').value.trim(),
            url:   linkRow.querySelector('[name="link-url"]').value.trim(),
            // Phase 10.2 additions (only emitted when set)
            spotlight:    (spotlightEl    && spotlightEl.checked)               || undefined,
            iconUrl:      (iconUrlEl      && iconUrlEl.value.trim())            || undefined,
            subtitle:     (subtitleEl     && subtitleEl.value.trim())           || undefined,
            visibleFrom:  (visibleFromEl  && visibleFromEl.value)               || undefined,
            visibleUntil: (visibleUntilEl && visibleUntilEl.value)              || undefined,
            qrImage:      (qrImageEl      && qrImageEl.value.trim())            || undefined,
            // Phase 10.3 — embed: { type, id } when both are set; undefined otherwise
            embed:        embed,
            // Phase 11 — clickCount: { show, template, format } when configured; undefined otherwise
            clickCount:   clickCount
          };
        }).filter(function (l) { return l.label && l.url; })
      };
    }).filter(function (s) { return s.label && s.links.length > 0; });

    const name = fd.get('name') || 'Your Name';

    // Phase 11 — Top-level siteCounter (opt-in). Same emit-undefined-when-off
    // pattern as the per-link clickCount above, so JSON.stringify keeps the
    // downloaded config clean for creators who don't use the feature.
    var scShow      = !!(fd.get('sitecounter-show'));
    var scTemplate  = (fd.get('sitecounter-template')  || '').trim();
    var scSource    = fd.get('sitecounter-source')     || 'all-links';
    var scLinkEvent = (fd.get('sitecounter-link-event') || '').trim();
    var scPosition  = fd.get('sitecounter-position')   || 'above-buttons';
    var scFormat    = fd.get('sitecounter-format')     || 'compact';
    // If the operator filled in a link event name, it overrides the Source dropdown
    var effectiveSource = scLinkEvent ? ('link:' + scLinkEvent) : scSource;
    var siteCounter = (scShow && scTemplate)
      ? { show: true, template: scTemplate, source: effectiveSource, position: scPosition, format: scFormat }
      : undefined;

    const config = {
      title: name + ' — Links',
      profile: {
        name: name,
        handle: fd.get('handle') || '@yourhandle',
        bio: fd.get('bio') || '',
        credential: fd.get('credential') || '',
        avatarPath: '/images/avatar-placeholder.svg',
        faviconPath: '/images/avatar.png',
        // Phase 10.1 — Banner / cover image (D-05; opt-in URL only). Undefined keys are omitted by JSON.stringify.
        coverImage: (fd.get('coverImage') || '').trim() || undefined
      },
      themePath: fd.get('themePath') || '/themes/nikoserves.css',
      theme: buildThemeOverrides(fd),
      sections: sections,
      analytics: {
        umamiWebsiteId: (fd.get('umamiWebsiteId') || '').trim()
      },
      // Phase 11 — siteCounter: { show, template, source, position, format } when configured; undefined otherwise
      siteCounter: siteCounter
    };

    // Schema-presence assertion — catches drift if Plan 7-01/7-02 fields ever evolve.
    const required = ['title', 'themePath'];
    const requiredProfile = ['name', 'handle', 'avatarPath', 'faviconPath'];
    for (var i = 0; i < required.length; i++) {
      if (!config[required[i]]) throw new Error("buildConfig: missing required field '" + required[i] + "'");
    }
    for (var j = 0; j < requiredProfile.length; j++) {
      if (!config.profile[requiredProfile[j]]) throw new Error("buildConfig: missing required profile." + requiredProfile[j]);
    }

    // Phase 10.3 — Warn (don't block) when too many embeds are configured. Each embed
    // is a per-page perf cost; >2 typically pushes Lighthouse Performance below 89.
    var embedCount = sections.reduce(function (n, s) {
      return n + s.links.filter(function (l) { return l.embed; }).length;
    }, 0);
    if (embedCount > 2) {
      console.warn('[wizard] ' + embedCount + ' embeds detected — may impact Lighthouse Performance (>2 typically pushes below 89). Consider hosting media on a separate page.');
    }

    return config;
  }

  // Phase 9.2 — buildThemeOverrides replaces themeAccentOverride. Reads all the
  // new Brand-fieldset controls and emits a theme object app.js will bridge into
  // CSS custom properties + body[data-button-style] attribute.
  function buildThemeOverrides(fd) {
    const overrides = {};

    // Accent color (existing behavior)
    const accent = fd.get('accentColor');
    if (accent) overrides.accent = accent;

    // Background — derive from bgType + color stops
    const bgType = fd.get('bgType') || 'flat';
    const a = fd.get('bgColorA') || '#0a0e17';
    const b = fd.get('bgColorB') || '#1a2244';
    if (bgType === 'linear')      overrides.background = `linear-gradient(180deg, ${a} 0%, ${b} 100%)`;
    else if (bgType === 'radial') overrides.background = `radial-gradient(circle at 30% 20%, ${a} 0%, ${b} 80%)`;
    else if (bgType === 'aurora') overrides.background = `linear-gradient(180deg, #0f0027 0%, #2d0d54 50%, #6e1976 100%)`;
    else if (bgType === 'sunset') overrides.background = `radial-gradient(circle at 30% 20%, #ff5e62 0%, #ff9966 40%, #1a0c1d 90%)`;
    else if (bgType === 'flat')   overrides.background = a;

    // Button style — only emit if non-default
    const buttonStyle = fd.get('buttonStyle');
    if (buttonStyle && buttonStyle !== 'filled') overrides.buttonStyle = buttonStyle;

    // Button radius — only emit if non-default
    let buttonRadius = fd.get('buttonRadius');
    if (buttonRadius === 'custom') {
      const custom = fd.get('buttonRadiusCustom') || '12';
      buttonRadius = custom + 'px';
    }
    if (buttonRadius && buttonRadius !== '0.5rem') overrides.buttonRadius = buttonRadius;

    // Avatar shape — only emit if non-default
    const avatarShape = fd.get('avatarShape');
    if (avatarShape && avatarShape !== 'circle') overrides.avatarShape = avatarShape;

    // Phase 9.3 — Font (only emit when non-default; system = no fetch)
    const font = fd.get('font');
    if (font && font !== 'system') overrides.font = font;

    // Phase 9.4 D-02 — Button text color override (only emit when non-default)
    const buttonTextColor = fd.get('buttonTextColor');
    if (buttonTextColor && buttonTextColor !== '#0a0e17') overrides.textColor = buttonTextColor;

    // Phase 9.4 D-03 — Headline mode (Solid vs Gradient)
    const headlineMode = fd.get('headlineMode') || 'solid';
    if (headlineMode === 'gradient') {
      overrides.gradientFrom  = fd.get('gradientFrom')  || '#ff00aa';
      overrides.gradientTo    = fd.get('gradientTo')    || '#00e5ff';
      overrides.gradientAngle = (fd.get('gradientAngle') || '90') + 'deg';
    }

    // Phase 9.4 D-09 — Avatar crop position (only emit when non-default; image bytes NEVER emitted)
    if (avatarCropState.x !== 50 || avatarCropState.y !== 50) {
      overrides.avatarPosition = avatarCropState.x + '% ' + avatarCropState.y + '%';
    }

    // Phase 10.1 — Image background overlay (D-03; opt-in URL only, no upload)
    const bgImage = (fd.get('backgroundImage') || '').trim();
    if (bgImage) overrides.backgroundImage = bgImage;

    return overrides;
  }

  // ===========================
  // Phase 13 — Config import: reverse the theme object back into form controls
  // ===========================

  // applyThemeToForm is the exact reverse of buildThemeOverrides above. The wizard's
  // config is "lossy" — structured form controls (a Background-type dropdown plus two
  // color pickers) are flattened into a single finished CSS string on the way out, so
  // import has to reverse-engineer the controls from that string.
  //
  // The aurora and sunset presets are FIXED, exact gradient strings. They MUST be
  // string-matched BEFORE the generic linear/radial parsing runs: aurora is itself a
  // `linear-gradient(...)`, so a generic linear parse would otherwise mis-detect it as
  // a custom two-stop linear gradient and lose the "aurora" preset selection.
  //
  // `setVal(name, value)` is supplied by the caller (applyConfigToForm, Task 3): it
  // sets the named form field's .value only when the element exists and value != null.
  function applyThemeToForm(theme, setVal) {
    theme = theme || {};

    // 1. Accent color — 1:1
    if (theme.accent) setVal('accentColor', theme.accent);

    // 2. Background — the lossy one. Match the two fixed presets FIRST.
    var bg = theme.background;
    if (bg === 'linear-gradient(180deg, #0f0027 0%, #2d0d54 50%, #6e1976 100%)') {
      setVal('bgType', 'aurora');
    } else if (bg === 'radial-gradient(circle at 30% 20%, #ff5e62 0%, #ff9966 40%, #1a0c1d 90%)') {
      setVal('bgType', 'sunset');
    } else if (typeof bg === 'string' && bg.indexOf('linear-gradient(') === 0) {
      setVal('bgType', 'linear');
      var linStops = bg.match(/(#[0-9a-fA-F]{3,8})/g);
      if (linStops && linStops[0]) setVal('bgColorA', linStops[0]);
      if (linStops && linStops[1]) setVal('bgColorB', linStops[1]);
    } else if (typeof bg === 'string' && bg.indexOf('radial-gradient(') === 0) {
      setVal('bgType', 'radial');
      var radStops = bg.match(/(#[0-9a-fA-F]{3,8})/g);
      if (radStops && radStops[0]) setVal('bgColorA', radStops[0]);
      if (radStops && radStops[1]) setVal('bgColorB', radStops[1]);
    } else if (bg) {
      // A bare hex string -> flat background.
      setVal('bgType', 'flat');
      setVal('bgColorA', bg);
    }
    // If bg is falsy, leave bgType at its 'flat' default.

    // 3. Button style — buildThemeOverrides only emits non-'filled'; absence = 'filled'.
    if (theme.buttonStyle) setVal('buttonStyle', theme.buttonStyle);

    // 4. Button radius — preset value sets the dropdown directly; an "Npx" string that
    //    is not a preset selects "custom" and fills the slider with N.
    var br = theme.buttonRadius;
    if (br === '0' || br === '9999px' || br === '0.5rem') {
      setVal('buttonRadius', br);
    } else if (typeof br === 'string' && /^(\d+)px$/.test(br)) {
      setVal('buttonRadius', 'custom');
      setVal('buttonRadiusCustom', RegExp.$1);
    }
    // After setting, fire a change event so the existing toggleCustom listener
    // reveals/hides the custom-radius slider to match.
    var rs = $('[name="buttonRadius"]');
    if (rs) rs.dispatchEvent(new Event('change'));

    // 5. Avatar shape — 1:1
    if (theme.avatarShape) setVal('avatarShape', theme.avatarShape);

    // 6. Font — 1:1
    if (theme.font) setVal('font', theme.font);

    // 7. Button text color override — 1:1 (config key is `textColor`, field is `buttonTextColor`)
    if (theme.textColor) setVal('buttonTextColor', theme.textColor);

    // 8. Headline mode — gradient mode is signalled by the presence of BOTH gradient stops.
    if (theme.gradientFrom && theme.gradientTo) {
      setVal('headlineMode', 'gradient');
      setVal('gradientFrom', theme.gradientFrom);
      setVal('gradientTo', theme.gradientTo);
      // gradientAngle is stored with a "deg" suffix; the range input wants the bare number.
      setVal('gradientAngle', String(theme.gradientAngle || '90deg').replace('deg', ''));
    } else {
      setVal('headlineMode', 'solid');
    }
    // Fire a change event so the existing toggleHeadline listener shows/hides
    // the gradient controls to match.
    var hm = $('[name="headlineMode"]');
    if (hm) hm.dispatchEvent(new Event('change'));

    // 9. Avatar crop position — restores only the crop dot (x/y). The image itself is
    //    session-local and never stored in config, so imageDataUrl is untouched.
    if (theme.avatarPosition) {
      var m = String(theme.avatarPosition).match(/(\d+)%\s+(\d+)%/);
      if (m) {
        avatarCropState.x = parseInt(m[1], 10);
        avatarCropState.y = parseInt(m[2], 10);
      }
    }

    // 10. Background image URL — 1:1
    if (theme.backgroundImage) setVal('backgroundImage', theme.backgroundImage);
  }

  // validateSetupConfig returns null when `cfg` is a usable main config.json, or a
  // human-readable error string otherwise. It is the first line of defence for the
  // import pipeline (D-03): it runs before applyConfigToForm ever touches the form.
  // Wrong-file detection is deliberate — a config-resources.json (the OTHER wizard's
  // file) has a top-level `page` + `schema_version`; loading it here would silently
  // produce garbage, so we catch it and point the operator at the right wizard.
  function validateSetupConfig(cfg) {
    if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
      return 'That file is not a valid config object.';
    }
    // Wrong-file detection FIRST — before the missing-field checks below, so the
    // operator gets the specific "that's a resources config" message.
    if (cfg.page && cfg.schema_version) {
      return 'That looks like a resources config (config-resources.json). Load it in the resources admin wizard instead.';
    }
    if (!cfg.profile || typeof cfg.profile !== 'object') {
      return 'This config is missing a "profile" section — it may not be a setup config.json.';
    }
    if (!Array.isArray(cfg.sections)) {
      return 'This config is missing a "sections" array — it may not be a setup config.json.';
    }
    return null;
  }

  // applyLinkExtras sets the 10 optional per-link fields on a freshly-built link row.
  // addLink only handles icon/label/url, so everything else (spotlight, iconUrl,
  // subtitle, scheduling, qrImage, embed, clickCount) is filled in here after the row
  // exists in the DOM.
  function applyLinkExtras(linkRow, link) {
    function f(name) { return linkRow.querySelector('[name="' + name + '"]'); }
    var spotEl = f('link-spotlight');
    if (spotEl) spotEl.checked = !!link.spotlight;
    var ccShowEl = f('link-clickcount-show');
    if (ccShowEl) ccShowEl.checked = !!(link.clickCount && link.clickCount.show);
    var pairs = [
      ['link-iconUrl', link.iconUrl], ['link-subtitle', link.subtitle],
      ['link-visibleFrom', link.visibleFrom], ['link-visibleUntil', link.visibleUntil],
      ['link-qrImage', link.qrImage],
      ['link-embed-type', link.embed && link.embed.type],
      ['link-embed-id', link.embed && link.embed.id],
      ['link-clickcount-template', link.clickCount && link.clickCount.template],
      ['link-clickcount-format', (link.clickCount && link.clickCount.format) || 'compact']
    ];
    pairs.forEach(function (p) { var el = f(p[0]); if (el && p[1] != null) el.value = p[1]; });
  }

  // applyConfigToForm is the reverse of buildConfig() — it takes a parsed config object
  // (already passed validateSetupConfig) and writes every value back into the wizard
  // form so the operator can edit an existing config visually instead of rebuilding it
  // by hand. addLink only sets icon/label/url, so applyLinkExtras fills the rest.
  function applyConfigToForm(cfg) {
    // setVal sets a named field's .value when the element exists and value != null.
    function setVal(name, value) {
      var el = $('[name="' + name + '"]');
      if (el && value != null) el.value = value;
    }

    // Identity
    setVal('name', cfg.profile.name);
    setVal('handle', cfg.profile.handle);
    setVal('bio', cfg.profile.bio);
    setVal('credential', cfg.profile.credential);

    // Profile cover image
    setVal('coverImage', cfg.profile.coverImage);

    // Theme path
    setVal('themePath', cfg.themePath);

    // Theme overrides (delegates to the Task 1 reverse helper)
    applyThemeToForm(cfg.theme, setVal);

    // Analytics
    setVal('umamiWebsiteId', cfg.analytics && cfg.analytics.umamiWebsiteId);

    // siteCounter — reverses buildConfig's effectiveSource logic. A `link:<event>`
    // source fills the single-link-event field; anything else sets the Source dropdown.
    var sc = cfg.siteCounter;
    var scShowEl = $('input[name="sitecounter-show"]');
    if (sc && sc.show) {
      if (scShowEl) scShowEl.checked = true;
      setVal('sitecounter-template', sc.template);
      setVal('sitecounter-position', sc.position || 'above-buttons');
      setVal('sitecounter-format', sc.format || 'compact');
      if (typeof sc.source === 'string' && sc.source.indexOf('link:') === 0) {
        setVal('sitecounter-link-event', sc.source.slice(5));
      } else {
        var srcEl = $('[name="sitecounter-source"]');
        // Edge case: a `section:<CustomLabel>` value that is not one of the fixed
        // dropdown options will not select. Detect and surface it rather than
        // failing silently — the operator needs to set it by hand after import.
        if (srcEl && sc.source) {
          srcEl.value = sc.source;
          if (srcEl.value !== sc.source) {
            console.warn('[wizard] siteCounter.source "' + sc.source +
              '" is not a preset option — set it manually after import.');
          }
        }
      }
    } else {
      if (scShowEl) scShowEl.checked = false;
    }
    // Fire change so the existing toggle reveals/hides the site-counter controls.
    if (scShowEl) scShowEl.dispatchEvent(new Event('change'));

    // Sections + links — clear the demo sections, then rebuild from the config.
    $('#sections-list').innerHTML = '';
    (cfg.sections || []).forEach(function (section) {
      addSection(section.label || '');
      var sectionRow = $$('.section-row').slice(-1)[0];
      (section.links || []).forEach(function (link) {
        addLink(sectionRow, link.icon || '', link.label || '', link.url || '');
        var linkRow = $$('.link-row', sectionRow).slice(-1)[0];
        applyLinkExtras(linkRow, link);
      });
    });

    // Re-render the preview iframe so it reflects the imported state immediately.
    updatePreview();
  }

  // Phase 9.3 — Curated Google Fonts allow-list for the preview iframe
  // (mirrors the same list in /assets/js/app.js — keep in sync)
  var CURATED_FONTS_PREVIEW = {
    inter:           { family: "Inter",          cssName: '"Inter", system-ui, sans-serif' },
    'dm-sans':       { family: "DM+Sans",        cssName: '"DM Sans", system-ui, sans-serif' },
    fraunces:        { family: "Fraunces",       cssName: '"Fraunces", Georgia, serif' },
    'space-grotesk': { family: "Space+Grotesk",  cssName: '"Space Grotesk", system-ui, sans-serif' },
    'crimson-text':  { family: "Crimson+Text",   cssName: '"Crimson Text", Georgia, serif' }
  };

  // Phase 9.4 D-09 — Avatar crop state (session-local; image never written to config.json)
  // imageDataUrl is held in memory only for preview; the download contains only the crop position.
  var avatarCropState = {
    imageDataUrl: null,
    x: 50,   // 0..100 — object-position X percentage
    y: 50    // 0..100 — object-position Y percentage
  };

  // Phase 9.4 D-11 — Browser-side image compression via Canvas (no build step, no third-party libs)
  // Reads a data URL, draws it into a canvas at most maxDim×maxDim (preserving aspect), exports JPEG.
  function compressImageToBlob(dataUrl, maxDim, quality, cb) {
    var img = new Image();
    img.onload = function () {
      var ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
      var w = Math.round(img.width * ratio);
      var h = Math.round(img.height * ratio);
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(function (blob) {
        if (blob) cb(blob, w, h);
      }, 'image/jpeg', quality);
    };
    img.onerror = function () {
      console.warn('[wizard] compressImageToBlob: failed to load image');
    };
    img.src = dataUrl;
  }

  function showCompressedDownload(blob, w, h, origBytes) {
    var dlContainer = document.getElementById('avatarCompressedDownload');
    var dlLink      = document.getElementById('avatarCompressedLink');
    var dlSize      = document.getElementById('avatarCompressedSize');
    if (!dlContainer || !dlLink || !dlSize) return;
    // Revoke any previous object URL to avoid memory leaks across re-uploads
    if (dlLink.href && dlLink.href.indexOf('blob:') === 0) URL.revokeObjectURL(dlLink.href);
    var url = URL.createObjectURL(blob);
    dlLink.href = url;
    dlLink.download = 'your-avatar-compressed.jpg';
    dlSize.textContent = 'Original: ' + (origBytes / 1024).toFixed(0) + ' KB → Compressed: ' +
                        (blob.size / 1024).toFixed(0) + ' KB (' + w + '×' + h + ')';
    dlContainer.hidden = false;
  }

  // ===========================
  // Preview iframe rendering
  // ===========================

  // Cheap brand colors for the iframe preview. Mirrors the on-disk theme CSS so
  // the preview is faithful without us having to fetch the actual theme files.
  var THEMES = {
    '/themes/nikoserves.css': {
      bg: '#0a0e17', accent: '#00e5ff', text: '#ffffff',
      button: 'linear-gradient(165deg, #0099b3 0%, #00e5ff 50%, #66f0ff 100%)',
      buttonText: '#0a0e17'
    },
    '/themes/light.css': {
      bg: '#ffffff', accent: '#1F2937', text: '#111827',
      button: '#1F2937', buttonText: '#ffffff'
    },
    '/themes/neon.css': {
      bg: '#08001a', accent: '#ff00aa', text: '#ffffff',
      button: 'linear-gradient(165deg, #ff00aa 0%, #cc00ff 50%, #00ffe0 100%)',
      buttonText: '#ffffff'
    }
  };

  function renderPreview(cfg) {
    var t = THEMES[cfg.themePath] || THEMES['/themes/nikoserves.css'];
    var accent = (cfg.theme && cfg.theme.accent) || t.accent;

    // Phase 9.2 — page background can be overridden by cfg.theme.background (gradient or hex)
    var bgOverride = (cfg.theme && cfg.theme.background) || t.bg;

    // Phase 9.2 — button radius + avatar radius from cfg.theme
    var buttonRadius = (cfg.theme && cfg.theme.buttonRadius) || '0.5rem';
    var avatarRadiusMap = { circle: '50%', square: '0', rounded: '0.75rem' };
    var avatarRadius = avatarRadiusMap[(cfg.theme && cfg.theme.avatarShape) || 'circle'];

    // Phase 9.2 — body data-button-style attribute mirrors the cfg.theme.buttonStyle
    var buttonStyle = (cfg.theme && cfg.theme.buttonStyle) || '';
    var bodyAttrs = buttonStyle ? ' data-button-style="' + escapeHtml(buttonStyle) + '"' : '';

    // Phase 9.4 D-02 — Button text color override (preview-side mirror of --button-text-override)
    var buttonTextColorOverride = (cfg.theme && cfg.theme.textColor) || '';
    var buttonTextColor = buttonTextColorOverride || t.buttonText;

    // Phase 9.4 D-03 — Gradient headlines (h1 + .section-label only)
    var gradFrom  = (cfg.theme && cfg.theme.gradientFrom)  || '';
    var gradTo    = (cfg.theme && cfg.theme.gradientTo)    || '';
    var gradAngle = (cfg.theme && cfg.theme.gradientAngle) || '90deg';
    var headlineStyle = (gradFrom && gradTo)
      ? 'background: linear-gradient(' + gradAngle + ', ' + gradFrom + ', ' + gradTo + ');' +
        ' -webkit-background-clip: text; background-clip: text;' +
        ' color: transparent; -webkit-text-fill-color: transparent;'
      : '';

    // Phase 9.4 D-09 — Avatar crop: use uploaded data URL if available
    var avatarSrc = avatarCropState.imageDataUrl || '';
    var avatarPos = (cfg.theme && cfg.theme.avatarPosition) || (avatarCropState.x + '% ' + avatarCropState.y + '%');

    // Phase 9.3 — Font: when a curated font is selected, inject Google Fonts <link> into preview
    var fontKey = (cfg.theme && cfg.theme.font) || 'system';
    var fontDef = (fontKey !== 'system' && CURATED_FONTS_PREVIEW[fontKey]) ? CURATED_FONTS_PREVIEW[fontKey] : null;
    var fontLinkHtml = fontDef
      ? '<link rel="preconnect" href="https://fonts.googleapis.com">' +
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=' + fontDef.family + ':wght@400;700&display=swap">'
      : '';
    var fontFamily = fontDef ? fontDef.cssName : 'system-ui, -apple-system, sans-serif';

    var sectionsHtml = cfg.sections.map(function (s) {
      // Phase 10.2 hotfix — Filter by schedule in the preview so creators can SEE
      // which links are currently visible (matches live app.js behavior on the
      // visitor side). Niko reported the preview was misleading because all
      // links showed regardless of visibleFrom/visibleUntil.
      var nowMs = Date.now();
      var visibleLinks = s.links.filter(function (l) {
        if (l.visibleFrom  && nowMs < Date.parse(l.visibleFrom))  return false;
        if (l.visibleUntil && nowMs > Date.parse(l.visibleUntil)) return false;
        return true;
      });
      var linksHtml = visibleLinks.map(function (l) {
        // Phase 10.2 — Spotlight class + subtitle in preview (mirrors live render in app.js).
        var spotlightClass = l.spotlight ? ' button--spotlight' : '';
        var subtitleHtml = l.subtitle
          ? '<br><small style="opacity:0.7;font-size:0.75em">' + escapeHtml(l.subtitle) + '</small>'
          : '';
        // Phase 10.2 hotfix — Per-link QR image renders ABOVE the button (mirrors app.js).
        var qrHtml = l.qrImage
          ? '<img src="' + escapeHtml(l.qrImage) + '" alt="" style="display:block;width:120px;height:120px;margin:0.5rem auto;border-radius:8px;background:white;padding:4px;">'
          : '';
        // Phase 10.3 — Embedded media (YouTube/Spotify); mirrors safelist in app.js.
        // Renders BELOW the button. encodeURIComponent prevents URL injection in the preview too.
        var embedHtml = '';
        if (l.embed && l.embed.type === 'youtube' && l.embed.id) {
          embedHtml = '<div class="link-embed"><iframe src="https://www.youtube-nocookie.com/embed/' +
                      encodeURIComponent(l.embed.id) +
                      '" loading="lazy" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;margin-top:0.5rem;"></iframe></div>';
        } else if (l.embed && l.embed.type === 'spotify' && l.embed.id) {
          embedHtml = '<div class="link-embed"><iframe src="https://open.spotify.com/embed/track/' +
                      encodeURIComponent(l.embed.id) +
                      '?utm_source=generator" loading="lazy" style="width:100%;height:152px;border:none;border-radius:8px;margin-top:0.5rem;"></iframe></div>';
        }
        // Phase 11 — Per-link click count preview. D-12: fake-zero, never fetches /api/counts.
        // The {count} placeholder is replaced with literal '0' so the wizard environment
        // never pollutes Umami events and works even when no Function backend is bound.
        var clickCountHtml = '';
        if (l.clickCount && l.clickCount.show && l.clickCount.template) {
          var ccText = l.clickCount.template.replace('{count}', '0');
          clickCountHtml =
            '<span class="link-count" style="' +
              'display:block;margin:0.15rem 0 0.5rem;font-size:0.8rem;opacity:0.7;' +
              'text-align:center;font-weight:600;white-space:nowrap;' +
              'overflow:hidden;text-overflow:ellipsis;' +
            '">' + escapeHtml(ccText) + '</span>';
        }
        return (
          qrHtml +
          '<a class="btn' + spotlightClass + '" href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(l.label) + subtitleHtml +
          '</a>' +
          embedHtml +
          clickCountHtml
        );
      }).join('');
      return (
        '<h2 class="section-label">' + escapeHtml(s.label) + '</h2>' +
        '<div class="links">' + linksHtml + '</div>'
      );
    }).join('');

    // Phase 11 — Site counter preview. D-12: fake-zero, never fetches /api/counts.
    // Same placeholder substitution (replace '{count}' with '0') and same reasoning
    // as the per-link clickCount above — wizard previews must not hit a real Function.
    var siteCounterHtml = '';
    if (cfg.siteCounter && cfg.siteCounter.show && cfg.siteCounter.template) {
      var scText = cfg.siteCounter.template.replace('{count}', '0');
      siteCounterHtml =
        '<div class="site-counter" style="' +
          'display:block;margin:1rem auto;padding:0.75rem 1.25rem;max-width:max-content;' +
          'font-size:1.25rem;font-weight:700;text-align:center;color:' + accent + ';' +
          'border:1px solid ' + accent + ';border-radius:' + buttonRadius + ';' +
          'background:rgba(0,229,255,0.06);' +
        '">' + escapeHtml(scText) + '</div>';
    }
    // Position-aware threading: place the rendered counter in one of three slots.
    // Default ('above-buttons') matches D-06 + the runtime behavior Plan 11-02 ships.
    var scPosition = (cfg.siteCounter && cfg.siteCounter.position) || 'above-buttons';
    var scAboveBio      = (scPosition === 'above-bio')      ? siteCounterHtml : '';
    var scAboveButtons  = (scPosition === 'above-buttons')  ? siteCounterHtml : '';
    var scBelowButtons  = (scPosition === 'below-buttons')  ? siteCounterHtml : '';

    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      fontLinkHtml,
      '<style>',
      '  *, *::before, *::after { box-sizing: border-box; }',
      '  body { margin: 0; background: ' + bgOverride + '; color: ' + t.text + ';',
      '         font-family: ' + fontFamily + ';',
      '         min-height: 100vh; padding: 2rem 1rem; }',
      '  .col { max-width: 420px; margin: 0 auto; text-align: center; }',
      '  .avatar { width: 120px; height: 120px; border-radius: ' + avatarRadius + '; background: ' + accent + ';',
      '            display: inline-flex; align-items: center; justify-content: center;',
      '            font-size: 60px; font-weight: 800; color: ' + t.bg + '; }',
      // Phase 9.4 D-09 — Avatar as <img> when uploaded, with object-position crop
      '  img.avatar { width: 120px; height: 120px; border-radius: ' + avatarRadius + ';',
      '               display: block; margin: 0 auto;',
      '               object-fit: cover; object-position: ' + avatarPos + '; }',
      '  h1 { font-size: 1.75rem; margin: 1rem 0 0.25rem; text-transform: uppercase;',
      '       letter-spacing: -0.01em; font-weight: 800;' + (headlineStyle ? ' ' + headlineStyle : '') + ' }',
      '  .handle { color: ' + accent + '; margin: 0 0 0.5rem; font-weight: 600; }',
      '  .badge { display: inline-block; padding: 0.25rem 0.75rem; margin: 0 0 0.75rem;',
      '           background: rgba(255,255,255,0.05); border: 1px solid rgba(250,204,21,0.4);',
      '           color: #FACC15; border-radius: 9999px; font-size: 0.75rem;',
      '           text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }',
      '  .bio { margin: 0 0 1.5rem; opacity: 0.9; }',
      '  .section-label { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.04em;',
      '                   margin: 1.5rem 0 0.5rem; opacity: 0.7; font-weight: 700;' + (headlineStyle ? ' ' + headlineStyle + ' opacity: 1;' : '') + ' }',
      '  .links { display: flex; flex-direction: column; gap: 0.5rem; }',
      '  .btn { display: block; padding: 0.85rem 1rem; background: ' + t.button + ';',
      '         color: ' + buttonTextColor + '; text-decoration: none; border-radius: ' + buttonRadius + ';',
      '         font-weight: 600; }',
      // Phase 9.2 — button-style variants in preview
      '  body[data-button-style="outline"] .btn { background: transparent; border: 2px solid ' + accent + '; color: ' + accent + '; }',
      '  body[data-button-style="soft"] .btn    { box-shadow: 0 4px 14px rgba(0,0,0,0.18); }',
      '  body[data-button-style="hard"] .btn    { box-shadow: 4px 4px 0 0 ' + accent + '; }',
      '  body[data-button-style="glass"] .btn   { background: rgba(255,255,255,0.08); -webkit-backdrop-filter: blur(12px) saturate(140%); backdrop-filter: blur(12px) saturate(140%); border: 1px solid rgba(255,255,255,0.18); box-shadow: none; transform: translateZ(0); }',
      // Phase 10.2 — Spotlight rule mirrored from css/style.css. Pulse is omitted in preview to keep srcdoc simple.
      '  .btn.button--spotlight { transform: scale(1.05); font-weight: 800; padding: 1rem; border: 2px solid ' + accent + '; box-shadow: 0 8px 24px rgba(0,229,255,0.18); }',
      '</style></head><body' + bodyAttrs + '><div class="col">',
      // Phase 9.4 D-09 — Use uploaded image when available; otherwise fall back to letter-circle
      (avatarSrc
        ? '<img class="avatar" src="' + avatarSrc + '" alt="Avatar preview">'
        : '<div class="avatar">' + escapeHtml((cfg.profile.name || 'N').charAt(0).toUpperCase()) + '</div>'),
      '<h1>' + escapeHtml(cfg.profile.name) + '</h1>',
      '<p class="handle">' + escapeHtml(cfg.profile.handle) + '</p>',
      cfg.profile.credential ? '<div class="badge">' + escapeHtml(cfg.profile.credential) + '</div>' : '',
      // Phase 11 — Site counter slot: 'above-bio'
      scAboveBio,
      cfg.profile.bio ? '<p class="bio">' + escapeHtml(cfg.profile.bio) + '</p>' : '',
      // Phase 11 — Site counter slot: 'above-buttons' (default)
      scAboveButtons,
      sectionsHtml,
      // Phase 11 — Site counter slot: 'below-buttons'
      scBelowButtons,
      '</div></body></html>'
    ].join('\n');
  }

  function updatePreview() {
    try {
      var cfg = buildConfig();
      $('#preview').srcdoc = renderPreview(cfg);
    } catch (err) {
      console.warn('[wizard] preview skipped:', err.message);
    }
  }

  var queueUpdate = debounce(updatePreview, 200);

  // ===========================
  // Download config.json
  // ===========================

  function downloadConfig() {
    var cfg;
    try {
      cfg = buildConfig();
    } catch (err) {
      alert('Cannot generate config: ' + err.message);
      return;
    }

    var json = JSON.stringify(cfg, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    $('#instructions').hidden = false;
    $('#instructions').scrollIntoView({ behavior: 'smooth' });
  }

  // ===========================
  // Event wiring
  // ===========================

  function initWizard() {
    // Defaults — visible-from-first-paint, sensible placeholders.
    $('[name="name"]').value = 'Your Name';
    $('[name="handle"]').value = '@yourhandle';
    $('[name="bio"]').value = 'Short tagline about you and what you do.';

    // Default sections showing a typical link-in-bio shape so creators can see how it works.
    addSection('Resources');
    addLink($$('.section-row').slice(-1)[0], 'notion', 'Get Free Resources', 'https://example.com/resources');
    addSection('Start Here');
    var startHere = $$('.section-row').slice(-1)[0];
    addLink(startHere, 'tiktok',    'TikTok',    'https://tiktok.com/@yourhandle');
    addLink(startHere, 'instagram', 'Instagram', 'https://instagram.com/yourhandle');
    addLink(startHere, 'facebook',  'Facebook',  'https://facebook.com/yourhandle');
    addLink(startHere, 'youtube',   'YouTube',   'https://youtube.com/@yourhandle');
    addSection('Work with Me');
    addLink($$('.section-row').slice(-1)[0], 'calendly', 'Book a call', 'https://example.com/booking');

    // Form-level listeners
    $('#wizard-form').addEventListener('input',  queueUpdate);
    $('#wizard-form').addEventListener('change', queueUpdate);

    // Submit -> download
    $('#wizard-form').addEventListener('submit', function (e) {
      e.preventDefault();
      downloadConfig();
    });

    // Phase 9.2 — show/hide custom radius slider based on dropdown
    const radiusSelect = document.querySelector('[name="buttonRadius"]');
    const customLabel = document.getElementById('buttonRadiusCustomLabel');
    if (radiusSelect && customLabel) {
      const toggleCustom = function () { customLabel.hidden = radiusSelect.value !== 'custom'; };
      radiusSelect.addEventListener('change', toggleCustom);
      toggleCustom();
    }

    // Phase 9.2 — live range output value
    const radiusSlider = document.querySelector('[name="buttonRadiusCustom"]');
    const radiusOut = document.getElementById('buttonRadiusCustomOut');
    if (radiusSlider && radiusOut) {
      const updateRadiusOut = function () { radiusOut.textContent = radiusSlider.value + 'px'; };
      radiusSlider.addEventListener('input', updateRadiusOut);
      updateRadiusOut();
    }

    // Phase 9.4 — Headline mode show/hide (Solid vs Gradient controls)
    const headlineModeSelect = document.querySelector('[name="headlineMode"]');
    const headlineSolidLabel = document.getElementById('headlineSolidLabel');
    const headlineGradientControls = document.getElementById('headlineGradientControls');
    if (headlineModeSelect && headlineSolidLabel && headlineGradientControls) {
      const toggleHeadline = function () {
        const isGradient = headlineModeSelect.value === 'gradient';
        headlineSolidLabel.hidden = isGradient;
        headlineGradientControls.hidden = !isGradient;
      };
      headlineModeSelect.addEventListener('change', toggleHeadline);
      toggleHeadline();
    }

    // Phase 11 — Reveal site-counter controls when the "Show" checkbox is checked.
    // Mirrors the headlineMode pattern above (Phase 9.4) for "show extra inputs when
    // a toggle activates them." Re-runs the preview so the iframe reflects the new
    // state without waiting for the input debounce.
    var scShowEl = $('input[name="sitecounter-show"]');
    var scControlsEl = $('#sitecounter-controls');
    if (scShowEl && scControlsEl) {
      var toggleSiteCounterControls = function () {
        scControlsEl.hidden = !scShowEl.checked;
        try { $('#preview').srcdoc = renderPreview(buildConfig()); } catch (_e) { /* preview will catch up on next change */ }
      };
      scShowEl.addEventListener('change', toggleSiteCounterControls);
      toggleSiteCounterControls();
    }

    // Phase 9.4 — Angle slider live output
    const angleSlider = document.querySelector('[name="gradientAngle"]');
    const angleOut = document.getElementById('gradientAngleOut');
    if (angleSlider && angleOut) {
      const updateAngle = function () { angleOut.textContent = angleSlider.value + 'deg'; };
      angleSlider.addEventListener('input', updateAngle);
      updateAngle();
    }

    // Phase 9.4 D-09 — Avatar file upload + crop preview wiring
    const cropFileInput = document.getElementById('avatarPreviewFile');
    const cropContainer = document.getElementById('avatarCropContainer');
    const cropImg       = document.getElementById('avatarCropImg');
    const cropDot       = document.getElementById('avatarCropDot');
    const cropOut       = document.getElementById('avatarCropOut');
    const cropThumb     = document.getElementById('avatarCropThumb');

    if (cropFileInput && cropContainer && cropImg && cropDot && cropOut && cropThumb) {
      cropFileInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          avatarCropState.imageDataUrl = ev.target.result;
          cropImg.src = ev.target.result;
          cropContainer.hidden = false;
          queueUpdate();   // re-render iframe with the new image

          // Phase 9.4 D-11 — Generate a compressed JPEG (400×400 max, 85% quality) for the user to download
          compressImageToBlob(ev.target.result, 400, 0.85, function (blob, w, h) {
            showCompressedDownload(blob, w, h, file.size);
          });
        };
        reader.readAsDataURL(file);
      });

      // Drag handler for the focal-point dot. Mouse-only on desktop is fine for v1; touch is a stretch.
      let dragging = false;
      function setPos(clientX, clientY) {
        const rect = cropThumb.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width)  * 100));
        const y = Math.max(0, Math.min(100, ((clientY - rect.top)  / rect.height) * 100));
        avatarCropState.x = Math.round(x);
        avatarCropState.y = Math.round(y);
        cropDot.style.left = avatarCropState.x + '%';
        cropDot.style.top  = avatarCropState.y + '%';
        cropImg.style.objectPosition = avatarCropState.x + '% ' + avatarCropState.y + '%';
        cropOut.textContent = avatarCropState.x + '%, ' + avatarCropState.y + '%';
        queueUpdate();
      }
      cropDot.addEventListener('mousedown',  function (e) { dragging = true; e.preventDefault(); });
      document.addEventListener('mousemove', function (e) { if (dragging) setPos(e.clientX, e.clientY); });
      document.addEventListener('mouseup',   function ()  { dragging = false; });

      // Touch support — cheap to add and helps mobile preview
      cropDot.addEventListener('touchstart', function (e) { dragging = true; e.preventDefault(); }, { passive: false });
      document.addEventListener('touchmove', function (e) {
        if (!dragging || !e.touches[0]) return;
        setPos(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }, { passive: false });
      document.addEventListener('touchend',  function () { dragging = false; });

      // Click anywhere on the thumb to jump the dot there
      cropThumb.addEventListener('click', function (e) {
        if (e.target === cropDot) return;
        setPos(e.clientX, e.clientY);
      });
    }

    // Phase 13 — Config import wiring. Two entry points — a file picker and a
    // "load my live config" button — both feed the same pipeline:
    //   parse -> importConfig() -> validateSetupConfig() -> applyConfigToForm().
    // Every failure surfaces as a visible inline message; nothing here ever crashes
    // the wizard (D-03).
    function showImportError(msg) {
      var e = $('#import-error');
      var s = $('#import-success');
      if (s) s.hidden = true;
      if (e) { e.textContent = msg; e.hidden = false; }
    }
    function showImportSuccess(msg) {
      var e = $('#import-error');
      var s = $('#import-success');
      if (e) e.hidden = true;
      if (s) { s.textContent = msg; s.hidden = false; }
    }
    function importConfig(cfg) {
      var err = validateSetupConfig(cfg);
      if (err) { showImportError(err); return; }
      try {
        applyConfigToForm(cfg);
        showImportSuccess('Config loaded — review the form and re-download when ready.');
      } catch (ex) {
        showImportError('Could not apply that config: ' + ex.message);
      }
    }

    // File picker — read the chosen file, parse JSON defensively, then import.
    var importFileEl = $('#import-file');
    if (importFileEl) {
      importFileEl.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var parsed;
          try {
            parsed = JSON.parse(ev.target.result);
          } catch (ex) {
            showImportError('That file is not valid JSON: ' + ex.message);
            return;
          }
          importConfig(parsed);
        };
        reader.onerror = function () { showImportError('Could not read that file.'); };
        reader.readAsText(file);
      });
    }

    // Load-live button — fetch the FIXED same-origin /config.json literal. The URL is
    // hard-coded (no user-controlled input), so there is no SSRF surface here.
    var importLiveBtn = $('#import-live-btn');
    if (importLiveBtn) {
      importLiveBtn.addEventListener('click', function () {
        fetch('/config.json', { cache: 'no-cache' })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function (cfg) { importConfig(cfg); })
          .catch(function (ex) {
            showImportError('Could not load the live config: ' + ex.message);
          });
      });
    }

    // Add-section / add-link / remove handlers (event delegation)
    $('#add-section').addEventListener('click', function () { addSection(''); });

    $('#sections-list').addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('add-link')) {
        addLink(t.closest('.section-row'), '', '', '');
      } else if (t.classList.contains('remove-link')) {
        t.closest('.link-row').remove();
        queueUpdate();
      } else if (t.classList.contains('remove-section')) {
        t.closest('.section-row').remove();
        queueUpdate();
      }
    });

    // Initial render
    updatePreview();
  }

  // ===========================
  // Gate (Plan 7-04) — SHA-256 hash check against the allowlist in access-codes.json.
  // ===========================
  // Architectural caveat: this is honor-system gating on a static site. The wizard
  // files are served to anyone who requests them; the gate only hides the form via
  // JS. A motivated user can bypass it via DevTools. For true server-side gating,
  // wrap /setup in Cloudflare Access or a CF Pages Function (deferred to v3).

  async function sha256(str) {
    const bytes = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  async function checkAccessCode(code) {
    if (!code || code.length < 8) return false;
    const hash = await sha256(code);
    try {
      const res = await fetch('/setup/access-codes.json', { cache: 'no-cache' });
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data.hashes) && data.hashes.includes(hash);
    } catch (err) {
      console.error('[wizard] access-codes.json fetch failed:', err);
      return false;
    }
  }

  function wireGate() {
    const gateForm = $('#gate-form');
    const gateScreen = $('#gate-screen');
    const wizardApp = $('#wizard-app');
    const gateError = $('#gate-error');
    const codeInput = $('#access-code');
    if (!gateForm) return;

    gateForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      gateError.hidden = true;
      const code = (codeInput.value || '').trim();
      const valid = await checkAccessCode(code);
      if (valid) {
        gateScreen.hidden = true;
        wizardApp.hidden = false;
        initWizard();
      } else {
        gateError.hidden = false;
        codeInput.focus();
        codeInput.select();
      }
    });
  }

  // Boot: wire the gate; do NOT call initWizard yet — it runs only after unlock.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireGate);
  } else {
    wireGate();
  }

})();
