// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
// import { loadSettings, saveSettings, DEFAULT_SETTINGS, Settings } from '../utils/settings';

// export function SettingsScreen({ onClose }: { onClose: () => void }) {
//   const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

//   useEffect(() => {
//     loadSettings().then(setS);
//   }, []);

//   const toggleTheme = () => {
//     const next = s.theme === 'system' ? 'light' : s.theme === 'light' ? 'dark' : 'system';
//     const merged = { ...s, theme: next } as Settings;
//     setS(merged); saveSettings({ theme: next });
//   };
//   const cycleRes = () => {
//     const next = s.resolution === '720p' ? '1080p' : s.resolution === '1080p' ? '4k' : s.resolution === '4k' ? 'auto' : '720p';
//     const merged = { ...s, resolution: next } as Settings;
//     setS(merged); saveSettings({ resolution: next });
//   };
//   const toggleLoc = () => {
//     const next = !s.locationTagging; const merged = { ...s, locationTagging: next } as Settings;
//     setS(merged); saveSettings({ locationTagging: next });
//   };
//   const cycleFormat = () => {
//     const formats = ['YYYY-MM-DD HH:mm:ss', 'DD/MM/YYYY HH:mm', 'MM-DD HH:mm:ss'];
//     const idx = (formats.indexOf(s.timestampFormat) + 1) % formats.length;
//     const next = formats[idx];
//     const merged = { ...s, timestampFormat: next } as Settings;
//     setS(merged); saveSettings({ timestampFormat: next });
//   };
//   const toggleTimezone = () => {
//     const next = s.timezone === 'device' ? 'UTC' : 'device';
//     const merged = { ...s, timezone: next } as Settings;
//     setS(merged); saveSettings({ timezone: next });
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Settings</Text>
//       <Row label={`Theme: ${s.theme}`} onPress={toggleTheme} />
//       <Row label={`Default Mode: ${s.defaultMode}`} disabled />
//       <Row label={`Resolution: ${s.resolution}`} onPress={cycleRes} />
//       <Row label={`Timestamp: ${s.timestampFormat}`} onPress={cycleFormat} />
//       <Row label={`Timezone: ${s.timezone}`} onPress={toggleTimezone} />
//       <View style={styles.row}>
//         <Text style={styles.label}>Location Tagging</Text>
//         <Switch value={s.locationTagging} onValueChange={toggleLoc} />
//       </View>
//       <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
//     </View>
//   );
// }

// function Row({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
//   return (
//     <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.row}>
//       <Text style={styles.label}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'black', padding: 16 },
//   title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
//   row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
//   label: { color: 'white' },
//   close: { marginTop: 20, backgroundColor: '#333', padding: 12, alignItems: 'center', borderRadius: 8 },
//   closeText: { color: 'white', fontWeight: 'bold' },
// });

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { Picker } from '@react-native-picker/picker';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();

  const themes = ['System', 'Light', 'Dark'];
  const resolutions = ['720p', '1080p', '4K', 'Auto'];
  const timezones = [
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Asia/Kolkata',
  ];
  const dateFormats = [
    'YYYY-MM-DD HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'MM/DD/YYYY hh:mm:ss A',
    'DD MMM YYYY HH:mm',
  ];

  const handleSave = () => {
    Alert.alert('Success', 'Settings saved successfully');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Theme</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={settings.theme}
                onValueChange={value => updateSettings({ theme: value })}
                style={styles.picker}
                dropdownIconColor="#b8c1cc"
              >
                {themes.map(theme => (
                  <Picker.Item key={theme} label={theme} value={theme} color="#e6edf3" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Camera Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Camera</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Default Mode</Text>
            <Text style={styles.settingValue}>Video</Text>
          </View>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Video Resolution</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={settings.videoResolution}
                onValueChange={value =>
                  updateSettings({ videoResolution: value })
                }
                style={styles.picker}
                dropdownIconColor="#b8c1cc"
              >
                {resolutions.map(res => (
                  <Picker.Item key={res} label={res} value={res} color="#e6edf3" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Timestamp Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamp</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Date/Time Format</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={settings.timestampFormat}
                onValueChange={value =>
                  updateSettings({ timestampFormat: value })
                }
                style={styles.picker}
                dropdownIconColor="#b8c1cc"
              >
                {dateFormats.map(format => (
                  <Picker.Item key={format} label={format} value={format} color="#e6edf3" />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Timezone</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={settings.timezone}
                onValueChange={value => updateSettings({ timezone: value })}
                style={styles.picker}
                dropdownIconColor="#b8c1cc"
              >
                {timezones.map(tz => (
                  <Picker.Item key={tz} label={tz} value={tz} color="#e6edf3" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Location Tagging</Text>
            <Switch
              value={settings.locationTagging}
              onValueChange={value =>
                updateSettings({ locationTagging: value })
              }
              trackColor={{ false: '#2a323c', true: '#0a84ff' }}
              thumbColor={settings.locationTagging ? '#e6edf3' : '#c3c7cf'}
            />
          </View>

          {settings.locationTagging && (
            <Text style={styles.settingDescription}>
              When enabled, location coordinates will be stamped on videos
            </Text>
          )}
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Auto-delete after (days)</Text>
            <TextInput
              style={styles.input}
              value={settings.autoDeleteDays?.toString() || '0'}
              onChangeText={text => {
                const days = parseInt(text, 10) || 0;
                updateSettings({ autoDeleteDays: days });
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#6b7785"
            />
          </View>
          <Text style={styles.settingDescription}>
            Set to 0 to disable auto-deletion
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#0b0f14',
    borderBottomWidth: 0.5,
    borderBottomColor: '#141b22',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e6edf3',
  },
  saveButton: {
    color: '#0a84ff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#11161d',
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#151c24',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8ea0b5',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#151c24',
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
    color: '#e6edf3',
  },
  settingValue: {
    fontSize: 16,
    color: '#9fb2c9',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7785',
    marginTop: 5,
  },
  pickerContainer: {
    flex: 1,
    maxWidth: 150,
    backgroundColor: '#0f141a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#151c24',
  },
  picker: {
    height: 50,
    color: '#e6edf3',
  },
  input: {
    borderWidth: 1,
    borderColor: '#151c24',
    backgroundColor: '#0f141a',
    color: '#e6edf3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: 100,
    textAlign: 'center',
  },
});

export default SettingsScreen;
