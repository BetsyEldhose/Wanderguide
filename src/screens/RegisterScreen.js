import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator  } from 'react-native';
import { register } from '../services/authService';
import { getPlaces } from '../services/apiServices';
import { Picker } from '@react-native-picker/picker';


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

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const result = await getPlaces();
      if (result.success) {
        setPlaces(result.places);
      } else {
        Alert.alert('Error', result.error);
      }
      setLoading(false);
    };

    fetchPlaces();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    const payload = {
      name: formData.name,
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: activeTab, 
      email: formData.email ? formData.email : '',
      contact: formData.contact ? formData.contact : '',
      age: formData.age ? formData.age : '',
      license: formData.license ? formData.license : '',
      cabDetails: formData.cabDetails ? formData.cabDetails : '',
      place: formData.place ? formData.place : '',
    };
  
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
      Alert.alert('Error', 'An unexpected error occurred during registration.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Traveller' && styles.activeTab]}
          onPress={() => setActiveTab('Traveller')}
        >
          <Text style={[styles.tabText, activeTab === 'Traveller' && styles.activeTabText]}>
            Traveller
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Driver' && styles.activeTab]}
          onPress={() => setActiveTab('Driver')}
        >
          <Text style={[styles.tabText, activeTab === 'Driver' && styles.activeTabText]}>
            Driver
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {activeTab === 'Traveller' ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              onChangeText={(text) => handleInputChange('name', text)}
            />
             <TextInput
              style={styles.input}
              placeholder="Phone"
              keyboardType="numeric"
              onChangeText={(text) => handleInputChange('contact', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="numeric"
              onChangeText={(text) => handleInputChange('age', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="email"
              onChangeText={(text) => handleInputChange('email', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="username"
              onChangeText={(text) => handleInputChange('username', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              onChangeText={(text) => handleInputChange('password', text)}
            />
              <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
              <Text style={styles.submitButtonText}>Register as Traveller</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Driver Name"
              onChangeText={(text) => handleInputChange('name', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              keyboardType="numeric"
              onChangeText={(text) => handleInputChange('contact', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="numeric"
              onChangeText={(text) => handleInputChange('age', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="License Number"
              onChangeText={(text) => handleInputChange('license', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Cab Details"
              onChangeText={(text) => handleInputChange('cabDetails', text)}
            />
             {loading ? (
            <ActivityIndicator size="large" color="#6200ee" />
          ) : (
            <Picker
              mode="dropdown"
              selectedValue={formData.place}
              style={styles.input}
              onValueChange={(value) => handleInputChange('place', value)}
            >
              <Picker.Item label="Select a place" value="" />
              {places.map((place) => (
                <Picker.Item key={place.id} label={place.place_name} value={place.id} />
              ))}
            </Picker>
          )}
            <TextInput
              style={styles.input}
              placeholder="username"
              onChangeText={(text) => handleInputChange('username', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              onChangeText={(text) => handleInputChange('password', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
              <Text style={styles.submitButtonText}>Register as Driver</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Already have an account? Login here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RegisterScreen;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#6200ee',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
   
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#6200ee',
  },
  tabText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginText: {
    color: '#6200ee',
    fontSize: 14,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
