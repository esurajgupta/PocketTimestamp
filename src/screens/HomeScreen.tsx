import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { listVideos, deleteVideo, StoredVideo } from '../services/videoStorage';
import Icon from 'react-native-vector-icons/MaterialIcons';

function EmptyList() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.empty}>
        No videos yet. Record one to see it here.
      </Text>
    </View>
  );
}

export function HomeScreen({
  onStart,
  onOpenSettings,
}: {
  onStart: () => void;
  onOpenSettings: () => void;
}) {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [player, setPlayer] = useState<{ visible: boolean; path?: string }>({
    visible: false,
  });

  const load = async () => {
    try {
      const items = await listVideos();
      setVideos(items);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (path: string) => {
    await deleteVideo(path);
    await load();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes < 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  };

  const formatDate = (ms: number): string => {
    if (!ms) return '';
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate(),
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    (async () => {
      // generate thumbnails lazily
      for (const v of videos) {
        if (thumbs[v.path] !== undefined) continue;
        try {
          // @ts-ignore - optional dependency; ignore types if not installed
          const mod = await import('react-native-create-thumbnail');
          const fileUrl = `file://${v.path}`;
          const res = await (mod as any).createThumbnail({
            url: fileUrl,
            timeStamp: 1000,
          });
          setThumbs(prev => ({
            ...prev,
            [v.path]: res.path || res.uri || null,
          }));
        } catch {
          setThumbs(prev => ({ ...prev, [v.path]: null }));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  const renderItem = ({ item }: { item: StoredVideo }) => {
    const uri = thumbs[item.path];
    return (
      <View style={styles.card}>
        <View style={styles.thumbWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Icon name="movie" size={28} color="#8ea0b5" />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.cardInfo}
          onPress={() => setPlayer({ visible: true, path: item.path })}
        >
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.name}
          </Text>
          <Text style={styles.cardMeta}>
            {formatBytes(item.size)} • {formatDate(item.modified)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardAction}
          onPress={() =>
            Alert.alert('Delete', 'Remove this video?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDelete(item.path),
              },
            ])
          }
        >
          <Icon name="delete" size={22} color="#ff6666" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PocketTimestamp</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
            <Icon name="settings" size={22} color="#e6edf3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
            <Icon name="refresh" size={22} color="#e6edf3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onStart} style={styles.primaryBtn}>
            <Icon name="videocam" size={18} color="#0b0f14" />
            <Text style={styles.primaryBtnText}>Record</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={videos}
        keyExtractor={item => item.path}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e6edf3"
          />
        }
      />

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
