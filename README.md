# MPF San Juan · Prototipo de sitio web

Prototipo funcional del nuevo sitio del **Ministerio Público Fiscal de la Provincia de San Juan**: una plataforma pensada desde las personas que necesitan la justicia penal (víctimas, denunciantes, testigos, profesionales, periodistas), en lenguaje claro y con accesibilidad como requisito.

> ⚠️ **Prototipo.** Es una propuesta de diseño, no el sitio oficial del MPF. Los datos marcados `[así]` están pendientes de validación institucional, y las cifras de Justicia abierta son ilustrativas. El sitio se publica con `noindex`.

## Qué incluye

| Página | Qué hace |
|---|---|
| **Inicio** | Buscador, tareas frecuentes, proceso penal en 5 pasos, selector por perfil, buscador de fiscalía, casos y Escuela |
| **Orientador de denuncias** | Asistente en 3 pasos (urgencia, tipo de hecho, departamento) con resultado imprimible. Acepta enlaces directos: `orientador.html#estafa`, `#violencia`, `#peligro`… |
| **Servicios y trámites** | Índice lateral con seguimiento de sección, consulta de legajo (demostración), preguntas frecuentes |
| **Víctimas** | Líneas de ayuda, derechos, guías por situación, protocolo de grooming, glosario |
| **Fiscalías y sedes** | Mapa esquemático de los 19 departamentos, filtros, búsqueda, `?dep=` y descarga del directorio en CSV |
| **Institución · Justicia abierta · Documentos · Prensa · Escuela · Contacto** | Secciones completas con buscadores, filtros y formularios validados |

**Transversal:** buscador global tipo paleta de comandos (`Ctrl/⌘ + K` o `/`), barra de ayuda urgente, tamaño de texto, alto contraste y lectura fácil (persisten entre páginas), salida rápida (botón o `Esc` tres veces en Víctimas), menú móvil, valoración de cada página, estilos de impresión y respeto por `prefers-reduced-motion`.

## Modo revisión (comentarios en vivo)

Pensado para sesiones de trabajo con el cliente sobre el prototipo. Se activa abriendo cualquier página con `?revision=CÓDIGO` (o `?revision` para escribir el código). Sin eso, el público no ve nada.

| Herramienta | Atajo | Qué hace |
|---|---|---|
| Comentar | `C` | Clic en cualquier elemento: deja un post-it anclado (Corregir, Agregar, Eliminar, Idea, Pregunta) |
| Redacción | `S` | Seleccioná un texto y proponé cómo debería decir; se muestra como tachado → nuevo |
| Ocultar | `H` | Oculta un bloque solo en tu pantalla para simular “¿y si lo quitamos?”, con opción de proponer su eliminación |
| Panel | `P` | Lista con filtros, búsqueda, orden por votos, estados, respuestas en hilo, votos y “ir al elemento” |

Además: presencia en vivo (quién está y en qué página), avisos cuando otra persona comenta, versión del sitio registrada en cada comentario, **acta de la sesión** en Markdown y exportación CSV. Los comentarios también aparecen en una hoja de Google Sheets vía `IMPORTDATA`.

**Arquitectura:** Supabase. Las tablas tienen RLS sin políticas (cerradas) y todo pasa por funciones `SECURITY DEFINER` que validan el código de sesión (`supabase/schema.sql`). Los avisos instantáneos y la presencia usan Supabase Realtime; si se corta, hay sondeo cada 20 s. La función `review-csv` exporta los comentarios para la hoja de cálculo. La clave del cliente que está en el HTML es pública por diseño.

**Cambiar el código de sesión:** `update public.review_config set value = 'NUEVO' where key = 'session_code';`

## Estructura

```
src/
  layout.html          plantilla base (<head>, scripts)
  partials/            encabezado, pie e íconos SVG compartidos
  pages/*.html         contenido de cada página (con front-matter)
assets/
  css/styles.css       sistema de diseño completo
  js/app.js            comportamiento global
  js/<página>.js       interacciones de cada página
  img/                 imágenes y favicon
build.mjs              generador estático sin dependencias → dist/
```

Cada página empieza con un front-matter simple:

```
---
title: Fiscalías y sedes
description: …
active: fiscalias        # ítem del menú marcado
quickExit: true          # muestra el botón "Salida rápida"
scripts: fiscalias.js    # scripts propios, separados por coma
---
```

## Uso

Requiere Node.js 18 o superior. No hay dependencias que instalar.

```bash
npm run build      # genera dist/
npm run preview    # genera y sirve dist/ en http://localhost:3000
```

`dist/` también se puede abrir directamente desde el sistema de archivos o servir con cualquier servidor estático (Apache, Nginx, WAMP).

## Publicación

Cada push a `main` ejecuta `.github/workflows/pages.yml`, que compila el sitio y lo publica en GitHub Pages.

## Diseño

- **Tipografía:** Inter Tight (títulos), Atkinson Hyperlegible (texto, diseñada para baja visión), Instrument Serif (acentos).
- **Color:** azul institucional profundo `#163A5F`, noche `#0B1A2A` y oro cálido `#D4B26F`.
- **Accesibilidad:** objetivos táctiles de 44 px o más, foco visible, enlace para saltar al contenido, landmarks y ARIA en los componentes interactivos, objetivo WCAG 2.2 AA.

## Pendiente para producción

- Validar con el MPF direcciones, horarios, teléfonos, denominaciones de UFI y textos normativos.
- Conectar la consulta de legajo, el formulario de contacto, los datos abiertos y el campus a servicios reales.
- Reemplazar las piezas gráficas de prensa por imágenes en alta resolución.
- Quitar `noindex` al pasar a producción.
