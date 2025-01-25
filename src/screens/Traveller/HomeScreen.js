import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import * as Linking from 'expo-linking';
import MenuBar from '../../components/MenuBar';
import CoverBanner from './../../../assets/cover-banner.png';
import { getEventsWithPlaceId, getHotelsWithPlaceId, getPlaces, getGuidesWithPlaceId, getCabsWithPlaceId } from '../../services/apiServices';

export default function HomeScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [hotels, setHotels] = useState([]);
  const [guides, setGuides] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [hotelsModalVisible, setHotelsModalVisible] = useState(false);
  const [guidesModalVisible, setGuidesModalVisible] = useState(false);
  const [cabsModalVisible, setCabsModalVisible] = useState(false);
  const [loading, setLoading] = useState({
    hotels: false,
    guides: false,
    cabs: false
  });

  // Animation values for floating buttons
  const scrollY = new Animated.Value(0);
  const diffClamp = Animated.diffClamp(scrollY, 0, 100);
  const translateY = diffClamp.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
  });

  // Fetch places and other existing useEffect logic...
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await getPlaces();

        if (response.success) {
          setPlaces(response.places);
          setFilteredPlaces(response.places);
        } else {
          Alert.alert('Error', response.error || 'Failed to fetch places');
        }
      } catch (error) {
        console.error('Error fetching places:', error);
        Alert.alert('Error', error.message || 'An unexpected error occurred');
      }
    };

    fetchPlaces();
  }, []);

  // Existing handlers...
  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredPlaces(places);
    } else {
      const filtered = places.filter((place) =>
        place.place_name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlaces(filtered);
    }
  };


  const viewEvents = (placeId) => {
    navigation.navigate('EventsScreen', { placeId });
  };

  const viewHotels = (placeId) => {
    navigation.navigate('HotelsScreen', { placeId });
  };

  const viewGuides = (placeId) => {
    navigation.navigate('GuidesScreen', { placeId });
  };
  const viewCabs = (placeId) => {
    navigation.navigate('CabsScreen', { placeId });
  };

  // Fetch events for a specific place
  const fetchEvents = async (placeId, placeName) => {
    try {
      const response = await getEventsWithPlaceId(placeId);

      if (response.success) {
        const limitedEvents = response.events.slice(0, 3);
        setEvents(limitedEvents);
        setSelectedPlaceName(placeName);
        setSelectedPlaceId(placeId);
        setModalVisible(true);
      } else {
        Alert.alert('Error', response.error || 'No events found for this place');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    }
  };

  
  const fetchHotels = async (placeId, placeName) => {
    try {
      console.log('Fetching hotels for', placeId, placeName);
      

      const response = await getHotelsWithPlaceId(placeId);

      if (response.success) {
        const limitedHotels = response.hotels.slice(0, 3);
        setHotels(limitedHotels);
        setSelectedPlaceName(placeName);
        setSelectedPlaceId(placeId);
        setHotelsModalVisible(true);
      } else {
        Alert.alert('Error', response.error || 'No hotels found for this place');
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(prev => ({ ...prev, hotels: false }));
    }
  };

  // Fetch guides for a specific place
  const fetchGuides = async (placeId, placeName) => {
    try {
      const response = await getGuidesWithPlaceId(placeId);

      if (response.success) {
        const limitedGuides = response.guides.slice(0, 3);
        setGuides(limitedGuides);
        setSelectedPlaceName(placeName);
        setSelectedPlaceId(placeId);
        setGuidesModalVisible(true);
      } else {
        Alert.alert('Error', response.error || 'No guides found for this place');
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(prev => ({ ...prev, guides: false }));
    }
  };

  // Fetch cabs for a specific place
  const fetchCabs = async (placeId, placeName) => {
    try {
      const response = await getCabsWithPlaceId(placeId);

      if (response.success) {
        const limitedCabs = response.cabs.slice(0, 3);
        setCabs(limitedCabs);
        setSelectedPlaceName(placeName);
        setSelectedPlaceId(placeId);
        setCabsModalVisible(true);
      } else {
        Alert.alert('Error', response.error || 'No cabs found for this place');
      }
    } catch (error) {
      console.error('Error fetching cabs:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(prev => ({ ...prev, cabs: false }));
    }
  };

  // Update the quick action buttons handler
  const handleQuickAction = (action, item) => {
    switch (action) {
      case 'Events':
        fetchEvents(item.id, item.place_name);
        break;
      case 'Hotels':
        fetchHotels(item.id, item.place_name);
        break;
      case 'Guides':
        fetchGuides(item.id, item.place_name);
        break;
      case 'Cabs':
        fetchCabs(item.id, item.place_name);
        break;
      default:
        break;
    }
  };

  // Function to navigate to full service screen
  const viewFullService = (service, placeId) => {
    console.log('Viewing full service', service, placeId);
    
    navigation.navigate(`${service}Screen`, {
      placeId,
      placeName: selectedPlaceName
    });
  };

  

  const openMap = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open the map');
    });
  };

  const FloatingActionButton = ({ icon, label, onPress, color }) => (
    <TouchableOpacity
      style={[styles.floatingButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.floatingButtonIcon}>{icon}</Text>
      <Text style={styles.floatingButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const goToTrans = () => {
    console.log("haaii");
    
    navigation.navigate('TranslationScreen');

  }
  

  const ServiceModal = ({
    visible,
    onClose,
    title,
    data,
    isLoading,
    onViewMore,
    renderItem
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeading}>{title}</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#6C5CE7" />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No {title.toLowerCase()} available</Text>
              }
            />
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.viewMoreButton]}
              onPress={onViewMore}
            >
              <Text style={styles.modalButtonText}>View More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.header,
        {
          transform: [{ translateY }]
        }
      ]}>
        <Image
          source={CoverBanner}
          style={styles.banner}
        />
        <TouchableOpacity
          style={styles.translatorButton}
          onPress={() => goToTrans()}
         
        >
          <Text style={styles.translatorButtonText}>Open Translator</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.setValue(e.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.floatingButtonsContainer}>

          <FloatingActionButton
            icon="🎪"
            label="Events"
            onPress={() => viewEvents("all")}
            color="#fff"
          />

          <FloatingActionButton
            icon="🏨"
            label="Hotels"
            onPress={() => viewHotels("all")}
            color="#fff"
          />
          <FloatingActionButton
            icon="🙋🏼"
            label="Guides"
            onPress={() =>  viewGuides("all")}
            color="#fff"
          />

          <FloatingActionButton
            icon="🚕"
            label="Cabs"
            onPress={() => viewCabs("all")}
            color="#fff"
          />

        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search places..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.heading}>Popular Places</Text>
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.placeCard}>
              <Text style={styles.placeName}>{item.place_name}</Text>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => openMap(item.latitude, item.longitude)}
                >
                  <Text style={styles.primaryButtonText}>Open Map</Text>
                </TouchableOpacity>

                <View style={styles.quickActionButtons}>
                  {['Events', 'Cabs', 'Hotels', 'Guides', 'Reviews'].map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickActionButton}
                      onPress={() => {
                        if (action === 'Events') {
                          fetchEvents(item.id, item.place_name);
                        } else if (action === 'Cabs') {
                          fetchCabs(item.id, item.place_name); 
                        } else if (action === 'Hotels') {
                          fetchHotels(item.id, item.place_name);  
                        } else if (action === 'Guides') {
                          fetchGuides(item.id, item.place_name);  
                        } else if (action === 'Reviews') {
                          fetchReviews(item.id, item.place_name);  
                        }
                      }}
                    >
                      <Text style={styles.quickActionText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No places available</Text>
          }
        />
      </ScrollView>

      {/* Events Modal */}
      <ServiceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={`Events at ${selectedPlaceName}`}
        data={events}
        isLoading={loading.events}
        onViewMore={() => viewFullService('Events', selectedPlaceId)}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{item.title}</Text>
            <Text style={styles.serviceDetails}>{item.details}</Text>
          </View>
        )}
      />

      {/* Hotels Modal */}
      <ServiceModal
        visible={hotelsModalVisible}
        onClose={() => setHotelsModalVisible(false)}
        title={`Hotels at ${selectedPlaceName}`}
        data={hotels}
        isLoading={loading.hotels}
        onViewMore={() => viewFullService('Hotels', selectedPlaceId)}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDetails}>{item.contact}</Text>
            <Text style={styles.servicePrice}>{item.address}</Text>
          </View>
        )}
      />

      {/* Guides Modal */}
      <ServiceModal
        visible={guidesModalVisible}
        onClose={() => setGuidesModalVisible(false)}
        title={`Guides at ${selectedPlaceName}`}
        data={guides}
        isLoading={loading.guides}
        onViewMore={() => viewFullService('Guides', selectedPlaceId)}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDetails}>{item.age}</Text>
          </View>
        )}
      />

      {/* Cabs Modal */}
      <ServiceModal
        visible={cabsModalVisible}
        onClose={() => setCabsModalVisible(false)}
        title={`Cabs at ${selectedPlaceName}`}
        data={cabs}
        isLoading={loading.cabs}
        onViewMore={() => viewFullService('Cabs', selectedPlaceId)}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{item.cab_details}</Text>
            <Text style={styles.serviceDetails}>{item.name}</Text>
            <Text style={styles.servicePrice}>license_no: ${item.license_no}</Text>
          </View>
        )}
      />

      <MenuBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  banner: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  translatorButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 10,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  translatorButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  floatingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  floatingButton: {
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '22%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  floatingButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    paddingHorizontal: 20,
    color: '#2D3436',
  },
  placeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 15,
  },
  actionButtonsContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: '#E8F0FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: '18%',
  },
  quickActionText: {
    color: '#6C5CE7',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2D3436',
  },
  eventCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 5,
  },
  eventDetails: {
    fontSize: 14,
    color: '#636E72',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
  },
  viewMoreButton: {
    backgroundColor: '#6C5CE7',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#636E72',
    fontSize: 16,
    marginTop: 20,
  },
  serviceCard:{
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
});