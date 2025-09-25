import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureStoragePermission() {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version <= 28) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}
