// screens/GuestHomeScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Easing } from 'react-native';

const GuestHomeScreen = ({ navigation }) => {
  const heartbeat = useRef(new Animated.Value(1)).current; // Initial scale value for animation

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
  }, [heartbeat]);

  return (
    <View style={styles.guestContainer}>
      <Animated.Image 
        source={require('../../assets/logo.png')} // Adjust path based on your structure
        style={[styles.guestLogo, { transform: [{ scale: heartbeat }] }]}
        resizeMode="contain"
      />
      <Text style={styles.welcomeText}>Wander Guide !</Text>
      <Text style={styles.subtitle}>Join us to explore amazing journeys</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Dark black background
    padding: 20,
  },
  guestLogo: {
    width: 120,
    height: 120,
    marginBottom: 40,
    borderRadius: 60, // Circular logo
    borderWidth: 2,
    borderColor: '#fff', // White border to match buttons
    shadowColor: '#fff', // White glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8, // For Android shadow
  },
  welcomeText: {
    fontSize: 32,
    marginBottom: 15,
    color: '#fff', // White text for contrast
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.3)', // Subtle white shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc', // Light gray for contrast
    marginBottom: 40,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%', // Full width for better alignment
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff', // White buttons
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginVertical: 12, // Increased spacing between buttons
    width: 220,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff', // White border for definition
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  registerButton: {
    backgroundColor: '#fff', // Same white, distinguished by text color or subtle effect
    borderColor: '#ccc', // Slightly different border for contrast
  },
  buttonText: {
    color: '#000', // Black text for white buttons
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default GuestHomeScreen;