import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
let Geolocation: any = null;
try {
  Geolocation = require('react-native-geolocation-service');
} catch {}
import { PermissionsAndroid } from 'react-native';
let RNFS: any;
try {
  RNFS = require('react-native-fs');
} catch {}
import { ensureAppDir } from '../utils/storage';
import { burnOverlay } from '../utils/ffmpegOverlay';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, formatNow } from '../utils/settings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reverseGeocode } from '../utils/geocode';

// NOTE: We reference vision-camera types, but avoid direct import if not installed.
// We'll type as any to keep compilation flexible in this scaffold.
let Camera: any = View;
let useCameraDevice: any = () => undefined;
try {
   
  const vision = require('react-native-vision-camera');
  Camera = vision.Camera;
  useCameraDevice = vision.useCameraDevice;
} catch (e) {
  // Library not installed yet; show placeholder UI
}

type Resolution = '720p' | '1080p' | '4k' | 'auto';

export function CameraScreen({ onOpenSettings, autoStart, onClose }: { onOpenSettings?: () => void; autoStart?: boolean; onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice?.('back');
  const cameraRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [locEnabled, setLocEnabled] = useState<boolean>(false);
  const [timestampFormat, setTimestampFormat] = useState<string>(DEFAULT_SETTINGS.timestampFormat);
  const [timezone, setTimezone] = useState<'device' | 'UTC'>(DEFAULT_SETTINGS.timezone);
  const [_tick, setTick] = useState<number>(0);
  const [address, setAddress] = useState<string>('');

  const format = useMemo(() => {
    if (!device?.formats) return undefined;
    const formats = device.formats as any[];
    const pick = (height: number) =>
      formats.find((f: any) => Math.max(f.videoHeight, f.videoWidth) >= height);
    if (resolution === '4k') return pick(3840);
    if (resolution === '1080p') return pick(1920);
    if (resolution === '720p') return pick(1280);
    return formats[0];
  }, [device, resolution]);

  const requestPermissions = useCallback(async () => {
    try {
      const vision = require('react-native-vision-camera');
      await vision.Camera.requestCameraPermission();
      await vision.Camera.requestMicrophonePermission();
      // ignore results here; UI will render placeholder if denied
    } catch {}
    // Location permission
    try {
      if (Platform.OS === 'android') {
        const fine = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        const coarse = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        );
        const ok =
          fine === PermissionsAndroid.RESULTS.GRANTED ||
          coarse === PermissionsAndroid.RESULTS.GRANTED;
        setLocEnabled(ok);
      } else {
        setLocEnabled(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    requestPermissions();
    loadSettings().then(s => {
      setTimestampFormat(s.timestampFormat);
      setLocEnabled(s.locationTagging);
      setResolution(s.resolution as Resolution);
      setTimezone(s.timezone as 'device' | 'UTC');
    });
  }, [requestPermissions]);

  useEffect(() => {
    if (!locEnabled) return;
    const geo: any = Geolocation ?? (globalThis as any)?.navigator?.geolocation;
    if (!geo) return;
    // Seed with a one-time high-accuracy fix
    geo.getCurrentPosition?.(
      (pos: any) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (_err: any) => {},
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
    if (!geo.watchPosition) return;
    const watchId = geo.watchPosition(
      (pos: any) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (_err: any) => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 2000,
        fastestInterval: 1000,
        // Specific to react-native-geolocation-service on Android
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
    return () => {
      try { geo.clearWatch?.(watchId); } catch {}
      try { geo.stopObserving?.(); } catch {}
    };
  }, [locEnabled]);

  // Reverse geocode whenever location changes
  useEffect(() => {
    (async () => {
      if (!location) return;
      const res = await reverseGeocode(location.lat, location.lon);
      setAddress(res?.displayName ?? '');
    })();
  }, [location]);

  // Update overlay text every second while recording
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const bottomLeftOverlayText = useMemo(() => {
    const parts: string[] = [];
    if (address) parts.push(address);
    parts.push(`${formatNow(timestampFormat, timezone)}`);
    if (location) {
      parts.push(`Latitude: ${location.lat.toFixed(6)}`);
      parts.push(`Longitude: ${location.lon.toFixed(6)}`);
    }
    return parts.join('\n');
  }, [address, timestampFormat, timezone, location]);

  const onToggleRecord = useCallback(async () => {
    if (!cameraRef.current || !Camera || !cameraRef.current.startRecording)
      return;
    if (isRecording) {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      if (onClose) onClose();
      return;
    }

    setIsRecording(true);
    const videoBitrate =
      resolution === '720p'
        ? 3_000_000
        : resolution === '1080p'
        ? 5_000_000
        : 12_000_000;
    await cameraRef.current.startRecording({
      flash: 'off',
      onRecordingFinished: (video: any) => {
        setIsRecording(false);
        (async () => {
          const dir = await ensureAppDir();
          const ts = new Date();
          const fileName = `VID_${ts.getFullYear()}${String(
            ts.getMonth() + 1,
          ).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(
            ts.getHours(),
          ).padStart(2, '0')}${String(ts.getMinutes()).padStart(
            2,
            '0',
          )}${String(ts.getSeconds()).padStart(2, '0')}.mp4`;
          const dest = `${dir}/${fileName}`;
          try {
            if (video?.path && (await RNFS.exists(video.path))) {
              await RNFS.moveFile(video.path, dest);
              await burnOverlay(dest, { text: bottomLeftOverlayText });
            }
          } catch {}
        })();
      },
      onRecordingError: (_e: any) => {
        setIsRecording(false);
      },
      videoBitrate,
    });
  }, [isRecording, resolution, bottomLeftOverlayText, onClose]);

  // Auto-start recording when requested
  useEffect(() => {
    if (!autoStart) return;
    // small delay to ensure camera is ready
    const id = setTimeout(() => {
      if (!isRecording) onToggleRecord();
    }, 400);
    return () => clearTimeout(id);
  }, [autoStart, isRecording, onToggleRecord]);

  const toggleResolution = useCallback(() => {
    setResolution(r => {
      const next = r === '720p' ? '1080p' : r === '1080p' ? '4k' : r === '4k' ? 'auto' : '720p';
      saveSettings({ resolution: next });
      return next as Resolution;
    });
  }, []);

  if (!device || !Camera || !Camera?.displayName) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>
          Install and link camera libs to use preview.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        format={format}
      />
      {locEnabled ? (
        <View style={[styles.locBottomLeft, { bottom: insets.bottom + 12 }] }>
          <Text style={styles.overlayText}>{bottomLeftOverlayText}</Text>
        </View>
      ) : null}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={toggleResolution} style={styles.badge}>
          <Text style={styles.badgeText}>{resolution.toUpperCase()}</Text>
        </TouchableOpacity>
        <View
          style={[
            styles.badge,
            { backgroundColor: locEnabled ? '#0a84ff' : '#555' },
          ]}
        >
          <Text style={styles.badgeText}>
            {locEnabled ? 'LOC ON' : 'LOC OFF'}
          </Text>
        </View>
        {onOpenSettings ? (
          <TouchableOpacity onPress={onOpenSettings} style={styles.badge}>
            <Text style={styles.badgeText}>SETTINGS</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={onToggleRecord}
          style={[styles.recBtn, isRecording && styles.recBtnOn]}
        >
          <Text style={styles.recText}>{isRecording ? 'STOP' : 'REC'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { color: '#999' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#0008',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 8,
  },
  badgeText: { color: 'white', fontWeight: 'bold' },
  recBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#e33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBtnOn: { backgroundColor: '#444' },
  recText: { color: 'white', fontWeight: 'bold' },
  overlayWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  overlayText: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locBottomLeft: {
    position: 'absolute',
    left: 12,
  },
});
