// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from 'react';
// import {
//   Platform,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// let Geolocation: any = null;
// try {
//   Geolocation = require('react-native-geolocation-service');
// } catch {}
// import { PermissionsAndroid } from 'react-native';
// let RNFS: any;
// try {
//   RNFS = require('react-native-fs');
// } catch {}
// import { ensureAppDir } from '../utils/storage';
// import { burnOverlay } from '../utils/ffmpegOverlay';
// import { DEFAULT_SETTINGS, loadSettings, saveSettings, formatNow } from '../utils/settings';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { reverseGeocode } from '../utils/geocode';

// // NOTE: We reference vision-camera types, but avoid direct import if not installed.
// // We'll type as any to keep compilation flexible in this scaffold.
// let Camera: any = View;
// let useCameraDevice: any = () => undefined;
// try {

//   const vision = require('react-native-vision-camera');
//   Camera = vision.Camera;
//   useCameraDevice = vision.useCameraDevice;
// } catch (e) {
//   // Library not installed yet; show placeholder UI
// }

// type Resolution = '720p' | '1080p' | '4k' | 'auto';

// export function CameraScreen({ onOpenSettings, autoStart, onClose }: { onOpenSettings?: () => void; autoStart?: boolean; onClose?: () => void }) {
//   const insets = useSafeAreaInsets();
//   const device = useCameraDevice?.('back');
//   const cameraRef = useRef<any>(null);

//   const [isRecording, setIsRecording] = useState(false);
//   const [resolution, setResolution] = useState<Resolution>('1080p');
//   const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
//     null,
//   );
//   const [locEnabled, setLocEnabled] = useState<boolean>(false);
//   const [timestampFormat, setTimestampFormat] = useState<string>(DEFAULT_SETTINGS.timestampFormat);
//   const [timezone, setTimezone] = useState<'device' | 'UTC'>(DEFAULT_SETTINGS.timezone);
//   const [_tick, setTick] = useState<number>(0);
//   const [address, setAddress] = useState<string>('');

//   const format = useMemo(() => {
//     if (!device?.formats) return undefined;
//     const formats = device.formats as any[];
//     const pick = (height: number) =>
//       formats.find((f: any) => Math.max(f.videoHeight, f.videoWidth) >= height);
//     if (resolution === '4k') return pick(3840);
//     if (resolution === '1080p') return pick(1920);
//     if (resolution === '720p') return pick(1280);
//     return formats[0];
//   }, [device, resolution]);

//   const requestPermissions = useCallback(async () => {
//     try {
//       const vision = require('react-native-vision-camera');
//       await vision.Camera.requestCameraPermission();
//       await vision.Camera.requestMicrophonePermission();
//       // ignore results here; UI will render placeholder if denied
//     } catch {}
//     // Location permission
//     try {
//       if (Platform.OS === 'android') {
//         const fine = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         );
//         const coarse = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
//         );
//         const ok =
//           fine === PermissionsAndroid.RESULTS.GRANTED ||
//           coarse === PermissionsAndroid.RESULTS.GRANTED;
//         setLocEnabled(ok);
//       } else {
//         setLocEnabled(true);
//       }
//     } catch {}
//   }, []);

//   useEffect(() => {
//     requestPermissions();
//     loadSettings().then(s => {
//       setTimestampFormat(s.timestampFormat);
//       setLocEnabled(s.locationTagging);
//       setResolution(s.resolution as Resolution);
//       setTimezone(s.timezone as 'device' | 'UTC');
//     });
//   }, [requestPermissions]);

//   useEffect(() => {
//     if (!locEnabled) return;
//     const geo: any = Geolocation ?? (globalThis as any)?.navigator?.geolocation;
//     if (!geo) return;
//     // Seed with a one-time high-accuracy fix
//     geo.getCurrentPosition?.(
//       (pos: any) => {
//         setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//       },
//       (_err: any) => {},
//       { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
//     );
//     if (!geo.watchPosition) return;
//     const watchId = geo.watchPosition(
//       (pos: any) => {
//         setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//       },
//       (_err: any) => {},
//       {
//         enableHighAccuracy: true,
//         distanceFilter: 0,
//         interval: 2000,
//         fastestInterval: 1000,
//         // Specific to react-native-geolocation-service on Android
//         forceRequestLocation: true,
//         showLocationDialog: true,
//       },
//     );
//     return () => {
//       try { geo.clearWatch?.(watchId); } catch {}
//       try { geo.stopObserving?.(); } catch {}
//     };
//   }, [locEnabled]);

//   // Reverse geocode whenever location changes
//   useEffect(() => {
//     (async () => {
//       if (!location) return;
//       const res = await reverseGeocode(location.lat, location.lon);
//       setAddress(res?.displayName ?? '');
//     })();
//   }, [location]);

//   // Update overlay text every second while recording
//   useEffect(() => {
//     if (!isRecording) return;
//     const id = setInterval(() => setTick(t => t + 1), 1000);
//     return () => clearInterval(id);
//   }, [isRecording]);

//   const bottomLeftOverlayText = useMemo(() => {
//     const parts: string[] = [];
//     if (address) parts.push(address);
//     parts.push(`${formatNow(timestampFormat, timezone)}`);
//     if (location) {
//       parts.push(`Latitude: ${location.lat.toFixed(6)}`);
//       parts.push(`Longitude: ${location.lon.toFixed(6)}`);
//     }
//     return parts.join('\n');
//   }, [address, timestampFormat, timezone, location]);

//   const onToggleRecord = useCallback(async () => {
//     if (!cameraRef.current || !Camera || !cameraRef.current.startRecording)
//       return;
//     if (isRecording) {
//       await cameraRef.current.stopRecording();
//       setIsRecording(false);
//       if (onClose) onClose();
//       return;
//     }

//     setIsRecording(true);
//     const videoBitrate =
//       resolution === '720p'
//         ? 3_000_000
//         : resolution === '1080p'
//         ? 5_000_000
//         : 12_000_000;
//     await cameraRef.current.startRecording({
//       flash: 'off',
//       onRecordingFinished: (video: any) => {
//         setIsRecording(false);
//         (async () => {
//           const dir = await ensureAppDir();
//           const ts = new Date();
//           const fileName = `VID_${ts.getFullYear()}${String(
//             ts.getMonth() + 1,
//           ).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(
//             ts.getHours(),
//           ).padStart(2, '0')}${String(ts.getMinutes()).padStart(
//             2,
//             '0',
//           )}${String(ts.getSeconds()).padStart(2, '0')}.mp4`;
//           const dest = `${dir}/${fileName}`;
//           try {
//             if (video?.path && (await RNFS.exists(video.path))) {
//               await RNFS.moveFile(video.path, dest);
//               await burnOverlay(dest, { text: bottomLeftOverlayText });
//             }
//           } catch {}
//         })();
//       },
//       onRecordingError: (_e: any) => {
//         setIsRecording(false);
//       },
//       videoBitrate,
//     });
//   }, [isRecording, resolution, bottomLeftOverlayText, onClose]);

//   // Auto-start recording when requested
//   useEffect(() => {
//     if (!autoStart) return;
//     // small delay to ensure camera is ready
//     const id = setTimeout(() => {
//       if (!isRecording) onToggleRecord();
//     }, 400);
//     return () => clearTimeout(id);
//   }, [autoStart, isRecording, onToggleRecord]);

//   const toggleResolution = useCallback(() => {
//     setResolution(r => {
//       const next = r === '720p' ? '1080p' : r === '1080p' ? '4k' : r === '4k' ? 'auto' : '720p';
//       saveSettings({ resolution: next });
//       return next as Resolution;
//     });
//   }, []);

//   if (!device || !Camera || !Camera?.displayName) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.info}>
//           Install and link camera libs to use preview.
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Camera
//         ref={cameraRef}
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         video={true}
//         audio={true}
//         format={format}
//       />
//       {locEnabled ? (
//         <View style={[styles.locBottomLeft, { bottom: insets.bottom + 12 }] }>
//           <Text style={styles.overlayText}>{bottomLeftOverlayText}</Text>
//         </View>
//       ) : null}
//       <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
//         <TouchableOpacity onPress={toggleResolution} style={styles.badge}>
//           <Text style={styles.badgeText}>{resolution.toUpperCase()}</Text>
//         </TouchableOpacity>
//         <View
//           style={[
//             styles.badge,
//             { backgroundColor: locEnabled ? '#0a84ff' : '#555' },
//           ]}
//         >
//           <Text style={styles.badgeText}>
//             {locEnabled ? 'LOC ON' : 'LOC OFF'}
//           </Text>
//         </View>
//         {onOpenSettings ? (
//           <TouchableOpacity onPress={onOpenSettings} style={styles.badge}>
//             <Text style={styles.badgeText}>SETTINGS</Text>
//           </TouchableOpacity>
//         ) : null}
//       </View>
//       <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
//         <TouchableOpacity
//           onPress={onToggleRecord}
//           style={[styles.recBtn, isRecording && styles.recBtnOn]}
//         >
//           <Text style={styles.recText}>{isRecording ? 'STOP' : 'REC'}</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'black' },
//   center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   info: { color: '#999' },
//   topBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     paddingHorizontal: 12,
//   },
//   bottomBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   badge: {
//     backgroundColor: '#0008',
//     borderRadius: 16,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     margin: 8,
//   },
//   badgeText: { color: 'white', fontWeight: 'bold' },
//   recBtn: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     backgroundColor: '#e33',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   recBtnOn: { backgroundColor: '#444' },
//   recText: { color: 'white', fontWeight: 'bold' },
//   overlayWrap: {
//     position: 'absolute',
//     left: 12,
//     right: 12,
//   },
//   overlayText: {
//     color: 'white',
//     fontWeight: 'bold',
//     textShadowColor: '#000',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   locBottomLeft: {
//     position: 'absolute',
//     left: 12,
//   },
// });

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  VideoFile,
  CameraDevice,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
//
import moment from 'moment-timezone';
import { saveVideoFromTemp } from '../services/videoStorage';
import { useSettings } from '../context/SettingsContext';
import { useRoute } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useLocation } from '../hooks/useLocation';
import { LocationOverlay } from '../components/LocationOverlay';

//

const CameraScreen = () => {
  // const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { settings, updateSettings } = useSettings();
  const camera = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<
    'pending' | 'granted' | 'denied'
  >('pending');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    permission: locPermission,
    requestPermission: requestLocPerm,
    location,
    startWatching,
    stopWatching,
  } = useLocation();
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);
  const [tempResolution, setTempResolution] = useState(
    settings.videoResolution,
  );
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const device = useCameraDevice('back');
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(
    null,
  );
  const route = useRoute<any>();
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    (async () => {
      if (hasPermission !== 'granted') return;
      try {
        const devices = await Camera.getAvailableCameraDevices();
        const back =
          devices.find(d => d.position === 'back') || devices[0] || null;
        setSelectedDevice(back);
      } catch (e) {
        console.warn('Failed to get camera devices', e);
        setSelectedDevice(null);
      }
    })();
  }, [hasPermission]);

  // Auto-start effect moved below startRecording

  const resolutionOptions = [
    { label: '720p', value: '720p', width: 1280, height: 720 },
    { label: '1080p', value: '1080p', width: 1920, height: 1080 },
    { label: '4K', value: '4K', width: 3840, height: 2160 },
    { label: 'Auto', value: 'Auto', width: 1920, height: 1080 },
  ];

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      const granted =
        cameraPermission === 'granted' && microphonePermission === 'granted';
      setHasPermission(granted ? 'granted' : 'denied');
    })();
  }, []);

  useEffect(() => {
    // Update time every second
    timeInterval.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timeInterval.current) clearInterval(timeInterval.current);
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, []);

  const getFormattedDateTime = React.useCallback(() => {
    const format = settings.timestampFormat || 'YYYY-MM-DD HH:mm:ss';
    const timezone = settings.timezone || 'UTC';
    return moment(currentTime).tz(timezone).format(format);
  }, [settings.timestampFormat, settings.timezone, currentTime]);

  // Ensure location starts as soon as the screen is focused
  useEffect(() => {
    if (!isFocused) {
      stopWatching();
      return;
    }

    (async () => {
      if (!settings.locationTagging) {
        stopWatching();
        return;
      }
      if (locPermission !== 'granted') {
        const ok = await requestLocPerm();
        if (ok) startWatching();
      } else {
        startWatching();
      }
    })();

    return () => {
      stopWatching();
    };
  }, [
    isFocused,
    settings.locationTagging,
    locPermission,
    requestLocPerm,
    startWatching,
    stopWatching,
  ]);

  const scheduleAutoDeletion = async (filePath: string, days: number) => {
    // Store file info with deletion date
    try {
      const AsyncStorage = (
        await import('@react-native-async-storage/async-storage')
      ).default;
      const data = await AsyncStorage.getItem('scheduledDeletions');
      const deletions = data ? JSON.parse(data) : [];
      deletions.push({
        path: filePath,
        deleteDate: moment().add(days, 'days').toISOString(),
      });
      await AsyncStorage.setItem(
        'scheduledDeletions',
        JSON.stringify(deletions),
      );
    } catch (error) {
      console.error('Error scheduling deletion:', error);
    }
  };

  const processVideo = useCallback(
    async (video: VideoFile) => {
      try {
        // Save with service
        const destPath = await saveVideoFromTemp(video.path);

        Alert.alert('Success', 'Video saved successfully');

        // Update settings to save resolution preference
        if (tempResolution !== settings.videoResolution) {
          updateSettings({ videoResolution: tempResolution });
        }

        // Burn overlay (timestamp + optional location) only when tagging enabled
        try {
          if (settings.locationTagging) {
            const timestamp = getFormattedDateTime();
            const locText = location
              ? `${Number(location.latitude).toFixed(6)}, ${Number(
                  location.longitude,
                ).toFixed(6)}`
              : '';
            const text = locText ? `${timestamp} | ${locText}` : `${timestamp}`;
            const { burnOverlay } = await import('../utils/ffmpegOverlay');
            await burnOverlay(destPath, { text });
          }
        } catch {}

        // Auto-delete after N days if enabled
        if (settings.autoDeleteDays > 0) {
          scheduleAutoDeletion(destPath, settings.autoDeleteDays);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Save Error', 'Failed to save video');
      }
    },
    [
      settings.autoDeleteDays,
      settings.videoResolution,
      settings.locationTagging,
      tempResolution,
      updateSettings,
      location,
      getFormattedDateTime,
    ],
  );

  const startRecording = useCallback(async () => {
    if (!camera.current || hasPermission !== 'granted') {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      // If user wants location tagging but permission not yet granted, ask now
      if (settings.locationTagging && locPermission !== 'granted') {
        const ok = await requestLocPerm();
        if (ok) startWatching();
      }

      setIsRecording(true);
      setRecordingTime(0);

      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      await camera.current.startRecording({
        onRecordingFinished: async (video: VideoFile) => {
          console.log('Video recorded:', video);
          await processVideo(video);
        },
        onRecordingError: error => {
          console.error('Recording error:', error);
          Alert.alert('Recording Error', 'Failed to record video');
          setIsRecording(false);
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
          }
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Recording Error', 'Failed to start recording');
      setIsRecording(false);
    }
  }, [
    hasPermission,
    locPermission,
    requestLocPerm,
    startWatching,
    settings.locationTagging,
    processVideo,
  ]);

  const stopRecording = async () => {
    if (camera.current && isRecording) {
      await camera.current.stopRecording();
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  };

  // Auto-start recording if route param set (only once per visit)
  useEffect(() => {
    if (!route?.params?.autoStart) return;
    if (hasAutoStartedRef.current) return;
    if (hasPermission !== 'granted') return;
    if (!isFocused) return;
    if (!selectedDevice && !device) return;
    if (isRecording) return;
  }, [
    route?.params?.autoStart,
    hasPermission,
    isFocused,
    selectedDevice,
    device,
    isRecording,
    startRecording,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // moved above and memoized as useCallback
  if (hasPermission === 'pending' || (!device && !selectedDevice)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Initializing camera…</Text>
      </View>
    );
  }

  if (hasPermission !== 'granted') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={(selectedDevice || device)!}
        isActive={isFocused}
        video={true}
        audio={true}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {/* <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Icon name="settings" size={28} color="#e6edf3" />
          </TouchableOpacity> */}

          {settings.locationTagging !== undefined && (
            <View
              style={[
                styles.badge,
                settings.locationTagging ? styles.badgeOn : styles.badgeOff,
                styles.badgeTopRight,
              ]}
            >
              <Icon name="location-on" size={16} color="#e6edf3" />
              <Text style={styles.badgeText}>
                {settings.locationTagging ? 'ON' : 'OFF'}
              </Text>
            </View>
          )}

          <View style={styles.topCenter}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>
                  {formatTime(recordingTime)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.topRightRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowResolutionPicker(true)}
            >
              <Text style={styles.resolutionText}>
                {tempResolution || settings.videoResolution}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timestamp and Location Overlay */}

        <LocationOverlay
          timestamp={getFormattedDateTime()}
          latitude={
            settings.locationTagging && location ? location.latitude : undefined
          }
          longitude={
            settings.locationTagging && location
              ? location.longitude
              : undefined
          }
          enabled={!!settings.locationTagging}
        />

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomLeft} />

          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View
              style={[
                styles.recordButtonInner,
                isRecording && styles.recordingInner,
              ]}
            />
          </TouchableOpacity>

          <View style={styles.bottomRight} />
        </View>
      </View>

      {/* Resolution Picker Modal */}
      <Modal
        visible={showResolutionPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResolutionPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowResolutionPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Resolution</Text>
            {resolutionOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  (tempResolution || settings.videoResolution) ===
                    option.value && styles.selectedOption,
                ]}
                onPress={() => {
                  setTempResolution(option.value);
                  setShowResolutionPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {(tempResolution || settings.videoResolution) ===
                  option.value && (
                  <Icon name="check" size={24} color="#0a84ff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorText: {
    color: '#e6edf3',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
  },
  resolutionText: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: 'rgba(17,22,29,0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#151c24',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.85)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a323c',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingTime: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestampOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(17,22,29,0.6)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#151c24',
  },
  timestampText: {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationText: {
    color: '#c3c7cf',
    fontSize: 12,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  bottomLeft: {
    flex: 1,
  },
  bottomRight: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#151c24',
  },
  badgeOn: {
    backgroundColor: '#4CAF50',
  },
  badgeOff: {
    backgroundColor: '#2a323c',
  },
  badgeTopRight: {
    marginRight: 8,
  },
  badgeText: {
    color: '#e6edf3',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(230,237,243,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#e6edf3',
  },
  recordingButton: {
    borderColor: '#ff3b30',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff3b30',
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f141a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#151c24',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#e6edf3',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#151c24',
  },
  selectedOption: {
    backgroundColor: '#11161d',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#e6edf3',
  },
});

export default CameraScreen;
