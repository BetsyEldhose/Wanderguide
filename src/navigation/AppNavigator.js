import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/Traveller/HomeScreen';
import EventsScreen from '../screens/Traveller/EventsScreen';
import HotelsScreen from '../screens/Traveller/HotelsScreen';
import GuidesScreen from '../screens/Traveller/GuidesScreen';
import CabsScreen from '../screens/Traveller/CabsScreen'; 
import RegisterScreen from '../screens/RegisterScreen';
import DriverHome from '../screens/Driver/DriverHome';
import TranslationScreen from '../screens/Traveller/TranslationScreen'; 
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null); // To hold the initial route dynamically

  useEffect(() => {
    const checkUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const userType = await AsyncStorage.getItem('userType');
        if(userId && userType) {
        if (userType === 'Driver') {
          setInitialRoute('DriverHome');
          } if (userType === 'Traveller') {
            setInitialRoute('Home');
            } if (userType === null) {
              setInitialRoute('Login');
            }
            } else {
              setInitialRoute('Login');
            }
       
      } catch (error) {
        console.error('Error checking userId:', error);
        setInitialRoute('Login'); // Fallback to Login
      }
    };

    checkUserId();
  }, []);

  // Show a loading spinner while checking AsyncStorage
  if (initialRoute === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EventsScreen" component={EventsScreen} />
        <Stack.Screen name="HotelsScreen" component={HotelsScreen} />
        <Stack.Screen name="GuidesScreen" component={GuidesScreen} />
        <Stack.Screen name="CabsScreen" component={CabsScreen} /> 
        <Stack.Screen name="TranslationScreen" component={TranslationScreen} />
        <Stack.Screen name="DriverHome" component={DriverHome} />

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
