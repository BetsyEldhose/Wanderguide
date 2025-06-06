import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  FlatList,
  ScrollView, // Explicitly imported
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../../components/MenuBar';
import { imageUrl } from '../../utils/config';
import { getHotelById, getHotelReviews, addHotelReview } from '../../services/apiServices';

const HotelDetailScreen = ({ route, navigation }) => {
  const { hotelId, hotelName } = route.params;
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [300, 100],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const fetchHotelData = async () => {
    setLoading(true);
    try {
      const hotelResponse = await getHotelById(hotelId);
      const reviewsResponse = await getHotelReviews(hotelId);
      if (hotelResponse.success) setHotel(hotelResponse.hotel);
      if (reviewsResponse.success) setReviews(reviewsResponse.data);
    } catch (error) {
      console.error('Error fetching hotel data:', error);
      alert('Error', error.message || 'Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelData();
  }, [hotelId]);

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
      alert('Error', 'Failed to pick an image');
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
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', { uri: selectedImage, name: filename, type });
      }
      const result = await addHotelReview(hotelId, formData);
      if (result.success) {
        setReviewText('');
        setRating(0);
        setSelectedImage(null);
        setReviewModalVisible(false);
        fetchHotelData();
        alert('Success', 'Review added successfully!');
      } else {
        alert('Error', result.message || 'Failed to add review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Error', error.message || 'Failed to add review');
    }
  };

  const renderStarInput = () => (
    <View style={styles.starInputContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
          <Text style={[styles.star, { color: star <= rating ? '#FFD700' : '#BBBBBB' }]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReviewModal = () => (
    <Modal animationType="slide" transparent={true} visible={reviewModalVisible}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={['#1E1E1E', '#2A2A2A']} style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Your Review</Text>
          <Text style={styles.ratingLabel}>Rate Your Stay</Text>
          {renderStarInput()}
          <TextInput
            style={styles.reviewInput}
            multiline
            numberOfLines={6}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience..."
            placeholderTextColor="#888888"
          />
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <LinearGradient colors={['#FF6F61', '#FF8A65']} style={styles.imagePickerGradient}>
              <Text style={styles.imagePickerText}>
                {selectedImage ? 'Change Image' : 'Add Image'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setReviewModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleAddReview}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      <Image
        source={{ uri: `${imageUrl}${hotel.image}` }}
        style={styles.headerImage}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.headerGradient}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity }]}>
          {hotel.name}
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderGallery = () => {
    const images = [hotel.image, hotel.image_1, hotel.image_2, hotel.image_3].filter(Boolean);
    return (
      <View style={styles.imageGallery}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {images.map((img, index) => (
            <Image
              key={index}
              source={{ uri: `${imageUrl}${img}` }}
              style={styles.galleryImage}
            />
          ))}
        </ScrollView>
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === 0 ? '#FF6F61' : '#BBBBBB' }, // Static for simplicity
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <MaterialIcons name="location-on" size={20} color="#FF6F61" />
        <Text style={styles.detailText}>{hotel.address || 'N/A'}</Text>
      </View>
      <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${hotel.contact}`)}>
        <MaterialIcons name="phone" size={20} color="#FF6F61" />
        <Text style={styles.detailText}>{hotel.contact || 'N/A'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`mailto:${hotel.email}`)}>
        <MaterialIcons name="email" size={20} color="#FF6F61" />
        <Text style={styles.detailText}>{hotel.email || 'N/A'}</Text>
      </TouchableOpacity>
      <View style={styles.detailRow}>
        <MaterialIcons name="home" size={20} color="#FF6F61" />
        <Text style={styles.detailText}>Rooms: {hotel.available_rooms || 'N/A'}</Text>
      </View>
    </View>
  );

  const renderReviewItem = ({ item }) => {
    const scaleAnim = new Animated.Value(1);
    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
      <Animated.View style={[styles.reviewCard, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity activeOpacity={0.95} onPressIn={onPressIn} onPressOut={onPressOut}>
          <LinearGradient colors={['#2A2A2A', '#1E1E1E']} style={styles.reviewGradient}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewUser}>{item.name || 'Anonymous'}</Text>
              <Text style={styles.reviewRating}>
                {Array(5).fill(0).map((_, i) => (i < item.rating ? '★' : '☆')).join('')}
              </Text>
            </View>
            <Text style={styles.reviewText}>{item.review}</Text>
            {item.image_url && (
              <Image
                source={{ uri: `${imageUrl}${item.image_url}` }}
                style={styles.reviewImage}
              />
            )}
            <Text style={styles.reviewDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderReviewsSection = () => (
    <View style={styles.reviewsSection}>
      <Text style={styles.sectionTitle}>Guest Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id}>{renderReviewItem({ item: review })}</View>
        ))
      )}
      <TouchableOpacity
        style={styles.addReviewButton}
        onPress={() => setReviewModalVisible(true)}
      >
        <LinearGradient colors={['#FF6F61', '#FF8A65']} style={styles.addReviewGradient}>
          <Text style={styles.addReviewText}>Write a Review</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!hotel) {
    return (
      <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>Hotel not found</Text>
      </LinearGradient>
    );
  }

  const data = [
    { type: 'header', render: renderHeader },
    { type: 'gallery', render: renderGallery },
    { type: 'details', render: renderDetails },
    { type: 'reviews', render: renderReviewsSection },
  ];

  return (
    <LinearGradient colors={['#1A1A1A', '#2C2C2C']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={data}
        renderItem={({ item }) => item.render()}
        keyExtractor={(item) => item.type}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
      {renderReviewModal()}
      <MenuBar />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  flatListContent: {
    paddingBottom: 120,
  },
  header: {
    overflow: 'hidden',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 300,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerGradient: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(44,44,44,0.8)',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  imageGallery: {
    marginVertical: 20,
  },
  galleryImage: {
    width: 300,
    height: 200,
    borderRadius: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  detailsContainer: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: '500',
  },
  reviewsSection: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reviewCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  reviewGradient: {
    padding: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewRating: {
    fontSize: 18,
    color: '#FFD700',
  },
  reviewText: {
    fontSize: 14,
    color: '#BBBBBB',
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: '#BBBBBB',
    textAlign: 'center',
    padding: 20,
  },
  addReviewButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  addReviewGradient: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  addReviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalContent: {
    width: '90%',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 15,
    textAlign: 'center',
  },
  starInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 36,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reviewInput: {
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    height: 130,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,111,97,0.2)',
  },
  imagePickerButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  imagePickerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  imagePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: 250,
    height: 180,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF6F61',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalCancelButton: {
    backgroundColor: '#555555',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalSubmitButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
    fontWeight: '600',
  },
});

export default HotelDetailScreen;