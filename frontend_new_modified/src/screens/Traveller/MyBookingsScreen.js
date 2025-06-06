import React, { useState, useEffect, useRef, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../../components/MenuBar';
import { getMyBookings, cancelBooking, getTrackingData } from '../../services/apiServices';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('booked');
  const [trackingData, setTrackingData] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const trackingInterval = useRef(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
        if (storedUserId) {
          await fetchBookings(storedUserId);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      }
      await requestLocationPermission();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    };
    initialize();

    return () => stopTracking();
  }, []);

  useEffect(() => {
    if (activeTab === 'ongoing' && userId) {
      startTracking(userId);
    } else {
      stopTracking();
    }
  }, [activeTab, userId]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to show your position on the map.');
      return false;
    }
    getUserLocation();
    return true;
  };

  const getUserLocation = () => {
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
      timeout: 15000,
    })
      .then((position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      })
      .catch((error) => {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Unable to get your location. Please enable location services.');
      });
  };

  const fetchBookings = async (userId) => {
    setLoading(true);
    try {
      const response = await getMyBookings(userId);
      console.log('Bookings API Response:', response);
      if (response && response.success && Array.isArray(response.bookings)) {
        setBookings(response.bookings);
        console.log('Booking IDs and Statuses:', response.bookings.map(b => ({ id: b.id, status: b.status })));
      } else {
        setBookings([]);
        Alert.alert('Error', response?.error || 'No bookings found');
      }
    } catch (error) {
      setBookings([]);
      console.error('Fetch bookings error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (userId) {
      setRefreshing(true);
      fetchBookings(userId);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              console.log('Cancelling Booking ID:', bookingId);
              const response = await cancelBooking(bookingId);
              if (response.success) {
                fetchBookings(userId);
                Alert.alert('Success', 'Booking cancelled successfully');
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel booking');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while cancelling');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return ['#27AE60', '#2ECC71'];
      case 'cancelled': return ['#C0392B', '#E74C3C'];
      case 'ongoing': return ['#2980B9', '#3498DB'];
      case 'booked': return ['#F39C12', '#F1C40F'];
      default: return ['#F39C12', '#F1C40F'];
    }
  };

  const filteredBookings = () => {
    if (!Array.isArray(bookings)) {
      console.warn('Bookings is not an array:', bookings);
      return [];
    }
    switch (activeTab) {
      case 'booked': return bookings.filter(b => b?.status?.toLowerCase() === 'booked');
      case 'ongoing': return bookings.filter(b => b?.status?.toLowerCase() === 'ongoing');
      case 'closed': return bookings.filter(b => b?.status?.toLowerCase() === 'cancelled' || b?.status?.toLowerCase() === 'completed');
      default: return bookings;
    }
  };

  const startTracking = (userId) => {
    if (trackingInterval.current) return;
    console.log('Starting tracking interval for Ongoing tab...');
    trackingInterval.current = setInterval(async () => {
      if (!userId || !bookings.length) {
        console.log('No userId or bookings available for tracking.');
        return;
      }
      const ongoingBookings = bookings.filter(b => b?.status?.toLowerCase() === 'ongoing');
      console.log('Ongoing Bookings:', ongoingBookings.map(b => ({ id: b.id, status: b.status })));

      if (ongoingBookings.length === 0) {
        console.log('No ongoing bookings to track.');
        return;
      }

      for (const booking of ongoingBookings) {
        try {
          console.log(`Fetching tracking data for Booking #${booking.id}`);
          const trackingResponse = await getTrackingData(booking.id);
          console.log(`Tracking Response for Booking #${booking.id}:`, trackingResponse);

          if (trackingResponse && trackingResponse.success && trackingResponse.data) {
            const newCoords = extractCoordinates(trackingResponse.data);
            console.log(`Extracted Coordinates for Booking #${booking.id}:`, newCoords);

            if (newCoords.length > 0) {
              setTrackingData(prev => {
                const existingData = prev[booking.id] || { coordinates: [] };
                const updatedCoords = [...existingData.coordinates, ...newCoords].filter(
                  (coord, index, self) =>
                    index === self.findIndex(c => c.latitude === coord.latitude && c.longitude === coord.longitude)
                );
                console.log(`Updated Tracking Data for Booking #${booking.id}:`, { coordinates: updatedCoords });
                return { ...prev, [booking.id]: { coordinates: updatedCoords } };
              });
            } else {
              console.log(`No valid coordinates for Booking #${booking.id}`);
            }
          } else {
            console.log(`Invalid tracking response for Booking #${booking.id}`);
          }
        } catch (error) {
          console.error(`Tracking error for Booking #${booking.id}:`, error);
        }
      }
    }, 3000);
  };

  const stopTracking = () => {
    if (trackingInterval.current) {
      console.log('Stopping tracking interval...');
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
  };

  const extractCoordinates = (data) => {
    const coords = [];
    if (data.first && data.first.latitude && data.first.longitude) {
      coords.push({ latitude: parseFloat(data.first.latitude), longitude: parseFloat(data.first.longitude) });
    }
    if (data.latest && data.latest.latitude && data.latest.longitude) {
      coords.push({ latitude: parseFloat(data.latest.latitude), longitude: parseFloat(data.latest.longitude) });
    }
    if (data.current && data.current.lat && data.current.lon) {
      coords.push({ latitude: parseFloat(data.current.lat), longitude: parseFloat(data.current.lon) });
    }
    if (data.latitude && data.longitude) {
      coords.push({ latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) });
    }
    return coords;
  };

  const BookingCard = memo(({ item }) => {
    const isOngoing = item.status?.toLowerCase() === 'ongoing';
    const tracking = trackingData[item.id];
    const scaleAnim = new Animated.Value(1);

    useEffect(() => {
      console.log(`Mounting BookingCard for Booking #${item.id}`);
      return () => console.log(`Unmounting BookingCard for Booking #${item.id}`);
    }, [item.id]);

    console.log(`Rendering Booking #${item.id}, Status: ${item.status}, Tracking Data:`, tracking);
    if (isOngoing && (!tracking || !tracking.coordinates || tracking.coordinates.length === 0)) {
      console.log(`Tracking unavailable for Booking #${item.id}:`, { tracking });
    }

    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    };

    const getInitialRegion = () => {
      const coords = tracking?.coordinates || [];
      if (coords.length > 0) {
        return {
          latitude: coords[coords.length - 1].latitude,
          longitude: coords[coords.length - 1].longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
      } else if (userLocation) {
        return {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
      } else {
        return {
          latitude: 9.9312,
          longitude: 76.2673,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
      }
    };

    return (
      <Animated.View style={[styles.bookingCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.bookingId}>Booking #{item.id || 'N/A'}</Text>
            <LinearGradient colors={getStatusColor(item.status)} style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.detailText}>Driver: {item.d_name || 'N/A'}</Text>
          <Text style={styles.detailText}>From: {item.start || 'N/A'}</Text>
          <Text style={styles.detailText}>To: {item.end || 'N/A'}</Text>

          {isOngoing && (
            <View style={styles.mapContainer}>
              {tracking && tracking.coordinates && tracking.coordinates.length > 0 ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={getInitialRegion()}
                  showsUserLocation={false} // Disable built-in user location marker to avoid conflicts
                  key={`map-${item.id}`} // Unique key for MapView
                >
                  <Marker
                    key={`driver-${item.id}`}
                    coordinate={tracking.coordinates[tracking.coordinates.length - 1]}
                    title={`Driver #${item.id}`}
                    description="Current Driver Location"
                    pinColor="blue"
                  />
                  {userLocation && (
                    <Marker
                      key={`user-${item.id}`}
                      coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                      title="Your Location"
                      description="Current Location"
                      pinColor="green"
                    />
                  )}
                  <Polyline coordinates={tracking.coordinates} strokeColor="#FF6F61" strokeWidth={3} />
                </MapView>
              ) : (
                <Text style={styles.noTrackingText}>Tracking unavailable</Text>
              )}
            </View>
          )}

          {item.status?.toLowerCase() === 'booked' && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelBooking(item.id)} onPressIn={onPressIn} onPressOut={onPressOut}>
              <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.cancelButtonGradient}>
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if item or trackingData changes meaningfully
    return prevProps.item.id === nextProps.item.id &&
           JSON.stringify(prevProps.trackingData[nextProps.item.id]) === JSON.stringify(nextProps.trackingData[nextProps.item.id]);
  });

  return (
    <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <LinearGradient colors={['rgba(44, 44, 44, 0.95)', 'rgba(26, 26, 26, 0.95)']} style={styles.headerGradient}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={32} color="#FF6F61" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>Track Your Journeys</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.tabContainer}>
        {['Booked', 'Ongoing', 'Closed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab.toLowerCase() && styles.activeTab]}
            onPress={() => setActiveTab(tab.toLowerCase())}
          >
            <LinearGradient
              colors={activeTab === tab.toLowerCase() ? ['#FF6F61', '#FF8A65'] : ['#2C2C2C', '#1A1A1A']}
              style={styles.tabGradient}
            >
              <Text style={[styles.tabText, activeTab === tab.toLowerCase() && styles.activeTabText]}>
                {tab}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings()}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <BookingCard item={item} trackingData={trackingData} />}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {userId ? `No ${activeTab} bookings found` : 'Please login to view bookings'}
              </Text>
            </View>
          }
          extraData={trackingData}
        />
      )}

      <MenuBar />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  headerGradient: { paddingVertical: 10, borderRadius: 30 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
  },
  headerContent: { alignItems: 'center' },
  headerTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255, 111, 97, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 111, 97, 0.2)',
  },
  tab: { flex: 1, marginHorizontal: 5, borderRadius: 25, overflow: 'hidden' },
  activeTab: { elevation: 5 },
  tabGradient: { paddingVertical: 12, alignItems: 'center' },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BBBBBB',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeTabText: { color: '#FFFFFF' },
  listContainer: { padding: 20, paddingBottom: 100 },
  bookingCard: {
    borderRadius: 25,
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  bookingId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 111, 97, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 3 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' },
  detailText: { fontSize: 16, color: '#BBBBBB', marginBottom: 10, fontWeight: '500', lineHeight: 22 },
  mapContainer: {
    height: 220,
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.3)',
  },
  map: { ...StyleSheet.absoluteFillObject },
  noTrackingText: { fontSize: 16, color: '#BBBBBB', textAlign: 'center', padding: 20, fontWeight: '500' },
  cancelButton: { marginTop: 15, borderRadius: 25, overflow: 'hidden', alignSelf: 'center' },
  cancelButtonGradient: { paddingVertical: 12, paddingHorizontal: 30 },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#FF6F61', fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#BBBBBB', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
});

export default MyBookingsScreen;