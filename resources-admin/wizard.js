// /resources-admin/wizard.js — admin wizard for editing /config-resources.json
// Interim auth: client-side SHA-256 hash gate (Plan 12-06 replaces with CF Access).
// Mirrors /setup/wizard.js patterns: section/resource templates, build+preview+download.
// D-10: live preview substitutes fake data when referenced assets don't exist.

(function () {
  // ===== Gate =================================================================
  const gateScreen = document.getElementById('gate-screen');
  const gateInput  = document.getElementById('gate-input');
  const gateBtn    = document.getElementById('gate-submit');
  const gateErr    = document.getElementById('gate-error');
  const wizardApp  = document.getElementById('wizard-app');
  const SESSION_KEY = 'resources-admin-unlocked';

  async function sha256Hex(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function checkGate(passphrase) {
    let codes;
    try {
      const res = await fetch('/resources-admin/access-codes.json', { cache: 'no-store' });
      codes = await res.json();
    } catch (err) {
      console.error('[resources-admin] access-codes.json fetch failed:', err);
      return false;
    }
    const hash = await sha256Hex(passphrase);
    // Schema uses `hashes` array (matches /setup/access-codes.json convention).
    return Array.isArray(codes.hashes) && codes.hashes.includes(hash);
  }

  function openWizard() {
    gateScreen.setAttribute('hidden', '');
    wizardApp.removeAttribute('hidden');
    sessionStorage.setItem(SESSION_KEY, '1');
    bootstrap();
  }

  gateBtn.addEventListener('click', async () => {
    const ok = await checkGate(gateInput.value);
    if (ok) openWizard();
    else gateErr.removeAttribute('hidden');
  });
  gateInput.addEventListener('keydown', e => { if (e.key === 'Enter') gateBtn.click(); });

  // Session re-entry shortcut: if user already unlocked this tab, skip the gate.
  if (sessionStorage.getItem(SESSION_KEY) === '1') openWizard();

  // ===== Form bootstrap =======================================================
  async function bootstrap() {
    let cfg;
    try {
      const res = await fetch('/config-resources.json', { cache: 'no-store' });
      cfg = await res.json();
    } catch (err) {
      console.warn('[resources-admin] config-resources.json fetch failed, starting empty:', err);
      cfg = {
        schema_version: 1,
        page: { title: '', subtitle: '', coverImage: '', intro: { icon: '', text: '' } },
        sections: [],
        supportSection: { show: true }
      };
    }
    populateForm(cfg);
    refreshPreview();
  }

  function populateForm(cfg) {
    const p = cfg.page || {};
    setVal('[name="page-title"]',     p.title);
    setVal('[name="page-subtitle"]',  p.subtitle);
    setVal('[name="page-coverImage"]', p.coverImage);
    setVal('[name="page-intro-icon"]', (p.intro || {}).icon);
    setVal('[name="page-intro-text"]', (p.intro || {}).text);

    const s = cfg.supportSection || {};
    document.querySelector('[name="support-show"]').checked = s.show !== false;
    setVal('[name="support-title"]',       s.title);
    setVal('[name="support-buttonLabel"]', s.buttonLabel);
    setVal('[name="support-url"]',         s.url);
    setVal('[name="support-qrImage"]',     s.qrImage);

    const list = document.getElementById('sections-list');
    list.innerHTML = '';
    for (const section of (cfg.sections || [])) {
      list.appendChild(buildSectionNode(section));
    }
  }
  function setVal(sel, v) { const el = document.querySelector(sel); if (el && v != null) el.value = v; }

  // ===== Import validation ====================================================
  // Returns null if `cfg` is a valid config-resources.json shape, otherwise a
  // human-readable error string. Never throws — safe to call on any input.
  function validateResourcesConfig(cfg) {
    // Reject non-objects, null, and arrays outright.
    if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
      return 'That file is not a valid config object.';
    }
    // Wrong-file detection FIRST: a setup config.json has a top-level
    // `profile` object and a `themePath` string. Catch it before the
    // generic page/sections checks so the operator gets a useful redirect.
    if (cfg.profile && cfg.themePath) {
      return 'That looks like a setup config (config.json). Load it in the setup wizard at /setup instead.';
    }
    if (!cfg.page || typeof cfg.page !== 'object') {
      return 'This config is missing a "page" section — it may not be a config-resources.json.';
    }
    if (!Array.isArray(cfg.sections)) {
      return 'This config is missing a "sections" array — it may not be a config-resources.json.';
    }
    return null;
  }

  // ===== Add/remove section ===================================================
  document.getElementById('add-section').addEventListener('click', () => {
    const node = buildSectionNode({ label: '', viewType: 'list', resources: [] });
    document.getElementById('sections-list').appendChild(node);
  });

  function buildSectionNode(section) {
    const tpl = document.getElementById('tpl-section');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('[name="section-label"]').value = section.label || '';
    node.querySelector('[name="section-viewType"]').value = ['list','kanban','embed-grid'].includes(section.viewType) ? section.viewType : 'list';
    const resList = node.querySelector('.wizard-resources-list');
    for (const r of (section.resources || [])) {
      resList.appendChild(buildResourceNode(r));
    }
    node.querySelector('.add-resource').addEventListener('click', () => {
      resList.appendChild(buildResourceNode({}));
    });
    node.querySelector('.remove-section').addEventListener('click', () => node.remove());
    return node;
  }

  function buildResourceNode(r) {
    const tpl = document.getElementById('tpl-resource');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('[name="resource-icon"]').value        = r.icon || '';
    node.querySelector('[name="resource-title"]').value       = r.title || '';
    node.querySelector('[name="resource-url"]').value         = r.url || '';
    node.querySelector('[name="resource-description"]').value = r.description || '';
    node.querySelector('[name="resource-thumbnail"]').value   = r.thumbnail || '';
    const embedType = (r.embed && r.embed.type) || 'none';
    node.querySelector('[name="resource-embed-type"]').value  = ['none','tiktok','instagram'].includes(embedType) ? embedType : 'none';
    node.querySelector('[name="resource-embed-id"]').value    = (r.embed && r.embed.id) || '';
    node.querySelector('[name="resource-embed-fallback"]').checked = !!(r.embed && r.embed.fallback);
    wireEmbedConditional(node);
    node.querySelector('.remove-resource').addEventListener('click', () => node.remove());
    return node;
  }

  // Conditional UI: show embed-id + fallback only when type != none
  function wireEmbedConditional(resourceNode) {
    const typeSelect = resourceNode.querySelector('[name="resource-embed-type"]');
    const idInput    = resourceNode.querySelector('[name="resource-embed-id"]');
    const fbLabel    = resourceNode.querySelector('.wizard-embed-fallback');
    const apply = () => {
      const t = typeSelect.value;
      if (t === 'none') { idInput.setAttribute('hidden',''); fbLabel.setAttribute('hidden',''); }
      else              { idInput.removeAttribute('hidden'); fbLabel.removeAttribute('hidden'); }
    };
    typeSelect.addEventListener('change', apply);
    apply();
  }

  // ===== buildConfig ==========================================================
  // Defensive reader: returns the trimmed value if present, else empty string.
  // Caller decides whether empty fields are emitted as keys (page.*) or omitted (resource extras).
  function val(sel, root) {
    const el = (root || document).querySelector(sel);
    return (el && typeof el.value === 'string') ? el.value.trim() : '';
  }
  function buildConfig() {
    const cfg = {
      schema_version: 1,
      page: {
        title:    val('[name="page-title"]'),
        subtitle: val('[name="page-subtitle"]'),
        coverImage: val('[name="page-coverImage"]'),
        intro: {
          icon: val('[name="page-intro-icon"]'),
          text: val('[name="page-intro-text"]')
        }
      },
      sections: [],
      supportSection: {
        show: document.querySelector('[name="support-show"]').checked,
        title:       val('[name="support-title"]'),
        buttonLabel: val('[name="support-buttonLabel"]'),
        url:         val('[name="support-url"]'),
        qrImage:     val('[name="support-qrImage"]')
      }
    };
    for (const sNode of document.querySelectorAll('#sections-list .wizard-section')) {
      const section = {
        label:    val('[name="section-label"]', sNode),
        viewType: val('[name="section-viewType"]', sNode) || 'list',
        resources: []
      };
      for (const rNode of sNode.querySelectorAll('.wizard-resource')) {
        const r = {
          icon:  val('[name="resource-icon"]', rNode),
          title: val('[name="resource-title"]', rNode),
          url:   val('[name="resource-url"]', rNode)
        };
        const desc = val('[name="resource-description"]', rNode); if (desc) r.description = desc;
        const thumb = val('[name="resource-thumbnail"]', rNode);  if (thumb) r.thumbnail = thumb;
        const etype = val('[name="resource-embed-type"]', rNode);
        if (etype && etype !== 'none') {
          const eid = val('[name="resource-embed-id"]', rNode);
          const efb = rNode.querySelector('[name="resource-embed-fallback"]').checked;
          r.embed = { type: etype, id: eid };
          if (efb) r.embed.fallback = true;
        }
        section.resources.push(r);
      }
      cfg.sections.push(section);
    }
    return cfg;
  }

  // ===== Preview (D-10 fake-data when assets missing) =========================
  async function refreshPreview() {
    let baseHtml;
    try {
      const res = await fetch('/resources/index.html', { cache: 'no-store' });
      baseHtml = await res.text();
    } catch (err) {
      console.warn('[resources-admin] preview base fetch failed:', err);
      return;
    }
    const cfg = buildConfig();

    // D-10: Substitute fake-data placeholders for missing assets.
    // Inline SVG data: URL = no extra HTTP fetch, no broken-image icon.
    const fakeCover = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%236ea8ff"/><stop offset="1" stop-color="%23ff6ec7"/></linearGradient></defs><rect width="600" height="200" fill="url(%23g)"/></svg>'
    );
    if (!cfg.page.coverImage) cfg.page.coverImage = fakeCover;
    // D-10: missing qrImage stays empty so the renderer skips the QR block (consistent with /resources/ runtime).
    if (!cfg.supportSection.qrImage) cfg.supportSection.qrImage = '';

    // Inject the new JSON into the base HTML, replacing the existing #resources-config block.
    const injected = baseHtml.replace(
      /(<script id="resources-config" type="application\/json">)([\s\S]*?)(<\/script>)/,
      `$1\n${JSON.stringify(cfg, null, 2)}\n$3`
    );

    document.getElementById('preview-iframe').srcdoc = injected;
  }

  document.getElementById('refresh-preview').addEventListener('click', refreshPreview);
  // Auto-refresh on any form change (debounced)
  let refreshTimer;
  document.addEventListener('input', () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshPreview, 250);
  });
  // Also refresh when sections/resources are added/removed (click events on add/remove buttons).
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.classList) return;
    if (t.classList.contains('add-resource') ||
        t.classList.contains('remove-resource') ||
        t.classList.contains('remove-section') ||
        t.id === 'add-section') {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refreshPreview, 250);
    }
  });

  // ===== Download =============================================================
  document.getElementById('download-config').addEventListener('click', () => {
    const cfg = buildConfig();
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-resources.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ===== Import (file upload) =================================================
  // The file picker lets the operator load a config-resources.json file from
  // disk (a backup, or one edited elsewhere) so they can keep editing it
  // visually. The flow: pick a file -> FileReader reads it -> JSON.parse ->
  // validateResourcesConfig checks the shape -> the EXISTING populateForm()
  // fills the form -> refreshPreview() re-renders. No second reverse function
  // is written — populateForm() is reused (Phase 13 D-02). All failures
  // (bad JSON, wrong shape, wrong config type) surface as a visible inline
  // message and never crash the wizard.

  // Inline message helpers — the wizard had no inline-message UI before this.
  function showImportError(msg) {
    var e = document.getElementById('import-error');
    var s = document.getElementById('import-success');
    if (s) s.hidden = true;
    if (e) { e.textContent = msg; e.hidden = false; }
  }
  function showImportSuccess(msg) {
    var e = document.getElementById('import-error');
    var s = document.getElementById('import-success');
    if (e) e.hidden = true;
    if (s) { s.textContent = msg; s.hidden = false; }
  }

  // Validate then apply a parsed config object. Reuses populateForm() (D-02).
  function importResourcesConfig(cfg) {
    var err = validateResourcesConfig(cfg);
    if (err) { showImportError(err); return; }
    try {
      populateForm(cfg);     // reuse the existing reverse function — D-02
      refreshPreview();
      showImportSuccess('Config loaded — review the form and re-download when ready.');
    } catch (ex) {
      showImportError('Could not apply that config: ' + ex.message);
    }
  }

  // File picker change listener — parses the chosen file and hands it off.
  var importInput = document.getElementById('import-file');
  if (importInput) {
    importInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var parsed;
        try { parsed = JSON.parse(ev.target.result); }
        catch (ex) { showImportError('That file is not valid JSON: ' + ex.message); return; }
        importResourcesConfig(parsed);
      };
      reader.onerror = function () { showImportError('Could not read that file.'); };
      reader.readAsText(file);
    });
  }
})();
