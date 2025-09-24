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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff8c00' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold' },
});


