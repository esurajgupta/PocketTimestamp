import RNFS from 'react-native-fs';
import moment from 'moment-timezone';

export const VIDEO_DIR_NAME = 'CameraApp';

export function getFolderPath() {
  return `${RNFS.PicturesDirectoryPath}/${VIDEO_DIR_NAME}`;
}

export async function ensureDir(): Promise<string> {
  const folderPath = getFolderPath();
  const exists = await RNFS.exists(folderPath);
  if (!exists) {
    await RNFS.mkdir(folderPath);
  }
  return folderPath;
}

export function generateFilename(date = new Date()): string {
  return `VID_${moment(date).format('YYYYMMDD_HHmmss')}.mp4`;
}

export async function saveVideoFromTemp(tempPath: string): Promise<string> {
  const folderPath = await ensureDir();
  const filename = generateFilename();
  const destPath = `${folderPath}/${filename}`;
  await RNFS.copyFile(tempPath, destPath);
  return destPath;
}

export interface StoredVideo {
  path: string;
  name: string;
  size: number;
  modified: number; // ms epoch
}

export async function listVideos(): Promise<StoredVideo[]> {
  const folderPath = await ensureDir();
  const items = await RNFS.readDir(folderPath);
  const videos = items
    .filter(i => i.isFile() && i.name.toLowerCase().endsWith('.mp4'))
    .map(i => ({
      path: i.path,
      name: i.name,
      size: i.size ?? 0,
      modified: (i.mtime ? i.mtime.getTime?.() : undefined) ?? 0,
    }));
  // Newest first
  videos.sort((a, b) => b.modified - a.modified);
  return videos;
}

export async function deleteVideo(path: string): Promise<void> {
  try {
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch {}
}



