import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Equipment } from '../domain/types';
import { MAX_THRESHOLD } from '../domain/threshold';

type Props = {
  equipment: Equipment;
  // Devuelve null si se guardó, o el mensaje de error a mostrar.
  onSave: (id: string, text: string) => Promise<string | null>;
  onClose: () => void;
};

// Se monta solo mientras hay un equipo seleccionado, así cada apertura arranca
// con el valor vigente y sin errores previos.
export function ThresholdDialog({ equipment, onSave, onClose }: Props) {
  const [text, setText] = useState(String(equipment.maxTemp).replace('.', ','));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    const result = await onSave(equipment.id, text);
    setSaving(false);
    if (result) {
      setError(result);
    } else {
      onClose();
    }
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.overline}>{equipment.id} · LÍMITE DE TEMPERATURA</Text>
          <Text style={styles.title}>{equipment.name}</Text>
          <Text style={styles.help}>
            Valor actual: {equipment.maxTemp.toFixed(1)} °C. Ingresá un número mayor que 0 y
            menor o igual a {MAX_THRESHOLD}.
          </Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={text}
            onChangeText={(value) => {
              setText(value);
              setError(null);
            }}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
            accessibilityLabel="Nuevo límite de temperatura en grados Celsius"
          />
          {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={saving} style={styles.secondary}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={() => void submit()} disabled={saving}
              style={[styles.primary, saving && { opacity: 0.6 }]}>
              {saving
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.primaryText}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,35,62,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, gap: 10 },
  overline: { fontSize: 10, fontWeight: '900', color: '#2365C7', letterSpacing: 0.3 },
  title: { fontSize: 17, fontWeight: '800', color: '#14233E' },
  help: { fontSize: 12, color: '#687990', lineHeight: 17 },
  input: {
    borderWidth: 1, borderColor: '#CCD9E9', borderRadius: 11, height: 46,
    paddingHorizontal: 14, fontSize: 16, color: '#14233E',
  },
  inputError: { borderColor: '#C45639' },
  error: { color: '#C45639', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 4 },
  secondary: { borderRadius: 10, backgroundColor: '#EAF1FB', paddingHorizontal: 16, height: 40, justifyContent: 'center' },
  secondaryText: { color: '#162D50', fontWeight: '800', fontSize: 13 },
  primary: { borderRadius: 10, backgroundColor: '#2365C7', paddingHorizontal: 18, height: 40, justifyContent: 'center', minWidth: 90, alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
});
