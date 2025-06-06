import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  Dimensions,
  Linking,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverMenuBar from '../../components/DriverMenu';
import { getDriverBookings, updateLocation, acceptBooking, cancelBooking, completeBooking } from '../../services/apiServices';
import * as Location from 'expo-location';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const TAB_HEIGHT = WINDOW_WIDTH * 0.08 + 24;

const DriverHome = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('booked');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [shareLocation, setShareLocation] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [locationPermission, setLocationPermission] = useState(null);
  const intervalsRef = useRef({});

  const tabs = [
    { key: 'booked', title: 'Booked' },
    { key: 'ongoing', title: 'Ongoing' },
    { key: 'completed', title: 'Completed' },
    { key: 'cancelled', title: 'Cancelled' },
  ];

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [WINDOW_HEIGHT * 0.12, WINDOW_HEIGHT * 0.08],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed to share your position during rides.');
      }
    };
    requestLocationPermission();

    const getDriverId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem('userId');
        setDriverId(storedDriverId);
        if (storedDriverId) {
          fetchBookings(storedDriverId);
        }
      } catch (error) {
        console.error('Error fetching driverId:', error);
        Alert.alert('Error', 'Failed to load driver profile.');
      }
    };
    getDriverId();
  }, []);

  useEffect(() => {
    // Manage location sharing intervals
    Object.keys(shareLocation).forEach(bookingId => {
      if (shareLocation[bookingId] && driverId && locationPermission) {
        if (!intervalsRef.current[bookingId]) {
          console.log(`Starting location sharing for Booking #${bookingId}`);
          intervalsRef.current[bookingId] = setInterval(() => {
            updateDriverLocation(bookingId);
          }, 5000);
        }
      } else {
        if (intervalsRef.current[bookingId]) {
          console.log(`Stopping location sharing for Booking #${bookingId}`);
          clearInterval(intervalsRef.current[bookingId]);
          delete intervalsRef.current[bookingId];
        }
      }
    });

    return () => {
      // Cleanup all intervals on unmount
      Object.keys(intervalsRef.current).forEach(bookingId => {
        clearInterval(intervalsRef.current[bookingId]);
        delete intervalsRef.current[bookingId];
      });
    };
  }, [shareLocation, driverId, locationPermission]);

  const fetchBookings = async (driverId) => {
    setLoading(true);
    try {
      const response = await getDriverBookings(driverId);
      if (response.success) {
        setBookings(response.bookings || []);
      } else {
        Alert.alert('Error', response.error || 'No bookings found');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (driverId) {
      setRefreshing(true);
      fetchBookings(driverId);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#2ECC71';
      case 'cancelled': return '#E74C3C';
      case 'ongoing': return '#3498DB';
      case 'booked': return '#F1C40F';
      default: return '#F1C40F';
    }
  };

  const hasOngoingBooking = useCallback(() => {
    return bookings.some(booking => booking.status.toLowerCase() === 'ongoing');
  }, [bookings]);

  const handleAcceptBooking = async (bookingId) => {
    if (hasOngoingBooking()) {
      Alert.alert('Info', 'Cannot accept new booking while an ongoing ride exists.');
      return;
    }
    setActionLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const response = await acceptBooking(bookingId);
      if (response.success) {
        fetchBookings(driverId);
        Alert.alert('Success', 'Booking accepted successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to accept booking');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while accepting the booking');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [bookingId]: true }));
            try {
              const response = await cancelBooking(bookingId);
              if (response.success) {
                fetchBookings(driverId);
                Alert.alert('Success', 'Booking cancelled successfully');
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel booking');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while cancelling');
            } finally {
              setActionLoading(prev => ({ ...prev, [bookingId]: false }));
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      console.error('Error opening dialer', err);
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  const handleCompleteBooking = async (bookingId) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const response = await completeBooking(bookingId);
      if (response.success) {
        fetchBookings(driverId);
        Alert.alert('Success', 'Ride completed successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to complete ride');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while completing the ride');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const updateDriverLocation = async (bookingId) => {
    if (!locationPermission) {
      console.log(`No location permission for Booking #${bookingId}`);
      return;
    }
    try {
      console.log(`Fetching location for Booking #${bookingId}`);
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      console.log(`Sending location for Booking #${bookingId}: ${latitude}, ${longitude}`);
      const response = await updateLocation(driverId, latitude, longitude, bookingId);
      if (response.success) {
        console.log(`Location updated successfully for Booking #${bookingId}`);
      } else {
        console.warn(`Location update failed for Booking #${bookingId}:`, response.error);
      }
    } catch (error) {
      console.error(`Error updating location for Booking #${bookingId}:`, error);
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.bookingId}>Booking #{item.id}</Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(item.phone)}
            accessibilityLabel={`Call traveller at ${item.phone}`}
          >
            <Text style={styles.callButtonText}>📞 Call</Text>
          </TouchableOpacity>
          </View>
        <Text style={[styles.status, { backgroundColor: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
          </Text>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.bookingText}>Traveller: {item.name || 'Unknown'}</Text>
        <Text style={styles.bookingText}>Contact: {item.phone || 'N/A'}</Text>
        <Text style={styles.bookingText}>From: {item.start || 'N/A'}</Text>
        <Text style={styles.bookingText}>To: {item.stop || 'N/A'}</Text>
      </View>
      {item.status.toLowerCase() === 'booked' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptBooking(item.id)}
            disabled={actionLoading[item.id] || false}
            accessibilityLabel="Accept this booking"
          >
            {actionLoading[item.id] ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item.id)}
            disabled={actionLoading[item.id] || false}
            accessibilityLabel="Cancel this booking"
          >
            {actionLoading[item.id] ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Cancel</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {item.status.toLowerCase() === 'ongoing' && (
        <>
          <View style={styles.locationToggle}>
            <Text style={styles.toggleText}>Share Location</Text>
            <Switch
              value={shareLocation[item.id] || false}
              onValueChange={(value) =>
                setShareLocation(prev => ({ ...prev, [item.id]: value }))
              }
              trackColor={{ false: '#767577', true: '#FF5733' }}
              thumbColor={shareLocation[item.id] ? '#FFF' : '#f4f3f4'}
              disabled={!locationPermission}
            />
          </View>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteBooking(item.id)}
            disabled={actionLoading[item.id] || false}
            accessibilityLabel="Complete this ride"
          >
            {actionLoading[item.id] ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Complete Ride</Text>
            )}
          </TouchableOpacity>
        </>
      )}
      
    </View>
  );

  const filterBookings = (status) => {
    return bookings.filter(booking => booking.status.toLowerCase() === status);
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
          accessibilityLabel={`View ${tab.title} bookings`}
        >
          <LinearGradient
            colors={
              activeTab === tab.key
                ? ['#FF6F61', '#FF8A65']
                : ['#2C2C2C', '#1A1A1A']
            }
            style={styles.tabGradient}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.title}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => (
    <FlatList
      data={filterBookings(activeTab)}
      renderItem={renderBookingItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.bookingList}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5733" />
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {driverId ? `No ${activeTab} bookings available` : 'Please login to view bookings'}
        </Text>
      }
      style={styles.content}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Your Ride Status</Text>
        </View>
      </Animated.View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5733" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {renderTabButtons()}
          {renderContent()}
        </View>
      )}

      <DriverMenuBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#000',
    paddingTop: WINDOW_HEIGHT * 0.05,
    paddingHorizontal: WINDOW_WIDTH * 0.05,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 10,
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: WINDOW_WIDTH * 0.07,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: WINDOW_WIDTH * 0.04,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  contentWrapper: {
    flex: 1,
  },
  tabContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: WINDOW_WIDTH * 0.05,
    paddingVertical: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 111, 97, 0.2)',
    zIndex: 10,
  },
  tab: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 25,
    overflow: 'hidden',
  },
  activeTab: {
    elevation: 5,
  },
  tabGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BBBBBB',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: TAB_HEIGHT + 20,
  },
  bookingList: {
    padding: WINDOW_WIDTH * 0.03,
    paddingTop: 5,
    paddingBottom: WINDOW_HEIGHT * 0.15,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: WINDOW_WIDTH * 0.03,
    marginBottom: WINDOW_WIDTH * 0.03,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: WINDOW_WIDTH * 0.04,
    fontWeight: '700',
    color: '#2D3436',
  },
  status: {
    fontSize: WINDOW_WIDTH * 0.028,
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  bookingText: {
    fontSize: WINDOW_WIDTH * 0.032,
    color: '#636E72',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    padding: WINDOW_WIDTH * 0.025,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: WINDOW_WIDTH * 0.025,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    padding: WINDOW_WIDTH * 0.025,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: WINDOW_WIDTH * 0.032,
  },
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toggleText: {
    fontSize: WINDOW_WIDTH * 0.032,
    color: '#2D3436',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: WINDOW_WIDTH * 0.04,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: WINDOW_WIDTH * 0.04,
    color: '#FF5733',
  },
  callButton: {
    backgroundColor: '#FF5733',
    borderRadius: 8,
    paddingVertical: WINDOW_WIDTH * 0.015,
    paddingHorizontal: WINDOW_WIDTH * 0.03,
    marginTop: 8,
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: WINDOW_WIDTH * 0.032,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default DriverHome;