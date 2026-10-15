/* Justicia abierta: filtros del tablero y solicitud de acceso a la información */
(function () {
  'use strict';
  const { $, toast } = window.MPF;

  const f = $('[data-stats-filters]');
  const cap = $('[data-stats-caption]');
  if (f && cap) {
    const upd = () => {
      cap.textContent = 'Mostrando: ' + [$('#f-periodo').value, $('#f-dep').value, $('#f-delito').value === 'Todos' ? 'todos los delitos' : $('#f-delito').value].map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join(' · ');
    };
    f.addEventListener('change', upd);
    f.addEventListener('submit', (e) => e.preventDefault());
  }

  const csv = $('[data-docs-csv]');
  csv && csv.addEventListener('click', () => { location.href = 'documentos.html#exportar'; });

  const form = $('[data-info-form]');
  if (!form) return;
  function check(input, ok, msg) {
    const p = input.parentElement.querySelector('.field-error');
    input.setAttribute('aria-invalid', String(!ok));
    p.hidden = ok; p.textContent = ok ? '' : msg;
    return ok;
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#ai-nombre'), m = $('#ai-mail'), q = $('#ai-que');
    const r = [check(n, n.value.trim().length > 2, 'Escribí tu nombre.'), check(m, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim()), 'Revisá el correo electrónico.'), check(q, q.value.trim().length > 9, 'Contanos qué información necesitás.')];
    const bad = [n, m, q][r.indexOf(false)];
    if (bad) { bad.focus(); return; }
    const num = 'AIP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);
    form.innerHTML = `<div class="success" role="status"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><div><h3 class="h3">Recibimos tu solicitud</h3><p class="small muted" style="margin-top:6px">Número de trámite de ejemplo: <strong>${num}</strong>. Te respondemos por correo en el plazo legal. <span class="ph">[En el prototipo no se envía ningún dato]</span></p></div></div>`;
    toast('Solicitud registrada');
  });
})();
