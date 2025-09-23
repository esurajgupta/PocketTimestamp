import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PocketTimestamp</Text>
      <TouchableOpacity onPress={onStart} style={styles.btn}>
        <Text style={styles.btnText}>Start Recording</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
  title: { color: 'white', fontSize: 22, marginBottom: 24, fontWeight: 'bold' },
  btn: { backgroundColor: '#0a84ff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
});


