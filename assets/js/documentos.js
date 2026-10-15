/* Documentos: buscador con filtros, ficha en lenguaje claro y enlaces permanentes */
(function () {
  'use strict';
  const { $, $$, norm, toast } = window.MPF;
  const D = [
    { id: 1, tipo: 'Instrucción general', num: 'n.º [00]/2026', titulo: 'Actuación de las UFI en casos de flagrancia', fecha: '[dd] de [mes] de 2026', anio: 2026, emisor: 'Fiscalía General', materia: 'Procedimiento penal', estado: 'Vigente', vinc: '', que: 'Ordena cómo organizar la investigación cuando una persona es detenida en el momento del hecho: plazos internos, registro de la prueba en el legajo y comunicación inmediata con la víctima.', quien: 'Fiscales, ayudantes fiscales y personal de las UFI. Indirectamente, a las víctimas y a las personas detenidas.', desde: 'Desde su publicación.', etiquetas: ['flagrancia', 'audiencia de presentación', 'víctimas'], rel: ['Protocolo de cadena de custodia [n.º]', 'Resolución sobre guardias de las UFI [n.º]'] },
    { id: 2, tipo: 'Protocolo', num: 'n.º [00]/2025', titulo: 'Investigación de delitos contra niñas, niños y adolescentes en entornos digitales', fecha: '[dd] de [mes] de 2025', anio: 2025, emisor: 'Fiscalía General y UFI ANIVI', materia: 'Niñez y adolescencia', estado: 'Vigente', vinc: '', que: 'Fija los pasos para preservar conversaciones y perfiles, pedir información a plataformas y empresas de telecomunicaciones, y acompañar a la familia desde la denuncia.', quien: 'Las UFI que investigan grooming y otros delitos digitales contra personas menores de edad, y la Policía que recibe la denuncia.', desde: 'Desde su aprobación.', etiquetas: ['grooming', 'evidencia digital', 'cooperación'], rel: ['Instrucción general sobre entrevistas especializadas [n.º]'] },
    { id: 3, tipo: 'Resolución', num: 'FG n.º [000]/2026', titulo: 'Horarios de atención y guardias de las UFI', fecha: '[dd] de [mes] de 2026', anio: 2026, emisor: 'Fiscalía General', materia: 'Organización interna', estado: 'Vigente', vinc: 'Modifica la Resolución FG n.º [000]/2023.', que: 'Establece los horarios de atención al público de cada sede y el régimen de guardias permanentes para flagrancia.', quien: 'Todas las dependencias del MPF y la ciudadanía que concurre a ellas.', desde: 'Desde el [fecha].', etiquetas: ['horarios', 'guardias', 'atención al público'], rel: ['Reglamento de atención al público [n.º]/2023'], relId: [4] },
    { id: 4, tipo: 'Resolución', num: 'FG n.º [000]/2023', titulo: 'Reglamento de atención al público', fecha: '[dd] de [mes] de 2023', anio: 2023, emisor: 'Fiscalía General', materia: 'Organización interna', estado: 'Modificado', vinc: 'Modificada por la Resolución FG n.º [000]/2026.', que: 'Regula cómo se recibe y se orienta a las personas que se acercan a las sedes del MPF.', quien: 'Personal de mesa de entradas y de atención al público.', desde: 'Vigente con las modificaciones de 2026.', etiquetas: ['atención al público'], rel: ['Horarios de atención y guardias de las UFI [n.º]/2026'], relId: [3] },
    { id: 5, tipo: 'Dictamen', num: 'n.º [00]/2025', titulo: 'Dictamen ante la Corte de Justicia sobre [tema]', fecha: '[dd] de [mes] de 2025', anio: 2025, emisor: 'Fiscalía General', materia: 'Procedimiento penal', estado: '', vinc: '', que: 'Expone la opinión de la Fiscalía General sobre [cuestión planteada] y los fundamentos para resolverla.', quien: 'Las partes del caso y, como criterio, a las UFI en casos similares.', desde: 'No aplica.', etiquetas: ['dictamen', 'Corte de Justicia'], rel: ['Sentencia de la Corte en el caso [referencia]'] },
    { id: 6, tipo: 'Jurisprudencia', num: '[referencia]', titulo: 'Condena en juicio abreviado por grooming (artículo 131 del Código Penal)', fecha: '29 de septiembre de 2026', anio: 2026, emisor: '[Juzgado de garantías]', materia: 'Niñez y adolescencia', estado: '', vinc: '', que: 'Homologa el acuerdo entre la fiscalía y la defensa, impone tres años de prisión de ejecución condicional y fija reglas de conducta.', quien: 'Las partes del caso. Se publica anonimizada, sin datos de las víctimas.', desde: 'No aplica.', etiquetas: ['grooming', 'juicio abreviado'], rel: ['Protocolo de investigación en entornos digitales [n.º]/2025'], relId: [2] },
    { id: 7, tipo: 'Informe', num: '2025', titulo: 'Informe anual de gestión 2025', fecha: '[dd] de [mes] de 2026', anio: 2026, emisor: 'Fiscalía General', materia: 'Organización interna', estado: '', vinc: '', que: 'Resume la actividad del año: denuncias, causas resueltas, audiencias, víctimas acompañadas y proyectos institucionales.', quien: 'A toda la ciudadanía.', desde: 'No aplica.', etiquetas: ['rendición de cuentas', 'estadísticas'], rel: ['Datos abiertos de denuncias 2025'] },
    { id: 8, tipo: 'Instrucción general', num: 'n.º [00]/2021', titulo: 'Registro de denuncias por violencia de género', fecha: '[dd] de [mes] de 2021', anio: 2021, emisor: 'Fiscalía General', materia: 'Violencia de género', estado: 'Derogado', vinc: 'Derogada por la Instrucción general n.º [00]/2024.', que: 'Establecía cómo registrar y derivar las denuncias por violencia de género. Ya no está vigente.', quien: 'No se aplica desde su derogación.', desde: 'Sin efecto desde el [fecha].', etiquetas: ['violencia de género'], rel: ['Instrucción general n.º [00]/2024'] },
    { id: 9, tipo: 'Protocolo', num: 'borrador', titulo: 'Lineamientos para el uso de inteligencia artificial en el MPF', fecha: 'En consulta hasta el [fecha]', anio: 2026, emisor: 'Fiscalía General', materia: 'Tecnología', estado: 'En consulta', vinc: 'Borrador abierto a comentarios.', que: 'Propone reglas para usar herramientas de inteligencia artificial: supervisión humana, prohibición de ingresar datos reservados en herramientas públicas y registro de cada herramienta.', quien: 'Todo el personal del MPF.', desde: 'Una vez aprobado.', etiquetas: ['inteligencia artificial', 'consulta pública'], rel: ['Registro de herramientas automatizadas'], relHref: ['justicia-abierta.html#ia'] }
  ];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ph = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');
  const ico = (t) => t === 'Protocolo' ? 'shield' : t === 'Dictamen' || t === 'Jurisprudencia' ? 'scale' : t === 'Informe' ? 'chart' : 'file';
  const list = $('[data-doc-list]'), det = $('[data-doc-detail]'), count = $('[data-doc-count]');
  const q = $('#q-docs'), ft = $('#f-tipo'), fe = $('#f-estado'), fa = $('#f-anio'), fm = $('#f-materia');
  let sel = 1;

  const qs = new URLSearchParams(location.search);
  if (qs.get('q')) q.value = qs.get('q');
  if (qs.get('tipo')) ft.value = qs.get('tipo');
  const hm = location.hash.match(/^#doc-(\d+)$/);
  if (hm) sel = Number(hm[1]);

  const okAnio = (d) => fa.value === 'Todos' || (fa.value === '2024 y anteriores' ? d.anio <= 2024 : String(d.anio) === fa.value);
  function filtered() {
    const n = norm(q.value);
    return D.filter((d) => (ft.value === 'Todos' || d.tipo === ft.value) && (fe.value === 'Todos' || d.estado === fe.value) && okAnio(d)
      && (fm.value === 'Todas' || d.materia === fm.value)
      && (!n || norm([d.titulo, d.que, d.quien, d.num, d.tipo, d.etiquetas.join(' ')].join(' ')).includes(n)));
  }
  function render(focusDetail) {
    const F = filtered();
    count.textContent = F.length === 1 ? '1 documento encontrado' : F.length + ' documentos encontrados';
    if (!F.length) {
      list.innerHTML = '<li class="empty">Ningún documento coincide con estos filtros. Probá con otras palabras o quitá algún filtro.<br><button type="button" class="btn btn-sm btn-ghost" style="margin-top:12px" data-clear>Quitar todos los filtros</button></li>';
      det.hidden = true;
      return;
    }
    det.hidden = false;
    if (!F.some((d) => d.id === sel)) sel = F[0].id;
    list.innerHTML = F.map((d) => `<li><button type="button" class="doc-item" aria-pressed="${d.id === sel}" data-id="${d.id}">
      <span class="news-tags"><span class="tag">${esc(d.tipo)} ${ph(d.num)}</span>${d.estado ? `<span class="tag e-${d.estado.replace(' ', '')}">${d.estado}</span>` : ''}</span>
      <span class="doc-item-t">${ph(d.titulo)}</span>
      <span class="xsmall muted">${ph(d.fecha)}. ${ph(d.emisor)}.</span></button></li>`).join('');
    const f = D.find((d) => d.id === sel);
    det.innerHTML = `
      <div class="news-tags"><span class="tag"><svg class="ic" aria-hidden="true" style="width:14px;height:14px"><use href="#i-${ico(f.tipo)}"/></svg>${esc(f.tipo)}</span>${f.estado ? `<span class="tag e-${f.estado.replace(' ', '')}">${f.estado}</span>` : ''}</div>
      <h2 class="h3" style="margin-top:12px">${ph(f.titulo)}</h2>
      <dl class="facts" style="margin-top:16px">
        <dt>Número</dt><dd>${esc(f.tipo)} ${ph(f.num)}</dd>
        <dt>Fecha</dt><dd>${ph(f.fecha)}</dd>
        <dt>Emitido por</dt><dd>${ph(f.emisor)}</dd>
        <dt>Materia</dt><dd>${esc(f.materia)}</dd>
        ${f.vinc ? `<dt>Vigencia</dt><dd>${ph(f.vinc)}</dd>` : ''}
      </dl>
      <div class="plain" style="margin-top:20px">
        <span class="eyebrow" style="color:var(--gold-700)">En lenguaje claro</span>
        <dl>
          <dt>Qué establece</dt><dd>${ph(f.que)}</dd>
          <dt>A quién alcanza</dt><dd>${ph(f.quien)}</dd>
          <dt>Desde cuándo</dt><dd>${ph(f.desde)}</dd>
        </dl>
        <p class="xsmall muted" style="margin-top:14px">La síntesis orienta y no reemplaza el texto oficial.</p>
      </div>
      <div class="btn-row" style="margin-top:18px">
        <button type="button" class="btn btn-primary btn-sm" data-demo="El PDF se publica junto con el texto oficial"><svg class="ic" aria-hidden="true"><use href="#i-download"/></svg>Texto completo (PDF)</button>
        <button type="button" class="btn btn-secondary btn-sm" data-copy-link>Copiar enlace permanente</button>
        <button type="button" class="btn btn-secondary btn-sm" data-cite>Cómo citarlo</button>
      </div>
      <p class="small" data-cite-out hidden style="margin-top:12px;padding:12px 14px;border-radius:10px;background:var(--bg);font-family:ui-monospace,Consolas,monospace;font-size:.85rem"></p>
      <h3 class="h4" style="margin-top:22px">Etiquetas</h3>
      <div class="tag-list" style="margin-top:8px">${f.etiquetas.map((t) => `<button type="button" class="chip" style="min-height:32px;font-size:.85rem" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <h3 class="h4" style="margin-top:22px">Documentos relacionados</h3>
      <ul class="checklist small" style="margin-top:10px">${f.rel.map((r, i) => {
        const id = f.relId && f.relId[i];
        const href = id ? `#doc-${id}` : (f.relHref && f.relHref[i]) || null;
        return `<li>${href ? `<a href="${href}"${id ? ` data-goto="${id}"` : ''}>${ph(r)}</a>` : ph(r)}</li>`;
      }).join('')}</ul>
      <p class="xsmall muted" style="margin-top:22px;padding-top:14px;border-top:1px solid var(--line)">Publicado en el sitio el <span class="ph">[fecha]</span>. Síntesis redactada por <span class="ph">[área]</span> y revisada por <span class="ph">[área]</span>.</p>`;
    if (focusDetail && matchMedia('(max-width: 1024px)').matches) det.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function pick(id, focus) {
    sel = id;
    history.replaceState(null, '', location.pathname + location.search + '#doc-' + id);
    render(focus);
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (b) pick(Number(b.dataset.id), true);
    if (e.target.closest('[data-clear]')) { q.value = ''; ft.value = 'Todos'; fe.value = 'Todos'; fa.value = 'Todos'; fm.value = 'Todas'; render(); }
  });
  det.addEventListener('click', async (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); q.value = ''; ft.value = 'Todos'; fe.value = 'Todos'; fa.value = 'Todos'; fm.value = 'Todas'; pick(Number(g.dataset.goto), true); return; }
    const t = e.target.closest('[data-tag]');
    if (t) { q.value = t.dataset.tag; render(); return; }
    if (e.target.closest('[data-copy-link]')) {
      const url = location.href.split('#')[0] + '#doc-' + sel;
      try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch (err) { toast(url); }
    }
    if (e.target.closest('[data-cite]')) {
      const f = D.find((d) => d.id === sel);
      const out = $('[data-cite-out]', det);
      out.hidden = false;
      out.textContent = `Ministerio Público Fiscal de San Juan. ${f.tipo} ${f.num}, «${f.titulo}». ${f.fecha}. Disponible en: ${location.href.split('#')[0]}#doc-${f.id}`;
    }
  });
  [q, ft, fe, fa, fm].forEach((el) => el.addEventListener('input', () => render()));
  $('[data-doc-filters]').addEventListener('submit', (e) => e.preventDefault());

  // Exportación de metadatos del repositorio (dato abierto)
  function exportCsv() {
    const rows = [['tipo', 'numero', 'titulo', 'fecha', 'emisor', 'materia', 'estado', 'vinculacion', 'etiquetas']]
      .concat(D.map((d) => [d.tipo, d.num, d.titulo, d.fecha, d.emisor, d.materia, d.estado, d.vinc, d.etiquetas.join('; ')]));
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'repositorio-documental-mpf.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Metadatos descargados');
  }
  $('[data-export]').addEventListener('click', exportCsv);
  if (location.hash === '#exportar') { history.replaceState(null, '', location.pathname); exportCsv(); }
  window.addEventListener('hashchange', () => { const m = location.hash.match(/^#doc-(\d+)$/); if (m) pick(Number(m[1])); });
  render();
})();
