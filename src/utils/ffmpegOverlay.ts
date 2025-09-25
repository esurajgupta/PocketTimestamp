import { Video as VideoCompressor, getRealPath } from 'react-native-compressor';
import RNFS from 'react-native-fs';
import moment from 'moment-timezone';
import { Platform } from 'react-native';

export type OverlayOptions = {
  text: string;
};

export async function burnOverlay(
  inputPath: string,
  _opts: OverlayOptions,
): Promise<string> {
  return inputPath;
}

export async function compressVideo(
  inputPath: string,
  opts: { width: number; targetBitrateKbps: number },
  onProgress?: (progressPercent: number) => void,
): Promise<string> {
  const { width, targetBitrateKbps } = opts;

  try {
    const compressedTemp: string = await VideoCompressor.compress(
      inputPath,
      {
        compressionMethod: 'manual',
        maxSize: width,
        bitrate: targetBitrateKbps * 1000,
        minimumFileSizeForCompress: 1,
      },
      progress => {
        if (onProgress) {
          const percent = Math.round(progress * 100);
          onProgress(percent);
        }
      },
    );

    let realPath = compressedTemp;
    try {
      const maybe = await getRealPath(compressedTemp, 'video');
      if (maybe) realPath = maybe;
    } catch {}

    if (Platform.OS === 'android') {
      const dcim = (RNFS as any).DCIMDirectoryPath || (RNFS.ExternalStorageDirectoryPath + '/DCIM');
      const folderPath = `${dcim}/Camera`;
      await RNFS.mkdir(folderPath);
      const filename = `VID_${moment().format('YYYYMMDD_HHmmss')}.mp4`;
      const destPath = `${folderPath}/${filename}`;

      // Move instead of copy
      await RNFS.moveFile(realPath.replace('file://', ''), destPath);

      // Trigger media scan (⚡ fix: pass string not object)
      // if (typeof (RNFS as any).scanFile === 'function') {
      //   await (RNFS as any).scanFile(destPath);
      // }

      // ✅ Delete original uncompressed input if it exists
      try {
        const exists = await RNFS.exists(inputPath);
        if (exists) await RNFS.unlink(inputPath);
      } catch {}

      return destPath;
    }

    // iOS: later we can add PHPhotoLibrary
    return realPath;
  } catch (e) {
    console.error('Compression failed:', e);
    return inputPath;
  }
}
