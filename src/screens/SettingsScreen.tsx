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
  // Static palette (theme removed)
  const colors = {
    background: '#0a0f1e',
    headerBg: '#0a0f1e',
    border: '#142038',
    text: '#e6edf3',
    subtext: '#8ea0b5',
    card: '#11161d',
    cardBorder: '#151c24',
    inputBg: '#0f141a',
    primary: '#0a84ff',
  };

  // const themes = ['System', 'Light', 'Dark'];
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Icon name="check" size={16} color="#0b0f14" />
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Theme Section */}
        {/* <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="palette" size={18} color={colors.subtext} />
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
              Appearance
            </Text>
          </View>
          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Theme
            </Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Picker
                selectedValue={settings.theme}
                onValueChange={value => updateSettings({ theme: value })}
                style={styles.picker}
                dropdownIconColor={colors.subtext}
              >
                {themes.map(theme => (
                  <Picker.Item
                    key={theme}
                    label={theme}
                    value={theme}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View> */}

        {/* Camera Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="videocam" size={18} color={colors.subtext} />
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
              Camera
            </Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Default Mode
            </Text>
            <Text style={[styles.settingValue, { color: colors.subtext }]}>
              Video
            </Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Video Resolution
            </Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Picker
                selectedValue={settings.videoResolution}
                onValueChange={value =>
                  updateSettings({ videoResolution: value })
                }
                style={styles.picker}
                dropdownIconColor={colors.subtext}
              >
                {resolutions.map(res => (
                  <Picker.Item
                    key={res}
                    label={res}
                    value={res}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Timestamp Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="schedule" size={18} color={colors.subtext} />
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
              Timestamp
            </Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Date/Time Format
            </Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Picker
                selectedValue={settings.timestampFormat}
                onValueChange={value =>
                  updateSettings({ timestampFormat: value })
                }
                style={styles.picker}
                dropdownIconColor={colors.subtext}
              >
                {dateFormats.map(format => (
                  <Picker.Item
                    key={format}
                    label={format}
                    value={format}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Timezone
            </Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Picker
                selectedValue={settings.timezone}
                onValueChange={value => updateSettings({ timezone: value })}
                style={styles.picker}
                dropdownIconColor={colors.subtext}
              >
                {timezones.map(tz => (
                  <Picker.Item
                    key={tz}
                    label={tz}
                    value={tz}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="place" size={18} color={colors.subtext} />
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
              Location
            </Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Location Tagging
            </Text>
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
            <Text
              style={[styles.settingDescription, { color: colors.subtext }]}
            >
              When enabled, location coordinates will be stamped on videos
            </Text>
          )}
        </View>

        {/* Storage Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="folder" size={18} color={colors.subtext} />
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
              Storage
            </Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Auto-delete after (days)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
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
          <Text style={[styles.settingDescription, { color: colors.subtext }]}>
            Set to 0 to disable auto-deletion
          </Text>
        </View>
        {/* About Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="info" size={18} color={colors.subtext} />
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
              About
            </Text>
          </View>
          <View style={styles.settingLast}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              App
            </Text>
            <Text style={[styles.settingValue, { color: colors.subtext }]}>
              PocketTimestamp v1.0
            </Text>
          </View>
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
  headerIconBtn: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e6edf3',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0a84ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  saveBtnText: { color: '#0b0f14', fontWeight: '700' },
  content: {
    flex: 1,
  },
  contentContainer: { paddingBottom: 28 },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8ea0b5',
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#151c24',
  },
  settingLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
