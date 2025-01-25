import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import React, { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../services/authService';
import { useNavigation } from '@react-navigation/native';

const MenuBar = () => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async (action) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    if (action === 'logout') {
      try {
        const response = await logout();
        if (response === true) {
          navigation.navigate('Login'); 
        }
      } catch (error) {
        console.error('Logout failed:', error);
      }
    } else {
      navigation.navigate(action);
    }
  };

  return (
    <View style={styles.bottomMenuBar}>
      {[
        { name: 'home-outline', label: 'Home', action: 'Home' },
        { name: 'notifications-outline', label: 'Notifications', action: 'NotificationsScreen' },
        { name: 'person-outline', label: 'Profile', action: 'ProfileScreen' },
        { name: 'log-out-outline', label: 'Logout', action: 'logout' },
      ].map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={() => handlePress(item.action)}
        >
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name={item.name} size={28} color="#fff" />
          </Animated.View>
          <Text style={styles.menuText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default MenuBar;


const styles = StyleSheet.create({
  bottomMenuBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff', // A pleasant green for the menu background
    paddingVertical: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: '#66BB6A', // Slightly darker green for contrast
    borderRadius: 50,
    padding: 7,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
});
