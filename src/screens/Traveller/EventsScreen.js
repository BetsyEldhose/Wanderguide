import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
  Linking
} from 'react-native';
import { API_BASE_URL } from '../../utils/config';
import MenuBar from '../../components/MenuBar';
import { getEventsWithPlaceId } from '../../services/apiServices';

const EventsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 70],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

   const openMap = (latitude, longitude) => {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open the map');
      });
    };
  

  const fetchEvents = async (placeId) => {
    setLoading(true);
    try {
      const response = await getEventsWithPlaceId(placeId);
      if (response.success) {
        setEvents(response.events);
      } else {
        Alert.alert('Error', response.error || 'No events found for this place');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isEventActive = (eventDate) => {
    const today = new Date(); // Current date
    const eventDateObj = new Date(eventDate); // Convert event date to Date object
    
    // Set the time of both dates to 00:00:00 to ignore the time component
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    
    return eventDateObj >= today; // Event is active if the event's date is today or in the future
  };

  useEffect(() => {
    fetchEvents(placeId);
  }, [placeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(placeId);
  };

  const EventCard = ({ item, index }) => {
    const scaleAnim = new Animated.Value(1);
    
    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
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
      <Animated.View
        style={[
          styles.eventCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: 1,
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => setSelectedEvent(item)}
        >
         <View style={styles.eventHeader}>
  <View style={styles.dateBox}>
    <Text style={styles.dateText}>
      {item.date}
    </Text>
  </View>
  <View style={styles.eventStatus}>
    <View
      style={[
        styles.statusDot,
        { backgroundColor: isEventActive(item.date) ? '#4CAF50' : '#FF5722' },
      ]}
    />
    <Text style={styles.statusText}>
      {isEventActive(item.date) ? 'Active' : 'Not Active'}
    </Text>
  </View>
</View>
          <Text style={styles.eventName}>{item.title}</Text>
          <Text style={styles.eventDetails}>{item.details}</Text>

          <View style={styles.eventFooter}>
            <View style={styles.eventMetrics}>
              <Text style={styles.metricText}>🕒 {item.time}</Text>
              <Text style={styles.metricText}>📍 {item.place_name}</Text>
            </View>
            <TouchableOpacity style={styles.registerButton}
             onPress={() => openMap(item.latitude, item.longitude)}>
              <Text style={styles.registerButtonText}>➡️ Location</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Events</Text>
          <Text style={styles.headerSubtitle}>{placeName || 'Upcoming Events'}</Text>
        </View>
      </Animated.View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <EventCard item={item} index={index} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events available at the moment</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchEvents(placeId)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <MenuBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#6C63FF',
    paddingTop: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateBox: {
    backgroundColor: '#F5F6FA',
    padding: 8,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  eventDetails: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 24,
    marginBottom: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F6FA',
    paddingTop: 15,
  },
  eventMetrics: {
    flexDirection: 'column',
    gap: 5,
  },
  metricText: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#636E72',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsScreen;