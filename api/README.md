# GeoPulse API

FastAPI y Pandas para consultar **un indicador por vez**, sin agregar medidas incompatibles. Requiere Python 3.13+ y `uv`.

```bash
uv sync --locked
uv run uvicorn main:app --reload --port 8000
```

Para ejecutar la muestra sintética distribuida con el repositorio:

```bash
GEOPULSE_DATA_DIR=sample_data uv run uvicorn main:app --port 8000
```

## Configuración

- `GEOPULSE_DATA_DIR`: directorio de datos; por defecto `api/data`.
- `CORS_ORIGINS`: orígenes separados por coma; por defecto `http://localhost:3000`.
- Se requiere exactamente un `DATASET_Ind*.csv` con columnas `INDICADOR, AMBITO, UBIGEO_DASH, FUENTE, ANIO, VALORES`.
- La geometría se lee de `peru_departamento_.json` dentro del directorio de datos, o del archivo versionado `client/public/peru_simplified.json`.
- `predictions.csv` es opcional. Su ausencia no impide usar el dashboard.

El catálogo `catalog/indicators.json` procede del diccionario local de noviembre de 2025. `name` conserva la definición oficial; `display_name`, `category` y `result_label` ofrecen nombres breves y contexto de lectura para la interfaz. Reinicia la API después de actualizar el catálogo. Cambiar la fuente exige revisar unidades, códigos y ámbitos. `VALORES` se conserva como medida preliminar: en homicidios y denuncias son recuentos, aunque el nombre oficial describa tasas. No se afirma completitud anual. La muestra `sample_data` es sintética y no puede utilizarse como estadística del Perú.

## Contrato HTTP

Documentación interactiva: `http://localhost:8000/docs`.

Rutas bajo `/api/v1/dashboard`:

| Ruta | Parámetros | Resultado |
|---|---|---|
| `/indicators` | — | Catálogo disponible con unidad, fuente, medida, ámbitos y años |
| `/periods` | `indicator` | Años disponibles del indicador |
| `/regions` | — | Catálogo de territorios, sin valores almacenados |
| `/summary` | `indicator, region?, year?` | Observación, año, unidad, dato previo y variación nullable |
| `/map-data` | `indicator, year?` | Observaciones regionales originales |
| `/top-regions` | `indicator, year?, limit?` | Ranking de observaciones regionales con dato |
| `/trend` | `indicator, region?` | Historia nacional o del territorio elegido |
| `/trends` | `indicator, region?, compare_region?, year?, limit?` | Series elegidas; sin regiones, las de mayor valor del año |
| `/anomalies` | `indicator, year?, region?, threshold?` | Variaciones descriptivas sobre el umbral absoluto |
| `/details` | `indicator, year?, region?, limit?` | Observaciones regionales filtradas |
| `/export` | `indicator, year?, region?, compare_region?` | CSV UTF-8 con metadatos y filtros |
| `/predictions` | `indicator, region?` | Clasificaciones históricas experimentales del artefacto opcional |
| `/distribution` | — | 410: retirada por agregación inválida |

`indicator` usa `30` como valor predeterminado. Si se omite `year`, se usa el último año real del indicador. `region` acepta códigos regionales con ceros iniciales y `1501`/`1599`; omitirlo solicita el dato nacional en resumen/historia y todos los territorios en exportación/mapa. El resumen nacional no se estima desde datos regionales.

Los valores numéricos se llaman `value`, sustituyendo el antiguo `total_delitos`. `value: null` significa ausencia; cero es una observación válida. La variación solo se calcula frente al año inmediatamente anterior y con denominador positivo. El CSV conserva ausencias como celdas vacías; al comparar exporta ambos territorios del año elegido.

`/health` devuelve 200 si los datos se cargaron y 503 si no. Las consultas analíticas también devuelven 503 cuando falta la fuente y 422 ante parámetros inválidos. La carga rechaza observaciones duplicadas y territorios/indicadores desconocidos en lugar de agregarlos. El artefacto ML existente colapsa ambas Limas en `15`: esas filas se omiten y no se atribuyen a ningún territorio.

## Pruebas

```bash
uv run python -m unittest discover -s tests -v
```

Se usan observaciones sintéticas, sin necesitar datasets oficiales ni entrenamiento. Los cambios del contrato se actualizan junto al cliente dentro de este monorepo; los clientes externos que usen `total_delitos` deben migrar a `value`.
