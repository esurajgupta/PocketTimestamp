import { NativeModules } from 'react-native';

const { MediaStoreModule } = NativeModules;

export async function saveVideoToGalleryAndroid(
  tempPath: string,
): Promise<string> {
  if (!MediaStoreModule) {
    throw new Error('MediaStoreModule not linked properly');
  }
  return await MediaStoreModule.saveVideoToGallery(tempPath);
}
