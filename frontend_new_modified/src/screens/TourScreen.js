import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Swiper from 'react-native-swiper';

const TourScreen = ({ navigation }) => {
  const finishTour = async () => {
    await AsyncStorage.setItem('hasSeenTour', 'true');
    navigation.replace('GuestHome'); 
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Skip Button */}
      {/* <TouchableOpacity style={styles.skipButton} onPress={finishTour}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity> */}
      
      <Swiper loop={false} showsPagination={true}>
        <View style={styles.slide}>
          <Image source={require('./../../assets/1.png')} style={styles.image} />
          <Text style={styles.text}>Pack Your Bag !!</Text>
        </View>

        <View style={styles.slide}>
          <Image source={require('./../../assets/2.png')} style={styles.image} />
          <Text style={styles.text}>Find your ultimate ride !!</Text>
        </View>

        <View style={styles.slide}>
          <Image source={require('./../../assets/3.png')} style={styles.image} />
          <Text style={styles.text}>EXPLORE with us !!!</Text>
          <TouchableOpacity style={styles.button} onPress={finishTour}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </Swiper>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: 300, height: 300, marginBottom: 20 },
  text: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  button: { backgroundColor: '#007BFF', padding: 10, borderRadius: 5, marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16 },
  skipButton: { position: 'absolute', top: 50, right: 20, padding: 10 },
  skipText: { fontSize: 16, color: '#007BFF', fontWeight: 'bold' },
});

export default TourScreen;