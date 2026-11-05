# Cambios y validación

## Funcionalidad 1 — Umbral

- Cambios realizados:
  - `src/domain/threshold.ts` (nuevo):
    - `parseThreshold(texto)` valida el límite: número real mayor que 0 y menor o igual a 150.
      - Acepta punto o coma decimal (`65.5`, `65,5`).
      - Rechaza vacío, texto, notación científica (`1e2`) y valores mezclados (`12abc`).
      - Devuelve el valor o un mensaje de error, sin lanzar excepciones.
    - `isInAlarm(equipo)` es la **única** definición del criterio de alarma: activado y `temperatura >= límite`.
  - `src/data/localDb.ts`: agregué `saveMaxTemp(id, límite)`.
    - Hace un `UPDATE` parametrizado de `max_temp`.
    - Falla si no modificó exactamente una fila.
  - `src/viewmodel/usePlantViewModel.ts`: agregué `changeThreshold(id, texto)`.
    - Valida, persiste y recién después actualiza el estado y el aviso.
    - Si algo falla, devuelve el error al diálogo y no modifica la vista: la pantalla nunca muestra un límite que no quedó guardado en SQLite.
  - `src/components/ThresholdDialog.tsx` (nuevo): un `Modal` multiplataforma (`Alert.prompt` solo existe en iOS).
    - Teclado decimal y valor actual precargado.
    - Error en línea, sin cerrar el diálogo, y estado "guardando".
    - Cierre con el botón atrás de Android.
  - `src/views/PlantScreen.tsx`:
    - El botón **Umbral** abre el diálogo del equipo de esa tarjeta.
    - Se guarda el *id* seleccionado, no una copia del objeto, para que el diálogo use siempre los datos vigentes.
    - La tarjeta y el contador de alarmas usan `isInAlarm`.
  - `src/components/OverviewWeb.tsx`:
    - El panel HTML recibe `alarm` ya calculado con `isInAlarm`, en lugar de recalcular `temperatura >= límite` sin mirar si el equipo está activado (antes un equipo detenido aparecía "caliente" en el panel y no en la tarjeta).
    - Ahora también muestra el límite (`46.8°/65°`).
- Verificación:
  - Prueba de `parseThreshold` con Node: `65`, `65,5`, `65.5`, ` 70 `, `150` → válidos. `150.01`, `0`, `-3`, vacío, `abc`, `12abc`, `1e2`, `65,5,1`, `Infinity` → rechazados con mensaje.
  - Prueba de `isInAlarm`: activado con 65/65 → alarma; detenido con 90/65 → sin alarma; activado con 64,9/65 → sin alarma.
  - En la app:
    1. Bajar el límite de P-101 por debajo de su temperatura: tarjeta en **ALARMA**, contador en 1 y barra naranja en el panel HTML.
    2. Apagar P-101: desaparece la alarma en la tarjeta, en el contador y en el panel.
    3. Ingresar `200` o `abc`: aparece el error y el valor no se guarda.
    4. Cerrar y reabrir la app: el límite se conserva.

## Funcionalidad 2 — Historial

- Cambios realizados:
  - `src/data/localDb.ts`: agregué `getRecentReadings(equipo, 10)`.
    - Consulta parametrizada sobre `readings`, con `ORDER BY created_at DESC, id DESC LIMIT ?`.
    - `id` desempata las lecturas con el mismo timestamp.
    - Mapea las filas al tipo de dominio `Reading`, así la vista no conoce el esquema SQL.
  - `src/viewmodel/usePlantViewModel.ts`: expone `loadHistory(id)` con `useCallback` (referencia estable, sin recargas innecesarias). La vista solo habla con el ViewModel.
  - `src/components/HistoryDialog.tsx` (nuevo): un `Modal` que consulta cada vez que se abre.
    - Estados de carga, error (con "Reintentar"), vacío y lista.
    - Por cada lectura muestra fecha/hora (`es-AR`), temperatura con 1 decimal y origen (`simulación` / `API ambiental`).
    - Un contador de peticiones descarta respuestas viejas si se cierra o se cambia de equipo durante la consulta.
    - El estado vacío aclara que A-003 solo recibe lecturas al sincronizar con éxito con la API.
  - `src/views/PlantScreen.tsx`: el botón **Historial** abre el diálogo del equipo de esa tarjeta.
  - No hizo falta tocar `recordReading`: *Simular ciclo* y *Sincronizar API* ya guardaban en SQLite, así que el historial persiste al reiniciar.
- Verificación:
  1. Con la base nueva, el historial muestra el estado vacío.
  2. Varios **Simular ciclo** → P-101 y M-204 muestran lecturas `simulación`, de la más nueva a la más vieja.
  3. **Sincronizar API** con red → A-003 muestra una lectura `API ambiental`.
  4. Con más de 10 lecturas se ven solo las 10 últimas.
  5. Al reiniciar la app el historial se conserva.

## Refactorización A

- Problema: **inyección SQL en la búsqueda** (`src/data/localDb.ts`, `findEquipment`).
  - El texto del buscador se interpolaba dentro del SQL (`LIKE '%${filtro}%'`).
  - Una comilla (`'`) rompía la consulta ("Error al filtrar").
  - `' OR 1=1 --` alteraba la consulta.
  - `%` y `_` funcionaban como comodines y devolvían todo.
- Solución: consulta parametrizada (`LIKE ? ESCAPE '\'`).
  - El patrón `%texto%` se pasa como parámetro.
  - Antes se escapan `\`, `%` y `_` para que se busquen literalmente.
  - Se conserva el comportamiento: `trim`, sin filtro = todos, búsqueda por nombre o id, `ORDER BY id ASC` y la misma firma.
  - Motivo: el texto del usuario nunca se interpreta como SQL.
- Evidencia:
  - Buscador vacío → 3 equipos.
  - `P-1` → P-101; `motor` → M-204; `  P-1  ` → P-101.
  - `'`, `' OR 1=1 --`, `%` y `_` → lista vacía sin error (antes: error o todos los equipos).
  - Al borrar el texto vuelven los 3 equipos.

## Refactorización B

- Problema: **manejo de errores engañoso en la sincronización** (`src/viewmodel/usePlantViewModel.ts`, `sync`).
  - Un único `try/catch` envolvía la simulación local (SQLite) y la consulta HTTP.
  - El `catch` descartaba el error y siempre decía *"Sin conexión externa. Se registraron lecturas simuladas."*, incluso cuando fallaba la base de datos y no se había registrado nada.
- Solución: separé las dos fases, cada una con su propio `try/catch`.
  - Si falla la simulación, se informa el error real y no se llama a la API.
  - Si solo falla la API, se mantiene el comportamiento anterior (modo `simulado`) y ahora el aviso incluye el motivo.
  - La función `describeError` distingue *tiempo de espera agotado*, *sin red*, *HTTP &lt;código&gt;* y otros errores.
  - El `finally` (recarga con filtro y `setLoading(false)`) quedó igual.
  - Motivo: el mensaje al usuario tiene que ser verdadero y conservar la causa.
- Evidencia:
  - Con red → humedad, "API OK" y el mismo mensaje que antes.
  - Sin red → "MODO LOCAL" con *"Sin conexión externa (sin red)…"*, y P-101/M-204 sí cambian de temperatura.
  - Un filtro activo se mantiene después de sincronizar.
  - El doble toque sigue bloqueado por `loading`.
  - `npm run typecheck` no muestra errores nuevos (ver nota).

## Nota sobre `npm run typecheck`

Queda un único error, `TS2769` en `<StatusBar ... backgroundColor>` de `PlantScreen.tsx`. Ya estaba en el código original (verificado ejecutando el typecheck sin los cambios): no deriva de estas modificaciones.

## Uso de IA (opcional)

- Herramienta utilizada: Claude Code (Anthropic).
- Qué acepté, revisé o corregí: _completar por el alumno._
