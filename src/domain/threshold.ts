import type { Equipment } from './types';

export const MIN_THRESHOLD_EXCLUSIVE = 0;
export const MAX_THRESHOLD = 150;

export type ThresholdParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

// Número decimal simple: acepta punto o coma ("65.5", "65,5", ",5"); rechaza
// notación científica, unidades, espacios intermedios y texto mezclado.
const DECIMAL_PATTERN = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

export function parseThreshold(text: string): ThresholdParseResult {
  const raw = text.trim();
  if (!raw) {
    return { ok: false, error: 'Ingresá un valor para el límite.' };
  }
  if (!DECIMAL_PATTERN.test(raw)) {
    return { ok: false, error: 'El límite debe ser un número (por ejemplo 65 o 65,5).' };
  }
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'El límite debe ser un número válido.' };
  }
  if (value <= MIN_THRESHOLD_EXCLUSIVE || value > MAX_THRESHOLD) {
    return {
      ok: false,
      error: `El límite debe ser mayor que ${MIN_THRESHOLD_EXCLUSIVE} y menor o igual a ${MAX_THRESHOLD} °C.`,
    };
  }
  return { ok: true, value };
}

// Única definición del criterio de alarma: equipo activado y temperatura >= límite.
export function isInAlarm(item: Pick<Equipment, 'enabled' | 'temperature' | 'maxTemp'>): boolean {
  return item.enabled === 1 && item.temperature >= item.maxTemp;
}
