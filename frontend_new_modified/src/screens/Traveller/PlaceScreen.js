import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import SwiperFlatList from 'react-native-swiper-flatlist';
import MenuBar from '../../components/MenuBar';
import {
  getGuidesWithPlaceId,
  getHotelsWithPlaceId,
  getEventsWithPlaceId,
  getCabsWithPlaceId,
  getSpotsWithPlaceId,
  getReviewsWithPlaceId,
  addReview,
  getPlaces,
  bookCab,
} from '../../services/apiServices';
import { imageUrl } from '../../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;

const PlaceScreen = ({ route, navigation }) => {
  const { placeId, placeName, placeImages = [] } = route.params;
  const [guides, setGuides] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [events, setEvents] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [spots, setSpots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sliderImages, setSliderImages] = useState([]);
  const [activeTab, setActiveTab] = useState('guides');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const scrollY = new Animated.Value(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedCab, setSelectedCab] = useState(null);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [destination, setDestination] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const tabs = {
    guides: { data: guides, type: 'Guides' },
    hotels: { data: hotels, type: 'Hotels' },
    events: { data: events, type: 'Events' },
  };

  const dropdownOptions = [
    { key: 'cabs', title: 'Cabs', data: cabs, type: 'Cabs' },
    { key: 'spots', title: 'Spots', data: spots, type: 'Spots' },
    { key: 'reviews', title: 'Reviews', data: reviews, type: 'Reviews' },
  ];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [300, 120],
    extrapolate: 'clamp',
  });

  const sliderOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [guideResponse, hotelResponse, eventResponse, cabResponse, spotResponse, reviewResponse, placesResponse] = await Promise.all([
        getGuidesWithPlaceId(placeId),
        getHotelsWithPlaceId(placeId),
        getEventsWithPlaceId(placeId),
        getCabsWithPlaceId(placeId),
        getSpotsWithPlaceId(placeId),
        getReviewsWithPlaceId(placeId),
        getPlaces(),
      ]);

      if (guideResponse.success) setGuides(guideResponse.guides || []);
      if (hotelResponse.success) setHotels(hotelResponse.hotels || []);
      if (eventResponse.success) setEvents(eventResponse.events || []);
      if (cabResponse.success) setCabs(cabResponse.cabs || []);
      if (spotResponse.success) setSpots(spotResponse.spots || []);
      if (reviewResponse.success) setReviews(reviewResponse.data || []);
      if (placesResponse.success) {
        setPlaces(placesResponse.places || []);
        setPlacesLoading(false);
      }

      let imagesForSlider = [];
      if (placeImages && placeImages.length > 0) {
        imagesForSlider = placeImages.map((photo, idx) => ({
          id: `${placeId}-${idx}`,
          image: `${imageUrl}${photo}`,
          title: placeName,
          description: `Image of ${placeName}`,
        }));
      } else if (spotResponse.success && spotResponse.spots.length > 0) {
        imagesForSlider = spotResponse.spots
          .map(spot => ({
            id: spot.id,
            image: `${imageUrl}${spot.image}`,
            title: spot.name,
            description: spot.details,
          }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
      }
      setSliderImages(imagesForSlider);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [placeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error', 'Failed to pick an image.');
    }
  };

  const handleAddReview = async () => {
    if (!rating || !reviewText.trim()) {
      alert('Error', 'Please provide a rating and review text.');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        alert('Error', 'Please log in to add a review.');
        return;
      }
      const formData = new FormData();
      formData.append('rating', rating.toString());
      formData.append('review_text', reviewText);
      formData.append('user_id', userId);
      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]} `: 'image/jpeg';
        formData.append('image', { uri: selectedImage, name: filename, type });
      }
      const result = await addReview(placeId, formData);
      if (result.success) {
        setReviewText('');
        setRating(0);
        setSelectedImage(null);
        setReviewModalVisible(false);
        fetchData();
        alert('Success', 'Review added successfully!');
      } else {
        alert('Error', result.message || 'Failed to add review.');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Error', error.message || 'Failed to add review.');
    }
  };

  const handleBookCab = (cab) => {
    setSelectedCab(cab);
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!destination) {
      alert('Error', 'Please select a destination');
      return;
    }
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      alert('Error', 'Please log in to book a cab');
      return;
    }

    setBookingLoading(true);
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
        alert(
          'Booking Confirmed',
          `Cab booked with ${selectedCab.name} from ${selectedCab.place_name} to ${
            selectedPlace ? selectedPlace.place_name : destination
          }`
        );
        setBookingModalVisible(false);
        setDestination('');
        fetchData();
      } else {
        alert('Booking Failed', response.error || 'Unable to book cab at this time');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error', 'An unexpected error occurred while booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const navigateToEvents = useCallback(
    () => {
      navigation.navigate('EventsScreen', { placeId: placeId, placeName: placeName });
    },
    [navigation, placeId]
  );

  const handleCallGuide = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
        console.error('Error opening dialer:', err)
      );
    } else {
      alert('No Phone Number', 'This guide does not have a contact number.');
    }
  };

  const handleEmailGuide = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch((err) =>
        console.error('Error opening email client:', err)
      );
    } else {
      alert('No Email', 'This guide does not have an email address.');
    }
  };

  const renderItem = ({ item, type }) => {
    const scaleAnim = new Animated.Value(1);
    const tiltAnim = new Animated.Value(0);

    const onPressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, useNativeDriver: true }),
        Animated.spring(tiltAnim, { toValue: 5, friction: 8, useNativeDriver: true }),
      ]).start();
    };

    const onPressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
        Animated.spring(tiltAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    };

    const tiltTransform = tiltAnim.interpolate({
      inputRange: [-5, 0, 5],
      outputRange: ['-5deg', '0deg', '5deg'],
    });

    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { scale: scaleAnim },
              { rotateY: tiltTransform },
              { perspective: 1000 },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setSelectedItem(item);
            setSelectedType(type);
            setDetailModalVisible(true);
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.95)', 'rgba(44, 44, 44, 0.95)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {type === 'Reviews' ? item.name || 'Anonymous' : item.name || item.title || 'Unnamed'}
              </Text>
              <View style={styles.cardDetailsContainer}>
                {type === 'Cabs' && (
                  <>
                    <Text style={styles.cardDetails} numberOfLines={2}>
                      {item.cab_details || 'No details available'}
                    </Text>
                    <Text style={styles.cardDetails}>From: {item.place_name || 'N/A'}</Text>
                  </>
                )}
                {type === 'Guides' && (
                  <>
                    <Text style={styles.cardDetails}>Age: {item.age || 'N/A'}</Text>
                    <Text style={styles.cardDetails} numberOfLines={1}>Email: {item.email || 'N/A'}</Text>
                  </>
                )}
                {type === 'Hotels' && (
                  <>
                    <Text style={styles.cardDetails} numberOfLines={2}>Address: {item.address || 'N/A'}</Text>
                    <Text style={styles.cardDetails}>Phone: {item.contact || 'N/A'}</Text>
                  </>
                )}
                {type === 'Events' && (
                  <>
                    <Text style={styles.cardDetails} numberOfLines={2}>{item.details || 'No details'}</Text>
                    <Text style={styles.cardDetails}>Date: {item.date || 'N/A'}</Text>
                  </>
                )}
                {type === 'Spots' && (
                  <Text style={styles.cardDetails} numberOfLines={2}>{item.details || 'No details available'}</Text>
                )}
                {type === 'Reviews' && (
                  <>
                    <Text style={styles.cardDetails}>{item.comment || 'No comment'}</Text>
                    {item.image_url && (
                      <Image
                        source={{ uri: `${imageUrl}${item.image_url}` }}
                        style={styles.reviewImage}
                      />
                    )}
                    <Text style={styles.reviewRating}>
                      {Array(5).fill(0).map((_, i) => (i < item.rating ? '★' : '☆')).join('')}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTabContent = () => {
    const currentTab = tabs[activeTab] || dropdownOptions.find(opt => opt.key === activeTab);
    if (!currentTab) return null;

    return (
      <View style={styles.tabContent}>
        {activeTab === 'events' && (
          <TouchableOpacity
            style={styles.viewEventsButton}
            onPress={navigateToEvents}
          >
            <LinearGradient
              colors={['#FF6F61', '#FF8A65']}
              style={styles.viewEventsButtonGradient}
            >
              <Text style={styles.viewEventsButtonText}>View Events Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <Animated.FlatList
          data={currentTab.data}
          renderItem={({ item }) => renderItem({ item, type: currentTab.type })}
          keyExtractor={(item, index) =>` ${currentTab.type.toLowerCase()}-${index}`}
          ListEmptyComponent={<Text style={styles.emptyText}>No {currentTab.type.toLowerCase()} available</Text>}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />}
        />
      </View>
    );
  };

  const renderDropdownItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setActiveTab(item.key);
        setDropdownVisible(false);
      }}
    >
      <Text style={styles.dropdownText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderStarInput = () => (
    <View style={styles.starInputContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starButton}
        >
          <Text style={[styles.star, { color: star <= rating ? '#FFD700' : '#BBBBBB' }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReviewModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={reviewModalVisible}
      onRequestClose={() => setReviewModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#1E1E1E', '#2A2A2A']}
          style={styles.modalContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView contentContainerStyle={styles.reviewModalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review {placeName}</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <MaterialIcons name="close" size={28} color="#FF6F61" />
              </TouchableOpacity>
            </View>
            <Text style={styles.ratingLabel}>Rate Your Experience</Text>
            {renderStarInput()}
            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={6}
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Share your thoughts..."
              placeholderTextColor="#888888"
            />
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <LinearGradient
                colors={['#FF6F61', '#FF8A65']}
                style={styles.imagePickerGradient}
              >
                <Text style={styles.imagePickerText}>
                  {selectedImage ? 'Change Image' : 'Add Image'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <LinearGradient
                  colors={['#555555', '#777777']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleAddReview}
              >
                <LinearGradient
                  colors={['#FF6F61', '#FF8A65']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.modalButtonText}>Submit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderBookingModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={bookingModalVisible}
      onRequestClose={() => setBookingModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#1E1E1E', '#2A2A2A']}
          style={styles.modalContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Your Cab</Text>
            <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
              <MaterialIcons name="close" size={28} color="#FF6F61" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Driver: {selectedCab?.name || 'Unnamed'}</Text>
          <View style={styles.modalDetails}>
            <Text style={styles.detailModalText}>
              From: {selectedCab?.place_name || placeName || 'N/A'}
            </Text>
            <Text style={styles.detailModalText}>
              Time: {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
            </Text>
            {placesLoading ? (
              <ActivityIndicator size="small" color="#FF6F61" style={{ marginTop: 15 }} />
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  mode="dropdown"
                  selectedValue={destination}
                  style={styles.picker}
                  onValueChange={(value) => setDestination(value)}
                  dropdownIconColor="#FF6F61"
                >
                  <Picker.Item label="Select a destination" value="" color="#BBBBBB" />
                  {places.map((place) => (
                    <Picker.Item
                      key={place.id}
                      label={place.place_name}
                      value={place.id}
                      color="#000"
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>
          {bookingLoading && (
            <ActivityIndicator size="small" color="#FF6F61" style={{ marginVertical: 15 }} />
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalCancelButton, bookingLoading && { opacity: 0.6 }]}
              onPress={() => setBookingModalVisible(false)}
              disabled={bookingLoading}
            >
              <LinearGradient
                colors={['#555555', '#777777']}
                style={styles.buttonGradient}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSubmitButton, bookingLoading && { opacity: 0.6 }]}
              onPress={handleConfirmBooking}
              disabled={bookingLoading}
            >
              <LinearGradient
                colors={['#FF6F61', '#FF8A65']}
                style={styles.buttonGradient}
              >
                <Text style={styles.modalButtonText}>{bookingLoading ? 'Booking...' : 'Confirm'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderDetailModal = () => {
    if (!selectedItem || !selectedType) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E1E1E', '#2A2A2A']}
            style={styles.detailModalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.detailModalTitle}>
                {selectedItem.name || selectedItem.title || 'Details'}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialIcons name="close" size={28} color="#FF6F61" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.detailModalScroll}>
              {selectedType === 'Cabs' && (
                <>
                  <Text style={styles.detailModalLabel}>Cab Details:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.cab_details || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Driver Name:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.name || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Phone:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.phone || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>From:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.place_name || 'N/A'}</Text>
                  <TouchableOpacity
                    style={styles.bookCabButton}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleBookCab(selectedItem);
                    }}
                  >
                    <LinearGradient
                      colors={['#FF6F61', '#FF8A65']}
                      style={styles.bookCabGradient}
                    >
                      <Text style={styles.bookCabText}>Book Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              {selectedType === 'Guides' && (
                <>
                  <Text style={styles.detailModalLabel}>Name:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.name || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Age:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.age || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Email:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.email || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Phone Number:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.phone_no || 'N/A'}</Text>
                  <View style={styles.guideActionButtons}>
                    <TouchableOpacity
                      style={styles.guideCallButton}
                      onPress={() => handleCallGuide(selectedItem.phone_no)}
                    >
                      <LinearGradient
                        colors={['#4CAF50', '#66BB6A']}
                        style={styles.guideButtonGradient}
                      >
                        <MaterialIcons name="phone" size={20} color="#FFFFFF" />
                        <Text style={styles.guideButtonText}>Call</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.guideEmailButton}
                      onPress={() => handleEmailGuide(selectedItem.email)}
                    >
                      <LinearGradient
                        colors={['#2196F3', '#42A5F5']}
                        style={styles.guideButtonGradient}
                      >
                        <MaterialIcons name="email" size={20} color="#FFFFFF" />
                        <Text style={styles.guideButtonText}>Email</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {selectedType === 'Hotels' && (
                <>
                  <Text style={styles.detailModalLabel}>Name:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.name || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Address:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.address || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Contact:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.contact || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Email:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.email || 'N/A'}</Text>
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => {
                      setDetailModalVisible(false);
                      navigation.navigate('HotelDetail', {
                        hotelId: selectedItem.id,
                        hotelName: selectedItem.name,
                      });
                    }}
                  >
                    <LinearGradient
                      colors={['#FF6F61', '#FF8A65']}
                      style={styles.viewDetailsGradient}
                    >
                      <Text style={styles.viewDetailsText}>View Full Details</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              {selectedType === 'Events' && (
                <>
                  <Text style={styles.detailModalLabel}>Title:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.title || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Details:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.details || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Time:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.time || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Date:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.date || 'N/A'}</Text>
                </>
              )}
              {selectedType === 'Spots' && (
                <>
                  <Text style={styles.detailModalLabel}>Name:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.name || 'N/A'}</Text>
                  <Text style={styles.detailModalLabel}>Details:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.details || 'N/A'}</Text>
                  {selectedItem.image && (
                    <>
                      <Text style={styles.detailModalLabel}>Image:</Text>
                      <Image
                        source={{ uri: `${imageUrl}${selectedItem.image} `}}
                        style={styles.detailModalImage}
                      />
                    </>
                  )}
                </>
              )}
              {selectedType === 'Reviews' && (
                <>
                  <Text style={styles.detailModalLabel}>Reviewer:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.name || 'Anonymous'}</Text>
                  <Text style={styles.detailModalLabel}>Comment:</Text>
                  <Text style={styles.detailModalText}>{selectedItem.comment || 'N/A'}</Text>
                  {selectedItem.image_url && (
                    <>
                      <Text style={styles.detailModalLabel}>Image:</Text>
                      <Image
                        source={{ uri:` ${imageUrl}${selectedItem.image_url}` }}
                        style={styles.detailModalImage}
                      />
                    </>
                  )}
                  <Text style={styles.detailModalLabel}>Rating:</Text>
                  <Text style={styles.reviewRating}>
                    {Array(5).fill(0).map((_, i) => (i < selectedItem.rating ? '★' : '☆')).join('')}
                  </Text>
                  <Text style={styles.detailModalLabel}>Date:</Text>
                  <Text style={styles.detailModalText}>
                    {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : 'N/A'}
                  </Text>
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.detailModalCloseButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <LinearGradient
                colors={['#555555', '#777777']}
                style={styles.buttonGradient}
              >
                <Text style={styles.detailModalButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient
      colors={['#1A1A1A', '#2C2C2C']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['rgba(44, 44, 44, 0.95)', 'rgba(26, 26, 26, 0.95)']}
          style={styles.gradient}
        >
          <Animated.View style={[styles.headerBackground, { transform: [{ translateY: headerTranslate }] }]} />
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={32} color="#FF6F61" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {placeName}
              </Text>
              <Text style={styles.headerSubtitle}>Discover {placeName}</Text>
            </View>
          </View>
        </LinearGradient>
        <Animated.View style={[styles.sliderContainer, { opacity: sliderOpacity }]}>
          <SwiperFlatList
            data={sliderImages.length > 0 ? sliderImages : [{ id: 'placeholder', image: null }]}
            renderItem={({ item }) =>
              item.image ? (
                <View style={styles.slide}>
                  <Image source={{ uri: item.image }} style={styles.slideImage} />
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.85)']}
                    style={styles.slideOverlay}
                  >
                    <Text style={styles.slideTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.noImageSlide}>
                  <Text style={styles.noImageText}>No Images Available</Text>
                </View>
              )
            }
            keyExtractor={(item) => item.id}
            horizontal
            showPagination={sliderImages.length > 1}
            paginationStyle={styles.pagination}
            paginationStyleItem={styles.slideIndicator}
            paginationStyleItemActive={[styles.slideIndicator, { backgroundColor: '#FF6F61' }]}
            autoplay={sliderImages.length > 1}
            autoplayDelay={3}
            autoplayLoop={sliderImages.length > 1}
          />
        </Animated.View>
      </Animated.View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['rgba(44, 44, 44, 0.9)', 'rgba(26, 26, 26, 0.9)']}
            style={styles.tabBarGradient}
          >
            <View style={styles.tabBar}>
              {Object.keys(tabs).map((tabKey) => (
                <TouchableOpacity
                  key={tabKey}
                  style={[
                    styles.tabButton,
                    activeTab === tabKey && styles.activeTabButton,
                  ]}
                  onPress={() => {
                    setActiveTab(tabKey);
                    setDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tabKey ? styles.activeTabLabel : styles.inactiveTabLabel,
                    ]}
                  >
                    {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  dropdownVisible && styles.activeTabButton,
                ]}
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    dropdownVisible ? styles.activeTabLabel : styles.inactiveTabLabel,
                  ]}
                >
                  More
                  <MaterialIcons
                    name={dropdownVisible ? 'arrow-drop-up' : 'arrow-drop-down'}
                    size={20}
                    color={dropdownVisible ? '#FF6F61' : '#BBBBBB'}
                  />
                </Text>
              </TouchableOpacity>
            </View>
            {dropdownVisible && (
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={dropdownOptions}
                  renderItem={renderDropdownItem}
                  keyExtractor={(item) => item.key}
                  style={styles.dropdownList}
                />
              </View>
            )}
          </LinearGradient>
          {renderTabContent()}
          {activeTab === 'reviews' && (
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => setReviewModalVisible(true)}
            >
              <LinearGradient
                colors={['#FF6F61', '#FF8A65']}
                style={styles.addReviewButtonGradient}
              >
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {renderReviewModal()}
      {renderDetailModal()}
      {renderBookingModal()}

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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  gradient: {
    paddingTop: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    height: 380,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255, 111, 97, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#BBBBBB',
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderContainer: {
    height: 180,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
  },
  slide: {
    width: WINDOW_WIDTH * 0.9,
    height: 160,
    marginHorizontal: 5,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.15)',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  noImageSlide: {
    width: WINDOW_WIDTH * 0.9,
    height: 160,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.15)',
  },
  noImageText: {
    fontSize: 18,
    color: '#BBBBBB',
    fontWeight: '600',
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pagination: {
    bottom: 10,
  },
  slideIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  tabBarGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 111, 97, 0.25)',
    paddingVertical: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 111, 97, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6F61',
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#BBBBBB',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTabLabel: {
    color: '#FF6F61',
  },
  inactiveTabLabel: {
    color: '#BBBBBB',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    right: 25,
    width: 140,
    backgroundColor: 'rgba(44, 44, 44, 0.98)',
    borderRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.25)',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 111, 97, 0.1)',
  },
  dropdownText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContent: {
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 120,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 25,
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
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 111, 97, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardDetailsContainer: {
    flex: 1,
  },
  cardDetails: {
    fontSize: 15,
    color: '#BBBBBB',
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '400',
  },
  reviewRating: {
    fontSize: 20,
    color: '#FF6F61',
    marginBottom: 8,
  },
  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    textAlign: 'center',
    padding: 25,
    fontWeight: '500',
  },
  loaderContainer: {
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
  addReviewButton: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },
  addReviewButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 35,
  },
  addReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  viewEventsButton: {
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },
  viewEventsButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  viewEventsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    width: WINDOW_WIDTH * 0.9,
    height: WINDOW_HEIGHT * 0.8, // Fixed height for the modal
    borderRadius: 25,
    padding: 30,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 111, 97, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  reviewModalScroll: {
    paddingBottom: 20,
  },
  detailModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 25,
    padding: 30,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 111, 97, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 111, 97, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailModalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 111, 97, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  detailModalScroll: {
    paddingBottom: 20,
  },
  modalDetails: {
    padding: 15,
    backgroundColor: 'rgba(44, 44, 44, 0.7)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailModalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6F61',
    marginTop: 10,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailModalText: {
    fontSize: 15,
    color: '#BBBBBB',
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 10,
  },
  detailModalImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginTop: 10,
    resizeMode: 'cover',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  starInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 10,
  },
  star: {
    fontSize: 36,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  reviewInput: {
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
    textAlignVertical: 'top',
    width: '100%',
    height: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePickerButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  imagePickerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  imagePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imageContainer: {
    width: '100%',
    maxHeight: 200, // Maximum height for the image container
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF6F61',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  pickerContainer: {
    backgroundColor: '#333333',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  picker: {
    color: '#FFFFFF',
    padding: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  modalCancelButton: {
    borderRadius: 25,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 10,
  },
  modalSubmitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 10,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailModalCloseButton: {
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 20,
  },
  detailModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bookCabButton: {
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 20,
  },
  bookCabGradient: {
    paddingVertical: 14,
    paddingHorizontal: 35,
    alignItems: 'center',
  },
  bookCabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  viewDetailsButton: {
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 20,
  },
  viewDetailsGradient: {
    paddingVertical: 14,
    paddingHorizontal: 35,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  guideActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  guideCallButton: {
    borderRadius: 25,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 10,
  },
  guideEmailButton: {
    borderRadius: 25,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 10,
  },
  guideButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PlaceScreen;