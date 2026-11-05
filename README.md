# Supervisión IIoT — Examen práctico

## Escenario

Recibís una aplicación para supervisar tres equipos simulados de una planta. La app contiene un panel híbrido (WebView con HTML embebido), una capa de estado tipo MVVM, persistencia SQLite, lecturas del acelerómetro y una referencia ambiental obtenida mediante una API HTTP (Open-Meteo). El sistema inicia, muestra los equipos y permite generar lecturas con los botones **Simular ciclo** y **Sincronizar API**.

Tu tarea consiste en **incorporar dos funcionalidades solicitadas** y **mejorar al menos dos decisiones técnicas del código existente** sin romper el funcionamiento inicial.

## Puesta en marcha

Requisitos: Node.js `>= 22.13.0` y Expo Go en un dispositivo, o bien un emulador Android/iOS.

```bash
npm install
npm start          # o: npm run android / npm run ios
npm run typecheck  # verificación de tipos (tsc --noEmit)
```

## Estructura del proyecto

| Ruta | Responsabilidad |
| --- | --- |
| `App.tsx`, `index.js` | Punto de entrada de la app. |
| `src/views/PlantScreen.tsx` | Pantalla principal y tarjetas de equipos (vista). |
| `src/viewmodel/usePlantViewModel.ts` | Estado y acciones de la pantalla (capa MVVM). |
| `src/data/localDb.ts` | Conexión SQLite, esquema (`equipment`, `readings`) y consultas. |
| `src/data/plantRepository.ts` | Simulación de ciclos y registro de la referencia ambiental. |
| `src/network/ambientApi.ts` | Cliente HTTP de la API ambiental. |
| `src/components/OverviewWeb.tsx` | Panel HTML embebido en la WebView. |
| `src/domain/types.ts` | Tipos de dominio (`Equipment`, `Reading`, etc.). |

### Comportamiento actual relevante

- **Simular ciclo** registra lecturas con origen `simulación` para P-101 y M-204, incluidos los equipos detenidos. El nodo **A-003** no se simula.
- **Sincronizar API** ejecuta primero un ciclo de simulación (P-101 y M-204) y después registra la temperatura exterior en A-003 con origen `API ambiental`. Si no hay conexión, solo quedan las lecturas simuladas.
- Por lo tanto, A-003 tiene historial solo después de una sincronización exitosa.

## Actividad 1 — Umbrales de alarma editables (30 puntos)

Actualmente el botón **Umbral** no tiene funcionalidad real. Implementá:

- Un formulario o diálogo asociado al **equipo seleccionado** para cambiar su límite de temperatura.
- Validación: número real **mayor que 0 y menor o igual a 150** (se acepta punto o coma como separador decimal). Un dato inválido no debe guardarse y debe informar al usuario.
- Persistencia del nuevo límite en **SQLite**: debe sobrevivir al cierre y reapertura de la app.
- Actualización visible del límite y del estado de alarma. Un equipo se considera en alarma **solo si está activado** y `temperatura >= límite`.
- El panel HTML embebido debe reflejar el nuevo límite y aplicar el mismo criterio de alarma que la vista nativa.

## Actividad 2 — Historial de lecturas por equipo (30 puntos)

Actualmente el botón **Historial** es demostrativo. Implementá:

- Acceso al historial específico del equipo elegido.
- Lectura de los **últimos 10 registros** guardados en SQLite, ordenados del más nuevo al más antiguo.
- Mostrar, para cada registro, **fecha/hora, temperatura y origen**.
- Estado vacío claro si todavía no se registraron lecturas.
- El historial debe incluir las lecturas generadas por **Simular ciclo** y por **Sincronizar API** (ver *Comportamiento actual relevante*) y conservarse al reiniciar la app.

## Actividad 3 — Refactorización argumentada (25 puntos)

Identificá **al menos dos problemas diferentes** en el código existente (diseño, seguridad, asincronismo, manejo de errores, duplicación, testabilidad, responsabilidades u otros). Refactorizá dos de ellos conservando los comportamientos iniciales.

Documentá brevemente cada refactorización en `CAMBIOS.md`:

- problema observado y archivos afectados;
- cambio implementado y motivo;
- cómo verificaste que no rompiste el flujo original.

Se valora la **calidad de las decisiones** más que la cantidad de cambios. No se exige reorganizar por completo el repositorio.

## Actividad 4 — Verificación y entrega (15 puntos)

1. Ejecutar `npm run typecheck` sin errores derivados de los cambios (5 puntos).
2. Demostrar al docente el flujo **umbral + alarma** y el flujo **simulación/sincronización + historial** (8 puntos).
3. Entregar `CAMBIOS.md` completo (funcionalidades, refactorizaciones y, opcionalmente, uso de IA) y el proyecto modificado (2 puntos).

## Restricciones

- No eliminar ni reemplazar la app completa por un proyecto nuevo.
- No quitar el consumo HTTP, el almacenamiento SQLite, la lectura del sensor ni la WebView.
- No convertir la demostración local en control de hardware real.
- Se permite crear componentes, funciones y archivos nuevos.
- Se permite usar IA, pero debés comprender y poder explicar el código entregado; la cátedra puede pedir una breve justificación de las decisiones.
- La referencia HTTP es información ambiental pública; no se presume que sea una medición de planta.
