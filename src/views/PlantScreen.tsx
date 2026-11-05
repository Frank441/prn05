import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OverviewWeb } from '../components/OverviewWeb';
import type { Equipment } from '../domain/types';
import { usePlantViewModel } from '../viewmodel/usePlantViewModel';

const C = {
  bg: '#F2F6FC', ink: '#14233E', muted: '#687990', navy: '#162D50',
  blue: '#2365C7', white: '#FFFFFF', border: '#DFE7F2', green: '#16815B', red: '#C45639',
};

function round(v: number): string {
  return `${v.toFixed(1)} °C`;
}

function EquipmentCard({ item, onToggle }: {
  item: Equipment;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const alarm = item.enabled === 1 && item.temperature >= item.maxTemp;
  return (
    <View style={styles.equipmentCard}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.machineId}>{item.id} · {item.area.toUpperCase()}</Text>
          <Text style={styles.machineName}>{item.name}</Text>
        </View>
        <Switch value={item.enabled === 1} onValueChange={(value) => onToggle(item.id, value)}
          trackColor={{ false: '#BCC7D5', true: '#6EA6E8' }} thumbColor={item.enabled ? C.blue : '#FFF'} />
      </View>
      <View style={styles.cardMetrics}>
        <View>
          <Text style={styles.miniLabel}>TEMPERATURA</Text>
          <Text style={styles.measure}>{round(item.temperature)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.miniLabel}>LÍMITE OPERATIVO</Text>
          <Text style={styles.measureSmall}>{round(item.maxTemp)}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={[styles.pill, { backgroundColor: alarm ? '#FDEDE8' : item.enabled ? '#E5F6ED' : '#EBEFF4' }]}>
          <Text style={{ color: alarm ? C.red : item.enabled ? C.green : C.muted, fontWeight: '700', fontSize: 11 }}>
            {alarm ? '● ALARMA' : item.enabled ? '● OPERATIVO' : '○ DETENIDO'}
          </Text>
        </View>
        <Pressable onPress={() => Alert.alert('Configuración', 'A implementar en el examen.')}
          style={styles.inlineButton}><Text style={styles.inlineButtonText}>Umbral</Text></Pressable>
        <Pressable onPress={() => Alert.alert('Historial', 'A implementar en el examen.')}
          style={styles.inlineButton}><Text style={styles.inlineButtonText}>Historial</Text></Pressable>
      </View>
    </View>
  );
}

export function PlantScreen() {
  const vm = usePlantViewModel();
  const active = vm.items.filter((device) => device.enabled === 1).length;
  const alarms = vm.items.filter((device) => device.enabled === 1 && device.temperature >= device.maxTemp).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.brandMark}><Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Ⅱ</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>LABORATORIO DE AUTOMATIZACIÓN</Text>
            <Text style={styles.title}>Supervisión IIoT</Text>
          </View>
          <View style={styles.liveDot} />
        </View>
        <Text style={styles.description}>Control local de equipos simulados y monitoreo ambiental de referencia.</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{vm.items.length}</Text><Text style={styles.statLabel}>Visibles</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{active}</Text><Text style={styles.statLabel}>En marcha</Text></View>
          <View style={styles.stat}><Text style={[styles.statValue, { color: alarms ? C.red : C.ink }]}>{alarms}</Text><Text style={styles.statLabel}>Alarmas</Text></View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{vm.notice}</Text>
          <Text style={styles.mode}>{vm.mode === 'sincronizado' ? 'API OK' : vm.mode === 'simulado' ? 'MODO LOCAL' : 'INICIO'}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable disabled={vm.loading} onPress={() => void vm.sync()} style={[styles.primaryButton, vm.loading && styles.disabled]}>
            {vm.loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryText}>Sincronizar API</Text>}
          </Pressable>
          <Pressable disabled={vm.loading} onPress={() => void vm.simulate()} style={[styles.secondaryButton, vm.loading && styles.disabled]}>
            <Text style={styles.secondaryText}>Simular ciclo</Text>
          </Pressable>
        </View>

        <OverviewWeb items={vm.items} onRefresh={() => void vm.sync()} />
        <View style={styles.telemetryRow}>
          <View style={styles.sensorStat}><Text style={styles.miniLabel}>ACELERÓMETRO LOCAL</Text><Text style={styles.sensorValue}>{vm.vibration === null ? 'No disponible' : `${vm.vibration.toFixed(2)} g Δ`}</Text></View>
          <View style={styles.sensorStat}><Text style={styles.miniLabel}>HUMEDAD EXTERIOR API</Text><Text style={styles.sensorValue}>{vm.humidity === null ? 'Sin lectura' : `${vm.humidity.toFixed(0)} %`}</Text></View>
        </View>

        <Text style={styles.sectionLabel}>EQUIPOS DE PLANTA</Text>
        <TextInput
          style={styles.search}
          value={vm.filter}
          onChangeText={(text) => void vm.search(text)}
          placeholder="Buscar por código o nombre"
          placeholderTextColor="#8C9CB0"
          autoCapitalize="none"
          returnKeyType="search"
        />
        {vm.items.map((item) => <EquipmentCard key={item.id} item={item} onToggle={(id, enabled) => void vm.changeEnabled(id, enabled)} />)}
        {!vm.items.length && <Text style={styles.empty}>No se encontraron equipos.</Text>}
        <Text style={styles.footnote}>Entorno académico. Los equipos y comandos son simulados; la API externa aporta una referencia climática, no telemetría de una planta real.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 32, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  overline: { fontSize: 9, fontWeight: '800', color: C.blue, letterSpacing: 1.2 },
  title: { fontSize: 25, fontWeight: '800', color: C.ink, letterSpacing: -0.9 },
  liveDot: { width: 10, height: 10, backgroundColor: '#3BBF94', borderRadius: 50 },
  description: { color: C.muted, lineHeight: 19, fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: 13 },
  statValue: { fontSize: 24, fontWeight: '800', color: C.ink },
  statLabel: { fontSize: 11, color: C.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusText: { fontSize: 11, color: C.muted, flex: 1 },
  mode: { fontSize: 10, fontWeight: '800', color: C.blue },
  buttonRow: { flexDirection: 'row', gap: 9 },
  primaryButton: { flex: 1, backgroundColor: C.blue, borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { flex: 1, backgroundColor: '#DDE9F8', borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  primaryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  secondaryText: { color: C.navy, fontSize: 13, fontWeight: '800' },
  telemetryRow: { flexDirection: 'row', gap: 9 },
  sensorStat: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#EAF1FB' },
  miniLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: C.muted },
  sensorValue: { color: C.navy, fontSize: 14, fontWeight: '800', marginTop: 5 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: C.navy, marginTop: 8 },
  search: { borderWidth: 1, borderColor: '#CCD9E9', borderRadius: 11, height: 46, backgroundColor: '#FFF', paddingHorizontal: 14, color: C.ink, fontSize: 14 },
  equipmentCard: { borderWidth: 1, borderColor: C.border, padding: 15, borderRadius: 15, backgroundColor: '#FFF', gap: 15 },
  cardTop: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  machineId: { fontSize: 10, fontWeight: '900', color: C.blue, letterSpacing: 0.3 },
  machineName: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  cardMetrics: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  measure: { fontSize: 22, color: C.ink, fontWeight: '800', marginTop: 5 },
  measureSmall: { fontSize: 16, color: C.ink, fontWeight: '700', marginTop: 5 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  pill: { borderRadius: 30, paddingVertical: 7, paddingHorizontal: 9 },
  inlineButton: { borderRadius: 7, backgroundColor: '#EAF1FB', paddingHorizontal: 10, paddingVertical: 7 },
  inlineButtonText: { fontSize: 11, color: C.blue, fontWeight: '800' },
  empty: { textAlign: 'center', color: C.muted, margin: 20 },
  footnote: { marginTop: 4, fontSize: 10, lineHeight: 16, color: C.muted },
});
