/* Orientador de denuncias: asistente en cuatro pasos */
(function () {
  'use strict';
  const { $ } = window.MPF;
  const box = $('[data-wizard]');
  const prog = $('[data-progress]');
  if (!box) return;

  const DEPS = ['Capital', 'Rawson', 'Rivadavia', 'Chimbas', 'Santa Lucía', 'Pocito', '9 de Julio', '25 de Mayo', 'Caucete', 'San Martín', 'Angaco', 'Albardón', 'Zonda', 'Ullum', 'Sarmiento', 'Jáchal', 'Iglesia', 'Calingasta', 'Valle Fértil'];
  const C = [
    { id: 'violencia', t: 'Violencia de género o familiar', d: 'Golpes, amenazas, control, acoso o violencia económica de una pareja, ex pareja o familiar.', unidad: 'UFI de violencia de género', val: 'denominación a validar', llevar: ['DNI', 'Mensajes, audios o fotos que muestren lo que pasó', 'Certificado médico, si tuviste lesiones', 'Datos de testigos, si los hay'], consejo: 'Al denunciar podés pedir medidas de protección, como la prohibición de acercamiento. No necesitás tener todas las pruebas para hacerlo.', lineas: [['144', 'Violencia de género, 24 horas'], ['911', 'Emergencias']] },
    { id: 'ninez', t: 'Algo le pasa a una niña, un niño o un adolescente', d: 'Incluye acoso por internet, grooming, maltrato o abuso.', unidad: 'UFI ANIVI', llevar: ['DNI de la persona adulta que denuncia', 'Capturas de las conversaciones con fecha, hora y nombre del perfil', 'El teléfono o la computadora donde están los mensajes, sin borrar nada'], consejo: 'No confrontes al perfil ni borres las conversaciones: son la prueba. Denunciar el mismo día ayuda a preservarlas.', lineas: [['102', 'Niñas, niños y adolescentes'], ['911', 'Emergencias']] },
    { id: 'sexual', t: 'Un delito contra la integridad sexual', d: 'Abuso, violación o difusión de imágenes íntimas sin consentimiento.', unidad: 'UFI ANIVI', val: 'competencia a validar', llevar: ['DNI', 'Si ocurrió hace poco, la ropa que tenías puesta, en una bolsa de papel', 'Capturas, si hubo mensajes o imágenes difundidas'], consejo: 'Si ocurrió hace poco, buscá atención médica cuanto antes, aunque no tengas lesiones visibles. Para recibir atención en salud no hace falta denunciar.', lineas: [['144', 'Violencia de género, 24 horas'], ['107', 'Emergencias médicas']] },
    { id: 'robo', t: 'Un robo, un hurto o un daño', d: 'Te sacaron algo, entraron a tu casa o rompieron tus cosas.', unidad: 'UFI Genérica de tu zona', extra: 'Si hubo personas detenidas en el momento, interviene la UFI Flagrancia.', llevar: ['DNI', 'Lista de lo que te sacaron, con marca, modelo o número de serie', 'Si fue un celular, el número IMEI: está en la caja o marcando *#06#', 'Facturas o fotos de los objetos'], consejo: 'Si el hecho está ocurriendo o acaba de ocurrir, llamá al 911: la respuesta inmediata permite que intervenga la guardia de flagrancia.', lineas: [['911', 'Emergencias']] },
    { id: 'estafa', t: 'Una estafa o un delito por internet', d: 'Transferencias engañosas, cuentas hackeadas o compras falsas.', unidad: 'UFI de delitos informáticos y estafas', val: 'denominación a validar', llevar: ['DNI', 'Capturas de mensajes, perfiles o publicaciones', 'Comprobantes de transferencias, con CBU o alias de destino', 'Número de teléfono o correo desde el que te contactaron'], consejo: 'Avisá a tu banco o billetera virtual de inmediato para intentar frenar la transferencia, y cambiá tus contraseñas.', lineas: [['911', 'Emergencias']] },
    { id: 'lesiones', t: 'Lesiones o amenazas', d: 'Una agresión o mensajes intimidatorios de alguien que no es tu pareja ni tu familia.', unidad: 'UFI Genérica de tu zona', llevar: ['DNI', 'Certificado médico de las lesiones', 'Datos de testigos', 'Mensajes o audios con las amenazas'], consejo: 'Si necesitás atención médica, andá primero al hospital y pedí que registren tus lesiones.', lineas: [['911', 'Emergencias'], ['107', 'Emergencias médicas']] },
    { id: 'transito', t: 'Un siniestro vial con personas heridas', d: 'Choques o atropellos con personas lesionadas.', unidad: 'UFI de delitos culposos', val: 'denominación a validar', llevar: ['DNI y licencia de conducir', 'Datos de los vehículos y de los seguros', 'Fotos del lugar y datos de testigos'], consejo: 'Si hay personas heridas, llamá al 107 antes que nada.', lineas: [['107', 'Emergencias médicas'], ['911', 'Emergencias']] },
    { id: 'otro', t: 'Otra situación, o no sé si es un delito', d: 'Te orientamos en persona o por teléfono.', unidad: 'Mesa de entradas y atención al público', llevar: ['DNI', 'Todo lo que tengas sobre lo que pasó: papeles, mensajes, fotos'], consejo: 'Si no sabés si es un delito, igual podés acercarte: te orientamos y, si no le corresponde al MPF, te indicamos a qué organismo ir.', lineas: [['911', 'Emergencias']] }
  ];
  const norte = ['Jáchal', 'Iglesia'];
  const este = ['Caucete', '25 de Mayo', '9 de Julio', 'San Martín', 'Angaco', 'Valle Fértil'];
  const sedeDe = (dep) => norte.includes(dep) ? { n: 'Sede Jáchal', v: true } : este.includes(dep) ? { n: 'Sede Caucete', v: true } : { n: 'Sede central, Ciudad de San Juan', v: false };

  const s = { paso: 'inicio', cat: null, dep: 'Capital' };
  const icon = (i) => `<svg class="ic" aria-hidden="true"><use href="#i-${i}"/></svg>`;
  const ph = (t) => `<span class="ph">[${t}]</span>`;

  // Entradas directas: orientador.html#estafa, #peligro, etc.
  const h = location.hash.slice(1);
  if (h === 'peligro') s.paso = 'peligro';
  else if (C.some((c) => c.id === h)) { s.cat = h; s.paso = 'donde'; }
  else if (h === 'grooming') { s.cat = 'ninez'; s.paso = 'donde'; }

  function go(p, patch) {
    Object.assign(s, patch || {}, { paso: p });
    render();
    const top = box.getBoundingClientRect().top + window.scrollY - 180;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    const h2 = $('h2', box);
    if (h2) { h2.tabIndex = -1; h2.focus({ preventScroll: true }); }
  }

  function renderProgress() {
    const orden = ['inicio', 'que', 'donde', 'resultado'];
    const idx = s.paso === 'peligro' ? 0 : orden.indexOf(s.paso);
    prog.innerHTML = ['Urgencia', 'Qué pasó', 'Dónde', 'Resultado'].map((t, i) =>
      `<li class="${i < idx ? 'is-done' : ''}${i === idx ? ' is-current' : ''}"${i === idx ? ' aria-current="step"' : ''}><span class="bar"></span><span class="t">${i + 1}. ${t}</span></li>`).join('');
  }

  const views = {
    inicio: () => `
      <div class="card wz-card fade-swap">
        <span class="eyebrow">Paso 1 de 3</span>
        <h2 class="h2" style="margin-top:12px">¿Estás en peligro ahora o la situación está ocurriendo en este momento?</h2>
        <div class="wz-choices">
          <button type="button" class="choice choice-urgent choice-big" data-go="peligro"><span class="choice-t">Sí, necesito ayuda ahora</span><span class="choice-d">Te mostramos a quién llamar de inmediato.</span>${icon('arrow')}</button>
          <button type="button" class="choice choice-big" data-go="que"><span class="choice-t">No, quiero saber cómo denunciar</span><span class="choice-d">Seguimos con dos preguntas más.</span>${icon('arrow')}</button>
        </div>
      </div>`,
    peligro: () => `
      <div class="danger-panel fade-swap">
        <div style="position:relative;z-index:1">
          <span class="eyebrow">Ayuda inmediata</span>
          <h2 class="h1" style="margin-top:12px;color:#fff">Llamá ahora</h2>
          <p style="margin-top:12px;max-width:56ch">Es gratuito y funciona las 24 horas. Si no podés hablar, quedate en línea: la llamada igual se registra. ${ph('Validar con el 911 provincial')}</p>
          <a class="big-911" href="tel:911">${icon('phone')}911</a>
        </div>
        <div class="line-cards">
          <a class="line-card" href="tel:144"><strong>144</strong>Violencia de género. Todos los días, las 24 horas.</a>
          <a class="line-card" href="tel:102"><strong>102</strong>Si la víctima es una niña, un niño o un adolescente.</a>
          <a class="line-card" href="tel:107"><strong>107</strong>Emergencias médicas.</a>
        </div>
        <div class="btn-row" style="margin-top:24px;position:relative;z-index:1">
          <button type="button" class="btn btn-gold" data-go="que">Ya estoy a salvo: quiero saber cómo denunciar</button>
          <button type="button" class="btn btn-outline-light" data-go="inicio">Volver al inicio</button>
        </div>
      </div>`,
    que: () => `
      <div class="card wz-card fade-swap">
        <span class="eyebrow">Paso 2 de 3</span>
        <h2 class="h2" style="margin-top:12px">¿Qué pasó?</h2>
        <p class="muted" style="margin-top:8px">Elegí la opción más parecida. Si hay varias, elegí la que más te preocupa.</p>
        <div class="wz-choices">
          ${C.map((c) => `<button type="button" class="choice" data-cat="${c.id}"><span class="choice-t">${c.t}</span><span class="choice-d">${c.d}</span>${icon('arrow')}</button>`).join('')}
        </div>
        <div style="margin-top:24px"><button type="button" class="btn btn-ghost" data-go="inicio">Volver</button></div>
      </div>`,
    donde: () => {
      const c = C.find((x) => x.id === s.cat);
      return `
      <div class="card wz-card fade-swap">
        <span class="eyebrow">Paso 3 de 3</span>
        <h2 class="h2" style="margin-top:12px">¿En qué departamento ocurrió?</h2>
        <p class="muted" style="margin-top:8px">Si no lo sabés, elegí el departamento donde vivís.</p>
        ${c ? `<p style="margin-top:16px"><span class="tag">${c.t}</span> <button type="button" class="btn btn-sm" style="min-height:30px;padding:0 8px;color:var(--brand-500)" data-go="que">Cambiar</button></p>` : ''}
        <div style="max-width:440px;margin-top:20px">
          <label class="label" for="dep-orientador">Departamento</label>
          <select id="dep-orientador" class="select">${DEPS.map((d) => `<option${d === s.dep ? ' selected' : ''}>${d}</option>`).join('')}</select>
        </div>
        <div class="btn-row" style="margin-top:24px">
          <button type="button" class="btn btn-primary btn-lg" data-go="resultado">Ver dónde denunciar${icon('arrow')}</button>
          <button type="button" class="btn btn-ghost btn-lg" data-go="que">Volver</button>
        </div>
      </div>`;
    },
    resultado: () => {
      const c = C.find((x) => x.id === s.cat) || C[3];
      const sede = sedeDe(s.dep);
      return `
      <div class="stack fade-swap">
        <div class="print-only"><strong>Ministerio Público Fiscal de San Juan · Guía para denunciar</strong></div>
        <div class="result-head">
          <span class="tag">${c.t} · ${s.dep}</span>
          <h2 class="h2" style="margin-top:14px">Te corresponde: <span class="serif">${c.unidad}</span>${c.val ? ' ' + ph(c.val) : ''}</h2>
          ${c.extra ? `<p class="muted" style="margin-top:8px">${c.extra}</p>` : ''}
          <dl class="result-meta">
            <div><dt>Sede</dt><dd>${sede.n}${sede.v ? ' ' + ph('a validar') : ''}</dd></div>
            <div><dt>Dirección</dt><dd>${ph('Dirección')}</dd></div>
            <div><dt>Horario</dt><dd>${ph('Horario de atención')}</dd></div>
          </dl>
          <div class="btn-row no-print" style="margin-top:20px">
            <a class="btn btn-primary" href="fiscalias.html?dep=${encodeURIComponent(s.dep)}">${icon('pin')}Ver la sede en el mapa</a>
            <button type="button" class="btn btn-secondary" data-print>${icon('printer')}Imprimir o guardar en PDF</button>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="card"><h3 class="h3">Qué llevar</h3><ul class="checklist" style="margin-top:16px">${c.llevar.map((x) => `<li>${x}</li>`).join('')}</ul></div>
          <div class="card" style="background:var(--gold-50);border-color:#EEDDB8"><span class="ico-tile ico-tile-gold">${icon('info')}</span><h3 class="h3" style="margin-top:14px">Importante</h3><p style="margin-top:8px">${c.consejo}</p></div>
        </div>
        <div class="card">
          <h3 class="h3">Qué va a pasar después</h3>
          <ol class="steps" style="margin-top:10px">
            <li><span class="num num-soft">1</span><div><strong>Te toman la denuncia</strong><span class="small muted">Te entregan una constancia con el número de legajo. Guardala.</span></div></li>
            <li><span class="num num-soft">2</span><div><strong>Se asigna una UFI</strong><span class="small muted">La Unidad Fiscal de Investigación puede citarte para ampliar tu declaración.</span></div></li>
            <li><span class="num num-soft">3</span><div><strong>Podés seguir el caso</strong><span class="small muted">Consultá el estado general en línea y pedí información en la UFI cuando lo necesites.</span></div></li>
          </ol>
        </div>
        <div class="card" style="background:var(--ink);border-color:var(--ink);color:#C9D3DD">
          <h3 class="h3" style="color:#fff">Líneas de ayuda para esta situación</h3>
          <div class="line-cards">${c.lineas.map(([n, t]) => `<a class="line-card" href="tel:${n}"><strong>${n}</strong>${t}</a>`).join('')}</div>
        </div>
        <div class="btn-row no-print">
          <button type="button" class="btn btn-ghost" data-go="inicio">Empezar de nuevo</button>
          <a class="btn btn-ghost" href="victimas.html#derechos">Conocer mis derechos como víctima</a>
        </div>
      </div>`;
    }
  };

  function render() {
    renderProgress();
    box.innerHTML = views[s.paso]();
  }

  box.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    const c = e.target.closest('[data-cat]');
    if (g) go(g.dataset.go);
    else if (c) go('donde', { cat: c.dataset.cat });
    else if (e.target.closest('[data-print]')) window.print();
  });
  box.addEventListener('change', (e) => { if (e.target.id === 'dep-orientador') s.dep = e.target.value; });
  render();
})();
