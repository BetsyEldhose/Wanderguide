import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../../components/MenuBar';
import { getCabsWithPlaceId, getPlaces, bookCab } from '../../services/apiServices';
import * as Linking from 'expo-linking';
import { ScrollView } from 'react-native-gesture-handler';

const CabsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [cabs, setCabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedCab, setSelectedCab] = useState(null);
  const [userId, setUserId] = useState(null);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [destination, setDestination] = useState(''); // Selected destination ID
  const [destinationSearch, setDestinationSearch] = useState(''); // Search query
  const [filteredPlaces, setFilteredPlaces] = useState([]); // Filtered list for dropdown
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Toggle dropdown visibility
  const scrollY = new Animated.Value(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [160, 90],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };
    getUserId();
    fetchCabs(placeId);
    fetchPlaces();
  }, [placeId]);

  

  const fetchCabs = async (placeId) => {
    setLoading(true);
    try {
      const response = await getCabsWithPlaceId(placeId);
      console.log('Cabs API Response:', response);
      if (response.success) {
        setCabs(response.cabs);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } else {
        alert('Error', response.error || 'No cabs found for this location');
      }
    } catch (error) {
      console.error('Error fetching cabs:', error);
      alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlaces = async () => {
    setPlacesLoading(true);
    try {
      const result = await getPlaces();
      if (result.success) {
        setPlaces(result.places);
        setFilteredPlaces(result.places); // Initially show all places
      } else {
        alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      alert('Error', 'Failed to fetch places');
    } finally {
      setPlacesLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCabs(placeId);
  };

  const handleBookNow = (cab) => {
    setSelectedCab(cab);
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!destination) {
      alert('Error', 'Please select a destination');
      return;
    }
    if (!userId) {
      alert('Error', 'Please log in to book a cab');
      return;
    }

    setLoading(true);
    const bookingData = {
      cab_id: selectedCab.id,
      login_id: userId,
      start_point: selectedCab.place_id,
      destination: destination,
    };

    try {
      const response = await bookCab(bookingData);
      if (response.success) {
        const selectedPlace = places.find((p) => p.id === destination);
        const startLocation = selectedCab.place_name || placeName;
        alert(
          'Booking Confirmed',
          `Cab booked with ${selectedCab.name} from ${startLocation} to ${
            selectedPlace ? selectedPlace.place_name : destination
          }`
        );
        setBookingModalVisible(false);
        setDestination('');
        setDestinationSearch('');
        fetchCabs(placeId);
      } else {
        alert('Booking Failed', response.error || 'Unable to book cab at this time');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error', 'An unexpected error occurred while booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
        console.error('Error opening dialer', err)
      );
    } else {
      alert('No Phone Number', 'This cab does not have a contact number.');
    }
  };

  // Filter places based on search input
  const handleSearchDestination = (text) => {
    setDestinationSearch(text);
    if (text) {
      const filtered = places.filter((place) =>
        place.place_name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlaces(filtered);
      setDropdownVisible(true);
    } else {
      setFilteredPlaces(places);
      setDropdownVisible(false);
    }
  };

  // Select a destination from the dropdown
  const handleSelectDestination = (place) => {
    setDestination(place.id);
    setDestinationSearch(place.place_name);
    setDropdownVisible(false);
  };

  const CabCard = ({ item }) => {
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.cabCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(26, 26, 26, 0.95)', 'rgba(44, 44, 44, 0.95)']}
          style={styles.cardGradient}
        >
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(item.phone)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <MaterialIcons name="phone" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cabName}>{item.name || 'Unnamed Cab'} CAB Service</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.cabDetails}>License: {item.license_no || 'N/A'}</Text>
            <Text style={styles.cabDetails}>Age: {item.age || 'N/A'}</Text>
            <Text style={styles.cabDetails}>Details: {item.cab_details || 'N/A'}</Text>
            <Text style={styles.cabDetails}>📞 {item.phone || 'N/A'}</Text>
            <Text style={styles.cabDetails}>From: {item.place_name || placeName || 'N/A'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookNow(item)}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(44, 44, 44, 0.9)', 'rgba(26, 26, 26, 0.9)']}
          style={styles.gradient}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={30} color="#FF6F61" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Cabs</Text>
            <Text style={styles.headerSubtitle}>{placeName || 'Available Cabs'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {loading && !isBookingModalVisible ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading cabs...</Text>
        </View>
      ) : (
        <FlatList
          data={cabs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CabCard item={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No cabs available at this moment</Text>
            </View>
          }
        />
      )}
      
      <Modal
        visible={isBookingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {setBookingModalVisible(false);
          setDropdownVisible(false); }}
        
      >
      {/* <TouchableOpacity */}
      {/* onPress={()=>setDropdownVisible(false)} */}
      {/* > */}
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.95)', 'rgba(44, 44, 44, 0.95)']}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Book Your Cab</Text>
            <Text style={styles.modalSubtitle}>Driver: {selectedCab?.name || 'Unnamed'}</Text>
            <View style={styles.modalDetails}>
              <Text style={styles.modalDetailText}>
                From: {selectedCab?.place_name || placeName || 'N/A'}
              </Text>
              <Text style={styles.modalDetailText}>
                Time: {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
              </Text>
              {placesLoading ? (
                <ActivityIndicator size="small" color="#FF6F61" style={{ marginTop: 15 }} />
              ) : (
                <View style={styles.dropdownContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search place..."
                    placeholderTextColor="#BBBBBB"
                    value={destinationSearch}
                    onChangeText={(text)=>handleSearchDestination(text)}
                    onFocus={() => setDropdownVisible(true)}
                  />
                  {isDropdownVisible && filteredPlaces.length>0 && (
                    <ScrollView
                      style={styles.dropdownList}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      >
                      {filteredPlaces.map(( item ) =>( 
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectDestination(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item.place_name}</Text>
                        </TouchableOpacity>
                      ))}
                     
                      {/* ListEmptyComponent={
                        <Text style={styles.noResultsText}>No matching destinations</Text>
                      } */}
                      
                      </ScrollView>
                  )}
                </View>
              )}
            </View>
            {loading && (
              <ActivityIndicator size="small" color="#FF6F61" style={{ marginVertical: 15 }} />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, loading && { opacity: 0.6 }]}
                onPress={handleConfirmBooking}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>{loading ? 'Booking...' : 'Confirm'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setBookingModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        {/* </TouchableOpacity> */}
      </Modal>
      
      <MenuBar />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 111, 97, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderRadius: 15,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  listContainer: {
    padding: 25,
  },
  cabCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
    minHeight: 230,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.1)',
  },
  contactContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  callButton: {
    backgroundColor: '#FF6F61',
    padding: 12,
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cabName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 15,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailsContainer: {
    padding: 12,
    backgroundColor: 'rgba(44, 44, 44, 0.7)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cabDetails: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 6,
    fontWeight: '400',
  },
  bookButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 25,
    padding: 25,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 111, 97, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalDetails: {
    padding: 15,
    backgroundColor: 'rgba(44, 44, 44, 0.7)',
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalDetailText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    fontWeight: '500',
  },
  dropdownContainer: {
    marginTop: 12,
    marginBottom: 12,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
  },
  dropdownList: {
    maxHeight: 150,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    top: 50, // Adjust based on searchInput height
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noResultsText: {
    color: '#BBBBBB',
    fontSize: 14,
    padding: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#BBBBBB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CabsScreen;