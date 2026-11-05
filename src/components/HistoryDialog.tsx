import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Reading } from '../domain/types';

const C = {
  bg: '#F2F6FC', ink: '#14233E', muted: '#687990', blue: '#2365C7',
  border: '#DFE7F2', white: '#FFFFFF', red: '#C45639',
};

type Status = 'loading' | 'ready' | 'error';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('es-AR');
}

export function HistoryDialog({ equipment, loadHistory, onClose }: {
  equipment: { id: string; name: string } | null;
  loadHistory: (id: string) => Promise<Reading[]>;
  onClose: () => void;
}) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const equipmentId = equipment?.id ?? null;

  const load = useCallback(async (id: string) => {
    const current = ++requestId.current;
    setStatus('loading');
    setError('');
    try {
      const rows = await loadHistory(id);
      if (current !== requestId.current) return;
      setReadings(rows);
      setStatus('ready');
    } catch (err) {
      if (current !== requestId.current) return;
      setReadings([]);
      setError(String(err));
      setStatus('error');
    }
  }, [loadHistory]);

  useEffect(() => {
    if (equipmentId) {
      void load(equipmentId);
    } else {
      // Invalida respuestas pendientes y limpia el estado al cerrar.
      requestId.current++;
      setReadings([]);
      setStatus('loading');
    }
  }, [equipmentId, load]);

  return (
    <Modal visible={equipment !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.overline}>HISTORIAL · {equipment?.id ?? ''}</Text>
          <Text style={styles.title}>{equipment?.name ?? ''}</Text>
          <Text style={styles.subtitle}>Últimas 10 lecturas, de la más reciente a la más antigua.</Text>

          <View style={styles.body}>
            {status === 'loading' && (
              <View style={styles.center}>
                <ActivityIndicator color={C.blue} />
                <Text style={styles.muted}>Cargando lecturas…</Text>
              </View>
            )}
            {status === 'error' && (
              <View style={styles.center}>
                <Text style={styles.errorText}>No se pudo leer el historial: {error}</Text>
                <Pressable onPress={() => { if (equipmentId) void load(equipmentId); }} style={styles.retryButton}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </Pressable>
              </View>
            )}
            {status === 'ready' && readings.length === 0 && (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Sin lecturas registradas</Text>
                <Text style={styles.muted}>
                  Usá «Simular ciclo» o «Sincronizar API» para generar lecturas. El nodo ambiental A-003 solo
                  recibe lecturas cuando la sincronización con la API es exitosa.
                </Text>
              </View>
            )}
            {status === 'ready' && readings.length > 0 && (
              <ScrollView style={styles.list}>
                {readings.map((reading, index) => (
                  <View key={reading.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.date}>{formatDate(reading.createdAt)}</Text>
                      <Text style={styles.source}>{reading.source}</Text>
                    </View>
                    <Text style={styles.temp}>{reading.temperature.toFixed(1)} °C</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20, 35, 62, 0.45)', justifyContent: 'center', padding: 18 },
  card: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18, gap: 6, maxHeight: '85%' },
  overline: { fontSize: 10, fontWeight: '900', color: C.blue, letterSpacing: 0.3 },
  title: { fontSize: 18, fontWeight: '800', color: C.ink },
  subtitle: { fontSize: 11, color: C.muted },
  body: { marginTop: 8, minHeight: 90, flexShrink: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  muted: { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: C.ink },
  errorText: { fontSize: 12, color: C.red, textAlign: 'center' },
  list: { borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.bg },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border },
  date: { fontSize: 12, fontWeight: '700', color: C.ink },
  source: { fontSize: 11, color: C.muted, marginTop: 2 },
  temp: { fontSize: 15, fontWeight: '800', color: C.ink },
  retryButton: { borderRadius: 7, backgroundColor: '#EAF1FB', paddingHorizontal: 12, paddingVertical: 7 },
  retryText: { fontSize: 11, color: C.blue, fontWeight: '800' },
  closeButton: { marginTop: 12, backgroundColor: C.blue, borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
