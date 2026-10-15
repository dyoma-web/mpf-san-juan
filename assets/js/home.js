/* Inicio: selector de perfiles */
(function () {
  'use strict';
  const { $ } = window.MPF;
  const P = [
    { id: 'victima', icon: 'heart', label: 'Fui víctima de un delito', titulo: 'Fui víctima de un delito', intro: 'Tenés derecho a recibir información, a ser escuchada o escuchado y a que te acompañen durante todo el proceso, aunque no seas parte formal del caso.', links: [['Conocer tus derechos', 'victimas.html#derechos'], ['Qué pasa después de denunciar', 'victimas.html#despues'], ['Seguir el estado de tu denuncia', 'servicios.html#seguimiento'], ['Recuperar tus pertenencias', 'servicios.html#objetos']] },
    { id: 'denunciante', icon: 'file', label: 'Vi algo o quiero denunciar', titulo: 'Vi algo o quiero denunciar', intro: 'Cualquier persona puede denunciar un delito, aunque no sea la víctima. Te ayudamos a saber dónde hacerlo y qué llevar.', links: [['Usar el orientador de denuncias', 'orientador.html'], ['Formas de denunciar', 'servicios.html#denunciar'], ['Buscar la sede más cercana', 'fiscalias.html'], ['Qué implica ser testigo', 'servicios.html#testigos']] },
    { id: 'imputado', icon: 'scale', label: 'Me acusan a mí o a un familiar', titulo: 'Me acusan de un delito, a mí o a un familiar', intro: 'El Ministerio Público Fiscal es la parte que acusa. Para tu defensa tenés derecho a una abogada o un abogado; si no podés pagarlo, te asiste la Defensa Pública.', links: [['Pedir defensa pública gratuita', 'https://www.jussanjuan.gov.ar/mpd/organigrama/'], ['Qué es una audiencia de formalización', 'escuela.html#ciudadania'], ['Salidas alternativas al juicio', 'servicios.html#alternativas'], ['Portal del Poder Judicial', 'https://www.jussanjuan.gov.ar/']] },
    { id: 'abogacia', icon: 'book', label: 'Soy abogada o abogado', titulo: 'Soy abogada o abogado', intro: 'Instrucciones generales, resoluciones y dictámenes del MPF con buscador y estado de vigencia, y el directorio actualizado de cada UFI.', links: [['Buscar resoluciones e instrucciones', 'documentos.html'], ['Directorio de UFI', 'fiscalias.html'], ['Formación para operadores', 'escuela.html#operadores'], ['Sistemas del Poder Judicial', 'https://www.jussanjuan.gov.ar/']] },
    { id: 'prensa', icon: 'news', label: 'Soy periodista', titulo: 'Soy periodista', intro: 'Comunicados, voceros por tema, material gráfico y pautas para informar sobre casos sin exponer a las víctimas.', links: [['Sala de prensa', 'prensa.html'], ['Pautas para comunicar casos', 'prensa.html#pautas'], ['Datos y estadísticas', 'justicia-abierta.html']] },
    { id: 'estudiante', icon: 'cap', label: 'Estudio o investigo', titulo: 'Estudio o investigo', intro: 'Datos abiertos con diccionario, jurisprudencia y una casoteca con investigaciones resueltas y anonimizadas.', links: [['Datos abiertos', 'justicia-abierta.html#datasets'], ['Casoteca de la Escuela', 'escuela.html#casoteca'], ['Jurisprudencia y dictámenes', 'documentos.html']] }
  ];
  const tabs = $('[data-profile-tabs]');
  const panel = $('[data-profile-panel]');
  if (!tabs || !panel) return;
  let cur = 'victima';

  tabs.innerHTML = P.map((p) => `<button type="button" role="tab" class="profile-tab" id="tab-${p.id}" aria-controls="profile-panel" data-id="${p.id}"><svg class="ic" aria-hidden="true"><use href="#i-${p.icon}"/></svg>${p.label}</button>`).join('');

  function render(focus) {
    const p = P.find((x) => x.id === cur);
    tabs.querySelectorAll('[role="tab"]').forEach((b) => {
      const on = b.dataset.id === cur;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    panel.setAttribute('aria-labelledby', 'tab-' + cur);
    panel.innerHTML = `<div class="fade-swap stack-lg" style="position:relative;z-index:1"><div class="stack"><h3>${p.titulo}</h3><p>${p.intro}</p></div><ul class="profile-links">${p.links.map(([t, h]) => `<li><a href="${h}"${/^https?:/.test(h) ? ' rel="noopener"' : ''}><span>${t}</span><svg class="ic" aria-hidden="true"><use href="#i-${/^https?:/.test(h) ? 'external' : 'arrow'}"/></svg></a></li>`).join('')}</ul></div>`;
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[role="tab"]');
    if (!b) return;
    cur = b.dataset.id;
    render(false);
  });
  tabs.addEventListener('keydown', (e) => {
    const i = P.findIndex((x) => x.id === cur);
    let n = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % P.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + P.length) % P.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = P.length - 1;
    if (n === null) return;
    e.preventDefault();
    cur = P[n].id;
    render(true);
  });
  render(false);
})();
