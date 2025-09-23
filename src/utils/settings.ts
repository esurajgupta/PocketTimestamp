import AsyncStorage from '@react-native-async-storage/async-storage';

export type Settings = {
  theme: 'system' | 'light' | 'dark';
  defaultMode: 'video';
  resolution: '720p' | '1080p' | '4k' | 'auto';
  timestampFormat: string; // e.g., 'YYYY-MM-DD HH:mm:ss'
  timezone: 'device' | 'UTC';
  locationTagging: boolean;
  autoDeleteDays: number; // 0 to disable
};

const KEY = 'app_settings_v1';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  defaultMode: 'video',
  resolution: '1080p',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
  timezone: 'device',
  locationTagging: true,
  autoDeleteDays: 0,
};

export async function loadSettings(): Promise<Settings> {
  const s = await AsyncStorage.getItem(KEY);
  if (!s) return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(s) as Settings }; } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(s: Partial<Settings>): Promise<void> {
  const current = await loadSettings();
  const merged = { ...current, ...s } as Settings;
  await AsyncStorage.setItem(KEY, JSON.stringify(merged));
}

export function formatNow(format: string, timezone: Settings['timezone'] = 'device'): string {
  const now = new Date();
  const d = timezone === 'UTC' ? new Date(now.getTime() + now.getTimezoneOffset() * 60000) : now;
  // minimal formatter to avoid adding moment/dayjs
  const pad = (n: number) => String(n).padStart(2, '0');
  return format
    .replace('YYYY', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}


