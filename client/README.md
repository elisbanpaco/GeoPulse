# GeoPulse Client

Next.js 16.2.9, React 19, TypeScript, Tailwind CSS, Leaflet y Recharts. Requiere Node.js 24 y pnpm. La API requiere Python 3.13 y se ejecuta por separado.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:3000`. La variable `NEXT_PUBLIC_API_URL` usa `http://localhost:8000` por defecto; configura otra URL mediante `.env.local` a partir de `.env.example`.

## Flujo de análisis

Seleccionar indicador → año → región → comparar otra región → compartir enlace o exportar CSV. Los años, fuentes y unidades provienen del catálogo del backend, no de listas locales.

- Los parámetros URL `indicator`, `year`, `region`, `compare_region` y `view` restauran el análisis, incluido al usar Atrás/Adelante.
- Si un parámetro no es válido, se usa un valor disponible: indicador 30, último año y ámbito nacional. Los filtros compartidos se serializan ya normalizados.
- Cambiar de indicador conserva el año solo si ese indicador tiene datos de ese año.
- Las peticiones anteriores se cancelan y sus respuestas no pueden sustituir el estado de filtros nuevos. Se muestran errores con reintento, carga y ausencia de datos por separado.
- Las series muestran toda la historia y destacan el año seleccionado. El mapa y el ranking muestran ese año.
- El mapa distingue cero de ausencia y usa una escala numérica; Lima Metropolitana y Lima Provincias se consultan por separado desde el selector porque la geometría departamental no distingue ambos territorios.
- El CSV conserva valores preliminares, unidades, fuentes, año y filtros. No hay botones de PDF/Excel sin implementar.
- El módulo ML se presenta como clasificación histórica experimental, no pronóstico ni alerta de riesgo.

## Comprobaciones

```bash
pnpm test
pnpm lint
pnpm build
```

Las pruebas de filtros usan el runner integrado de Node.js, sin bibliotecas de prueba adicionales. CI ejecuta pruebas, lint y build. Revisar también en escritorio y móvil: selección de región, cambios rápidos de indicador/año, comparación de dos territorios, URL compartida, exportación y errores de API.

Los componentes reutilizan las clases y variables de `globals.css`. No se requieren fuentes remotas para ejecutar o compilar. El backend es la única fuente del catálogo; consultar el README raíz para metodología y limitaciones.
