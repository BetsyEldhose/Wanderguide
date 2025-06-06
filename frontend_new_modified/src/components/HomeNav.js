import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logo from '../../assets/logo.png';
import { useNavigation } from '@react-navigation/native';

const HomeNav = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [username, setUsername] = useState(''); // State to store the username
  const navigation = useNavigation();

  // Fetch username from AsyncStorage when component mounts or menu toggles
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const storedName = await AsyncStorage.getItem('name');
        if (storedName) {
          setUsername(storedName);
        } else {
          setUsername('Guest'); // Default value if no name is stored
        }
      } catch (error) {
        console.error('Error fetching username from AsyncStorage:', error);
        setUsername('Guest'); // Fallback in case of error
      }
    };

    fetchUsername();
  }, []); // Empty dependency array means it runs once on mount

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userId', 'userType', 'name']); // Remove 'name' as well on logout
      await AsyncStorage.setItem('hasSeenTour', 'false');
      setIsMenuVisible(false);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      setIsMenuVisible(false);
      navigation.navigate('Login');
    }
  };

  // Close menu when clicking outside of it
  const handleOutsideClick = () => {
    setIsMenuVisible(false);
  };

  return (
    <View style={styles.navbar}>
      {/* Logo & Title Section */}
      <TouchableOpacity
        style={styles.titleContainer}
        onPress={() => navigation.navigate('Home')}
      >
        <Image source={logo} style={styles.logo} />
        <View>
          <Text style={styles.title}>Wander Guide</Text>
          <Text style={styles.subtitle}>Explore the World!!</Text>
        </View>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity onPress={toggleMenu}>
        <MaterialCommunityIcons name="account-circle" size={40} color="#fff" />
      </TouchableOpacity>

      {/* Dropdown Menu */}
      {isMenuVisible && (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View style={styles.dropdownMenu}>
            {/* Display Username */}
            <Text style={styles.menuItem}>
              <MaterialCommunityIcons name="account" size={20} color="#000" /> {username}
            </Text>

            {/* Logout Option */}
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.menuItem}>
                <MaterialCommunityIcons name="logout" size={20} color="#000" /> Logout
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 20,
    borderColor: '#fff',
    borderWidth: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: 25,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  menuItem: {
    color: '#000',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});

export default HomeNav;