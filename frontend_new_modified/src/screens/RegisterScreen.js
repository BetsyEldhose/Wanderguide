// screens/RegisterScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { register } from '../services/authService';
import { getPlaces } from '../services/apiServices';
import AnimatedFade, { FadeInDown } from 'react-native-reanimated';

const RegisterScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Traveller');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    contact: '',
    age: '',
    license: '',
    cabDetails: '',
    place: '',
  });
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const heartbeat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const result = await getPlaces();
      if (result.success) setPlaces(result.places);
      else Alert.alert('Error', result.error);
      setLoading(false);
    };
    fetchPlaces();

    const startHeartbeat = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartbeat, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(heartbeat, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startHeartbeat();
  }, [heartbeat]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    const payload = { ...formData, role: activeTab };
    try {
      const result = await register(payload);
      if (result.success) {
        Alert.alert('Success', 'Registration successful! Please Login', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const filteredPlaces = places.filter((place) =>
    place.place_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaceSelect = (place) => {
    handleInputChange('place', place.id);
    setSearchQuery(place.place_name);
    setIsDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { transform: [{ scale: heartbeat }] }]}
          resizeMode="contain"
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sign Up</Text>
          <Text style={styles.headerSubtitle}>Join as {activeTab}</Text>
        </View>

        <View style={styles.tabContainer}>
          {['Traveller', 'Driver'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AnimatedFade.View entering={FadeInDown.duration(600)} style={styles.formContainer}>
          <View style={styles.formCard}>
            {activeTab === 'Traveller' ? (
              <>
                <View style={styles.row}>
                  <TextInputField
                    placeholder="Full Name"
                    field="name"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                  <TextInputField
                    placeholder="Phone"
                    field="contact"
                    keyboardType="numeric"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                </View>
                <View style={styles.row}>
                  <TextInputField
                    placeholder="Age"
                    field="age"
                    keyboardType="numeric"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                  <TextInputField
                    placeholder="Email"
                    field="email"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <TextInputField
                    placeholder="Driver Name"
                    field="name"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                  <TextInputField
                    placeholder="Phone"
                    field="contact"
                    keyboardType="numeric"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                </View>
                <View style={styles.row}>
                  <TextInputField
                    placeholder="Age"
                    field="age"
                    keyboardType="numeric"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                  <TextInputField
                    placeholder="License"
                    field="license"
                    onChange={handleInputChange}
                    style={styles.inputHalf}
                  />
                </View>
                <TextInputField
                  placeholder="Cab Details"
                  field="cabDetails"
                  onChange={handleInputChange}
                />
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={styles.searchableDropdown}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search Place"
                      placeholderTextColor="#bbb"
                      value={searchQuery}
                      onChangeText={(text) => {
                        handleInputChange();
                        setSearchQuery(text);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    {isDropdownOpen && filteredPlaces.length > 0 && (
                      <ScrollView
                        style={styles.dropdownList}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredPlaces.map((place) => (
                          <TouchableOpacity
                            key={place.id}
                            style={styles.dropdownItem}
                            onPress={() => handlePlaceSelect(place)}
                          >
                            <Text style={styles.dropdownItemText}>
                              {place.place_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </>
            )}
            <View style={styles.row}>
              <TextInputField
                placeholder="Username"
                field="username"
                onChange={handleInputChange}
                style={styles.inputHalf}
              />
              <TextInputField
                placeholder="Password"
                field="password"
                secureTextEntry
                onChange={handleInputChange}
                style={styles.inputHalf}
              />
            </View>
            <TextInputField
              placeholder="Confirm Password"
              field="confirmPassword"
              secureTextEntry
              onChange={handleInputChange}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
              <Text style={styles.submitButtonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>
                Have an account? <Text style={styles.loginHighlight}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedFade.View>
      </ScrollView>
    </View>
  );
};

const TextInputField = ({
  placeholder,
  field,
  keyboardType,
  secureTextEntry,
  onChange,
  style,
}) => (
  <TextInput
    style={[styles.input, style]}
    placeholder={placeholder}
    placeholderTextColor="#bbb"
    keyboardType={keyboardType}
    secureTextEntry={secureTextEntry}
    onChangeText={(text) => onChange(field, text)}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 30,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  formCard: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#555',
    flex: 1,
  },
  inputHalf: {
    flex: 0.48,
  },
  searchableDropdown: {
    marginTop: 12,
    marginBottom: 12,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#555',
  },
  dropdownList: {
    maxHeight: 150,
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
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
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 25,
    marginBottom: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#ccc',
    fontSize: 13,
  },
  loginHighlight: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default RegisterScreen;