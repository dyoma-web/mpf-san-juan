/* ==========================================================================
   Modo revisión: comentarios en vivo sobre el prototipo
   Se activa con ?revision=CODIGO (o ?revision para escribirlo).
   Datos: Supabase (funciones RPC con código de sesión) + Realtime para
   avisos instantáneos y presencia. Sin el modo activo no carga nada.
   ========================================================================== */
(function () {
  'use strict';
  const CFG = window.MPF_REVIEW;
  if (!CFG) return;
  const LS = 'mpf-review';
  const params = new URLSearchParams(location.search);
  const ls = {
    get() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  let saved = ls.get();
  if (!params.has('revision') && !saved.code) return;

  /* ---------- Constantes ---------- */
  const KINDS = {
    corregir: { t: 'Corregir', c: 'var(--k-corregir)' },
    agregar: { t: 'Agregar', c: 'var(--k-agregar)' },
    eliminar: { t: 'Eliminar', c: 'var(--k-eliminar)' },
    idea: { t: 'Idea', c: 'var(--k-idea)' },
    pregunta: { t: 'Pregunta', c: 'var(--k-pregunta)' },
    redaccion: { t: 'Redacción', c: 'var(--k-redaccion)' }
  };
  const STATUS = { abierto: 'Abierto', en_curso: 'En curso', resuelto: 'Resuelto' };
  const COLORS = ['#0090FF', '#E5484D', '#30A46C', '#8E4EC6', '#F76B15', '#12A594', '#D6409F', '#3E63DD'];
  const PAGE = (location.pathname.split('/').pop() || 'index.html');
  const PAGE_TITLE = (document.title.split(' · ')[0] || PAGE).replace('Ministerio Público Fiscal de San Juan', 'Inicio');
  const VERSION = (document.querySelector('meta[name="mpf-version"]') || {}).content || '';

  const ICONS = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <symbol id="rv-i-msg" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></symbol>
    <symbol id="rv-i-type" viewBox="0 0 24 24"><path d="M4 7V5h16v2M12 5v14M9 19h6"/></symbol>
    <symbol id="rv-i-eye" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 9 4.5 10 6-.4.7-1.4 2-2.8 3.3M6.6 6.6C4.4 8 2.9 10 2 12c1 1.5 5 6 10 6 1.6 0 3-.4 4.3-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></symbol>
    <symbol id="rv-i-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></symbol>
    <symbol id="rv-i-dots" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></symbol>
    <symbol id="rv-i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
    <symbol id="rv-i-up" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></symbol>
    <symbol id="rv-i-reply" viewBox="0 0 24 24"><path d="M10 8 5 12l5 4M5 12h9a5 5 0 0 1 5 5v1"/></symbol>
    <symbol id="rv-i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></symbol>
    <symbol id="rv-i-back" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></symbol>
    <symbol id="rv-i-doc" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></symbol>
    <symbol id="rv-i-sheet" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/></symbol>
    <symbol id="rv-i-dl" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></symbol>
    <symbol id="rv-i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></symbol>
    <symbol id="rv-i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></symbol>
    <symbol id="rv-i-exit" viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/></symbol>
    <symbol id="rv-i-restore" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></symbol>
  </svg>`;
  const ic = (n) => `<svg class="ic" aria-hidden="true"><use href="#rv-i-${n}"/></svg>`;

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  function ago(d) {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'recién';
    if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }
  function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h).toString(36); }
  async function rpc(fn, args) {
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch (e) { j = t; }
    if (!r.ok) throw new Error((j && j.message) || t || r.statusText);
    return j;
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  /* ---------- Estado ---------- */
  const S = {
    code: null, me: null, all: [], mode: null, panel: false, view: 'list', detail: null,
    tab: 'page', kinds: new Set(Object.keys(KINDS)), status: 'activos', sort: 'recientes', q: '',
    pins: saved.pins !== false, showResolved: saved.showResolved !== false,
    presence: [], live: false, els: new Map(), resolving: false, editing: false
  };
  let root, bar, pinsLayer, hoverBox, panel, pop, toastEl, hintEl, channel;

  /* ---------- Arranque ---------- */
  async function boot() {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'assets/css/review.css';
    document.head.appendChild(css);
    root = document.createElement('div');
    root.id = 'rv-root';
    root.innerHTML = ICONS;
    document.body.appendChild(root);

    const fromUrl = params.get('revision');
    let code = fromUrl || saved.code;
    if (params.has('revision')) {
      params.delete('revision');
      const qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
    code = await ensureCode(code);
    if (!code) { root.remove(); return; }
    S.code = code;
    saved = Object.assign(ls.get(), { code });
    ls.set(saved);
    S.me = saved.me && saved.me.id ? saved.me : await askIdentity();
    document.body.classList.add('rv-active');
    buildUI();
    applyHidden();
    await reload();
    connectRealtime();
    setInterval(() => { if (!S.live) reload(); }, 20000);
    setInterval(reload, 120000);
    const m = location.hash.match(/rv=([0-9a-f-]{36})/);
    if (m) { history.replaceState(null, '', location.pathname + location.search); setTimeout(() => focusComment(m[1]), 400); }
  }

  async function ensureCode(code) {
    while (true) {
      if (code) {
        try { if (await rpc('review_check', { p_code: code })) return code; }
        catch (e) { await infoModal('El sistema de comentarios no está disponible', 'No pudimos conectar con la base de datos de revisión. Probá de nuevo en unos minutos.'); return null; }
      }
      code = await askCode(!!code);
      if (code === null) { const s = ls.get(); delete s.code; ls.set(s); return null; }
    }
  }

  /* ---------- Modales ---------- */
  function modal(html, onMount) {
    return new Promise((resolve) => {
      const m = document.createElement('div');
      m.className = 'rv-modal';
      m.innerHTML = `<div class="rv-dialog" role="dialog" aria-modal="true">${html}</div>`;
      root.appendChild(m);
      const done = (v) => { m.remove(); resolve(v); };
      onMount(m, done);
      const f = $('input, textarea, button', m);
      f && f.focus();
    });
  }
  function infoModal(t, p) {
    return modal(`<h2 class="rv-h">${esc(t)}</h2><p>${esc(p)}</p><div class="rv-actions"><button class="rv-b rv-b-p" data-ok>Entendido</button></div>`,
      (m, done) => $('[data-ok]', m).onclick = () => done());
  }
  function askCode(wrong) {
    return modal(`
      <h2 class="rv-h">Modo revisión</h2>
      <p>Ingresá el código de la sesión para ver y dejar comentarios sobre el prototipo.</p>
      ${wrong ? '<p style="color:#C62A2F;font-weight:700">El código no es válido.</p>' : ''}
      <form class="rv-form" style="display:flex;flex-direction:column;gap:12px">
        <input class="rv-in" name="code" placeholder="Código de sesión" autocomplete="off" required>
        <div class="rv-actions"><button type="button" class="rv-b" data-cancel>Cancelar</button><button class="rv-b rv-b-p">Entrar</button></div>
      </form>`, (m, done) => {
      $('form', m).onsubmit = (e) => { e.preventDefault(); done($('input', m).value.trim()); };
      $('[data-cancel]', m).onclick = () => done(null);
    });
  }
  function askIdentity(cur) {
    const color0 = (cur && cur.color) || COLORS[Math.floor(Math.random() * COLORS.length)];
    return modal(`
      <h2 class="rv-h">${cur ? 'Tu nombre' : '¡Bienvenida, bienvenido!'}</h2>
      <p>${cur ? 'Así te ven las demás personas en la sesión.' : 'Contanos cómo te llamás para que el equipo sepa quién dejó cada comentario. No hace falta crear una cuenta.'}</p>
      <form style="display:flex;flex-direction:column;gap:14px">
        <input class="rv-in" name="name" placeholder="Nombre y apellido o rol" value="${esc(cur ? cur.name : '')}" maxlength="60" required>
        <div><div class="rv-label" style="margin-bottom:8px">Tu color</div><div class="rv-colors">${COLORS.map((c) => `<button type="button" class="rv-color" style="background:${c}" data-c="${c}" aria-label="Color ${c}" aria-pressed="${c === color0}"></button>`).join('')}</div></div>
        <div class="rv-actions"><button class="rv-b rv-b-p">Continuar</button></div>
      </form>`, (m, done) => {
      let color = color0;
      $$('[data-c]', m).forEach((b) => b.onclick = () => { color = b.dataset.c; $$('[data-c]', m).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
      $('form', m).onsubmit = (e) => {
        e.preventDefault();
        const name = $('input', m).value.trim();
        if (!name) return;
        const me = { id: (cur && cur.id) || uid(), name, color };
        const s = ls.get(); s.me = me; ls.set(s);
        done(me);
      };
    });
  }

  /* ---------- Interfaz ---------- */
  function buildUI() {
    root.insertAdjacentHTML('beforeend', `
      <div class="rv-pins" aria-hidden="false"></div>
      <div class="rv-hover" hidden><span class="rv-hover-label"></span></div>
      <div class="rv-mode-hint" hidden></div>
      <div class="rv-toast" role="status"></div>
      <aside class="rv-panel" aria-label="Comentarios de revisión"></aside>
      <div class="rv-bar" role="toolbar" aria-label="Herramientas de revisión">
        <span class="rv-brand" title="Conexión en vivo"><span class="rv-live is-off"></span><span class="rv-brand-t">Revisión</span></span>
        <span class="rv-avatars"></span>
        <span class="rv-sep"></span>
        <button type="button" class="rv-btn" data-mode="comment" aria-pressed="false" title="Comentar un elemento (C)">${ic('msg')}<span class="rv-t">Comentar</span><kbd>C</kbd></button>
        <button type="button" class="rv-btn" data-mode="suggest" aria-pressed="false" title="Proponer otra redacción (S)">${ic('type')}<span class="rv-t">Redacción</span><kbd>S</kbd></button>
        <button type="button" class="rv-btn" data-mode="hide" aria-pressed="false" title="Ocultar un bloque para simular (H)">${ic('eye')}<span class="rv-t">Ocultar</span><kbd>H</kbd></button>
        <span class="rv-sep"></span>
        <button type="button" class="rv-btn" data-act="panel" aria-pressed="false" title="Panel de comentarios (P)">${ic('list')}<span class="rv-t">Comentarios</span><span class="rv-count">0</span></button>
        <span style="position:relative">
          <button type="button" class="rv-btn" data-act="menu" aria-haspopup="true" aria-expanded="false" aria-label="Más opciones">${ic('dots')}</button>
          <div class="rv-menu" hidden></div>
        </span>
      </div>`);
    bar = $('.rv-bar', root);
    pinsLayer = $('.rv-pins', root);
    hoverBox = $('.rv-hover', root);
    panel = $('.rv-panel', root);
    toastEl = $('.rv-toast', root);
    hintEl = $('.rv-mode-hint', root);

    bar.addEventListener('click', (e) => {
      const m = e.target.closest('[data-mode]');
      const a = e.target.closest('[data-act]');
      if (m) setMode(S.mode === m.dataset.mode ? null : m.dataset.mode);
      else if (a && a.dataset.act === 'panel') togglePanel();
      else if (a && a.dataset.act === 'menu') toggleMenu();
    });
    pinsLayer.addEventListener('click', (e) => {
      const p = e.target.closest('.rv-pin');
      if (p) { openPanel(); showDetail(p.dataset.id); }
    });
    pinsLayer.addEventListener('mouseover', (e) => {
      const p = e.target.closest('.rv-pin');
      $$('.rv-tip', pinsLayer).forEach((t) => t.remove());
      if (!p) return;
      const c = S.all.find((x) => x.id === p.dataset.id);
      if (!c) return;
      const tip = document.createElement('div');
      tip.className = 'rv-tip';
      tip.style.left = p.style.left; tip.style.top = p.style.top;
      tip.innerHTML = `<b>#${c.num} · ${KINDS[c.kind].t}</b> — ${esc(c.author_name)}<br>${esc((c.proposal || c.body || '').slice(0, 140))}`;
      pinsLayer.appendChild(tip);
    });
    pinsLayer.addEventListener('mouseout', (e) => { if (e.target.closest('.rv-pin')) $$('.rv-tip', pinsLayer).forEach((t) => t.remove()); });

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('mouseup', onSelectEnd, true);
    document.addEventListener('touchend', onSelectEnd, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', schedulePins, { passive: true });
    window.addEventListener('resize', () => { S.els.clear(); schedulePins(); });
    new MutationObserver((muts) => {
      if (muts.every((m) => root.contains(m.target))) return;
      S.els.clear(); schedulePins();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'class', 'data-rv-hidden'] });
    setInterval(schedulePins, 1200);
    renderPanel();
  }

  function toast(msg) {
    toastEl.innerHTML = esc(msg);
    toastEl.classList.add('is-on');
    clearTimeout(toastEl._h);
    toastEl._h = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  }

  /* ---------- Modos ---------- */
  const HINTS = {
    comment: 'Hacé clic en cualquier elemento para dejar un comentario · Esc para salir',
    suggest: 'Seleccioná el texto que querés reescribir · Esc para salir',
    hide: 'Hacé clic en un bloque para ocultarlo (solo en tu pantalla) · Esc para salir'
  };
  function setMode(m) {
    S.mode = m;
    $$('[data-mode]', bar).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    document.body.classList.toggle('rv-picking', m === 'comment');
    document.body.classList.toggle('rv-hiding', m === 'hide');
    hintEl.hidden = !m;
    if (m) hintEl.textContent = HINTS[m];
    hoverBox.hidden = true;
  }
  function inReviewUI(el) { return !!(el && el.closest && el.closest('#rv-root, .rv-ghost')); }
  function pickTarget(el) {
    if (!el || el.nodeType !== 1) el = el && el.parentElement;
    if (!el) return null;
    const svg = el.closest('svg');
    if (svg) el = svg.parentElement || svg;
    if (el === document.body || el === document.documentElement) return null;
    return el;
  }
  function describe(el) {
    const tag = el.tagName.toLowerCase();
    const names = { h1: 'Título', h2: 'Título', h3: 'Subtítulo', h4: 'Subtítulo', p: 'Párrafo', a: 'Enlace', button: 'Botón', img: 'Imagen', li: 'Ítem', input: 'Campo', select: 'Selector', section: 'Sección', nav: 'Navegación', ul: 'Lista', ol: 'Lista', header: 'Encabezado', footer: 'Pie', form: 'Formulario', table: 'Tabla', span: 'Texto', div: 'Bloque', article: 'Artículo', label: 'Etiqueta', dl: 'Lista', aside: 'Columna' };
    const t = snippetOf(el).slice(0, 38);
    return (names[tag] || tag) + (t ? ' · ' + t + (snippetOf(el).length > 38 ? '…' : '') : '');
  }
  function snippetOf(el) {
    const t = el.tagName === 'IMG' ? (el.alt || '') : (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '');
    return t.replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  function onMove(e) {
    if (S.mode !== 'comment' && S.mode !== 'hide') return;
    if (pop || inReviewUI(e.target)) { hoverBox.hidden = true; return; }
    const el = pickTarget(e.target);
    if (!el) { hoverBox.hidden = true; return; }
    const r = el.getBoundingClientRect();
    Object.assign(hoverBox.style, { left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' });
    hoverBox.classList.toggle('is-hide', S.mode === 'hide');
    $('.rv-hover-label', hoverBox).textContent = (S.mode === 'hide' ? 'Ocultar: ' : '') + describe(el);
    hoverBox.hidden = false;
  }
  function onClick(e) {
    if (inReviewUI(e.target)) return;
    if (pop && !e.target.closest('.rv-pop')) { closePop(); if (S.mode) { e.preventDefault(); e.stopPropagation(); } return; }
    if (S.mode !== 'comment' && S.mode !== 'hide') return;
    const el = pickTarget(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    hoverBox.hidden = true;
    if (S.mode === 'hide') hideBlock(el);
    else {
      const r = el.getBoundingClientRect();
      openComposer({ el, kind: 'corregir', relX: (e.clientX - r.left) / Math.max(r.width, 1), relY: (e.clientY - r.top) / Math.max(r.height, 1), x: e.clientX, y: e.clientY });
    }
  }
  function onSelectEnd(e) {
    if (S.mode !== 'suggest' || inReviewUI(e.target) || pop) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().replace(/\s+/g, ' ').trim() : '';
      if (text.length < 2 || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      let el = range.commonAncestorContainer;
      if (el.nodeType !== 1) el = el.parentElement;
      el = pickTarget(el);
      if (!el || inReviewUI(el)) return;
      const rr = range.getBoundingClientRect(), er = el.getBoundingClientRect();
      openComposer({ el, kind: 'redaccion', quote: text, relX: (rr.left - er.left) / Math.max(er.width, 1), relY: (rr.top - er.top) / Math.max(er.height, 1), x: rr.left, y: rr.bottom });
    }, 10);
  }
  function onKey(e) {
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName) || (document.activeElement || {}).isContentEditable;
    if (e.key === 'Escape') {
      if (pop) { closePop(); e.stopPropagation(); return; }
      if ($('.rv-menu:not([hidden])', root)) { toggleMenu(false); e.stopPropagation(); return; }
      if (S.mode) { setMode(null); e.stopPropagation(); return; }
      if (S.panel && !typing) { togglePanel(false); e.stopPropagation(); }
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || $('.rv-modal', root)) return;
    const k = e.key.toLowerCase();
    const map = { c: 'comment', s: 'suggest', h: 'hide' };
    if (map[k]) { e.preventDefault(); setMode(S.mode === map[k] ? null : map[k]); }
    else if (k === 'p') { e.preventDefault(); togglePanel(); }
  }

  /* ---------- Selector estable para anclar pines ---------- */
  function selectorFor(el) {
    if (el.id && !/^rv-/.test(el.id) && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.body) {
      if (n.id && !/^(rv-|cmdk-o)/.test(n.id) && document.querySelectorAll('#' + CSS.escape(n.id)).length === 1) { parts.unshift('#' + CSS.escape(n.id)); break; }
      let i = 1, s = n;
      while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
      parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      n = n.parentElement;
    }
    if (n === document.body) parts.unshift('body');
    return parts.join(' > ');
  }
  function locate(c) {
    if (S.els.has(c.id)) return S.els.get(c.id);
    let el = null;
    try { el = c.selector ? document.querySelector(c.selector) : null; } catch (e) { el = null; }
    const want = norm(c.snippet).slice(0, 40);
    if (want && (!el || !norm(snippetOf(el)).startsWith(want.slice(0, 24)))) {
      const tag = ((c.selector || '').split('>').pop().trim().match(/^[a-z0-9]+/) || ['*'])[0];
      const cand = $$(tag === 'body' ? '*' : tag).find((x) => !inReviewUI(x) && norm(snippetOf(x)).startsWith(want.slice(0, 24)));
      if (cand) el = cand;
    }
    S.els.set(c.id, el);
    return el;
  }
  function isShown(el) {
    if (!el || !el.isConnected || el.closest('[data-rv-hidden]')) return false;
    return el.getClientRects().length > 0;
  }

  /* ---------- Pines ---------- */
  let pinRaf = 0;
  function schedulePins() { if (!pinRaf) pinRaf = requestAnimationFrame(() => { pinRaf = 0; layoutPins(); }); }
  function layoutPins() {
    if (!pinsLayer) return;
    const here = S.pins ? S.all.filter((c) => c.page === PAGE && (S.showResolved || c.status !== 'resuelto')) : [];
    const ids = new Set(here.map((c) => c.id));
    $$('.rv-pin', pinsLayer).forEach((p) => { if (!ids.has(p.dataset.id)) p.remove(); });
    for (const c of here) {
      let p = $(`.rv-pin[data-id="${c.id}"]`, pinsLayer);
      if (!p) {
        p = document.createElement('button');
        p.type = 'button';
        p.className = 'rv-pin';
        p.dataset.id = c.id;
        pinsLayer.appendChild(p);
      }
      p.textContent = c.num;
      p.style.background = KINDS[c.kind].c;
      p.classList.toggle('is-resolved', c.status === 'resuelto');
      p.classList.toggle('is-active', S.view === 'detail' && S.detail === c.id && S.panel);
      p.setAttribute('aria-label', `Comentario ${c.num}: ${KINDS[c.kind].t}`);
      const el = locate(c);
      if (!isShown(el)) { p.hidden = true; continue; }
      const r = el.getBoundingClientRect();
      const x = r.left + Math.min(Math.max(c.rel_x ?? 0, 0), 1) * r.width;
      const y = r.top + Math.min(Math.max(c.rel_y ?? 0, 0), 1) * r.height;
      p.hidden = y < -40 || y > innerHeight + 40;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
    }
  }

  /* ---------- Compositor (post-it) ---------- */
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function placePop(x, y) {
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let left = Math.min(Math.max(12, x + 14), innerWidth - w - 12);
    let top = y + 14;
    if (top + h > innerHeight - 80) top = Math.max(12, y - h - 14);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }
  function openComposer(o) {
    closePop();
    const isSug = o.kind === 'redaccion';
    pop = document.createElement('div');
    pop.className = 'rv-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Nuevo comentario');
    pop.innerHTML = `<form class="rv-pop-in">
      <div class="rv-pop-head"><span class="rv-h" style="font-size:15px">${isSug ? 'Proponer otra redacción' : 'Nuevo comentario'}</span><button type="button" class="rv-x" data-close aria-label="Cerrar" style="width:30px;height:30px;background:transparent;border-color:rgba(11,26,42,.12)">${ic('x')}</button></div>
      <div class="rv-pop-target">${ic('target')} ${esc(describe(o.el))}</div>
      ${isSug ? `<div class="rv-label">Texto actual</div><p class="rv-quote">${esc(o.quote)}</p>
        <label class="rv-label" for="rv-prop">Nueva redacción</label><textarea id="rv-prop" class="rv-ta" required>${esc(o.quote)}</textarea>
        <label class="rv-label" for="rv-body">Por qué (opcional)</label><textarea id="rv-body" class="rv-ta" style="min-height:56px"></textarea>`
        : `<div class="rv-kinds" role="group" aria-label="Tipo">${Object.entries(KINDS).filter(([k]) => k !== 'redaccion').map(([k, v]) => `<button type="button" class="rv-kind" data-k="${k}" aria-pressed="${k === o.kind}" style="color:${v.c}"><i style="background:${v.c}"></i><span style="color:#16222F">${v.t}</span></button>`).join('')}</div>
        <textarea id="rv-body" class="rv-ta" placeholder="¿Qué hay que cambiar, agregar o revisar?" required></textarea>`}
      <div class="rv-actions"><span class="rv-hint">Ctrl + Enter para guardar</span><button type="button" class="rv-b" data-close>Cancelar</button><button class="rv-b rv-b-p">Guardar</button></div>
    </form>`;
    root.appendChild(pop);
    placePop(o.x, o.y);
    let kind = o.kind;
    $$('[data-k]', pop).forEach((b) => b.onclick = () => { kind = b.dataset.k; $$('[data-k]', pop).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
    $$('[data-close]', pop).forEach((b) => b.onclick = closePop);
    const form = $('form', pop);
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });
    form.onsubmit = async (e) => {
      e.preventDefault();
      const body = ($('#rv-body', pop).value || '').trim();
      const proposal = isSug ? $('#rv-prop', pop).value.trim() : null;
      if (!isSug && !body) { $('#rv-body', pop).focus(); return; }
      if (isSug && (!proposal || proposal === o.quote)) { $('#rv-prop', pop).focus(); return; }
      const btn = $('.rv-b-p', pop); btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        const c = await rpc('review_add_comment', { p_code: S.code, p: {
          page: PAGE, page_title: PAGE_TITLE, selector: selectorFor(o.el), rel_x: o.relX, rel_y: o.relY,
          snippet: snippetOf(o.el), viewport_w: innerWidth, kind, body, quote: o.quote || null, proposal,
          author_id: S.me.id, author_name: S.me.name, author_color: S.me.color, version: VERSION
        } });
        c.replies = []; c.voters = [];
        S.all.push(c);
        closePop();
        window.getSelection && window.getSelection().removeAllRanges();
        refresh();
        notify('add', c);
        toast(`Comentario #${c.num} guardado`);
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Guardar';
        toast('No se pudo guardar. Revisá la conexión.');
      }
    };
    setTimeout(() => ($('#rv-prop', pop) || $('#rv-body', pop)).focus(), 30);
  }

  /* ---------- Ocultar bloques (simulación local) ---------- */
  const HKEY = 'mpf-review-hidden:' + PAGE;
  const hiddenSel = () => { try { return JSON.parse(sessionStorage.getItem(HKEY)) || []; } catch (e) { return []; } };
  const saveHidden = (a) => { try { sessionStorage.setItem(HKEY, JSON.stringify(a)); } catch (e) { /* nada */ } };
  function hideBlock(el, silent) {
    if (el.hasAttribute('data-rv-hidden')) return;
    const sel = selectorFor(el);
    const snip = snippetOf(el);
    el.setAttribute('data-rv-hidden', '');
    const g = document.createElement('div');
    g.className = 'rv-ghost';
    g.dataset.sel = sel;
    g.innerHTML = `<span>${ic('eye')} Bloque oculto (simulación, solo en tu pantalla)${snip ? ': «' + esc(snip.slice(0, 50)) + (snip.length > 50 ? '…' : '') + '»' : ''}</span>
      <button type="button" class="rv-b" data-restore>${ic('restore')}Restaurar</button>
      <button type="button" class="rv-b rv-b-p" data-propose>Proponer eliminarlo</button>`;
    el.parentNode.insertBefore(g, el);
    $('[data-restore]', g).onclick = () => restoreBlock(g, el);
    $('[data-propose]', g).onclick = () => {
      const r = g.getBoundingClientRect();
      openComposer({ el, kind: 'eliminar', relX: 0.02, relY: 0.02, x: r.left + 20, y: r.bottom });
    };
    if (!silent) {
      const a = hiddenSel(); if (!a.includes(sel)) { a.push(sel); saveHidden(a); }
      toast('Bloque oculto. Podés restaurarlo cuando quieras.');
    }
    updateMenu();
  }
  function restoreBlock(g, el) {
    el.removeAttribute('data-rv-hidden');
    saveHidden(hiddenSel().filter((s) => s !== g.dataset.sel));
    g.remove();
    updateMenu();
  }
  function applyHidden() {
    hiddenSel().forEach((sel) => { try { const el = document.querySelector(sel); if (el) hideBlock(el, true); } catch (e) { /* selector viejo */ } });
  }
  function restoreAll() {
    $$('.rv-ghost').forEach((g) => { const el = g.nextElementSibling; if (el) el.removeAttribute('data-rv-hidden'); g.remove(); });
    saveHidden([]);
    updateMenu();
    toast('Se restauraron todos los bloques');
  }

  /* ---------- Datos y tiempo real ---------- */
  let reloading = null;
  async function reload() {
    if (reloading) return reloading;
    reloading = rpc('review_list', { p_code: S.code }).then((rows) => {
      S.all = Array.isArray(rows) ? rows : [];
      S.els.clear();
      refresh();
    }).catch(() => {}).finally(() => { reloading = null; });
    return reloading;
  }
  function refresh() {
    // No re-renderizar el detalle mientras alguien escribe en él (respuesta, edición o referencia).
    const a = document.activeElement;
    const typingInDetail = S.view === 'detail' && panel && panel.contains(a) && /TEXTAREA|INPUT/.test(a.tagName);
    if (!typingInDetail && !(S.view === 'detail' && (S.editing || S.resolving))) renderPanel();
    layoutPins(); updateCount();
  }
  function updateCount() {
    const n = S.all.filter((c) => c.page === PAGE && c.status !== 'resuelto').length;
    $('.rv-count', bar).textContent = n;
  }
  async function connectRealtime() {
    try {
      if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
      const client = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false } });
      channel = client.channel('mpf-review-' + hash(S.code), { config: { broadcast: { self: false }, presence: { key: S.me.id } } });
      channel.on('broadcast', { event: 'changed' }, ({ payload }) => {
        reload();
        if (payload && payload.action === 'add') toast(`${payload.name} comentó en ${payload.pageTitle} (#${payload.num})`);
      });
      channel.on('presence', { event: 'sync' }, () => {
        const st = channel.presenceState();
        S.presence = Object.values(st).map((a) => a[0]).filter(Boolean);
        renderPresence();
      });
      channel.subscribe(async (status) => {
        S.live = status === 'SUBSCRIBED';
        $('.rv-live', bar).classList.toggle('is-off', !S.live);
        if (S.live) await channel.track({ id: S.me.id, name: S.me.name, color: S.me.color, page: PAGE_TITLE });
      });
    } catch (e) { S.live = false; }
  }
  function notify(action, c) {
    if (channel && S.live) channel.send({ type: 'broadcast', event: 'changed', payload: { action, by: S.me.id, name: S.me.name, num: c && c.num, pageTitle: c && c.page_title } });
  }
  function renderPresence() {
    const people = S.presence.length ? S.presence : [S.me];
    $('.rv-avatars', bar).innerHTML = people.slice(0, 5).map((p) => `<span class="rv-av" style="background:${esc(p.color)}" title="${esc(p.name)} · ${esc(p.page || '')}">${esc(initials(p.name))}</span>`).join('');
    const pres = $('.rv-presence', panel);
    if (pres) pres.innerHTML = people.map((p) => `<span class="rv-person"><span class="rv-av rv-av-sm" style="background:${esc(p.color)}">${esc(initials(p.name))}</span>${esc(p.name)}${p.id === S.me.id ? ' <small>(vos)</small>' : ''}<small>${esc(p.page || '')}</small></span>`).join('');
  }

  /* ---------- Panel ---------- */
  function togglePanel(force) {
    S.panel = typeof force === 'boolean' ? force : !S.panel;
    panel.classList.toggle('is-open', S.panel);
    document.body.classList.toggle('rv-panel-open', S.panel);
    $('[data-act="panel"]', bar).setAttribute('aria-pressed', String(S.panel));
    if (!S.panel) { S.view = 'list'; S.detail = null; }
    renderPanel(); layoutPins();
  }
  function openPanel() { if (!S.panel) togglePanel(true); }
  function filtered() {
    const q = norm(S.q);
    let a = S.all.filter((c) => (S.tab === 'all' || c.page === PAGE) && S.kinds.has(c.kind)
      && (S.status === 'todos' || (S.status === 'activos' ? c.status !== 'resuelto' : c.status === S.status))
      && (!q || norm([c.body, c.quote, c.proposal, c.author_name, c.page_title, c.snippet, '#' + c.num].join(' ')).includes(q)));
    if (S.sort === 'votos') a.sort((x, y) => (y.voters.length - x.voters.length) || (y.num - x.num));
    else if (S.sort === 'numero') a.sort((x, y) => x.num - y.num);
    else a.sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
    return a;
  }
  function badge(c) { return `<span class="rv-num" style="background:${KINDS[c.kind].c}">${c.num}</span>`; }
  function diff(c) { return c.quote ? `<span class="rv-diff"><del>${esc(c.quote)}</del> → <ins>${esc(c.proposal || '')}</ins></span>` : ''; }
  function renderPanel() {
    if (!panel) return;
    if (S.view === 'detail') return renderDetail();
    const list = filtered();
    const keepFocus = document.activeElement && document.activeElement.id === 'rv-q';
    panel.innerHTML = `
      <div class="rv-ph">
        <div class="rv-ph-top"><h2 class="rv-h">Comentarios</h2><button type="button" class="rv-x" data-close aria-label="Cerrar panel">${ic('x')}</button></div>
        <div class="rv-presence"></div>
        <div class="rv-tabs" role="tablist">
          <button type="button" class="rv-tab" role="tab" data-tab="page" aria-selected="${S.tab === 'page'}">Esta página (${S.all.filter((c) => c.page === PAGE).length})</button>
          <button type="button" class="rv-tab" role="tab" data-tab="all" aria-selected="${S.tab === 'all'}">Todo el sitio (${S.all.length})</button>
        </div>
        <div class="rv-filters" role="group" aria-label="Filtrar por tipo">${Object.entries(KINDS).map(([k, v]) => `<button type="button" class="rv-kind" data-fk="${k}" aria-pressed="${S.kinds.has(k)}"><i style="background:${v.c}"></i>${v.t}</button>`).join('')}</div>
        <div class="rv-row">
          <select data-status aria-label="Estado"><option value="activos">Pendientes</option><option value="abierto">Abiertos</option><option value="en_curso">En curso</option><option value="resuelto">Resueltos</option><option value="todos">Todos</option></select>
          <select data-sort aria-label="Orden"><option value="recientes">Más recientes</option><option value="votos">Más votados</option><option value="numero">Por número</option></select>
        </div>
        <input id="rv-q" class="rv-in" type="search" placeholder="Buscar en comentarios" value="${esc(S.q)}" style="min-height:36px;padding:6px 12px">
      </div>
      <div class="rv-list">${list.length ? list.map((c) => {
        const voted = c.voters.some((v) => v.id === S.me.id);
        const placed = c.page !== PAGE || isShown(locate(c));
        return `<button type="button" class="rv-card${c.status === 'resuelto' ? ' is-resolved' : ''}" data-id="${c.id}">
          <div class="rv-card-top">${badge(c)}<span class="rv-badge"><i style="background:${KINDS[c.kind].c}"></i>${KINDS[c.kind].t}</span><span class="rv-badge rv-st-${c.status}">${STATUS[c.status]}</span><span style="margin-left:auto">${esc(ago(c.created_at))}</span></div>
          <p class="rv-card-body">${c.kind === 'redaccion' ? diff(c) : esc(c.body)}</p>
          <div class="rv-card-foot">
            <span class="rv-av rv-av-sm" style="background:${esc(c.author_color || '#5B6978')}">${esc(initials(c.author_name))}</span>${esc(c.author_name)}
            <span title="Votos"${voted ? ' style="color:#B88A1E;font-weight:700"' : ''}>${ic('up')}${c.voters.length}</span>
            <span title="Respuestas">${ic('reply')}${c.replies.length}</span>
            ${!placed ? '<span title="El elemento no está visible ahora">' + ic('pin') + 'oculto</span>' : ''}
            ${S.tab === 'all' ? `<span class="rv-card-page">${esc(c.page_title || c.page)}</span>` : ''}
          </div>
        </button>`;
      }).join('') : `<div class="rv-empty">${S.all.length ? 'No hay comentarios con estos filtros.' : 'Todavía no hay comentarios.<br>Activá <b>Comentar</b> (tecla C) y hacé clic en cualquier parte de la página.'}</div>`}</div>`;
    $('[data-status]', panel).value = S.status;
    $('[data-sort]', panel).value = S.sort;
    renderPresence();
    $('[data-close]', panel).onclick = () => togglePanel(false);
    $$('[data-tab]', panel).forEach((b) => b.onclick = () => { S.tab = b.dataset.tab; renderPanel(); });
    $$('[data-fk]', panel).forEach((b) => b.onclick = () => {
      const k = b.dataset.fk;
      if (S.kinds.size === Object.keys(KINDS).length) S.kinds = new Set([k]);
      else if (S.kinds.has(k)) { S.kinds.delete(k); if (!S.kinds.size) S.kinds = new Set(Object.keys(KINDS)); }
      else S.kinds.add(k);
      renderPanel();
    });
    $('[data-status]', panel).onchange = (e) => { S.status = e.target.value; renderPanel(); };
    $('[data-sort]', panel).onchange = (e) => { S.sort = e.target.value; renderPanel(); };
    const q = $('#rv-q', panel);
    q.oninput = () => { S.q = q.value; renderPanel(); };
    if (keepFocus) { const nq = $('#rv-q', panel); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
    $$('.rv-card', panel).forEach((b) => b.onclick = () => showDetail(b.dataset.id));
  }
  function showDetail(id) { S.view = 'detail'; S.detail = id; S.resolving = false; S.editing = false; renderPanel(); layoutPins(); }
  function renderDetail() {
    const c = S.all.find((x) => x.id === S.detail);
    if (!c) { S.view = 'list'; return renderPanel(); }
    const mine = c.author_id === S.me.id;
    const voted = c.voters.some((v) => v.id === S.me.id);
    const draft = $('#rv-reply', panel) ? $('#rv-reply', panel).value : '';
    panel.innerHTML = `
      <div class="rv-ph"><div class="rv-ph-top"><button type="button" class="rv-back" data-back>${ic('back')}Todos los comentarios</button><button type="button" class="rv-x" data-close aria-label="Cerrar panel">${ic('x')}</button></div></div>
      <div class="rv-detail">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${badge(c)}<span class="rv-badge"><i style="background:${KINDS[c.kind].c}"></i>${KINDS[c.kind].t}</span><span class="rv-h" style="font-size:14px">${esc(c.page_title || c.page)}</span></div>
        <div class="rv-seg" role="group" aria-label="Estado">${Object.entries(STATUS).map(([k, v]) => `<button type="button" data-st="${k}" aria-pressed="${c.status === k}">${v}</button>`).join('')}</div>
        ${S.resolving ? `<form class="rv-box" data-resolve style="display:flex;flex-direction:column;gap:8px"><label class="rv-label" for="rv-ref">Referencia de la solución (opcional)</label><input id="rv-ref" class="rv-in" placeholder="Commit, versión o nota breve"><div class="rv-actions"><button type="button" class="rv-b" data-cancel-res>Cancelar</button><button class="rv-b rv-b-p">Marcar resuelto</button></div></form>` : ''}
        <div style="display:flex;align-items:center;gap:8px"><span class="rv-av rv-av-sm" style="background:${esc(c.author_color || '#5B6978')}">${esc(initials(c.author_name))}</span><strong class="rv-h" style="font-size:14px">${esc(c.author_name)}</strong><span style="font-size:12px;color:#5B6978">${esc(ago(c.created_at))}</span></div>
        ${S.editing ? `<form class="rv-box" data-edit style="display:flex;flex-direction:column;gap:8px">${c.kind === 'redaccion' ? `<label class="rv-label" for="rv-ep">Nueva redacción</label><textarea id="rv-ep" class="rv-ta">${esc(c.proposal)}</textarea>` : ''}<label class="rv-label" for="rv-eb">Comentario</label><textarea id="rv-eb" class="rv-ta">${esc(c.body)}</textarea><div class="rv-actions"><button type="button" class="rv-b" data-cancel-edit>Cancelar</button><button class="rv-b rv-b-p">Guardar cambios</button></div></form>`
          : `${c.kind === 'redaccion' ? `<div class="rv-box rv-diff" style="display:flex;flex-direction:column;gap:8px"><div class="rv-label">Texto actual</div><p><del>${esc(c.quote)}</del></p><div class="rv-label">Propuesta</div><p><ins>${esc(c.proposal)}</ins></p></div>` : ''}
          ${c.body ? `<div class="rv-box"><p>${esc(c.body)}</p></div>` : ''}`}
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" class="rv-b rv-vote" data-rv-vote aria-pressed="${voted}" title="${esc(c.voters.map((v) => v.name).join(', ') || 'Sin votos')}">${ic('up')}${voted ? 'Votado' : 'Votar'} · ${c.voters.length}</button>
          <button type="button" class="rv-b" data-goto>${ic('target')}Ir al elemento</button>
          ${mine && !S.editing ? `<button type="button" class="rv-b" data-edit-btn>Editar</button><button type="button" class="rv-b rv-b-danger" data-del>Eliminar</button>` : ''}
        </div>
        ${c.voters.length ? `<p style="margin:0;font-size:12.5px;color:#5B6978">Votaron: ${esc(c.voters.map((v) => v.name).join(', '))}</p>` : ''}
        <dl class="rv-meta">
          <dt>Elemento</dt><dd>${esc(c.snippet || '—')}</dd>
          <dt>Pantalla</dt><dd>${c.viewport_w ? c.viewport_w + ' px de ancho' : '—'}</dd>
          <dt>Versión</dt><dd>${esc(c.version || '—')}</dd>
          ${c.status === 'resuelto' ? `<dt>Resuelto</dt><dd>${esc(ago(c.resolved_at))}${c.resolved_ref ? ' · ' + esc(c.resolved_ref) : ''}</dd>` : ''}
        </dl>
        <div class="rv-label">Respuestas (${c.replies.length})</div>
        <div class="rv-replies">${c.replies.map((r) => `<div class="rv-reply"><span class="rv-av rv-av-sm" style="background:${esc(r.author_color || '#5B6978')}">${esc(initials(r.author_name))}</span><div class="rv-reply-b"><strong>${esc(r.author_name)}</strong><time>${esc(ago(r.created_at))}</time><p>${esc(r.body)}</p></div></div>`).join('') || '<p style="margin:0;font-size:13px;color:#5B6978">Nadie respondió todavía.</p>'}</div>
        <form data-reply style="display:flex;flex-direction:column;gap:8px"><textarea id="rv-reply" class="rv-ta" style="min-height:64px" placeholder="Escribí una respuesta…" aria-label="Respuesta">${esc(draft)}</textarea><div class="rv-actions"><span class="rv-hint" style="color:#5B6978">Ctrl + Enter</span><button class="rv-b rv-b-p">Responder</button></div></form>
      </div>`;
    $('[data-close]', panel).onclick = () => togglePanel(false);
    $('[data-back]', panel).onclick = () => { S.view = 'list'; S.detail = null; renderPanel(); layoutPins(); };
    $$('[data-st]', panel).forEach((b) => b.onclick = () => {
      if (b.dataset.st === c.status) return;
      if (b.dataset.st === 'resuelto') { S.resolving = true; renderDetail(); setTimeout(() => $('#rv-ref', panel).focus(), 20); return; }
      update(c, { status: b.dataset.st });
    });
    const rf = $('[data-resolve]', panel);
    if (rf) {
      rf.onsubmit = (e) => { e.preventDefault(); S.resolving = false; update(c, { status: 'resuelto', resolved_ref: $('#rv-ref', panel).value.trim() || null }); };
      $('[data-cancel-res]', panel).onclick = () => { S.resolving = false; renderDetail(); };
    }
    $('[data-rv-vote]', panel).onclick = async () => {
      try { await rpc('review_toggle_vote', { p_code: S.code, p_id: c.id, p_author: S.me.id, p_name: S.me.name }); await reload(); notify('vote', c); } catch (e) { toast('No se pudo registrar el voto'); }
    };
    $('[data-goto]', panel).onclick = () => goTo(c);
    const eb = $('[data-edit-btn]', panel);
    if (eb) eb.onclick = () => { S.editing = true; renderDetail(); };
    const ef = $('[data-edit]', panel);
    if (ef) {
      $('[data-cancel-edit]', panel).onclick = () => { S.editing = false; renderDetail(); };
      ef.onsubmit = (e) => {
        e.preventDefault();
        const p = { body: $('#rv-eb', panel).value.trim() };
        if ($('#rv-ep', panel)) p.proposal = $('#rv-ep', panel).value.trim();
        S.editing = false; update(c, p);
      };
    }
    const del = $('[data-del]', panel);
    if (del) del.onclick = async () => {
      if (!confirm(`¿Eliminar el comentario #${c.num}? No se puede deshacer.`)) return;
      try { await rpc('review_delete_comment', { p_code: S.code, p_id: c.id, p_author: S.me.id }); S.view = 'list'; S.detail = null; await reload(); notify('delete', c); toast('Comentario eliminado'); } catch (e) { toast('No se pudo eliminar'); }
    };
    const rpf = $('[data-reply]', panel);
    rpf.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); rpf.requestSubmit(); } });
    rpf.onsubmit = async (e) => {
      e.preventDefault();
      const body = $('#rv-reply', panel).value.trim();
      if (!body) return;
      $('#rv-reply', panel).value = '';
      try { await rpc('review_add_reply', { p_code: S.code, p: { comment_id: c.id, body, author_id: S.me.id, author_name: S.me.name, author_color: S.me.color } }); await reload(); notify('reply', c); } catch (err) { toast('No se pudo enviar la respuesta'); }
    };
  }
  async function update(c, p) {
    try { await rpc('review_update_comment', { p_code: S.code, p_id: c.id, p_author: S.me.id, p }); await reload(); notify('update', c); }
    catch (e) { toast(/solo_autor/.test(e.message) ? 'Solo quien escribió el comentario puede editarlo' : 'No se pudo actualizar'); reload(); }
  }
  function goTo(c) {
    if (c.page !== PAGE) { location.href = c.page + '#rv=' + c.id; return; }
    const el = locate(c);
    if (!isShown(el)) { toast('Ese elemento no está visible ahora (puede estar en otro paso o pestaña)'); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('rv-flash');
    setTimeout(() => el.classList.remove('rv-flash'), 1800);
  }
  function focusComment(id) {
    const c = S.all.find((x) => x.id === id);
    if (!c) return;
    openPanel(); showDetail(id);
    if (c.page === PAGE) goTo(c);
  }

  /* ---------- Menú ---------- */
  function toggleMenu(force) {
    const m = $('.rv-menu', bar);
    const open = typeof force === 'boolean' ? force : m.hidden;
    m.hidden = !open;
    $('[data-act="menu"]', bar).setAttribute('aria-expanded', String(open));
    if (open) updateMenu();
  }
  function updateMenu() {
    const m = bar && $('.rv-menu', bar);
    if (!m) return;
    const nh = $$('.rv-ghost').length;
    m.innerHTML = `
      <button type="button" data-m="acta">${ic('doc')}Generar acta de la sesión</button>
      <a href="${CFG.csv}?code=${encodeURIComponent(S.code)}" download="comentarios-mpf.csv">${ic('dl')}Exportar CSV</a>
      ${CFG.sheet ? `<a href="${CFG.sheet}" target="_blank" rel="noopener">${ic('sheet')}Abrir hoja de cálculo</a>` : ''}
      <hr>
      <button type="button" data-m="pins">${ic('pin')}${S.pins ? 'Ocultar pines' : 'Mostrar pines'}</button>
      <button type="button" data-m="resolved">${ic('target')}${S.showResolved ? 'Ocultar resueltos en la página' : 'Mostrar resueltos en la página'}</button>
      ${nh ? `<button type="button" data-m="restore">${ic('restore')}Restaurar bloques ocultos (${nh})</button>` : ''}
      <hr>
      <button type="button" data-m="name">${ic('user')}Cambiar mi nombre (${esc(S.me.name)})</button>
      <button type="button" data-m="exit">${ic('exit')}Salir del modo revisión</button>`;
    $$('[data-m]', m).forEach((b) => b.onclick = () => menuAction(b.dataset.m));
    $$('a', m).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  }
  async function menuAction(a) {
    toggleMenu(false);
    const s = ls.get();
    if (a === 'acta') return showActa();
    if (a === 'pins') { S.pins = !S.pins; s.pins = S.pins; ls.set(s); layoutPins(); toast(S.pins ? 'Pines visibles' : 'Pines ocultos'); }
    if (a === 'resolved') { S.showResolved = !S.showResolved; s.showResolved = S.showResolved; ls.set(s); layoutPins(); }
    if (a === 'restore') restoreAll();
    if (a === 'name') {
      S.me = await askIdentity(S.me);
      if (channel && S.live) channel.track({ id: S.me.id, name: S.me.name, color: S.me.color, page: PAGE_TITLE });
      renderPresence();
    }
    if (a === 'exit') {
      delete s.code; ls.set(s);
      if (channel) channel.unsubscribe();
      restoreAll();
      location.reload();
    }
  }

  /* ---------- Acta de la sesión ---------- */
  function buildActa() {
    const now = new Date();
    const f = now.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
    const all = S.all.slice().sort((a, b) => a.num - b.num);
    const people = [...new Set(all.map((c) => c.author_name).concat(all.flatMap((c) => c.replies.map((r) => r.author_name))).concat(S.presence.map((p) => p.name)))];
    const by = (k) => all.filter((c) => c.status === k).length;
    const kinds = Object.entries(KINDS).map(([k, v]) => [v.t, all.filter((c) => c.kind === k).length]).filter(([, n]) => n);
    const top = all.filter((c) => c.voters.length).sort((a, b) => b.voters.length - a.voters.length).slice(0, 10);
    const pages = [...new Set(all.map((c) => c.page_title || c.page))];
    const line = (c) => {
      let s = `- [${c.status === 'resuelto' ? 'x' : ' '}] **#${c.num} · ${KINDS[c.kind].t}** (${STATUS[c.status]}${c.voters.length ? ', ' + c.voters.length + ' voto' + (c.voters.length > 1 ? 's' : '') : ''}) — ${c.author_name}`;
      if (c.kind === 'redaccion') s += `\n  - Texto actual: “${c.quote}”\n  - Propuesta: “${c.proposal}”`;
      if (c.body) s += `\n  - ${c.body.replace(/\n+/g, ' ')}`;
      if (c.snippet && c.kind !== 'redaccion') s += `\n  - Elemento: “${c.snippet.slice(0, 80)}”`;
      c.replies.forEach((r) => { s += `\n  - ↳ ${r.author_name}: ${r.body.replace(/\n+/g, ' ')}`; });
      if (c.resolved_ref) s += `\n  - Resuelto: ${c.resolved_ref}`;
      return s;
    };
    let md = `# Acta de revisión · Sitio del MPF San Juan\n\n**Fecha:** ${f}  \n**Versión revisada:** ${VERSION || '—'}  \n**Participantes:** ${people.join(', ') || '—'}\n\n`;
    md += `## Resumen\n\n- Comentarios: **${all.length}** (abiertos ${by('abierto')} · en curso ${by('en_curso')} · resueltos ${by('resuelto')})\n- Por tipo: ${kinds.map(([t, n]) => `${t} ${n}`).join(' · ') || '—'}\n\n`;
    if (top.length) md += `## Prioridades (más votados)\n\n${top.map((c, i) => `${i + 1}. **#${c.num}** ${KINDS[c.kind].t} en ${c.page_title || c.page} — ${(c.proposal || c.body || '').replace(/\n+/g, ' ').slice(0, 140)} (${c.voters.length} votos)`).join('\n')}\n\n`;
    md += `## Detalle por página\n\n`;
    pages.forEach((p) => { md += `### ${p}\n\n${all.filter((c) => (c.page_title || c.page) === p).map(line).join('\n')}\n\n`; });
    return md;
  }
  function showActa() {
    const md = buildActa();
    modal(`<h2 class="rv-h">Acta de la sesión</h2><p>Resumen listo para compartir. Está en formato Markdown: se puede pegar en un correo, en Google Docs o en el repositorio.</p>
      <textarea class="rv-md" readonly>${esc(md)}</textarea>
      <div class="rv-actions"><button type="button" class="rv-b" data-close>Cerrar</button><button type="button" class="rv-b" data-dl>${ic('dl')}Descargar .md</button><button type="button" class="rv-b rv-b-p" data-copy>Copiar</button></div>`,
    (m, done) => {
      $('.rv-dialog', m).classList.add('rv-dialog-lg');
      $('[data-close]', m).onclick = () => done();
      $('[data-copy]', m).onclick = async () => {
        try { await navigator.clipboard.writeText(md); toast('Acta copiada'); } catch (e) { $('.rv-md', m).select(); document.execCommand('copy'); toast('Acta copiada'); }
      };
      $('[data-dl]', m).onclick = () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
        a.download = 'acta-revision-mpf-' + new Date().toISOString().slice(0, 10) + '.md';
        document.body.appendChild(a); a.click(); a.remove();
      };
      m.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(); });
    });
  }

  boot();
})();
