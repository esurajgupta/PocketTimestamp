import { Video as VideoCompressor, getRealPath } from 'react-native-compressor';
export type OverlayOptions = {
  text: string; // single line, already composed (e.g., "2025-09-23 12:30 | 19.07,72.88")
};

export async function burnOverlay(
  inputPath: string,
  _opts: OverlayOptions,
): Promise<string> {
  return inputPath;
}

export async function compressVideo(
  inputPath: string,
  opts: { width: number; height: number; bitrateKbps: number },
  onProgress?: (progressPercent: number) => void,
): Promise<string> {
  const { width, bitrateKbps } = opts;

  try {
    const compressedTemp: string = await VideoCompressor.compress(
      inputPath,
      {
        compressionMethod: 'manual',
        maxSize: width,
        bitrate: bitrateKbps * 1000,
        minimumFileSizeForCompress: 5,
      },
      progress => {
        if (typeof onProgress === 'function') {
          try { onProgress(progress); } catch {}
        }
      },
    );

    try {
      const real = await getRealPath(compressedTemp, 'video');
      return real || compressedTemp || inputPath;
    } catch {
      return compressedTemp || inputPath;
    }
  } catch (e) {
    console.error('Compression failed:', e);
    return inputPath;
  }
}
