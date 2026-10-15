/* Escuela: filtro de cursos y verificación de certificados (demostración) */
(function () {
  'use strict';
  const { $, $$ } = window.MPF;
  const f = $('[data-course-filter]');
  f && f.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    $$('[data-p]', f).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-courses] .course').forEach((c) => { c.hidden = !!b.dataset.p && c.dataset.p !== b.dataset.p; });
  });
  const cert = $('[data-cert]');
  cert && cert.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#cert').value.trim().toUpperCase();
    const out = $('[data-cert-out]');
    if (/^EMPF-\d{4}-\d{4}$/.test(v)) out.innerHTML = '<strong style="color:var(--ok)">Formato válido.</strong> <span class="muted">La validación contra el registro se habilita con el campus.</span>';
    else out.innerHTML = '<strong style="color:var(--danger)">Revisá el código.</strong> <span class="muted">Tiene el formato EMPF-AAAA-NNNN.</span>';
  });
})();
