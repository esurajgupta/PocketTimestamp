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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useLocation } from '../hooks/useLocation';
import { LocationOverlay } from '../components/LocationOverlay';
import { compressVideo } from '../utils/ffmpegOverlay';
import RNFS from 'react-native-fs';

const CameraScreen = () => {
  const navigation = useNavigation<any>();
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
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

  const resolutionOptions = React.useMemo(
    () => [
      { label: '720p', value: '720p', width: 1280, height: 720 },
      { label: '1080p', value: '1080p', width: 1920, height: 1080 },
      { label: '4K', value: '4K', width: 3840, height: 2160 },
      { label: 'Auto', value: 'Auto', width: 1920, height: 1080 },
    ],
    [],
  );

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
        console.log('destPath', destPath);

        let finalPath = destPath;
        try {
          setIsProcessing(true);
          setProcessProgress(0);

          const compressedTempPath = await compressVideo(
            destPath,
            {
              width: 1280, // for 720p
              targetBitrateKbps: 2000, // ~15 MB/min
            },
            p => setProcessProgress(p),
          );

          console.log('compressedTempPath', compressedTempPath);
          // If compressor returned a different temp file, replace original
          if (compressedTempPath && compressedTempPath !== destPath) {
            try {
              const exists = await RNFS.exists(destPath);
              if (exists) {
                await RNFS.unlink(destPath); // delete original
              }
              await RNFS.copyFile(
                compressedTempPath.startsWith('file://')
                  ? compressedTempPath.replace('file://', '')
                  : compressedTempPath,
                destPath,
              );
              finalPath = destPath;
            } catch (err) {
              console.warn('Copy fallback error:', err);
              finalPath = compressedTempPath;
            }
          }
        } catch {
        } finally {
          setIsProcessing(false);
          setProcessProgress(100);
        }

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
            await burnOverlay(finalPath, { text });
          }
        } catch {}

        // Auto-delete after N days if enabled
        if (settings.autoDeleteDays > 0) {
          scheduleAutoDeletion(finalPath, settings.autoDeleteDays);
        }
        // Navigate back to Home so the list can refresh
        try {
          navigation.navigate?.('Home');
        } catch {}

        Alert.alert('Success', 'Video saved successfully');
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
      navigation,
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
        videoCodec: 'h265',
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

  const isLocationOn = locPermission === 'granted' && !!location;

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
        // Let device decide best format when 'Auto'; otherwise hint target fps/format via videoStabilizationMode only.
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {settings.locationTagging && (
            <View
              style={[
                styles.badge,
                isLocationOn ? styles.badgeOn : styles.badgeOff,
                styles.badgeTopRight,
              ]}
            >
              <Icon name="location-on" size={16} color="#e6edf3" />
              <Text style={styles.badgeText}>
                {isLocationOn ? 'ON' : 'OFF'}
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

          {!isRecording && (
            <View style={styles.topRightRow}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowResolutionPicker(true)}
              >
                <Text style={styles.resolutionText}>
                  {tempResolution || settings.videoResolution}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Settings' as never)}
              >
                <Icon name="settings" size={28} color="#e6edf3" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Timestamp and Location Overlay */}

        <LocationOverlay
          timestamp={getFormattedDateTime()}
          latitude={isLocationOn && location ? location.latitude : undefined}
          longitude={isLocationOn && location ? location.longitude : undefined}
          enabled={isLocationOn}
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

      {/* Processing Modal */}
      <Modal
        visible={isProcessing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <Text style={styles.processingTitle}>Compressing…</Text>
            <View style={styles.progressBarWrap}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${processProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{processProgress}%</Text>
          </View>
        </View>
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
  processingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    width: '80%',
    maxWidth: 360,
    backgroundColor: '#0f141a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#151c24',
    padding: 20,
    alignItems: 'center',
  },
  processingTitle: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressBarWrap: {
    width: '100%',
    height: 10,
    backgroundColor: '#151c24',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1b2430',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0a84ff',
  },
  progressText: {
    color: '#8ea0b5',
    marginTop: 8,
  },
});

export default CameraScreen;
