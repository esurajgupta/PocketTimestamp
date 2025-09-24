import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  theme: string;
  defaultMode: string;
  videoResolution: string;
  timestampFormat: string;
  timezone: string;
  locationTagging: boolean;
  autoDeleteDays: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

interface ProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<ProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'System',
    defaultMode: 'Video',
    videoResolution: '1080p',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
    timezone: 'UTC',
    locationTagging: true,
    autoDeleteDays: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('cameraSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem('cameraSettings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
