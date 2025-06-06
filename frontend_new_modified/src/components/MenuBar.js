import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MenuBar = () => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Check login status when component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const userType = await AsyncStorage.getItem('userType');
        console.log('MenuBar - userId:', userId);
        console.log('MenuBar - userType:', userType);

        if (!userId || !userType) {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.replace('Login');
      }
    };

    checkLoginStatus();
  }, [navigation]);

  const handlePress = async (action) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    
      navigation.navigate(action);

  };

  return (
    <View style={styles.bottomMenuBar}>
      {[
        { name: 'home-outline', label: 'Home', action: 'Home' },
        { name: 'mic-outline', label: 'Translate', action: 'TranslationScreen' },
        { name: 'ticket-outline', label: 'Bookings', action: 'MyBookingsScreen' },
      ].map((item, index) => {
        const iconColor = item.name === 'mic-outline' ? '#000' : '#fff';
        const isMicIcon = item.name === 'mic-outline';

        return (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handlePress(item.action)}
          >
            <Animated.View
              style={[
                styles.iconWrapper,
                isMicIcon && styles.micIconWrapper,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Ionicons name={item.name} size={28} color={iconColor} />
            </Animated.View>
            <Text style={styles.menuText}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomMenuBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: '#000',
    borderRadius: 50,
    padding: 7,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  micIconWrapper: {
    borderWidth: 2,
    borderColor: 'black',
    backgroundColor: '#fff',
  },
  menuText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default MenuBar;