import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, Settings } from '../utils/settings';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setS);
  }, []);

  const toggleTheme = () => {
    const next = s.theme === 'system' ? 'light' : s.theme === 'light' ? 'dark' : 'system';
    const merged = { ...s, theme: next } as Settings;
    setS(merged); saveSettings({ theme: next });
  };
  const cycleRes = () => {
    const next = s.resolution === '720p' ? '1080p' : s.resolution === '1080p' ? '4k' : s.resolution === '4k' ? 'auto' : '720p';
    const merged = { ...s, resolution: next } as Settings;
    setS(merged); saveSettings({ resolution: next });
  };
  const toggleLoc = () => {
    const next = !s.locationTagging; const merged = { ...s, locationTagging: next } as Settings;
    setS(merged); saveSettings({ locationTagging: next });
  };
  const cycleFormat = () => {
    const formats = ['YYYY-MM-DD HH:mm:ss', 'DD/MM/YYYY HH:mm', 'MM-DD HH:mm:ss'];
    const idx = (formats.indexOf(s.timestampFormat) + 1) % formats.length;
    const next = formats[idx];
    const merged = { ...s, timestampFormat: next } as Settings;
    setS(merged); saveSettings({ timestampFormat: next });
  };
  const toggleTimezone = () => {
    const next = s.timezone === 'device' ? 'UTC' : 'device';
    const merged = { ...s, timezone: next } as Settings;
    setS(merged); saveSettings({ timezone: next });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Row label={`Theme: ${s.theme}`} onPress={toggleTheme} />
      <Row label={`Default Mode: ${s.defaultMode}`} disabled />
      <Row label={`Resolution: ${s.resolution}`} onPress={cycleRes} />
      <Row label={`Timestamp: ${s.timestampFormat}`} onPress={cycleFormat} />
      <Row label={`Timezone: ${s.timezone}`} onPress={toggleTimezone} />
      <View style={styles.row}>
        <Text style={styles.label}>Location Tagging</Text>
        <Switch value={s.locationTagging} onValueChange={toggleLoc} />
      </View>
      <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
    </View>
  );
}

function Row({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 16 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  label: { color: 'white' },
  close: { marginTop: 20, backgroundColor: '#333', padding: 12, alignItems: 'center', borderRadius: 8 },
  closeText: { color: 'white', fontWeight: 'bold' },
});


