/* Servicios: índice con seguimiento de sección y consulta de legajo (demostración) */
(function () {
  'use strict';
  const { $, $$ } = window.MPF;

  // Índice lateral que marca la sección visible
  const links = $$('[data-toc] a');
  const secs = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secs.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  // Consulta de legajo: validación y respuesta de ejemplo
  const form = $('[data-legajo]');
  if (!form) return;
  const out = $('[data-legajo-result]', form);
  const leg = $('#legajo'), dni = $('#dni-seg');
  function err(input, msg) {
    const p = input.parentElement.querySelector('.field-error');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    p.hidden = !msg;
    p.textContent = msg || '';
    if (msg) { p.id = input.id + '-err'; input.setAttribute('aria-describedby', p.id); } else input.removeAttribute('aria-describedby');
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const l = leg.value.trim(), d = dni.value.replace(/\D/g, '');
    let ok = true;
    if (!/^\d{1,7}\/\d{4}$/.test(l)) { err(leg, 'Escribilo como figura en la constancia, por ejemplo 12345/2026.'); ok = false; } else err(leg, '');
    if (d.length < 7 || d.length > 8) { err(dni, 'El DNI debe tener 7 u 8 números.'); ok = false; } else err(dni, '');
    if (!ok) { (leg.getAttribute('aria-invalid') === 'true' ? leg : dni).focus(); return; }
    const etapas = ['Recibida', 'En investigación', 'Audiencia fijada', 'Resuelta'];
    const n = (parseInt(l, 10) % 3) + 1;
    out.hidden = false;
    out.innerHTML = `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><strong style="font-family:var(--f-head);color:var(--ink)">Legajo ${l}</strong><span class="tag tag-gold">Resultado de ejemplo</span></div>
      <p class="small" style="margin-top:6px">Estado: <strong>${etapas[n]}</strong> · UFI a cargo: <span class="ph">[UFI asignada]</span></p>
      <ol class="track">${etapas.map((t, i) => `<li class="${i < n ? 'is-done' : ''}${i === n ? ' is-current' : ''}">${t}</li>`).join('')}</ol>`;
  });
})();
