// Static-site language switcher.
// Strategy: each page lives at the root in zh-Hans, and at /<locale>/<page>.html
// for other languages. On first visit, we redirect to the closest match for
// navigator.language unless the user has already chosen something else.

(function () {
  const SUPPORTED = ['zh-Hans', 'zh-Hant', 'en', 'ja', 'ko', 'es', 'de', 'pt-BR', 'fr']
  const STORAGE_KEY = 'fitlite_site_lang'

  // Map a navigator language tag (e.g. 'zh-CN', 'pt-BR', 'en-GB') to one of
  // our 9 buckets. Falls back to 'en'.
  function pickLang(raw) {
    if (!raw) return 'en'
    const lower = String(raw).toLowerCase()
    if (lower.startsWith('zh')) {
      if (lower.includes('hant') || lower.includes('tw') || lower.includes('hk') || lower.includes('mo')) {
        return 'zh-Hant'
      }
      return 'zh-Hans'
    }
    if (lower.startsWith('ja')) return 'ja'
    if (lower.startsWith('ko')) return 'ko'
    if (lower.startsWith('es')) return 'es'
    if (lower.startsWith('de')) return 'de'
    if (lower.startsWith('pt')) return 'pt-BR'
    if (lower.startsWith('fr')) return 'fr'
    if (lower.startsWith('en')) return 'en'
    return 'en'
  }

  // Detect what locale this page is currently rendering. Root path → zh-Hans;
  // /<locale>/<page>.html → that locale.
  function currentLang() {
    const segments = location.pathname.split('/').filter(Boolean)
    // GitHub Pages prefixes with the repo name (e.g. /fitlite-site/...) so the
    // locale segment is whichever segment matches a supported code.
    for (const seg of segments) {
      if (SUPPORTED.includes(seg)) return seg
    }
    return 'zh-Hans'
  }

  // Build a URL for a given locale, preserving the page (privacy / support /
  // terms / index). Root pages (zh-Hans) live at /, others at /<locale>/.
  function urlForLang(target) {
    // Figure out the page slug independently of locale prefix.
    const pathParts = location.pathname.split('/').filter(Boolean)
    let pageFile = pathParts[pathParts.length - 1] || 'index.html'
    if (!pageFile.endsWith('.html')) pageFile = 'index.html'

    // Reconstruct the base path (everything before the locale or page).
    // On GitHub Pages this is /fitlite-site/. Locally it might be /.
    let base = ''
    for (const seg of pathParts) {
      if (SUPPORTED.includes(seg) || seg.endsWith('.html')) break
      base += '/' + seg
    }
    if (!base.endsWith('/')) base += '/'

    return target === 'zh-Hans'
      ? `${base}${pageFile}`
      : `${base}${target}/${pageFile}`
  }

  // Auto-redirect on first visit if the URL doesn't match the user's
  // browser language. Skipped if the user has manually picked something
  // (so they can navigate to a non-default locale and stay there).
  function maybeAutoRedirect() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return  // user already picked something — respect it
    const detected = pickLang(navigator.language || (navigator.languages || [])[0])
    const cur = currentLang()
    if (detected !== cur) {
      // First-time visitor whose browser language differs from this page —
      // jump to the localized version. Mark as auto so we don't loop.
      localStorage.setItem(STORAGE_KEY, '__auto__')
      location.replace(urlForLang(detected))
    }
  }

  // Render a <select> language picker into the nav. Each page calls this.
  function mountPicker() {
    const slot = document.getElementById('lang-picker-slot')
    if (!slot) return
    const cur = currentLang()
    const sel = document.createElement('select')
    sel.className = 'lang-picker'
    sel.setAttribute('aria-label', 'Language')
    const labels = {
      'zh-Hans': '简体中文',
      'zh-Hant': '繁體中文',
      'en':      'English',
      'ja':      '日本語',
      'ko':      '한국어',
      'es':      'Español',
      'de':      'Deutsch',
      'pt-BR':   'Português',
      'fr':      'Français',
    }
    SUPPORTED.forEach((code) => {
      const opt = document.createElement('option')
      opt.value = code
      opt.textContent = labels[code]
      if (code === cur) opt.selected = true
      sel.appendChild(opt)
    })
    sel.addEventListener('change', (e) => {
      const target = e.target.value
      localStorage.setItem(STORAGE_KEY, target)
      location.href = urlForLang(target)
    })
    slot.appendChild(sel)
  }

  // Run on load.
  maybeAutoRedirect()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPicker)
  } else {
    mountPicker()
  }
})()
