import RNFS from 'react-native-fs';
import moment from 'moment-timezone';
import { Platform } from 'react-native';
import { saveVideoToGalleryAndroid } from '../native/mediaStore';

export const VIDEO_DIR_NAME = 'PocketTimestamp';

export function getFolderPath() {
  const dcimDir = (RNFS as any).DCIMDirectoryPath as string | undefined;
  if (Platform.OS === 'android' && dcimDir) {
    return `${dcimDir}/Camera`;
  }
  const moviesDir = (RNFS as any).MoviesDirectoryPath as string | undefined;
  const base = moviesDir || RNFS.PicturesDirectoryPath;
  return `${base}/${VIDEO_DIR_NAME}`;
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
  if (Platform.OS === 'android') {
    try {
      const uriOrPath = await saveVideoToGalleryAndroid(tempPath);
      return uriOrPath;
    } catch (e) {
      console.warn('MediaStore save failed, fallback to copy + scan:', e);
      const dcim =
        (RNFS as any).DCIMDirectoryPath ||
        RNFS.ExternalStorageDirectoryPath + '/DCIM';
      const folderPath = `${dcim}/Camera`;
      await RNFS.mkdir(folderPath);
      const destPath = `${folderPath}/${generateFilename()}`;
      await RNFS.copyFile(tempPath, destPath);
      try {
        if (typeof (RNFS as any).scanFile === 'function') {
          await (RNFS as any).scanFile([{ path: destPath, mime: 'video/mp4' }]);
        }
      } catch {}
      return destPath;
    }
  } else {
    return tempPath; // iOS: use CameraRoll / PHPhotoLibrary separately
  }
}

export interface StoredVideo {
  path: string;
  name: string;
  size: number;
  modified: number;
}

export async function listVideos(): Promise<StoredVideo[]> {
  try {
    // Build candidate directories to scan on Android
    const candidates: string[] = [];
    const primary = await ensureDir();
    candidates.push(primary);
    if (Platform.OS === 'android') {
      const dcim =
        ((RNFS as any).DCIMDirectoryPath as string | undefined) ||
        (RNFS.ExternalStorageDirectoryPath
          ? `${RNFS.ExternalStorageDirectoryPath}/DCIM`
          : undefined);
      if (dcim) {
        candidates.push(`${dcim}/Camera`);
        candidates.push(`${dcim}/PocketTimestamp`);
      }
      const movies = (RNFS as any).MoviesDirectoryPath as string | undefined;
      if (movies) candidates.push(`${movies}/PocketTimestamp`);
      candidates.push(`${RNFS.PicturesDirectoryPath}/${VIDEO_DIR_NAME}`);
    }

    const seen = new Set<string>();
    const all: StoredVideo[] = [];
    for (const dir of candidates) {
      try {
        const exists = await RNFS.exists(dir);
        if (!exists) continue;
        const items = await RNFS.readDir(dir);
        for (const i of items) {
          if (!i.isFile()) continue;
          const nameLower = (i.name || '').toLowerCase();
          if (!nameLower.endsWith('.mp4')) continue;
          const key = i.path;
          if (seen.has(key)) continue;
          seen.add(key);
          all.push({
            path: i.path,
            name: i.name,
            size: i.size ?? 0,
            modified: (i.mtime ? i.mtime.getTime?.() : undefined) ?? 0,
          });
        }
      } catch {}
    }
    all.sort((a, b) => b.modified - a.modified);
    return all;
  } catch {
    return [];
  }
}

export async function deleteVideo(path: string): Promise<void> {
  try {
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch {}
}
