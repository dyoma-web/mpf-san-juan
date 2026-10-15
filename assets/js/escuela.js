/* Escuela: trayectos por público, buscador de cursos, calendario .ics y verificación de certificados */
(function () {
  'use strict';
  const { $, $$, norm, toast } = window.MPF;
  const h = '[n.º] horas';
  const P = [
    { id: 'mpf', icon: 'scale', label: 'Personal del MPF', intro: 'Fiscales, ayudantes fiscales, funcionarias, funcionarios y personal administrativo. Rutas por función, con cursos de ingreso y actualización anual.', cursos: [
      { t: 'Inducción al MPF y al sistema acusatorio', mod: 'Autoasistido', dur: h, nivel: 'Ingresantes', oblig: true },
      { t: 'Investigar rápido, investigar bien: el procedimiento de flagrancia', mod: 'Tutorado', dur: h, nivel: 'Intermedio', href: 'curso-flagrancia.html' },
      { t: 'Litigación en audiencias orales', mod: 'Híbrido con simulación', dur: h, nivel: 'Intermedio' },
      { t: 'Evidencia digital y cooperación con plataformas', mod: 'Tutorado', dur: h, nivel: 'Intermedio' },
      { t: 'Escuchar a niñas, niños y adolescentes sin revictimizar', mod: 'Tutorado', dur: h, nivel: 'Especializado' },
      { t: 'Perspectiva de género: Ley Micaela', mod: 'Autoasistido', dur: h, nivel: 'Todas las funciones', oblig: true },
      { t: 'Redactar resoluciones en lenguaje claro', mod: 'Autoasistido', dur: h, nivel: 'Todas las funciones' },
      { t: 'Uso responsable de inteligencia artificial', mod: 'Autoasistido', dur: h, nivel: 'Todas las funciones', oblig: true }
    ] },
    { id: 'pol', icon: 'shield', label: 'Fuerzas de seguridad', intro: 'Personal policial que interviene en la primera respuesta y colabora con las UFI. Cohortes conjuntas con la fiscalía para trabajar sobre casos reales.', cursos: [
      { t: 'Actuación en flagrancia y comunicación con la UFI', mod: 'Tutorado', dur: h, nivel: 'Primera respuesta' },
      { t: 'Preservación de la escena y cadena de custodia', mod: 'Híbrido con simulación', dur: h, nivel: 'Primera respuesta' },
      { t: 'Secuestro y resguardo de dispositivos digitales', mod: 'Autoasistido', dur: h, nivel: 'Intermedio' },
      { t: 'Primera intervención ante violencia de género', mod: 'Tutorado', dur: h, nivel: 'Primera respuesta' }
    ] },
    { id: 'abo', icon: 'book', label: 'Abogacía y operadores', intro: 'Profesionales del derecho, peritos y personal de otros organismos que intervienen en el proceso penal.', cursos: [
      { t: 'El Código Procesal Penal de San Juan en la práctica', mod: 'Autoasistido', dur: h, nivel: 'Introductorio' },
      { t: 'Acuerdos y salidas alternativas: criterios del MPF', mod: 'Conversatorio', dur: '2 horas', nivel: 'Actualización' },
      { t: 'Derechos de las víctimas en el proceso penal', mod: 'Autoasistido', dur: h, nivel: 'Introductorio' }
    ] },
    { id: 'ciu', icon: 'users', label: 'Ciudadanía', intro: 'Cursos abiertos y breves, sin requisitos previos, para entender cómo funciona la justicia penal y cómo pedir ayuda.', cursos: [
      { t: 'Cómo funciona la justicia penal en San Juan', mod: 'Microcurso', dur: '30 minutos', nivel: 'Abierto' },
      { t: 'Tus derechos como víctima', mod: 'Microcurso', dur: '20 minutos', nivel: 'Abierto' },
      { t: 'Estafas por internet: cómo prevenirlas y qué hacer', mod: 'Microcurso', dur: '25 minutos', nivel: 'Abierto' },
      { t: 'Violencia de género: cómo pedir ayuda y cómo acompañar', mod: 'Microcurso', dur: '30 minutos', nivel: 'Abierto' }
    ] },
    { id: 'edu', icon: 'cap', label: 'Comunidad educativa', intro: 'Docentes, equipos directivos y familias. Materiales listos para usar en el aula, por nivel educativo.', cursos: [
      { t: 'Prevención del grooming: guía para docentes y familias', mod: 'Autoasistido', dur: h, nivel: 'Primaria y secundaria' },
      { t: 'Ciberconvivencia y uso seguro de redes', mod: 'Secuencia didáctica', dur: '4 clases', nivel: 'Secundaria' },
      { t: 'La fiscalía va a la escuela: simulacro de juicio', mod: 'Programa presencial', dur: '1 jornada', nivel: 'Secundaria' }
    ] },
    { id: 'per', icon: 'news', label: 'Periodismo', intro: 'Periodistas y comunicadores que cubren casos penales y temas de seguridad.', cursos: [
      { t: 'Cobertura judicial responsable', mod: 'Autoasistido', dur: h, nivel: 'Abierto' },
      { t: 'Cómo leer una resolución judicial', mod: 'Microcurso', dur: '20 minutos', nivel: 'Abierto' },
      { t: 'Perspectiva de género y niñez en la información', mod: 'Conversatorio', dur: '2 horas', nivel: 'Abierto' }
    ] }
  ];
  const ph = (s) => s.replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');
  const tabs = $('[data-pub-tabs]'), panel = $('[data-pub-panel]');
  let cur = 'mpf', query = '';

  const card = (c, pub) => {
    const inner = `<div class="news-tags"><span class="tag">${c.mod}</span>${c.oblig ? '<span class="tag tag-gold">Obligatorio</span>' : ''}</div>
      <h4 class="h4">${c.t}</h4>
      <div class="course-meta"><span><svg class="ic" aria-hidden="true"><use href="#i-clock"/></svg>${ph(c.dur)}</span><span><svg class="ic" aria-hidden="true"><use href="#i-users"/></svg>${c.nivel}</span>${pub ? `<span>${pub}</span>` : ''}</div>`;
    return c.href ? `<a class="card card-link course-card" href="${c.href}">${inner}<span class="card-go"><svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></span></a>`
      : `<div class="card course-card">${inner}</div>`;
  };
  function render(focus) {
    tabs.innerHTML = P.map((p) => `<button type="button" role="tab" class="profile-tab" id="pub-${p.id}" data-id="${p.id}" aria-controls="pub-panel" aria-selected="${!query && p.id === cur}" tabindex="${p.id === cur ? 0 : -1}"><svg class="ic" aria-hidden="true"><use href="#i-${p.icon}"/></svg>${p.label}</button>`).join('');
    if (query) {
      const n = norm(query);
      const res = P.flatMap((p) => p.cursos.filter((c) => norm(c.t + ' ' + c.mod + ' ' + c.nivel + ' ' + p.label).includes(n)).map((c) => [c, p.label]));
      panel.innerHTML = `<div class="stack-sm"><h3 class="h3">Resultados para «${query.replace(/</g, '&lt;')}»</h3><p class="muted small">${res.length} ${res.length === 1 ? 'curso' : 'cursos'} · <button type="button" class="btn btn-sm" style="min-height:28px;padding:0;color:var(--brand-500)" data-clear>Ver por público</button></p></div>
        ${res.length ? `<div class="grid grid-2">${res.map(([c, l]) => card(c, l)).join('')}</div>` : '<p class="empty">No encontramos cursos con esas palabras.</p>'}`;
      return;
    }
    const s = P.find((p) => p.id === cur);
    panel.setAttribute('aria-labelledby', 'pub-' + cur);
    panel.innerHTML = `<div class="fade-swap stack"><div class="stack-sm"><h3 class="h3">${s.label}</h3><p class="muted">${s.intro}</p><p class="small"><strong>${s.cursos.length} cursos</strong> en este trayecto</p></div><div class="grid grid-2">${s.cursos.map((c) => card(c)).join('')}</div></div>`;
    if (focus) $('#pub-' + cur).focus();
  }
  tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) { cur = b.dataset.id; query = ''; $('#q-curso').value = ''; render(); } });
  tabs.addEventListener('keydown', (e) => {
    const i = P.findIndex((p) => p.id === cur);
    const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!k) return;
    e.preventDefault(); cur = P[(i + k + P.length) % P.length].id; query = ''; render(true);
  });
  panel.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) { query = ''; $('#q-curso').value = ''; render(); } });
  $('[data-course-search]').addEventListener('submit', (e) => {
    e.preventDefault();
    query = $('#q-curso').value.trim();
    render();
    $('#oferta').scrollIntoView({ behavior: 'smooth' });
  });
  $$('[data-pub-link]').forEach((a) => a.addEventListener('click', () => { cur = a.dataset.pubLink; query = ''; render(); }));

  // Enlaces directos: escuela.html#ciu, #ciudadania, #operadores, etc.
  const alias = { ciudadania: 'ciu', operadores: 'mpf', policia: 'pol', docentes: 'edu', periodismo: 'per', abogacia: 'abo' };
  function fromHash() {
    const hsh = location.hash.slice(1);
    const pid = alias[hsh] || (P.some((p) => p.id === hsh) ? hsh : null);
    if (!pid) return false;
    cur = pid; query = ''; render();
    setTimeout(() => $('#oferta').scrollIntoView(), 50);
    return true;
  }
  if (!fromHash()) render();
  window.addEventListener('hashchange', fromHash);

  // Calendario descargable (.ics). Las fechas son tentativas hasta confirmar el día.
  $('[data-ics]').addEventListener('click', () => {
    const ev = [['20261101', 'Investigar rápido, investigar bien (primera cohorte)'], ['20261115', 'Conversatorio: inteligencia artificial en el trabajo fiscal'], ['20261201', 'Ley Micaela: cohorte de cierre de año'], ['20270201', 'Inducción institucional'], ['20270301', 'Prevención del grooming en las escuelas']];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MPF San Juan//Escuela//ES', 'CALSCALE:GREGORIAN']
      .concat(ev.flatMap(([d, t], i) => ['BEGIN:VEVENT', `UID:escuela-mpf-${i}-${d}@mpf-san-juan`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${t} (fecha a confirmar)`, 'DESCRIPTION:Escuela del Ministerio Público Fiscal de San Juan. Día exacto a confirmar.', 'END:VEVENT']))
      .concat(['END:VCALENDAR']).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'escuela-mpf-calendario.ics';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Calendario descargado');
  });

  // Verificación de certificados (formato; la consulta al registro llega con el campus)
  const cert = $('[data-cert]');
  cert && cert.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#cert').value.trim().toUpperCase();
    const out = $('[data-cert-out]');
    if (/^MPF-\d{4}-\d{6}$/.test(v)) out.innerHTML = '<strong style="color:var(--ok)">Formato válido.</strong> <span class="muted">La validación contra el registro se habilita con el campus.</span>';
    else out.innerHTML = '<strong style="color:var(--danger)">Revisá el código.</strong> <span class="muted">Tiene el formato MPF-AAAA-000000.</span>';
  });
})();
