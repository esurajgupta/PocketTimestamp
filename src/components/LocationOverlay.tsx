import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function LocationOverlay({
  timestamp,
  latitude,
  longitude,
}: {
  timestamp: string;
  latitude?: number;
  longitude?: number;
}) {
  console.log('latitude', latitude);
  console.log('longitude', longitude);
  return (
    <View style={styles.wrap}>
      <Text style={styles.time}>{timestamp}</Text>
      {latitude != null && longitude != null ? (
        <Text style={styles.location}>
          Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  time: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  location: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});


