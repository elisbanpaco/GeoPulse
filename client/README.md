# GeoPulse Client

Next.js 16.2.9, React 19, TypeScript, Tailwind CSS, Leaflet y Recharts. Requiere Node.js 24 y pnpm. La API requiere Python 3.13 y se ejecuta por separado.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:3000`. La variable `NEXT_PUBLIC_API_URL` usa `http://localhost:8000` por defecto; configura otra URL mediante `.env.local` a partir de `.env.example`. Reinicia la API después de actualizar el catálogo para que incluya los nuevos nombres breves y categorías.

## Experiencia de consulta

La entrada pide elegir una región mediante un buscador. No se muestran cifras nacionales sin una elección explícita. «Prefiero ver todo el Perú» abre la vista nacional.

Una sola pantalla concentra región, tema y año, con nombres breves y una explicación del resultado. Para recuentos muestra la diferencia absoluta frente al año anterior; para porcentajes usa puntos porcentuales. Las unidades, las fuentes y los cálculos originales se conservan.

- «Comparar con otra región» añade la segunda región junto al resultado y sustituye el gráfico por ambas series.
- «Explorar otras regiones» despliega el mapa. Se encuadra todo el Perú al abrirlo o cambiar el tamaño de la pantalla; «Ver Perú completo» restaura el encuadre tras hacer zoom. Ambas Limas siguen disponibles por separado en el selector.
- «Sobre estos datos» conserva definiciones oficiales, cobertura y limitaciones.
- «Más» reúne copiar enlace, descargar CSV y análisis avanzado. La clasificación experimental no aparece en el recorrido inicial.
- Los selectores permiten buscar sin distinguir tildes o mayúsculas, navegar con teclado, cerrar con Escape y recuperar el foco.
- Las respuestas antiguas se cancelan; los errores se explican con una acción para reintentar.

Los parámetros `indicator`, `year`, `region`, `compare_region` y `view` conservan los enlaces anteriores. `scope=national` identifica una elección nacional explícita. Una URL antigua con una vista pero sin región sigue abriendo el contexto nacional; entrar sin parámetros abre la bienvenida.

## Pruebas

```bash
pnpm test
pnpm lint
pnpm build
```

Las pruebas unitarias usan el runner integrado de Node.js y verifican filtros, compatibilidad de enlaces y textos de comparación. CI ejecuta esas pruebas, lint y build.

Las pruebas de interfaz usan Playwright. Con la API y el frontend ya iniciados, usando los datos locales o la muestra sintética distribuida en `api/sample_data`:

```bash
pnpm exec playwright install chromium
pnpm test:ui
```

Se pueden usar servidores alternativos sin modificar la configuración del producto:

```bash
GEOPULSE_TEST_URL=http://localhost:3100 GEOPULSE_TEST_API_URL=http://localhost:8100 pnpm test:ui
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE` permite indicar un Chromium instalado. `GEOPULSE_TEST_OUTPUT` cambia la carpeta de capturas, que por defecto es `/tmp/geopulse-ux`. Las pruebas incluyen la bienvenida, teclado y foco, comparación, exportación, enlaces, errores y el mapa completo a 1920, 1366, 390 y 375 píxeles.

Los nombres breves y categorías proceden del catálogo de la API; `name` conserva la definición oficial. Los componentes de la experiencia pública están en `src/components/explore/`. Las clases `gx-*` de `globals.css` definen su presentación, sin depender de fuentes remotas.
