import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import GuestHomeScreen from '../screens/GuestHomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/Traveller/HomeScreen';
import EventsScreen from '../screens/Traveller/EventsScreen';
import HotelsScreen from '../screens/Traveller/HotelsScreen';
import GuidesScreen from '../screens/Traveller/GuidesScreen';
import CabsScreen from '../screens/Traveller/CabsScreen';
import TranslationScreen from '../screens/Traveller/TranslationScreen';
import PlaceScreen from '../screens/Traveller/PlaceScreen';
import SpotsScreen from '../screens/Traveller/SpotsScreen';
import DriverHome from '../screens/Driver/DriverHome';
import TourScreen from '../screens/TourScreen';
import MyBookingsScreen from '../screens/Traveller/MyBookingsScreen';
import HotelDetailScreen from '../screens/Traveller/HotelDetailScreen';
import DriverTranslationScreen from '../screens/Driver/DriverTranslationScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  
  const [initialRoute, setInitialRoute] = useState('Splash');

  // useEffect(() => {
  //   const checkUserStatus = async () => {
  //     try {
  //       const hasSeenTour = await AsyncStorage.getItem('hasSeenTour');
  //       if (hasSeenTour==''||hasSeenTour=='false') {
  //         setInitialRoute('Tour');
  //         return;
  //       }

  //       const userId = await AsyncStorage.getItem('userId');
  //       const userType = await AsyncStorage.getItem('userType');
  //       console.log('userId:', userId);
  //       console.log('userType:', userType);
        

  //       if (userId && userType) {
  //         setInitialRoute(userType === 'Driver' ? 'DriverHome' : 'Home');
  //       } else {
  //         setInitialRoute('Splash');
  //       }
  //     } catch (error) {
  //       console.error('Error checking user status:', error);
  //       setInitialRoute('Splash');
  //     }
  //   };

  //   checkUserStatus();
  // }, []);

  // if (initialRoute === null) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#007BFF" />
  //     </View>
  //   );
  // }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="GuestHome" component={GuestHomeScreen} />
        <Stack.Screen name="Tour" component={TourScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EventsScreen" component={EventsScreen} />
        <Stack.Screen name="HotelsScreen" component={HotelsScreen} />
        <Stack.Screen name="GuidesScreen" component={GuidesScreen} />
        <Stack.Screen name="CabsScreen" component={CabsScreen} />
        <Stack.Screen name="TranslationScreen" component={TranslationScreen} />
        <Stack.Screen name="PlaceScreen" component={PlaceScreen} />
        <Stack.Screen name="SpotsScreen" component={SpotsScreen} />
        <Stack.Screen name="DriverHome" component={DriverHome} />
        <Stack.Screen name="MyBookingsScreen" component={MyBookingsScreen} />
        <Stack.Screen name="HotelDetail" component={HotelDetailScreen} />
        <Stack.Screen name="DriverTranslationScreen" component={DriverTranslationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
});

export default AppNavigator;