import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function LocationOverlay({
  timestamp,
  latitude,
  longitude,
  enabled = true,
}: {
  timestamp: string;
  latitude?: number;
  longitude?: number;
  enabled?: boolean;
}) {
  const isValidNumber = (n: unknown) => typeof n === 'number' && isFinite(n as number);
  const withinRange = (lat?: number, lon?: number) =>
    isValidNumber(lat) && isValidNumber(lon) && lat! >= -90 && lat! <= 90 && lon! >= -180 && lon! <= 180;

  const showCoords = enabled && withinRange(latitude, longitude);

  return (
    <View style={styles.wrap}>
      <Text style={styles.time}>{timestamp}</Text>
      {showCoords ? (
        <Text style={styles.location}>
          {`Lat: ${(latitude as number).toFixed(6)}, Lon: ${(longitude as number).toFixed(6)}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    bottom: 200,
    backgroundColor: 'rgba(17,22,29,0.6)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#151c24',
  },
  time: {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  location: {
    color: '#c3c7cf',
    fontSize: 12,
    marginTop: 6,
  },
  locationMuted: {
    color: '#6b7785',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
});


