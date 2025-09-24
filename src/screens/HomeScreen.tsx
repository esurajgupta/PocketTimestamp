import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { listVideos, deleteVideo, StoredVideo } from '../services/videoStorage';
import Icon from 'react-native-vector-icons/MaterialIcons';

export function HomeScreen({ onStart }: { onStart: () => void }) {
  const [videos, setVideos] = useState<StoredVideo[]>([]);

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

  const renderItem = ({ item }: { item: StoredVideo }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name="videocam" size={22} color="#fff" />
        <Text style={styles.rowText}>{item.name}</Text>
      </View>
      <TouchableOpacity
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PocketTimestamp</Text>
      <TouchableOpacity onPress={onStart} style={styles.btn}>
        <Text style={styles.btnText}>Start Recording</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Recorded Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={item => item.path}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>
            No videos yet. Record one to see it here.
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  title: { color: 'white', fontSize: 22, marginBottom: 16, fontWeight: 'bold' },
  btn: {
    backgroundColor: '#0a84ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  listTitle: {
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  listContent: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { color: '#fff', marginLeft: 8 },
  sep: { height: 1, backgroundColor: '#333' },
  empty: { color: '#888', marginTop: 12 },
});
