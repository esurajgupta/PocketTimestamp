// Lightweight wrapper to burn timestamp/location onto the recorded video using ffmpeg.
// We keep API minimal; implementation assumes react-native-ffmpeg-lite.

// import RNFS from 'react-native-fs';

export type OverlayOptions = {
  text: string; // single line, already composed (e.g., "2025-09-23 12:30 | 19.07,72.88")
};

export async function burnOverlay(inputPath: string, _opts: OverlayOptions): Promise<string> {
  // FFmpeg not bundled; return original file path (no-op overlay)
  return inputPath;
}


