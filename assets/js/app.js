/* MPF San Juan — comportamiento global */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;

  /* ---------- Utilidades compartidas ---------- */
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('is-on'), 2600);
  }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  window.MPF = { $, $$, toast, norm, store };

  /* ---------- Accesibilidad ---------- */
  const prefs = store.get('mpf-a11y', {});
  const SCALES = [0.9, 1, 1.1, 1.2, 1.32];
  function applyPrefs() {
    root.style.setProperty('--scale', prefs.scale || 1);
    if (prefs.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
    if (prefs.easy) root.dataset.easy = 'on'; else delete root.dataset.easy;
    $$('[data-a11y="contrast"]').forEach((b) => b.setAttribute('aria-pressed', String(!!prefs.contrast)));
    $$('[data-a11y="easy"]').forEach((b) => b.setAttribute('aria-pressed', String(!!prefs.easy)));
    store.set('mpf-a11y', prefs);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a11y]');
    if (!b) return;
    const a = b.dataset.a11y;
    let i = SCALES.indexOf(prefs.scale || 1);
    if (i < 0) i = 1;
    if (a === 'bigger') { prefs.scale = SCALES[Math.min(i + 1, SCALES.length - 1)]; toast('Texto ' + Math.round(prefs.scale * 100) + ' %'); }
    if (a === 'smaller') { prefs.scale = SCALES[Math.max(i - 1, 0)]; toast('Texto ' + Math.round(prefs.scale * 100) + ' %'); }
    if (a === 'contrast') { prefs.contrast = !prefs.contrast; toast(prefs.contrast ? 'Alto contraste activado' : 'Alto contraste desactivado'); }
    if (a === 'easy') { prefs.easy = !prefs.easy; toast(prefs.easy ? 'Lectura fácil activada' : 'Lectura fácil desactivada'); }
    applyPrefs();
  });
  applyPrefs();

  /* ---------- Salida rápida (botón o Esc tres veces) ---------- */
  function quickExit() {
    try { sessionStorage.clear(); } catch (e) { /* nada */ }
    window.open('https://www.google.com.ar', '_blank', 'noopener');
    location.replace('https://www.google.com.ar');
  }
  $$('[data-quick-exit]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); quickExit(); }));
  let escCount = 0, escTimer;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || document.body.dataset.page !== 'victimas') return;
    if (document.body.classList.contains('rv-active')) return; // en modo revisión, Esc cierra herramientas
    if ($('#cmdk:not([hidden])') || $('#drawer:not([hidden])')) return;
    escCount++;
    clearTimeout(escTimer);
    escTimer = setTimeout(() => { escCount = 0; }, 1200);
    if (escCount >= 3) quickExit();
  });

  /* ---------- Encabezado con sombra al desplazarse ---------- */
  const header = $('[data-header]');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Gestión de foco para diálogos ---------- */
  function trapFocus(container, e) {
    const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Menú móvil ---------- */
  const drawer = $('#drawer');
  const menuBtn = $('[data-open-menu]');
  let lastFocus = null;
  function openMenu() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
    $('[data-close-menu].icon-btn', drawer).focus();
  }
  function closeMenu() {
    drawer.hidden = true;
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  menuBtn && menuBtn.addEventListener('click', openMenu);
  $$('[data-close-menu]').forEach((b) => b.addEventListener('click', closeMenu));
  drawer && drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    if (e.key === 'Tab') trapFocus($('.drawer-panel', drawer), e);
  });

  /* ---------- Buscador global (paleta de comandos) ---------- */
  const INDEX = [
    { g: 'Acciones rápidas', t: 'Quiero denunciar un delito', d: 'Orientador: dónde y cómo denunciar, en tres preguntas', u: 'orientador.html', i: 'file', k: 'denuncia denunciar delito donde como orientador' },
    { g: 'Acciones rápidas', t: 'Estoy en peligro ahora', d: 'Líneas de emergencia: 911, 144, 102, 107', u: 'orientador.html#peligro', i: 'alert', k: 'peligro urgencia emergencia 911 ayuda ahora' },
    { g: 'Acciones rápidas', t: 'Consultar el estado de mi denuncia', d: 'Con el número de legajo y tu DNI', u: 'servicios.html#seguimiento', i: 'clock', k: 'estado seguimiento legajo consultar causa como sigue' },
    { g: 'Acciones rápidas', t: 'Buscar una fiscalía cerca', d: 'Sedes por departamento, horarios y cómo llegar', u: 'fiscalias.html', i: 'pin', k: 'fiscalia sede cerca direccion horario departamento ufi mapa' },
    { g: 'Situaciones', t: 'Violencia de género', d: 'Medidas de protección, línea 144 y cómo denunciar', u: 'orientador.html#violencia', i: 'shield', k: 'violencia genero pareja ex familiar 144 golpes amenazas proteccion' },
    { g: 'Situaciones', t: 'Grooming y acoso por internet', d: 'Qué hacer en las primeras horas si contactaron a una niña o un niño', u: 'victimas.html#grooming', i: 'shield', k: 'grooming acoso internet redes instagram perfil falso nino nina adolescente anivi' },
    { g: 'Situaciones', t: 'Denunciar una estafa virtual', d: 'Transferencias engañosas, cuentas hackeadas, compras falsas', u: 'orientador.html#estafa', i: 'alert', k: 'estafa virtual internet transferencia hackeo whatsapp banco cuento' },
    { g: 'Situaciones', t: 'Me robaron el celular', d: 'Cómo denunciar, IMEI y recuperar objetos', u: 'orientador.html#robo', i: 'box', k: 'robo hurto celular telefono imei me robaron arrebato' },
    { g: 'Situaciones', t: 'Recuperar algo que me robaron', d: 'Devolución de objetos secuestrados en una investigación', u: 'servicios.html#objetos', i: 'box', k: 'recuperar devolucion objeto secuestrado celular cartera' },
    { g: 'Situaciones', t: 'Me citaron como testigo', d: 'Qué llevar, tus derechos y qué hacer si no podés ir', u: 'servicios.html#testigos', i: 'users', k: 'testigo citacion declarar citaron' },
    { g: 'Situaciones', t: 'Me acusan a mí o a un familiar', d: 'Defensa pública gratuita y qué es una formalización', u: 'index.html#perfiles', i: 'scale', k: 'acusado imputado defensa abogado defensor publico' },
    { g: 'Víctimas', t: 'Derechos de las víctimas', d: 'Información, escucha, protección y acompañamiento', u: 'victimas.html#derechos', i: 'heart', k: 'derechos victima informacion acompanamiento proteccion querellante' },
    { g: 'Víctimas', t: 'Líneas de ayuda gratuitas', d: '911 · 144 · 102 · 137 · 145 · 107', u: 'victimas.html#lineas', i: 'phone', k: 'lineas telefono ayuda 144 102 137 145 107 trata' },
    { g: 'Víctimas', t: 'Qué pasa después de denunciar', d: 'Etapas, audiencias y medidas de protección', u: 'victimas.html#despues', i: 'clock', k: 'despues denunciar etapas audiencia proceso' },
    { g: 'Trámites', t: 'Formas de hacer una denuncia', d: 'En una sede del MPF, en una comisaría o en línea', u: 'servicios.html#denunciar', i: 'file', k: 'formas denuncia comisaria en linea online' },
    { g: 'Trámites', t: 'Constancias y copias', d: 'Copia de la constancia de denuncia o de actuaciones', u: 'servicios.html#constancias', i: 'file', k: 'constancia copia certificado perdi' },
    { g: 'Trámites', t: 'Acuerdos y salidas alternativas', d: 'Juicio abreviado, conciliación, probation', u: 'servicios.html#alternativas', i: 'scale', k: 'juicio abreviado conciliacion reparacion probation suspension salida alternativa' },
    { g: 'Trámites', t: 'Preguntas frecuentes', d: 'Abogado, retirar una denuncia, tiempos', u: 'servicios.html#preguntas', i: 'info', k: 'preguntas frecuentes faq retirar abogado tarda' },
    { g: 'Institución', t: 'Quiénes somos', d: 'Misión, autoridades y organigrama', u: 'institucion.html', i: 'building', k: 'institucion quienes somos fiscal general autoridades organigrama mision' },
    { g: 'Institución', t: 'Prensa y novedades', d: 'Casos explicados paso a paso y comunicados', u: 'prensa.html', i: 'news', k: 'prensa noticias novedades casos comunicados periodista' },
    { g: 'Institución', t: 'Contacto', d: 'Canales de atención y formulario de consultas', u: 'contacto.html', i: 'mail', k: 'contacto consulta correo telefono formulario' },
    { g: 'Institución', t: 'Trabajar en el MPF', d: 'Concursos y búsquedas abiertas', u: 'contacto.html#trabajar', i: 'users', k: 'trabajo empleo concurso trabajar' },
    { g: 'Justicia abierta', t: 'Datos y estadísticas', d: 'Denuncias, causas resueltas y tiempos de respuesta', u: 'justicia-abierta.html', i: 'chart', k: 'datos estadisticas numeros transparencia' },
    { g: 'Justicia abierta', t: 'Datos abiertos', d: 'Archivos descargables con diccionario de datos', u: 'justicia-abierta.html#datasets', i: 'database', k: 'datos abiertos csv descargar dataset' },
    { g: 'Justicia abierta', t: 'Uso de inteligencia artificial', d: 'Registro público de herramientas automatizadas', u: 'justicia-abierta.html#ia', i: 'cpu', k: 'inteligencia artificial ia algoritmo automatizacion' },
    { g: 'Justicia abierta', t: 'Resoluciones, instrucciones y protocolos', d: 'Buscador con síntesis en lenguaje claro', u: 'documentos.html', i: 'book', k: 'resolucion instruccion protocolo dictamen jurisprudencia documento normativa' },
    { g: 'Institución', t: 'Autoridades y declaraciones juradas', d: 'Quiénes conducen el MPF', u: 'institucion.html#autoridades', i: 'users', k: 'autoridades fiscal general adjunto declaracion jurada trayectoria' },
    { g: 'Institución', t: 'Organigrama', d: 'UFI, atención a víctimas, apoyo a la investigación y gestión', u: 'institucion.html#organigrama', i: 'building', k: 'organigrama estructura ufi areas' },
    { g: 'Institución', t: 'Marco normativo', d: 'Constitución, ley orgánica, Código Procesal Penal y más', u: 'institucion.html#normativa', i: 'book', k: 'ley organica codigo procesal penal constitucion normativa micaela 27372' },
    { g: 'Institución', t: 'Qué hace el MPF y qué hacen otras instituciones', d: 'Defensa, Poder Judicial, Policía y Defensoría', u: 'institucion.html#que-hacemos', i: 'scale', k: 'diferencia defensa poder judicial policia defensoria a quien acudir' },
    { g: 'Justicia abierta', t: 'Compromisos y rendición de cuentas', d: 'Informes de gestión y estado de los compromisos', u: 'justicia-abierta.html#gestion', i: 'check', k: 'informe anual gestion plan estrategico compromisos rendicion' },
    { g: 'Justicia abierta', t: 'Presupuesto y compras', d: 'Ejecución presupuestaria, contrataciones y declaraciones juradas', u: 'justicia-abierta.html#presupuesto', i: 'chart', k: 'presupuesto compras contrataciones licitacion gasto' },
    { g: 'Justicia abierta', t: 'Participación ciudadana', d: 'Consultas públicas, propuestas y encuesta de atención', u: 'justicia-abierta.html#participacion', i: 'message', k: 'participacion consulta publica encuesta propuesta' },
    { g: 'Institución', t: 'Sala de prensa', d: 'Contactos, voceros, kit de prensa y pautas', u: 'prensa.html#sala', i: 'news', k: 'sala de prensa voceros kit logos periodistas' },
    { g: 'Institución', t: 'Declaración de accesibilidad', d: 'Cómo usar el sitio y reportar una barrera', u: 'contacto.html#accesibilidad', i: 'info', k: 'accesibilidad wcag lector de pantalla barrera' },
    { g: 'Escuela', t: 'Escuela del MPF', d: 'Trayectos para personal, fuerzas de seguridad, ciudadanía, escuelas y periodismo', u: 'escuela.html', i: 'cap', k: 'escuela curso formacion capacitacion trayecto' },
    { g: 'Escuela', t: 'Curso: procedimiento de flagrancia', d: 'Investigar rápido, investigar bien. Tutorado', u: 'curso-flagrancia.html', i: 'play', k: 'curso flagrancia investigar rapido cohorte inscripcion' },
    { g: 'Escuela', t: 'Mi campus', d: 'Plan de formación, cursos y certificados', u: 'campus.html', i: 'cap', k: 'campus mis cursos aula virtual plan formacion' },
    { g: 'Escuela', t: 'Calendario de la Escuela', d: 'Inicios de cohortes y conversatorios', u: 'escuela.html#calendario', i: 'calendar', k: 'calendario fechas cohorte conversatorio' },
    { g: 'Escuela', t: 'Formación obligatoria y Ley Micaela', d: 'Cursos que completa todo el personal', u: 'escuela.html#obligatoria', i: 'scale', k: 'ley micaela obligatoria induccion genero' },
    { g: 'Escuela', t: 'Verificar un certificado', d: 'Validá un certificado emitido por la Escuela', u: 'escuela.html#certificados', i: 'badge', k: 'certificado verificar validar' }
  ];
  const cmdk = $('#cmdk');
  const cmdkInput = $('#cmdk-input');
  const cmdkList = $('#cmdk-list');
  let results = [], sel = 0, cmdkLast = null;

  function search(q) {
    const n = norm(q).trim();
    if (!n) return INDEX.filter((x) => x.g === 'Acciones rápidas' || x.g === 'Situaciones').slice(0, 9);
    const words = n.split(/\s+/);
    return INDEX.map((x) => {
      const hay = norm(x.t + ' ' + x.d + ' ' + x.k);
      let s = 0;
      for (const w of words) {
        if (!hay.includes(w)) return null;
        s += norm(x.t).includes(w) ? 3 : 1;
      }
      return { x, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s).map((r) => r.x).slice(0, 12);
  }
  function renderResults() {
    results = search(cmdkInput.value);
    sel = Math.min(sel, Math.max(results.length - 1, 0));
    if (!results.length) {
      cmdkList.innerHTML = '<li class="cmdk-empty">No encontramos resultados. Probá con otras palabras o usá el <a href="orientador.html">orientador de denuncias</a>.</li>';
      return;
    }
    let html = '', g = '';
    results.forEach((r, i) => {
      if (r.g !== g) { g = r.g; html += `<li class="cmdk-group" role="presentation">${g}</li>`; }
      html += `<li class="cmdk-item" role="option" id="cmdk-o${i}" aria-selected="${i === sel}"><a href="${r.u}" tabindex="-1"><span class="cmdk-ico"><svg class="ic" aria-hidden="true"><use href="#i-${r.i}"/></svg></span><span><span class="cmdk-t">${r.t}</span><span class="cmdk-d">${r.d}</span></span><svg class="ic ic-go" aria-hidden="true"><use href="#i-arrow"/></svg></a></li>`;
    });
    cmdkList.innerHTML = html;
    cmdkInput.setAttribute('aria-activedescendant', 'cmdk-o' + sel);
  }
  function moveSel(d) {
    if (!results.length) return;
    sel = (sel + d + results.length) % results.length;
    $$('.cmdk-item', cmdkList).forEach((el, i) => el.setAttribute('aria-selected', String(i === sel)));
    cmdkInput.setAttribute('aria-activedescendant', 'cmdk-o' + sel);
    const cur = $('#cmdk-o' + sel);
    cur && cur.scrollIntoView({ block: 'nearest' });
  }
  function openSearch(q) {
    if (!cmdk) return;
    if (drawer && !drawer.hidden) closeMenu();
    cmdkLast = document.activeElement;
    cmdk.hidden = false;
    document.body.style.overflow = 'hidden';
    cmdkInput.value = q || '';
    sel = 0;
    renderResults();
    requestAnimationFrame(() => cmdkInput.focus());
  }
  function closeSearch() {
    cmdk.hidden = true;
    document.body.style.overflow = '';
    if (cmdkLast) cmdkLast.focus();
  }
  window.MPF.openSearch = openSearch;
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', () => openSearch()));
  $$('[data-close-search]').forEach((b) => b.addEventListener('click', closeSearch));
  cmdkInput && cmdkInput.addEventListener('input', () => { sel = 0; renderResults(); });
  cmdkList && cmdkList.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.cmdk-item');
    if (!li) return;
    const i = Number(li.id.replace('cmdk-o', ''));
    if (i !== sel) { sel = i; moveSel(0); }
  });
  cmdk && cmdk.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); location.href = results[sel].u; closeSearch(); }
    else if (e.key === 'Tab') trapFocus($('.cmdk-panel', cmdk), e);
  });
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.hidden ? openSearch() : closeSearch(); }
    else if (e.key === '/' && !typing && cmdk.hidden) { e.preventDefault(); openSearch(); }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $$('.search-trigger .kbd').forEach((k) => { k.textContent = '⌘ K'; });

  // Formularios que abren el buscador con la consulta escrita (inicio)
  $$('[data-search-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    openSearch($('input', f).value);
  }));

  /* ---------- Valoración de la página ---------- */
  const fb = $('[data-feedback]');
  if (fb) {
    const show = (s) => $$('.fb-step', fb).forEach((el) => { el.hidden = el.dataset.step !== s; });
    $$('[data-vote]', fb).forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.vote === 'si') show('thanks');
      else { show('why'); $('#fb-motivo').focus(); }
    }));
    $('.fb-form', fb).addEventListener('submit', (e) => { e.preventDefault(); show('thanks'); });
  }

  /* ---------- Subnavegación de página: marca la sección visible ---------- */
  $$('[data-subnav]').forEach((nav) => {
    const links = $$('a[href^="#"]', nav);
    const secs = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    if (!('IntersectionObserver' in window) || !secs.length) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        a.classList.toggle('is-active', on);
        if (on) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    }), { rootMargin: '-35% 0px -60% 0px' });
    secs.forEach((s) => io.observe(s));
  });

  /* ---------- Revelado al hacer scroll ---------- */
  const rv = $$('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('is-in'));

  /* ---------- Acciones sin destino real en el prototipo ---------- */
  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-demo]');
    if (!d) return;
    e.preventDefault();
    toast(d.dataset.demo || 'Disponible en la versión final');
  });
})();
