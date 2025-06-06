import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logout } from '../services/authService';

const DriverMenuBar = ({ menuItems: customMenuItems }) => {
  const navigation = useNavigation();
  const route = useRoute(); // To determine the current screen

  // Default menu items if not provided via props
  const defaultMenuItems = [
    { name: 'home-outline', label: 'Home', action: 'DriverHome', a11yLabel: 'Go to Driver Home' },
    { name: 'mic-outline', label: 'Translate', action: 'DriverTranslationScreen', a11yLabel: 'Go to Translation Screen' },
    { name: 'log-out-outline', label: 'Logout', action: 'logout', a11yLabel: 'Log out of the app' },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  // Initialize Animated.Value for each menu item
  const scaleAnims = useRef(
    menuItems.map(() => new Animated.Value(1))
  ).current;

  // Determine the active item based on the current route
  const activeItem = menuItems.find(item => item.action === route.name) || menuItems[0];

  useEffect(() => {
    // Reset animations on mount or route change to ensure consistency
    scaleAnims.forEach(anim => anim.setValue(1));
  }, [route.name]);

  const handlePress = async (action, index) => {
    const anim = scaleAnims[index];
    if (!anim) {
      console.error(`Animated.Value at index ${index} is undefined`);
      return;
    }

    // Animation sequence: scale up then back
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 1.3, // Slightly larger scale for emphasis
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (action === 'logout') {
      try {
        const response = await logout();
        if (response === true) {
          //await AsyncStorage.setItem('hasSeenTour','false')
          navigation.navigate('Login');
        } else {
          Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
          console.warn('Logout response was not true:', response);
        }
      } catch (error) {
        console.error('Logout failed:', error);
        Alert.alert('Error', 'An error occurred during logout. Please try again.');
      }
    } else {
      navigation.navigate(action);
    }
  };

  return (
    <View style={styles.bottomMenuBar}>
      {menuItems.map((item, index) => {
        const isActive = item.action === activeItem.action && item.action !== 'logout';
        return (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, isActive && styles.activeMenuItem]}
            onPress={() => handlePress(item.action, index)}
            activeOpacity={0.8}
            accessibilityLabel={item.a11yLabel}
            accessibilityRole="button"
          >
            <Animated.View
              style={[
                styles.iconWrapper,
                isActive && styles.activeIconWrapper,
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              <Ionicons name={item.name} size={20} color="#FFF" />
            </Animated.View>
            <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
              {item.label}
            </Text>
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
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingBottom: 5,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 5,
  },
  activeMenuItem: {
    borderTopWidth: 2,
    borderTopColor: '#FF5733',
  },
  iconWrapper: {
    backgroundColor: '#FF5733',
    borderRadius: 50,
    padding: 10,
    marginBottom: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activeIconWrapper: {
    backgroundColor: '#FF8A65', // Lighter shade for active state
    borderWidth: 2,
    borderColor: '#FFF',
  },
  menuText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  activeMenuText: {
    color: '#FF8A65',
    fontWeight: '700',
  },
});

export default DriverMenuBar;