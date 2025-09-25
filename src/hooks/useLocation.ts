import { useEffect, useRef, useState, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type LocationCoords = { latitude: number; longitude: number } | null;
export type LocationPermission = 'pending' | 'granted' | 'denied';

export function useLocation() {
  const [permission, setPermission] = useState<LocationPermission>('pending');

  const [location, setLocation] = useState<LocationCoords>(null);
  const watchId = useRef<number | null>(null);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const granted =
          results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;
        setPermission(granted ? 'granted' : 'denied');
        return granted;
      } catch (e) {
        setPermission('denied');
        return false;
      }
    } else {
      try {
        // iOS explicit authorization request
        const auth = await (Geolocation as any)?.requestAuthorization?.(
          'whenInUse',
        );
        const granted = auth === 'granted' || auth === true;
        setPermission(granted ? 'granted' : 'denied');
        return granted;
      } catch {
        // Fallback: allow and let first location call prompt
        setPermission('granted');
        return true;
      }
    }
  }, []);

  const startWatching = useCallback(() => {
    // Avoid multiple watches
    if (watchId.current != null) return;

    // Seed with one-time current position
    const getOneTime = () =>
      Geolocation.getCurrentPosition(
        (pos: any) =>
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),

        (_err: any) => {
          // Fallback to browser geolocation if available (e.g., web dev tools)
          const navGeo = (globalThis as any)?.navigator?.geolocation;
          navGeo?.getCurrentPosition?.(
            (npos: any) =>
              setLocation({
                latitude: npos.coords.latitude,
                longitude: npos.coords.longitude,
              }),
            () => {},
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    getOneTime();
    // Retry once after a short delay to warm up providers on some devices
    setTimeout(getOneTime, 1200);

    // Watch updates
    const id = Geolocation.watchPosition(
      (pos: any) =>
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (_err: any) => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        timeout: 20000,
        maximumAge: 0,
      },
    ) as unknown as number;
    watchId.current = id;
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current != null) {
      try {
        Geolocation.clearWatch(watchId.current);
      } catch {}
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    // Do not auto-start; consumer controls when to request and watch
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    permission,
    requestPermission,
    location,
    startWatching,
    stopWatching,
  };
}
