// screens/SplashScreen.js
import React, { useEffect, useRef,useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {
  const heartbeat = useRef(new Animated.Value(1)).current; // Initial scale value for animation
  const fadeAnim = useRef(new Animated.Value(1)).current; // Initial opacity value for fade
  

  useEffect(() => {
    // Heartbeat animation loop
    const startHeartbeat = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartbeat, {
            toValue: 1.1, // Scale up
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(heartbeat, {
            toValue: 1, // Scale back
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startHeartbeat();

    // Fade out and navigation sequence
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 3000, // Fade out duration
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(async() => {
        const SeenTour = await AsyncStorage.getItem('hasSeenTour');
        const userId = await AsyncStorage.getItem('userId');
        const userType = await AsyncStorage.getItem('userType');
        console.log("hasseentour",SeenTour)
        if(SeenTour=== 'false'|| !SeenTour|| SeenTour=== ""){
          console.log("navigating to tour")
          navigation.replace('Tour');
          return;
        }
        else{
          try{
            
        console.log('userId:', userId);
        console.log('userType:', userType);
        

        if (userId && userType) {
          navigation.replace(userType === 'Driver' ? 'DriverHome' : 'Home');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        navigation.replace('Login');
      }
        }
      });
    }, 1500); // Start fade after 1.5s, total duration will be 2s

    return () => clearTimeout(timer);
  }, [navigation, heartbeat, fadeAnim]);

  return (
    <Animated.View 
      style={[
        styles.splashContainer,
        { opacity: fadeAnim } // Apply fade animation to entire container
      ]}
    >
      <Animated.Image 
        source={require('../../assets/logo.png')}
        style={[
          styles.splashLogo, 
          { 
            transform: [{ scale: heartbeat }]
          }
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  splashText: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});

export default SplashScreen;