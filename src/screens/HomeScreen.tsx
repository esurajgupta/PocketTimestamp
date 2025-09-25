import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettings } from '../context/SettingsContext';

export function HomeScreen({
  onStart,
  onOpenSettings,
}: {
  onStart: () => void;
  onOpenSettings: () => void;
}) {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();
  const preferred = (settings as any)?.theme || 'System';
  const mode =
    preferred === 'System' ? systemScheme : (preferred || 'Dark').toLowerCase();
  const isDark = mode !== 'light';
  const colors = {
    background: isDark ? '#0b0f14' : '#f5f7fb',
    text: isDark ? '#e6edf3' : '#0b0f14',
    subtext: isDark ? '#8ea0b5' : '#4a5568',
    card: isDark ? '#11161d' : '#ffffff',
    border: isDark ? '#151c24' : '#e4e8ee',
    primary: '#0a84ff',
    overlay: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.15)',
    footer: isDark ? '#e6edf3' : '#556072',
  };

  const [player, setPlayer] = useState<{ visible: boolean; path?: string }>({
    visible: false,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1400&q=60',
        }}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]} />

        <View style={styles.topBar}>
          <Text style={[styles.brand, { color: colors.text }]}>
            PocketTimestamp
          </Text>
          <TouchableOpacity onPress={onOpenSettings} style={styles.topIconBtn}>
            <Icon name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={[styles.tagline, { color: colors.text }]}>
            Capture moments with precise timestamps
          </Text>

          <TouchableOpacity
            onPress={onStart}
            activeOpacity={0.9}
            style={styles.recordCta}
          >
            <View style={styles.recordOuter}>
              <View
                style={[styles.recordInner, { backgroundColor: '#0a84ff' }]}
              >
                <Icon name="videocam" size={28} color="white" />
              </View>
            </View>
            <Text style={[styles.recordLabel, { color: colors.text }]}>
              Start Recording
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.footer }]}>
            v1.0 • Welcome
          </Text>
        </View>
      </ImageBackground>

      {/* Simple modal video player */}
      {player.visible && (
        <View style={styles.playerOverlay}>
          <View style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerTitle}>Preview</Text>
              <TouchableOpacity
                onPress={() => setPlayer({ visible: false })}
                style={styles.iconBtn}
              >
                <Icon name="close" size={22} color="#e6edf3" />
              </TouchableOpacity>
            </View>
            <View style={styles.playerBody}>
              {(() => {
                try {
                  // Lazy require to avoid hard dependency
                  const Video = require('react-native-video').default;
                  return (
                    <Video
                      source={{ uri: `file://${player.path}` }}
                      style={styles.video}
                      controls
                      resizeMode="contain"
                    />
                  );
                } catch {
                  return (
                    <Text style={styles.empty}>
                      Install react-native-video to preview videos.
                    </Text>
                  );
                }
              })()}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  brand: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  topIconBtn: { padding: 10 },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 18,
    textAlign: 'center',
  },
  recordCta: { alignItems: 'center' },
  recordOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordLabel: {
    color: '#ffffff',
    marginTop: 10,
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: { color: '#e6edf3', opacity: 0.7 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#e6edf3',
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginRight: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a84ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  primaryBtnText: { color: '#0b0f14', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11161d',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#151c24',
    marginBottom: 10,
  },
  thumbWrap: {
    width: 86,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0f141a',
    borderWidth: 1,
    borderColor: '#151c24',
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardMeta: { color: '#8ea0b5', fontSize: 12 },
  cardAction: { padding: 8 },
  emptyWrap: { alignItems: 'center', marginTop: 24 },
  empty: { color: '#6b7785' },
  playerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCard: {
    width: '92%',
    maxWidth: 520,
    backgroundColor: '#11161d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#151c24',
    overflow: 'hidden',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#151c24',
  },
  playerTitle: { color: '#e6edf3', fontWeight: '700' },
  playerBody: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0b0f14',
  },
  video: { width: '100%', height: '100%' },
});
