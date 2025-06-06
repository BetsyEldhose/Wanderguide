import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  Animated,
  Easing,
  BackHandler, // Import BackHandler
} from 'react-native';
import { login } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const heartbeat = useRef(new Animated.Value(1)).current; // For heartbeat effect

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

    // Handle back button press
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp(); // Close the app
      return true; // Prevent default behavior (going back)
    });

    // Cleanup the event listener on unmount
    return () => backHandler.remove();
  }, [heartbeat]);

  const handleLogin = async () => {
    const response = await login(username, password);

    if (response.success) {
      
      if (response.userType === 'Traveller') {
        Alert.alert('Login Successful', 'Welcome back, Traveller!');
        navigation.navigate('Home');
        
      } else if (response.userType === 'Driver') {
        Alert.alert('Login Successful', 'Welcome back, Driver!');
        navigation.navigate('DriverHome');
        
      } else {
        Alert.alert('Error', 'Invalid user type');
      }
      await AsyncStorage.setItem('hasSeenTour', 'true');
    } else {
      Alert.alert('Login Failed', response.message);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')} // Using the same logo as earlier
        style={[styles.logo, { transform: [{ scale: heartbeat }] }]}
        resizeMode="contain"
      />
      <Text style={styles.title}>Wander Guide</Text>
      <Text style={styles.subtitle}>Please sign in to continue</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#bbb"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#bbb"
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.signupLink}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.signupText}>
          Don’t have an account? <Text style={styles.signupTextHighlight}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Better centering
    padding: 20,
    backgroundColor: '#000', // Dark black background
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 40,
    borderRadius: 60, // Circular logo
    borderWidth: 2,
    borderColor: '#fff', // White border
    shadowColor: '#fff', // White glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32, // Slightly larger
    fontWeight: 'bold',
    color: '#fff', // White for contrast
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc', // Light gray
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  form: {
    width: '100%', // Full width for better alignment
    backgroundColor: '#1a1a1a', // Darker gray for form
    borderRadius: 16,
    padding: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  input: {
    backgroundColor: '#333', // Darker input background
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  loginButton: {
    backgroundColor: '#fff', // White button
    borderRadius: 30, // More rounded
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: '#000', // Black text for white button
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  signupLink: {
    marginTop: 30,
  },
  signupText: {
    color: '#ccc', // Light gray
    fontSize: 14,
  },
  signupTextHighlight: {
    color: '#fff', // White for emphasis
    fontWeight: 'bold',
  },
});

export default LoginScreen;