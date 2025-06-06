import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { API_BASE_URL } from './../utils/config';

export const login = async (username, password) => {
  try {
    console.log("Login called at:", API_BASE_URL);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (response.ok) {
      const { userId, userType,name } = data; 

      // Store userId in AsyncStorage
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userType', userType);
      await AsyncStorage.setItem('name', name);

      return { success: true, userId ,userType};
    } else {
      return { success: false, message: data.message || 'Invalid credentials' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred while logging in.' };
  }
};

export const register = async (payload) => {
  try {
    console.log("Register called at:", API_BASE_URL);

    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
    return { success: true, message: 'Registration successful' };
    } else {
      return { success: false, message: data.message || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'An error occurred during registration.' };
  }
};

export const getSession = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    return userId; // Return userId from AsyncStorage
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.multiRemove(['userId', 'userType']);
    await AsyncStorage.setItem('hasSeenTour','false')
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};
