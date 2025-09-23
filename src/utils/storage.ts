import RNFS from 'react-native-fs';

export const APP_DIR = `${RNFS.ExternalStorageDirectoryPath ?? RNFS.DocumentDirectoryPath}/PocketTimestamp`;

export async function ensureAppDir(): Promise<string> {
  const exists = await RNFS.exists(APP_DIR);
  if (!exists) {
    await RNFS.mkdir(APP_DIR);
  }
  return APP_DIR;
}

export async function cleanupOldFiles(maxAgeDays: number): Promise<number> {
  const dir = await ensureAppDir();
  const entries = await RNFS.readDir(dir);
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let deleted = 0;
  for (const e of entries) {
    if (e.isFile() && e.mtime && e.mtime.getTime() < cutoff) {
      try {
        await RNFS.unlink(e.path);
        deleted += 1;
      } catch {}
    }
  }
  return deleted;
}


