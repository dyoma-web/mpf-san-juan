/* Documentos: buscador con filtros */
(function () {
  'use strict';
  const { $, norm } = window.MPF;
  const DOCS = [
    { tipo: 'Protocolo', t: 'Protocolo de actuación en casos de grooming y acoso digital', vig: 'Vigente', fecha: '2026', que: 'Fija cómo se preservan las conversaciones y los dispositivos desde la primera hora.', a: 'UFI ANIVI, Policía y comisarías.' },
    { tipo: 'Instrucción general', t: 'Criterios para solicitar medidas de protección en violencia de género', vig: 'Vigente', fecha: '2026', que: 'Indica cuándo y cómo pedir prohibición de acercamiento y otras medidas desde la denuncia.', a: 'Todas las UFI.' },
    { tipo: 'Resolución', t: 'Organización de la guardia de flagrancia', vig: 'Vigente', fecha: '2025', que: 'Define turnos, competencia territorial y plazos de la audiencia de presentación.', a: 'UFI Flagrancia y unidades de apoyo.' },
    { tipo: 'Instrucción general', t: 'Información a víctimas sobre salidas alternativas', vig: 'Vigente', fecha: '2025', que: 'Obliga a escuchar a la víctima antes de acordar una conciliación, un juicio abreviado o una suspensión del juicio a prueba.', a: 'Todas las UFI.' },
    { tipo: 'Protocolo', t: 'Atención de víctimas de delitos contra la integridad sexual', vig: 'Vigente', fecha: '2025', que: 'Coordina la atención médica urgente, la toma de muestras y el acompañamiento.', a: 'UFI ANIVI, Atención a víctimas y sistema de salud.' },
    { tipo: 'Dictamen', t: 'Competencia en estafas cometidas por medios digitales', vig: 'Vigente', fecha: '2024', que: 'Establece qué fiscalía investiga cuando la víctima y el autor están en distintas jurisdicciones.', a: 'UFI de delitos informáticos y Genéricas.' },
    { tipo: 'Resolución', t: 'Devolución de objetos secuestrados en guarda', vig: 'Vigente', fecha: '2024', que: 'Simplifica la devolución de celulares y otros bienes a sus dueños antes de que termine el caso.', a: 'Todas las UFI y depósitos judiciales.' },
    { tipo: 'Instrucción general', t: 'Registro de denuncias en comisarías', vig: 'Derogada', fecha: '2022', que: 'Reemplazada por la instrucción de 2025 sobre denuncia digital.', a: 'Policía de San Juan.' }
  ];
  const list = $('[data-doc-list]'), count = $('[data-doc-count]');
  const q = $('#q-docs'), ft = $('#f-tipo'), fv = $('#f-vig');
  function render() {
    const n = norm(q.value);
    const r = DOCS.filter((d) => (!ft.value || d.tipo === ft.value) && (!fv.value || d.vig === fv.value) && (!n || norm(d.t + ' ' + d.que + ' ' + d.a + ' ' + d.tipo).includes(n)));
    count.textContent = r.length === 1 ? '1 documento' : r.length + ' documentos';
    list.innerHTML = r.length ? r.map((d) => `
      <li class="doc fade-swap">
        <span class="ico-tile"><svg class="ic" aria-hidden="true"><use href="#i-${d.tipo === 'Protocolo' ? 'shield' : d.tipo === 'Dictamen' ? 'scale' : 'file'}"/></svg></span>
        <div>
          <div class="news-tags"><span class="tag">${d.tipo}</span><span class="tag ${d.vig === 'Vigente' ? 'tag-ok' : ''}">${d.vig}</span></div>
          <h2 class="doc-t" style="margin-top:10px">${d.t}</h2>
          <p class="doc-sum"><b>Qué decide:</b> ${d.que}<br><b>A quién afecta:</b> ${d.a}</p>
          <div class="doc-meta"><span>N.º <span class="ph">[número]</span>/${d.fecha}</span><span>Publicado en ${d.fecha}</span></div>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" data-demo="El PDF se publica junto con el documento oficial"><svg class="ic" aria-hidden="true"><use href="#i-download"/></svg>PDF</button>
      </li>`).join('') : '<li class="empty">No encontramos documentos con esos criterios.</li>';
  }
  [q, ft, fv].forEach((el) => el.addEventListener('input', render));
  $('[data-doc-filters]').addEventListener('submit', (e) => e.preventDefault());
  const pre = new URLSearchParams(location.search).get('q');
  if (pre) q.value = pre;
  render();
})();
