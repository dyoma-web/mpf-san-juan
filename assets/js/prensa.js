/* Prensa: filtro por categoría y suscripción (demostración) */
(function () {
  'use strict';
  const { $, $$, toast } = window.MPF;
  const f = $('[data-news-filter]');
  f && f.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    $$('[data-cat]', f).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const c = b.dataset.cat;
    let shown = 0;
    $$('[data-news-item]').forEach((it) => {
      const on = !c || it.dataset.cat === c;
      it.hidden = !on;
      if (on && it.closest('[data-news-grid]')) shown++;
    });
    $('[data-news-empty]').hidden = shown > 0;
  });
  const nl = $('[data-newsletter]');
  nl && nl.addEventListener('submit', (e) => {
    e.preventDefault();
    const m = $('#nl-mail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim())) { m.focus(); toast('Revisá el correo electrónico'); return; }
    m.value = '';
    toast('Listo: te vamos a escribir con las novedades');
  });
})();
