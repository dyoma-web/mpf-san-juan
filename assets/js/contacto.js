/* Contacto: validación del formulario y confirmación (sin envío real en el prototipo) */
(function () {
  'use strict';
  const { $ } = window.MPF;
  const form = $('[data-contact]');
  if (!form) return;
  const motivo = new URLSearchParams(location.search).get('motivo');
  if (motivo && $(`#c-motivo option[value="${motivo}"]`)) $('#c-motivo').value = motivo;

  function check(input, ok, msg) {
    const p = input.parentElement.querySelector('.field-error');
    input.setAttribute('aria-invalid', String(!ok));
    p.hidden = ok;
    p.textContent = ok ? '' : msg;
    p.id = input.id + '-err';
    if (ok) input.removeAttribute('aria-describedby'); else input.setAttribute('aria-describedby', p.id);
    return ok;
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#c-nombre'), m = $('#c-mail'), t = $('#c-msg');
    const r = [
      check(n, n.value.trim().length > 2, 'Escribí tu nombre.'),
      check(m, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim()), 'Revisá el correo electrónico.'),
      check(t, t.value.trim().length > 9, 'Contanos un poco más (al menos 10 caracteres).')
    ];
    const bad = [n, m, t][r.indexOf(false)];
    if (bad) { bad.focus(); return; }
    form.innerHTML = '<div class="success" role="status"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><div><h2 class="h3">Recibimos tu consulta</h2><p class="small muted" style="margin-top:6px">Te vamos a responder al correo que indicaste. <span class="ph">[En el prototipo no se envía ningún dato]</span></p></div></div>';
    form.querySelector('.success').focus?.();
  });
})();
