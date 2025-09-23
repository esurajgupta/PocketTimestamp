import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1200);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PocketTimestamp</Text>
      <Text style={styles.subtitle}>Preparing camera...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#aaa', marginTop: 8 },
});


