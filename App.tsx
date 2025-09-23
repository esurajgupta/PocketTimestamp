

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import React, { useState } from 'react';
import { CameraScreen } from './src/screens/CameraScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [route, setRoute] = useState<'splash' | 'home' | 'camera' | 'settings'>('splash');
  const [autoStart, setAutoStart] = useState(false);
  if (route === 'splash') {
    return (
      <View style={styles.container}>
        <SplashScreen onDone={() => setRoute('home')} />
      </View>
    );
  }
  if (route === 'settings') {
    return (
      <View style={styles.container}>
        <SettingsScreen onClose={() => setRoute('home')} />
      </View>
    );
  }
  if (route === 'camera') {
    return (
      <View style={styles.container}>
        <CameraScreen
          autoStart={autoStart}
          onClose={() => setRoute('home')}
          onOpenSettings={() => setRoute('settings')}
        />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <HomeScreen onStart={() => { setAutoStart(true); setRoute('camera'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
