// Generador estático mínimo, sin dependencias.
// Lee src/pages/*.html (con front-matter), los envuelve en src/layout.html
// con el encabezado y el pie compartidos, y escribe el sitio en dist/.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist');

const NAV = [
  { id: 'institucion', t: 'Institución', href: 'institucion.html' },
  { id: 'fiscalias', t: 'Fiscalías y sedes', href: 'fiscalias.html' },
  { id: 'servicios', t: 'Servicios y trámites', href: 'servicios.html' },
  { id: 'victimas', t: 'Víctimas', href: 'victimas.html' },
  { id: 'transparencia', t: 'Justicia abierta', href: 'justicia-abierta.html' },
  { id: 'documentos', t: 'Documentos', href: 'documentos.html' },
  { id: 'prensa', t: 'Prensa', href: 'prensa.html' },
  { id: 'escuela', t: 'Escuela', href: 'escuela.html' },
  { id: 'contacto', t: 'Contacto', href: 'contacto.html' }
];

const read = (p) => readFileSync(p, 'utf8');
const layout = read(join(SRC, 'layout.html'));
const header = read(join(SRC, 'partials', 'header.html'));
const footer = read(join(SRC, 'partials', 'footer.html'));
const icons = read(join(SRC, 'partials', 'icons.svg'));

function parse(file) {
  const raw = read(file);
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('Falta front-matter en ' + file);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ''));
}

function navHtml(active, cls) {
  return NAV.map((i) => {
    const cur = i.id === active;
    return `<li><a class="${cls}${cur ? ' is-active' : ''}" href="${i.href}"${cur ? ' aria-current="page"' : ''}>${i.t}</a></li>`;
  }).join('\n');
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });
if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), OUT, { recursive: true });

const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
for (const f of pages) {
  const { meta, body } = parse(join(SRC, 'pages', f));
  const active = meta.active || '';
  const scripts = (meta.scripts || '').split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => `<script src="assets/js/${s}" defer></script>`).join('\n');
  const h = fill(header, {
    nav: navHtml(active, 'nav-link'),
    navMobile: navHtml(active, 'drawer-link'),
    quickExit: meta.quickExit === 'true' ? '' : ' hidden'
  });
  const html = fill(layout, {
    title: meta.title === 'Inicio' ? 'Ministerio Público Fiscal de San Juan' : `${meta.title} · MPF San Juan`,
    description: meta.description || '',
    bodyClass: meta.bodyClass || '',
    page: basename(f, '.html'),
    icons,
    header: h,
    footer,
    main: body,
    scripts
  });
  writeFileSync(join(OUT, f), html);
  console.log('  ✓', f);
}
console.log(`Sitio generado en dist/ (${pages.length} páginas).`);
