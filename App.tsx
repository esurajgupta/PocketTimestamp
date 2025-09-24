// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// import React, { useState } from 'react';
// import { CameraScreen } from './src/screens/CameraScreen';
// import { SettingsScreen } from './src/screens/SettingsScreen';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { SplashScreen } from './src/screens/SplashScreen';
// import { HomeScreen } from './src/screens/HomeScreen';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <SafeAreaProvider>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// function AppContent() {
//   const [route, setRoute] = useState<'splash' | 'home' | 'camera' | 'settings'>('splash');
//   const [autoStart, setAutoStart] = useState(false);
//   if (route === 'splash') {
//     return (
//       <View style={styles.container}>
//         <SplashScreen onDone={() => setRoute('home')} />
//       </View>
//     );
//   }
//   if (route === 'settings') {
//     return (
//       <View style={styles.container}>
//         <SettingsScreen onClose={() => setRoute('home')} />
//       </View>
//     );
//   }
//   if (route === 'camera') {
//     return (
//       <View style={styles.container}>
//         <CameraScreen
//           autoStart={autoStart}
//           onClose={() => setRoute('home')}
//           onOpenSettings={() => setRoute('settings')}
//         />
//       </View>
//     );
//   }
//   return (
//     <View style={styles.container}>
//       <HomeScreen onStart={() => { setAutoStart(true); setRoute('camera'); }} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;

import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from './src/screens/CameraScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsProvider } from './src/context/SettingsContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        console.log('Permissions granted:', granted);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
};

const Splash = ({ navigation }: any) => {
  useEffect(() => {
    const id = setTimeout(() => navigation.replace('Home'), 1200);
    return () => clearTimeout(id);
  }, [navigation]);
  return <SplashScreen onDone={() => navigation.replace('Home')} />;
};

const Home = ({ navigation }: any) => {
  return (
    <HomeScreen
      onStart={() => navigation.navigate('Camera', { autoStart: true })}
    />
  );
};

export default App;
