import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import MenuBar from '../../components/MenuBar';
import { getEventsWithPlaceId } from '../../services/apiServices';
import CalendarView from './../../components/CalendarView';
import EventCard from './../../components/EventCard';

const EventsScreen = ({ route, navigation }) => {
  const { placeId, placeName } = route.params;
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalendarMinimized, setIsCalendarMinimized] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  const scrollY = new Animated.Value(0);
  const scrollRef = useRef(null);
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(false);

  const searchContainerTranslate = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -150],
    extrapolate: 'clamp',
  });
  const searchContainerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const fetchEvents = useCallback(async (placeId) => {
    setLoading(true);
    try {
      const response = await getEventsWithPlaceId(placeId);
      if (response.success) {
        setEvents(response.events);
        setFilteredEvents(response.events);
      } else {
        alert('Error', response.error || 'No events found for this place');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleDateSelect = useCallback(
    (date) => {
      const filtered = date
        ? events.filter(
            (event) => new Date(event.date).toDateString() === date.toDateString()
          )
        : events;
      setFilteredEvents(filtered);
    },
    [events]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    },
    [events]
  );

  const openMapModal = (latitude, longitude) => {
    if (!latitude || !longitude) {
      alert('Error', 'Location data is missing for this event.');
      return;
    }
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    setMapUrl(url);
    setModalVisible(true);
  };

  const openNativeMaps = (latitude, longitude) => {
    if (!latitude || !longitude) {
      alert('Error', 'Location data is missing.');
      return;
    }
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
    setModalVisible(false);
  };

  useEffect(() => {
    fetchEvents(placeId);
  }, [placeId, fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents(placeId);
  }, [fetchEvents, placeId]);

  const renderEventCards = () => {
    const eventList = filteredEvents.length > 0 ? filteredEvents : events;
    return eventList.map((item) => (
      <EventCard
        key={item.id.toString()}
        item={item}
        onPress={() => console.log('Event clicked:', item)}
        onLocationPress={() => openMapModal(item.latitude, item.longitude)}
      />
    ));
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const newIsFullyCollapsed = offsetY >= 150;
        if (newIsFullyCollapsed && !isFullyCollapsed) {
          setIsFullyCollapsed(true);
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: true });
          }
        } else if (!newIsFullyCollapsed && isFullyCollapsed) {
          setIsFullyCollapsed(false);
        }
      },
    }
  );

  // Dynamic listContainer style based on calendar state
  const listContainerStyle = {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: isCalendarMinimized ? 200 : 490, // Adjust these values as needed
  };

  return (
    <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
      <ScrollView>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.headerGradient}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#FF6F61" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>{placeName || 'Upcoming Events'}</Text>
          </View>
        </LinearGradient>
      </View>

      <Animated.ScrollView
        style={[
          styles.searchContainer,
          {
            transform: [{ translateY: searchContainerTranslate }],
            opacity: searchContainerOpacity,
            position: 'absolute',
            top: 140,
            left: 0,
            right: 0,
          },
        ]}
      >
        <CalendarView
          events={events}
          onDateSelect={handleDateSelect}
          isMinimized={isCalendarMinimized}
          toggleMinimize={() => setIsCalendarMinimized(!isCalendarMinimized)}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#BBBBBB"
        />
      </Animated.ScrollView>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          contentContainerStyle={listContainerStyle}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
          }
        >
          {filteredEvents.length > 0 || events.length > 0 ? (
            renderEventCards()
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filteredEvents.length === 0 ? 'No events for selected date' : 'No events available'}
              </Text>
              {filteredEvents.length === 0 && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => handleDateSelect(null)}
                >
                  <Text style={styles.retryButtonText}>Show All Events</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {mapUrl ? (
              <WebView source={{ uri: mapUrl }} style={styles.webview} />
            ) : (
              <Text style={styles.modalErrorText}>Loading map...</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => openNativeMaps(events[0]?.latitude, events[0]?.longitude)}
              >
                <Text style={styles.modalButtonText}>Open in Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#BBBBBB' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <MenuBar />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    height: 140,
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    elevation: 2,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#2C2C2C',
    borderRadius: 15,
    marginHorizontal: 20,
    elevation: 4,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 15,
    elevation: 2,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  modalErrorText: {
    flex: 1,
    textAlign: 'center',
    color: '#000000',
    fontSize: 16,
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#2C2C2C',
  },
  modalButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsScreen;