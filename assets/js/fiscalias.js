/* Fiscalías y sedes: mapa esquemático, filtros y búsqueda */
(function () {
  'use strict';
  const { $, norm, toast } = window.MPF;
  const D = [
    ['Iglesia', 1, 1, 'norte'], ['Jáchal', 3, 1, 'norte'], ['Valle Fértil', 6, 1, 'este'],
    ['Calingasta', 1, 2, 'centro'], ['Ullum', 2, 2, 'centro'], ['Albardón', 3, 2, 'centro'], ['Angaco', 4, 2, 'este'], ['San Martín', 5, 2, 'este'],
    ['Zonda', 2, 3, 'centro'], ['Chimbas', 3, 3, 'centro'], ['Caucete', 6, 3, 'este'],
    ['Rivadavia', 2, 4, 'centro'], ['Capital', 3, 4, 'centro'], ['Santa Lucía', 4, 4, 'centro'], ['9 de Julio', 5, 4, 'este'], ['25 de Mayo', 6, 4, 'este'],
    ['Pocito', 2, 5, 'centro'], ['Rawson', 3, 5, 'centro'], ['Sarmiento', 3, 6, 'centro']
  ];
  const S = [
    { n: 'UFI Flagrancia', tipo: 'UFI', zona: 'centro', h24: true, hor: 'Guardia: horario a confirmar', que: 'Investiga los hechos en los que la persona es detenida en el momento o inmediatamente después.' },
    { n: 'UFI ANIVI', tipo: 'UFI', zona: 'todas', hor: 'Horario', que: 'Investiga delitos contra niñas, niños y adolescentes, incluidos los cometidos por internet.', val: 'Competencia a validar' },
    { n: 'UFI Genérica', tipo: 'UFI', zona: 'centro', hor: 'Horario', que: 'Robos, hurtos, lesiones, amenazas y otros delitos que no corresponden a una unidad especializada.', val: 'n.º' },
    { n: 'UFI Delitos Especiales', tipo: 'UFI', zona: 'todas', hor: 'Horario', que: 'Delitos económicos, contra la administración pública y otros de investigación compleja.', val: 'a validar' },
    { n: 'Sede Jáchal', tipo: 'UFI', zona: 'norte', hor: 'Horario', que: 'Recibe denuncias e investiga los hechos ocurridos en Jáchal e Iglesia.', val: 'a validar' },
    { n: 'Sede Caucete', tipo: 'UFI', zona: 'este', hor: 'Horario', que: 'Recibe denuncias e investiga los hechos ocurridos en los departamentos del este.', val: 'a validar' },
    { n: 'Atención a víctimas', tipo: 'Atención a víctimas', zona: 'todas', hor: 'Horario', que: 'Orientación, acompañamiento a audiencias y articulación con salud y desarrollo humano.', val: 'a validar' },
    { n: 'Mesa de entradas y atención al público', tipo: 'Atención al público', zona: 'todas', hor: 'Lunes a viernes, horario', que: 'Recibe denuncias, escritos y consultas generales.' },
    { n: 'Fiscalía General', tipo: 'Fiscalía General', zona: 'todas', hor: 'Horario', que: 'Conduce el Ministerio Público Fiscal, fija criterios de actuación y lo representa ante la Corte de Justicia.' }
  ];
  const TIPOS = ['Todas', 'UFI', 'Atención a víctimas', 'Atención al público', 'Fiscalía General'];
  const qp = new URLSearchParams(location.search).get('dep');
  const s = { dep: D.some((d) => d[0] === qp) ? qp : 'Capital', tipo: 'Todas', q: '' };
  const zonaDe = (n) => (D.find((x) => x[0] === n) || [, , , 'centro'])[3];
  const ph = (t) => `<span class="ph">[${t}]</span>`;
  const icon = (i) => `<svg class="ic" aria-hidden="true"><use href="#i-${i}"/></svg>`;

  const elTiles = $('[data-tiles]'), elTypes = $('[data-types]'), elList = $('[data-sedes]'), elTitle = $('[data-title]'), elCount = $('[data-count]');

  function render() {
    const z = zonaDe(s.dep);
    elTiles.innerHTML = D.map((d) => `<button type="button" class="tile${d[3] === z && d[0] !== s.dep ? ' is-zone' : ''}" style="grid-column:${d[1]};grid-row:${d[2]}" aria-pressed="${d[0] === s.dep}" data-dep="${d[0]}">${d[0]}</button>`).join('');
    elTypes.innerHTML = TIPOS.map((t) => `<button type="button" class="chip" aria-pressed="${t === s.tipo}" data-tipo="${t}">${t}</button>`).join('');
    elTitle.textContent = 'Te atienden en ' + s.dep;
    const q = norm(s.q);
    const list = S.filter((x) => (x.zona === 'todas' || x.zona === z) && (s.tipo === 'Todas' || x.tipo === s.tipo) && (!q || norm(x.n + ' ' + x.que + ' ' + x.tipo + ' ' + x.zona).includes(q)));
    elCount.textContent = list.length === 1 ? '1 sede' : list.length + ' sedes';
    elList.innerHTML = list.length ? list.map((x) => `
      <li class="card sede fade-swap">
        <div class="stack-sm">
          <div class="news-tags"><span class="tag">${x.tipo}</span>${x.h24 ? '<span class="tag tag-ok">Guardia permanente</span>' : ''}</div>
          <h3 class="h3" style="margin-top:4px">${x.n}${x.val ? ' ' + ph(x.val) : ''}</h3>
          <p class="small muted">${x.que}</p>
        </div>
        <dl>
          <dt>Dirección</dt><dd>${ph('Dirección')}</dd>
          <dt>Horario</dt><dd>${ph(x.hor)}</dd>
          <dt>Teléfono</dt><dd>${ph('Número')}</dd>
          <dt>Accesible</dt><dd>${ph('Rampa, ascensor, baño adaptado')}</dd>
          <dt></dt><dd><a class="link-arrow" href="https://www.google.com/maps/search/${encodeURIComponent('Ministerio Público Fiscal ' + x.n + ' San Juan')}" target="_blank" rel="noopener">Cómo llegar${icon('external')}</a></dd>
        </dl>
      </li>`).join('') : `<li class="empty">No hay sedes que coincidan con la búsqueda. <button type="button" class="btn btn-sm btn-ghost" data-clear style="margin-left:6px">Limpiar filtros</button></li>`;
  }

  elTiles.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dep]');
    if (!b) return;
    s.dep = b.dataset.dep;
    history.replaceState(null, '', '?dep=' + encodeURIComponent(s.dep));
    render();
    $(`[data-dep="${s.dep}"]`, elTiles).focus();
  });
  elTypes.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tipo]');
    if (!b) return;
    s.tipo = b.dataset.tipo;
    render();
  });
  elList.addEventListener('click', (e) => {
    if (!e.target.closest('[data-clear]')) return;
    s.tipo = 'Todas'; s.q = ''; $('#q-sedes').value = '';
    render();
  });
  $('#q-sedes').addEventListener('input', (e) => { s.q = e.target.value; render(); });

  // Descarga del directorio en CSV (generado en el navegador)
  $('[data-csv]').addEventListener('click', () => {
    const rows = [['nombre', 'tipo', 'zona', 'guardia_24h', 'que_hace', 'horario', 'direccion', 'telefono']]
      .concat(S.map((x) => [x.n, x.tipo, x.zona, x.h24 ? 'si' : 'no', x.que, x.hor, '[a completar]', '[a completar]']));
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'directorio-mpf-san-juan.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Directorio descargado');
  });
  render();
})();
