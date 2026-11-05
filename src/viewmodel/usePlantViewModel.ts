import { useCallback, useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import type { Equipment, SyncMode } from '../domain/types';
import { findEquipment, saveEquipmentState } from '../data/localDb';
import { simulateCycle, syncReference } from '../data/plantRepository';

export function usePlantViewModel() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Cargando equipos locales…');
  const [mode, setMode] = useState<SyncMode>('inicial');
  const [humidity, setHumidity] = useState<number | null>(null);
  const [vibration, setVibration] = useState<number | null>(null);

  const reload = useCallback(async (text: string) => {
    const rows = await findEquipment(text);
    setItems(rows);
  }, []);

  useEffect(() => {
    let alive = true;
    findEquipment('')
      .then((rows) => {
        if (alive) {
          setItems(rows);
          setNotice('Equipos locales listos.');
        }
      })
      .catch((error: unknown) => {
        if (alive) setNotice(`No se pudieron cargar equipos: ${String(error)}`);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: { remove(): void } | undefined;
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (available && active) {
          Accelerometer.setUpdateInterval(1000);
          subscription = Accelerometer.addListener(({ x, y, z }) => {
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            setVibration(Math.round(Math.abs(magnitude - 1) * 100) / 100);
          });
        }
      })
      .catch(() => setVibration(null));
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  const search = async (text: string) => {
    setFilter(text);
    try {
      await reload(text);
      setNotice('Listado actualizado.');
    } catch (error) {
      setNotice(`Error al filtrar: ${String(error)}`);
    }
  };

  const changeEnabled = async (id: string, enabled: boolean) => {
    setItems((current) => current.map((item) =>
      item.id === id ? { ...item, enabled: enabled ? 1 : 0 } : item
    ));
    try {
      await saveEquipmentState(id, enabled);
      setNotice(`Comando local aplicado a ${id}.`);
    } catch (error) {
      setNotice(`Error al guardar el estado: ${String(error)}`);
    }
  };

  const simulate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const all = await findEquipment('');
      await simulateCycle(all);
      await reload(filter);
      setMode('simulado');
      setNotice('Lecturas simuladas registradas en SQLite.');
    } catch (error) {
      setNotice(`No se pudo simular: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const all = await findEquipment('');
      await simulateCycle(all);
      const result = await syncReference();
      setHumidity(result.humidity);
      setMode('sincronizado');
      setNotice('Referencia ambiental recibida por HTTP y guardada.');
    } catch {
      setMode('simulado');
      setNotice('Sin conexión externa. Se registraron lecturas simuladas.');
    } finally {
      try {
        await reload(filter);
      } catch (error) {
        setNotice(`No se pudo actualizar la vista: ${String(error)}`);
      }
      setLoading(false);
    }
  };

  return {
    items, filter, loading, notice, mode, humidity, vibration,
    search, changeEnabled, simulate, sync,
  };
}
